import type { CaaCoaParseResult } from '@/types/caa';
import { parseCoaInput, CaaParseError } from '@lib/caa/parse';
import { fetchCoaUrl } from '@lib/coa/fetch';
import { hashContent } from '@lib/coa/hash';
import { detectProvider, scanInputToCaa } from '@lib/coa/input';
import { COA_PARSER_VERSION, normalizedFromCaaParse } from '@lib/coa/normalize';
import type { CoaScanErrorCode, NormalizedCoaResult, ScanInput, ScanJobStatus } from '@lib/coa/types';
import { validateScanInput } from '@lib/coa/validate';

export class CoaResolveError extends Error {
  readonly code: CoaScanErrorCode;

  constructor(code: CoaScanErrorCode, message: string) {
    super(message);
    this.name = 'CoaResolveError';
    this.code = code;
  }
}

export type ResolvedCoaScan = {
  normalized: NormalizedCoaResult;
  provider: string;
  contentHash: string | null;
  rawMetadata: Record<string, unknown>;
  parse: CaaCoaParseResult;
  jobStatus: ScanJobStatus;
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

function caaErrorToResolveCode(err: unknown): CoaScanErrorCode {
  if (err instanceof CoaResolveError) return err.code;
  if (err instanceof CaaParseError) return 'RESOLVE_FAILED';
  const message = err instanceof Error ? err.message : '';
  if (message.startsWith('INVALID_URL')) return 'INVALID_URL';
  if (message.startsWith('INVALID_INPUT')) return 'INVALID_INPUT';
  return 'RESOLVE_FAILED';
}

export async function resolveCoaScan(input: ScanInput): Promise<ResolvedCoaScan> {
  const validation = validateScanInput(input);
  if (!validation.ok) {
    throw new CoaResolveError(validation.errorCode, validation.message);
  }

  const { caaInput, caaSource, sourceUrl } = scanInputToCaa(input);
  let provider =
    input.kind === 'manual_url' || input.kind === 'qr_url'
      ? detectProvider(input.url.trim())
      : 'http_extract';

  let contentHash: string | null = null;

  if (input.kind === 'manual_url' || input.kind === 'qr_url') {
    try {
      const fetched = await fetchCoaUrl(input.url.trim());
      if (fetched) {
        contentHash = fetched.contentHash;
        if (provider === 'http_extract') {
          provider = 'http_extract';
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'COA fetch failed.';
      const code = caaErrorToResolveCode(err);
      throw new CoaResolveError(code, message);
    }
  } else {
    contentHash = hashContent(caaInput);
  }

  let parse: CaaCoaParseResult;
  try {
    parse = await parseCoaInput(caaInput, caaSource);
  } catch (err) {
    const message =
      err instanceof CaaParseError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'CAA parse failed.';
    throw new CoaResolveError(caaErrorToResolveCode(err), message);
  }

  if (input.kind === 'manual_url' || input.kind === 'qr_url') {
    if (provider === 'confident_lims') {
      provider = 'confident_lims';
    }
  }

  const normalized = normalizedFromCaaParse(parse, sourceUrl, provider, contentHash);
  if (contentHash) {
    normalized.source.contentHash = contentHash;
  }

  const jobStatus = mapExtractionToJobStatus(normalized.extraction.status);

  return {
    normalized,
    provider,
    contentHash,
    rawMetadata: {
      parse_source: parse.parse_source,
      product_key: parse.product_key,
    },
    parse,
    jobStatus,
  };
}

export { COA_PARSER_VERSION };
