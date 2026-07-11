import type { CaaCoaParseResult } from '@/types/caa';
import { parseCoaInput, CaaParseError } from '@lib/caa/parse';
import { isConfidentLimsUrl } from '@lib/caa/adapters/confidentLims';
import { CoaFetchError, fetchCoaUrl } from '@lib/coa/fetch';
import { hashContent } from '@lib/coa/hash';
import { scanInputToCaa } from '@lib/coa/input';
import {
  COA_PARSER_VERSION,
  emptyNormalizedCoaResult,
  normalizedFromCaaParse,
  normalizedToCaaParse,
} from '@lib/coa/normalize';
import { selectProvider, type CoaProviderInput } from '@lib/coa/providers';
import type { CoaScanErrorCode, NormalizedCoaResult, ScanInput, ScanJobStatus } from '@lib/coa/types';
import { validateScanInput } from '@lib/coa/validate';

export class CoaResolveError extends Error {
  readonly code: CoaScanErrorCode;
  readonly scanId?: string;

  constructor(code: CoaScanErrorCode, message: string, scanId?: string) {
    super(message);
    this.name = 'CoaResolveError';
    this.code = code;
    this.scanId = scanId;
  }
}

export type ResolvedCoaScan = {
  normalized: NormalizedCoaResult;
  provider: string;
  contentHash: string | null;
  rawMetadata: Record<string, unknown>;
  parse: CaaCoaParseResult | null;
  jobStatus: ScanJobStatus;
  errorCode: CoaScanErrorCode | null;
  errorMessage: string | null;
};

function mapExtractionToJobStatus(
  extractionStatus: NormalizedCoaResult['extraction']['status'],
): ScanJobStatus {
  switch (extractionStatus) {
    case 'resolved':
      return 'resolved';
    case 'partial':
      return 'partial';
    case 'needs_review':
      return 'needs_review';
    default:
      return 'failed';
  }
}

function mapFetchError(err: unknown): CoaResolveError {
  if (err instanceof CoaResolveError) return err;
  if (err instanceof CoaFetchError) {
    return new CoaResolveError(err.code, err.message);
  }
  const message = err instanceof Error ? err.message : 'COA resolve failed.';
  if (message.startsWith('INVALID_URL')) {
    return new CoaResolveError('INVALID_URL', message.replace(/^INVALID_URL:\s*/, ''));
  }
  if (message.startsWith('BLOCKED_URL')) {
    return new CoaResolveError('BLOCKED_URL', message.replace(/^BLOCKED_URL:\s*/, ''));
  }
  return new CoaResolveError('INTERNAL_ERROR', message);
}

function buildRawMetadata(args: {
  provider: string;
  finalUrl?: string;
  contentType?: string;
  contentHash: string | null;
  byteLength?: number;
  redirectCount?: number;
  isPdf?: boolean;
  titleNote?: string;
}): Record<string, unknown> {
  return {
    provider: args.provider,
    final_url: args.finalUrl,
    content_type: args.contentType,
    content_hash: args.contentHash,
    byte_length: args.byteLength,
    redirect_count: args.redirectCount ?? 0,
    is_pdf: args.isPdf ?? false,
    // Intentionally omit full remote HTML body.
    html_persisted: false,
  };
}

function maybeCaaParse(normalized: NormalizedCoaResult, source: 'url' | 'qr' | 'text'): CaaCoaParseResult | null {
  if (normalized.cannabinoids.length === 0) return null;
  const hasThc = normalized.cannabinoids.some(
    (c) =>
      (c.name === 'THC' || c.name === 'Total THC') &&
      typeof c.value === 'number' &&
      Number.isFinite(c.value),
  );
  if (!hasThc) return null;
  try {
    return normalizedToCaaParse(normalized, source);
  } catch {
    return null;
  }
}

