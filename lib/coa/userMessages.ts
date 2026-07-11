import type { CoaScanErrorCode, ScanJobStatus } from '@lib/coa/types';
import { COA_SCAN_MAX_ATTEMPTS } from '@lib/coa/types';

/** User-facing copy for scan error codes. Never promises PDF OCR. */
export function userMessageForScanError(
  code: CoaScanErrorCode | string | null | undefined,
  fallback?: string,
): string {
  switch (code) {
    case 'PDF_NOT_SUPPORTED_YET':
      return 'This link points to a PDF lab report. Automatic PDF extraction is not available yet — open the PDF yourself and paste the labeled fields, or use an HTML report URL instead.';
    case 'PARSE_INSUFFICIENT_DATA':
      return 'Not enough clearly labeled lab data was found. Review and fill in what you can, or try a different report URL.';
    case 'BLOCKED_URL':
      return 'That URL cannot be fetched for security reasons. Use a public HTTPS lab report link.';
    case 'INVALID_URL':
      return 'That does not look like a valid HTTP(S) lab report URL.';
    case 'INVALID_INPUT':
      return 'Check your input and try again.';
    case 'UNSUPPORTED_CONTENT':
      return 'That page is not a supported lab report format. Try an HTML COA URL or paste labeled text.';
    case 'FETCH_TIMEOUT':
      return 'The lab site took too long to respond. Retry in a moment, or paste the report text.';
    case 'FETCH_FAILED':
      return 'Could not reach that lab report URL. Check the link or try again later.';
    case 'RETRY_LIMIT_EXCEEDED':
      return `Retry limit reached (max ${COA_SCAN_MAX_ATTEMPTS} attempts). Try a different URL or paste the report text.`;
    case 'RETRY_NOT_ALLOWED':
      return 'This scan cannot be retried in its current state.';
    case 'CONFIRM_NOT_ALLOWED':
      return 'This scan cannot be confirmed yet. Wait for extraction to finish or retry.';
    case 'NOT_FOUND':
      return 'Scan not found. Start a new scan.';
    case 'UNAUTHORIZED':
      return 'Sign in required to scan and save lab reports.';
    case 'INTERNAL_ERROR':
      return 'Something went wrong while scanning. Try again in a moment.';
    default:
      return fallback?.trim() || 'Could not extract lab data from that input.';
  }
}

/** Whether retrying the same scan is useful (PDF will not improve on retry). */
export function isRetryUseful(code: CoaScanErrorCode | string | null | undefined): boolean {
  if (!code) return true;
  switch (code) {
    case 'PDF_NOT_SUPPORTED_YET':
    case 'BLOCKED_URL':
    case 'INVALID_URL':
    case 'INVALID_INPUT':
    case 'PARSE_INSUFFICIENT_DATA':
    case 'UNSUPPORTED_CONTENT':
    case 'CONFIRM_NOT_ALLOWED':
    case 'UNAUTHORIZED':
    case 'NOT_FOUND':
      return false;
    default:
      return true;
  }
}

export function canRetryScan(
  status: ScanJobStatus | undefined,
  attemptCount: number | undefined,
  errorCode?: CoaScanErrorCode | string | null,
): boolean {
  if (!status) return false;
  if (status !== 'failed' && status !== 'needs_review') return false;
  if ((attemptCount ?? 0) >= COA_SCAN_MAX_ATTEMPTS) return false;
  return isRetryUseful(errorCode);
}

export function retryCapMessage(attemptCount: number | undefined): string {
  const used = attemptCount ?? COA_SCAN_MAX_ATTEMPTS;
  if (used >= COA_SCAN_MAX_ATTEMPTS) {
    return `Retry limit reached (${COA_SCAN_MAX_ATTEMPTS} attempts). Try a different URL or paste labeled report text.`;
  }
  return `${COA_SCAN_MAX_ATTEMPTS - used} retr${COA_SCAN_MAX_ATTEMPTS - used === 1 ? 'y' : 'ies'} left.`;
}

export function isHttpSourceUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
