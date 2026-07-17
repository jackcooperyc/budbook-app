import type { CaaCoaParseResult } from '@/types/caa';
import { parseCoaInput, CaaParseError } from '@lib/caa/parse';
import { isConfidentLimsUrl } from '@lib/caa/adapters/confidentLims';
import {
  isMetrcUrl,
  metrcCredentialsConfigured,
  parseMetrcUrl,
} from '@lib/caa/adapters/metrc';
import { CoaFetchError, fetchCoaUrl } from '@lib/coa/fetch';
import { hashContent } from '@lib/coa/hash';
import { scanInputToCaa } from '@lib/coa/input';
import {
  COA_PARSER_VERSION,
  normalizedFromCaaParse,
  normalizedToCaaParse,
} from '@lib/coa/normalize';
import { extractPdfText } from '@lib/coa/pdfExtract';
import {
  emptyImageOnlyPdfResult,
  normalizedFromPdfText,
} from '@lib/coa/pdfNormalize';
import { selectProvider, type CoaProviderInput } from '@lib/coa/providers';
import type { CoaScanErrorCode, FieldValue, NormalizedCoaResult, ScanInput, ScanJobStatus } from '@lib/coa/types';
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

  // Prefer Metrc API when credentials are configured (before HTML scrape).
  if (isMetrcUrl(sourceUrl) && metrcCredentialsConfigured()) {
    const metrcParse = await parseMetrcUrl(sourceUrl, caaSource);
    if (metrcParse) {
      const contentHash = hashContent(`${sourceUrl}:${metrcParse.lab_report_id}`);
      const normalized = normalizedFromCaaParse(
        metrcParse,
        sourceUrl,
        'metrc',
        contentHash,
      );
      return {
        normalized,
        provider: 'metrc',
        contentHash,
        rawMetadata: buildRawMetadata({
          provider: 'metrc',
          finalUrl: sourceUrl,
          contentType: 'application/json',
          contentHash,
        }),
        parse: metrcParse,
        jobStatus: mapExtractionToJobStatus(normalized.extraction.status),
        errorCode: null,
        errorMessage: null,
      };
    }
  }

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
    const pdfBytes = fetched.pdfBytes;
    if (!pdfBytes || pdfBytes.length === 0) {
      const normalized = emptyImageOnlyPdfResult(sourceUrl, fetched.contentHash);
      return {
        normalized,
        provider: 'pdf_text',
        contentHash: fetched.contentHash,
        rawMetadata: buildRawMetadata({
          provider: 'pdf_text',
          finalUrl: fetched.finalUrl,
          contentType: fetched.contentType,
          contentHash: fetched.contentHash,
          byteLength: fetched.byteLength,
          redirectCount: fetched.redirectCount,
          isPdf: true,
        }),
        parse: null,
        jobStatus: 'needs_review',
        errorCode: 'PARSE_INSUFFICIENT_DATA',
        errorMessage:
          'PDF body was empty after fetch. Try another URL or paste labeled report text.',
      };
    }

    let extracted;
    try {
      extracted = await extractPdfText(pdfBytes);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF text extraction failed.';
      throw new CoaResolveError('PARSE_INSUFFICIENT_DATA', message);
    }

    if (!extracted.usable) {
      const normalized = emptyImageOnlyPdfResult(sourceUrl, fetched.contentHash);
      normalized.extraction.notes.push(
        `Extracted ${extracted.text.length} characters across ${extracted.pageCount} page(s).`,
      );
      return {
        normalized,
        provider: 'pdf_text',
        contentHash: fetched.contentHash,
        rawMetadata: {
          ...buildRawMetadata({
            provider: 'pdf_text',
            finalUrl: fetched.finalUrl,
            contentType: fetched.contentType,
            contentHash: fetched.contentHash,
            byteLength: fetched.byteLength,
            redirectCount: fetched.redirectCount,
            isPdf: true,
          }),
          pdf_page_count: extracted.pageCount,
          pdf_text_chars: extracted.text.length,
        },
        parse: null,
        jobStatus: 'needs_review',
        errorCode: 'PARSE_INSUFFICIENT_DATA',
        errorMessage:
          'This PDF has little or no extractable text (likely scanned). Paste labeled fields or use an HTML COA URL.',
      };
    }

    const normalized = normalizedFromPdfText(
      extracted.text,
      sourceUrl,
      fetched.contentHash,
    );
    const jobStatus = mapExtractionToJobStatus(normalized.extraction.status);
    const insufficient =
      normalized.cannabinoids.length === 0 && !normalized.product.name?.value;

    return {
      normalized,
      provider: 'pdf_text',
      contentHash: fetched.contentHash,
      rawMetadata: {
        ...buildRawMetadata({
          provider: 'pdf_text',
          finalUrl: fetched.finalUrl,
          contentType: fetched.contentType,
          contentHash: fetched.contentHash,
          byteLength: fetched.byteLength,
          redirectCount: fetched.redirectCount,
          isPdf: true,
        }),
        pdf_page_count: extracted.pageCount,
        pdf_text_chars: extracted.text.length,
      },
      parse: maybeCaaParse(normalized, caaSource),
      jobStatus: insufficient ? 'needs_review' : jobStatus,
      errorCode: insufficient ? 'PARSE_INSUFFICIENT_DATA' : null,
      errorMessage: insufficient
        ? 'PDF text was found but not enough labeled COA fields could be parsed. Review and fill missing fields.'
        : null,
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

  // Text / non-URL QR is heuristic CAA — never present as fully lab-verified.
  // Keep potency only when CAA found labeled values; force review before stash.
  if (input.kind === 'text' || input.kind === 'qr_payload') {
    const note =
      input.kind === 'text'
        ? 'Parsed from pasted text — verify labeled fields before saving.'
        : 'Parsed from QR text payload — verify labeled fields before saving.';
    normalized.extraction = {
      status: 'partial',
      confidence: parse.confidence === 'high' ? 'medium' : 'low',
      notes: [...normalized.extraction.notes, note],
    };
    normalized.warnings.push('INLINE_TEXT_NEEDS_REVIEW');
    const downgrade = <T,>(field: FieldValue<T> | undefined): FieldValue<T> | undefined => {
      if (!field || field.confidence !== 'high') return field;
      return { ...field, confidence: 'medium' };
    };
    normalized.product = {
      ...normalized.product,
      name: downgrade(normalized.product.name),
      brand: downgrade(normalized.product.brand),
      category: downgrade(normalized.product.category),
      strain: downgrade(normalized.product.strain),
      batchNumber: downgrade(normalized.product.batchNumber),
      lotNumber: downgrade(normalized.product.lotNumber),
      packageDate: downgrade(normalized.product.packageDate),
    };
    normalized.cannabinoids = normalized.cannabinoids.map((c) =>
      c.confidence === 'high' ? { ...c, confidence: 'medium' as const } : c,
    );
    normalized.terpenes = normalized.terpenes.map((t) =>
      t.confidence === 'high' ? { ...t, confidence: 'medium' as const } : t,
    );
  }

  return {
    normalized,
    provider: 'caa_inline',
    contentHash,
    rawMetadata: {
      parse_source: parse.parse_source,
      product_key: parse.product_key,
      html_persisted: false,
      input_kind: input.kind,
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
