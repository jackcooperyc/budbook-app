import type { CoaScanErrorCode, ScanInput } from '@lib/coa/types';
import { sourceUrlFromScanInput } from '@lib/coa/input';
import { normalizeUrl } from '@lib/coa/normalize';

export type ScanValidationResult =
  | { ok: true; sourceUrl: string }
  | { ok: false; errorCode: CoaScanErrorCode; message: string };

const BLOCKED_URL_SCHEMES = /^(javascript|data|file|blob|ftp):/i;

/** Patterns that suggest potency inference from arbitrary text — rejected for short inputs. */
const POTENCY_FRAGMENT_PATTERNS = [
  /\bthc\s*[:=]?\s*\d/i,
  /\bcbd\s*[:=]?\s*\d/i,
  /\b\d+(\.\d+)?\s*%\s*thc\b/i,
  /\b\d+(\.\d+)?\s*%\s*cbd\b/i,
  /\b\d+(\.\d+)?\s*mg\s*(thc|cbd)\b/i,
];

function looksLikePotencyFragment(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  return POTENCY_FRAGMENT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/** Reject short text that is only a potency fragment, not a full COA document. */
function looksLikePotencyOnlyFragment(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length > 200) return false;
  return looksLikePotencyFragment(trimmed);
}

export function validateUrl(url: string): ScanValidationResult {
  const trimmed = url.trim();
  if (!trimmed) {
    return { ok: false, errorCode: 'INVALID_URL', message: 'URL is required.' };
  }

  if (looksLikePotencyFragment(trimmed)) {
    return {
      ok: false,
      errorCode: 'INVALID_INPUT',
      message:
        'Potency values cannot be inferred from text fragments. Provide a full COA URL instead.',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, errorCode: 'INVALID_URL', message: 'URL is not valid.' };
  }

  if (BLOCKED_URL_SCHEMES.test(parsed.protocol)) {
    return {
      ok: false,
      errorCode: 'INVALID_URL',
      message: `URL scheme "${parsed.protocol.replace(':', '')}" is not allowed.`,
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      ok: false,
      errorCode: 'INVALID_URL',
      message: 'Only http and https URLs are supported.',
    };
  }

  if (!parsed.hostname) {
    return { ok: false, errorCode: 'INVALID_URL', message: 'URL must include a hostname.' };
  }

  return { ok: true, sourceUrl: normalizeUrl(parsed.toString()) };
}

function validateInlineText(value: string, label: string): ScanValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, errorCode: 'INVALID_INPUT', message: `${label} is required.` };
  }

  if (looksLikePotencyOnlyFragment(trimmed)) {
    return {
      ok: false,
      errorCode: 'INVALID_INPUT',
      message:
        'Potency values cannot be inferred from text fragments. Paste the full COA document instead.',
    };
  }

  return { ok: true, sourceUrl: sourceUrlFromScanInput({ kind: 'text', text: trimmed }) };
}

export function validateScanInput(input: ScanInput): ScanValidationResult {
  if (!input) {
    return { ok: false, errorCode: 'INVALID_INPUT', message: 'Scan input is required.' };
  }

  switch (input.kind) {
    case 'manual_url':
    case 'qr_url':
      if (typeof input.url !== 'string') {
        return { ok: false, errorCode: 'INVALID_INPUT', message: 'Scan input URL must be a string.' };
      }
      return validateUrl(input.url);
    case 'text':
      if (typeof input.text !== 'string') {
        return { ok: false, errorCode: 'INVALID_INPUT', message: 'Scan input text must be a string.' };
      }
      return validateInlineText(input.text, 'COA text');
    case 'qr_payload':
      if (typeof input.payload !== 'string') {
        return {
          ok: false,
          errorCode: 'INVALID_INPUT',
          message: 'QR payload must be a string.',
        };
      }
      return validateInlineText(input.payload, 'QR payload');
    default:
      return { ok: false, errorCode: 'INVALID_INPUT', message: 'Unsupported scan input kind.' };
  }
}