async function resolveUrlScan(
  input: Extract<ScanInput, { kind: 'qr_url' | 'manual_url' }>,
): Promise<ResolvedCoaScan> {
  const sourceUrl = input.url.trim();
  const caaSource = input.kind === 'qr_url' ? 'qr' : 'url';

  // Prefer Confident LIMS API bridge without requiring HTML scrape.
  if (isConfidentLimsUrl(sourceUrl)) {
    const providerInput: CoaProviderInput = {
      sourceUrl,
      finalUrl: sourceUrl,
      html: '',
      contentType: 'application/json',
      contentHash: hashContent(sourceUrl),
    };
    const provider = selectProvider(providerInput);
    const normalized = await provider.parse(providerInput);
    const jobStatus = mapExtractionToJobStatus(normalized.extraction.status);
    const insufficient = normalized.extraction.status === 'needs_review' &&
      normalized.cannabinoids.length === 0;

    return {
      normalized,
      provider: provider.id,
      contentHash: normalized.source.contentHash ?? providerInput.contentHash,
      rawMetadata: buildRawMetadata({
        provider: provider.id,
        finalUrl: sourceUrl,
        contentType: 'application/json',
        contentHash: normalized.source.contentHash ?? providerInput.contentHash,
      }),
      parse: maybeCaaParse(normalized, caaSource),
      jobStatus,
      errorCode: insufficient ? 'PARSE_INSUFFICIENT_DATA' : null,
      errorMessage: insufficient
        ? 'Confident LIMS URL detected but insufficient lab data was returned.'
        : null,
    };
  }

  let fetched;
  try {
    fetched = await fetchCoaUrl(sourceUrl);
  } catch (err) {
    throw mapFetchError(err);
  }

  if (fetched.isPdf) {
    const normalized = emptyNormalizedCoaResult(sourceUrl, 'pdf', COA_PARSER_VERSION);
    normalized.source.contentHash = fetched.contentHash;
    normalized.extraction = {
      status: 'needs_review',
      confidence: 'low',
      notes: ['PDF COA detected. PDF text extraction is not supported yet.'],
    };
    normalized.warnings.push('PDF_NOT_SUPPORTED_YET');

    return {
      normalized,
      provider: 'pdf',
      contentHash: fetched.contentHash,
      rawMetadata: buildRawMetadata({
        provider: 'pdf',
        finalUrl: fetched.finalUrl,
        contentType: fetched.contentType,
        contentHash: fetched.contentHash,
        byteLength: fetched.byteLength,
        redirectCount: fetched.redirectCount,
        isPdf: true,
      }),
      parse: null,
      jobStatus: 'needs_review',
      errorCode: 'PDF_NOT_SUPPORTED_YET',
      errorMessage: 'PDF COA documents are not supported yet. Use an HTML report URL.',
    };
  }

  const providerInput: CoaProviderInput = {
    sourceUrl,
    finalUrl: fetched.finalUrl,
    html: fetched.body,
    contentType: fetched.contentType,
    contentHash: fetched.contentHash,
  };

  const provider = selectProvider(providerInput);
  const normalized = await provider.parse(providerInput);
  normalized.source.contentHash = fetched.contentHash;

  const jobStatus = mapExtractionToJobStatus(normalized.extraction.status);
  const insufficient =
    jobStatus === 'needs_review' &&
    normalized.cannabinoids.length === 0 &&
    !normalized.product.name?.value;

  return {
    normalized,
    provider: provider.id,
    contentHash: fetched.contentHash,
    rawMetadata: buildRawMetadata({
      provider: provider.id,
      finalUrl: fetched.finalUrl,
      contentType: fetched.contentType,
      contentHash: fetched.contentHash,
      byteLength: fetched.byteLength,
      redirectCount: fetched.redirectCount,
      isPdf: false,
    }),
    parse: maybeCaaParse(normalized, caaSource),
    jobStatus: insufficient ? 'needs_review' : jobStatus,
    errorCode: insufficient ? 'PARSE_INSUFFICIENT_DATA' : null,
    errorMessage: insufficient
      ? 'Could not extract enough clearly labeled COA fields from the HTML page.'
      : null,
  };
}

async function resolveInlineScan(input: ScanInput): Promise<ResolvedCoaScan> {
  const { caaInput, caaSource, sourceUrl } = scanInputToCaa(input);
  const contentHash = hashContent(caaInput);

  let parse: CaaCoaParseResult;
  try {
    parse = await parseCoaInput(caaInput, caaSource);
  } catch (err) {
    if (err instanceof CaaParseError) {
      throw new CoaResolveError('PARSE_INSUFFICIENT_DATA', err.message);
    }
    throw mapFetchError(err);
  }

  const normalized = normalizedFromCaaParse(parse, sourceUrl, 'caa_inline', contentHash);
  return {
    normalized,
    provider: 'caa_inline',
    contentHash,
    rawMetadata: {
      parse_source: parse.parse_source,
      product_key: parse.product_key,
      html_persisted: false,
    },
    parse,
    jobStatus: mapExtractionToJobStatus(normalized.extraction.status),
    errorCode: null,
    errorMessage: null,
  };
}

/**
 * Resolve a scan input into a normalized COA result.
 * URL path: SSRF-safe fetch → provider parse (generic / Fidelity / Confident LIMS).
 * Inline text/QR payload path: existing CAA adapters (compat).
 */
export async function resolveCoaScan(input: ScanInput): Promise<ResolvedCoaScan> {
  const validation = validateScanInput(input);
  if (!validation.ok) {
    throw new CoaResolveError(validation.errorCode, validation.message);
  }

  if (input.kind === 'manual_url' || input.kind === 'qr_url') {
    return resolveUrlScan(input);
  }

  return resolveInlineScan(input);
}

export { COA_PARSER_VERSION };
