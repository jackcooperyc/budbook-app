import type { CaaCoaParseResult, CaaParseSource } from '@/types/caa';
import { parseConfidentLimsUrl, isConfidentLimsUrl } from '@lib/caa/adapters/confidentLims';
import { parseCoaFromUrl, parseCoaLabText } from '@lib/caa/adapters/httpExtract';
import { extractUrlFromQrPayload } from '@lib/caa/qrPayload';

export class CaaParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaaParseError';
  }
}

async function parseLiveCoaUrl(
  url: string,
  source: 'url' | 'qr',
): Promise<CaaCoaParseResult | null> {
  if (isConfidentLimsUrl(url)) {
    return parseConfidentLimsUrl(url, source);
  }
  return parseCoaFromUrl(url);
}

export async function parseCoaInput(
  input: string,
  source: CaaParseSource,
): Promise<CaaCoaParseResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new CaaParseError('No COA input was provided.');
  }

  if (source === 'url') {
    const live = await parseLiveCoaUrl(trimmed, 'url');
    if (live) return live;
    throw new CaaParseError(
      'Could not extract lab data from that URL. Paste the COA text or try a Confident LIMS share link.',
    );
  }

  if (source === 'qr') {
    const url = extractUrlFromQrPayload(trimmed);
    if (url) {
      const live = await parseLiveCoaUrl(url, 'qr');
      if (live) return live;
      throw new CaaParseError(
        'QR code was read, but lab data could not be loaded from that link. Check the report is public and try again.',
      );
    }

    const fromText = parseCoaLabText(trimmed, 'qr');
    if (fromText && fromText.confidence === 'high') return fromText;

    throw new CaaParseError(
      'QR code did not contain a recognized lab report URL. Use Upload QR image, or paste the COA URL manually.',
    );
  }

  const fromText = parseCoaLabText(trimmed, 'text');
  if (fromText) return fromText;

  throw new CaaParseError(
    'Could not find THC/CBD values in the pasted text. Include lab report numbers or paste the COA URL instead.',
  );
}

export function parseCoaUrl(url: string): Promise<CaaCoaParseResult> {
  return parseCoaInput(url, 'url');
}

export function parseCoaText(text: string): Promise<CaaCoaParseResult> {
  return parseCoaInput(text, 'text');
}
