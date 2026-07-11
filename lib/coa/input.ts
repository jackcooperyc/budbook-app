import type { CaaParseSource } from '@/types/caa';
import type { ScanInput, ScanJob } from '@lib/coa/types';
import { hashContent } from '@lib/coa/hash';
import { normalizeUrl } from '@lib/coa/normalize';

export function sourceUrlFromScanInput(input: ScanInput): string {
  switch (input.kind) {
    case 'manual_url':
    case 'qr_url':
      return normalizeUrl(input.url.trim());
    case 'text':
      return `text:inline#${hashContent(input.text.trim()).slice(0, 16)}`;
    case 'qr_payload':
      return `qr:inline#${hashContent(input.payload.trim()).slice(0, 16)}`;
  }
}

export function scanInputToCaa(
  input: ScanInput,
): { caaInput: string; caaSource: CaaParseSource; sourceUrl: string } {
  const sourceUrl = sourceUrlFromScanInput(input);

  switch (input.kind) {
    case 'manual_url':
      return { caaInput: input.url.trim(), caaSource: 'url', sourceUrl };
    case 'qr_url':
      return { caaInput: input.url.trim(), caaSource: 'qr', sourceUrl };
    case 'text':
      return { caaInput: input.text.trim(), caaSource: 'text', sourceUrl };
    case 'qr_payload':
      return { caaInput: input.payload.trim(), caaSource: 'qr', sourceUrl };
  }
}

export function detectProvider(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === 'share.confidentlims.com' || host === 'app.confidentlims.com') {
      return 'confident_lims';
    }
    if (host.includes('fidelity')) {
      return 'fidelity';
    }
  } catch {
    /* fall through */
  }
  return 'generic_html';
}

export function scanInputFromJob(job: ScanJob): ScanInput {
  switch (job.input_kind) {
    case 'manual_url':
    case 'qr_url':
      return { kind: job.input_kind, url: job.source_url };
    case 'text': {
      const text = job.metadata.input_text;
      if (typeof text !== 'string' || !text.trim()) {
        throw new Error('Scan job is missing input_text metadata.');
      }
      return { kind: 'text', text };
    }
    case 'qr_payload': {
      const payload = job.metadata.qr_payload;
      if (typeof payload !== 'string' || !payload.trim()) {
        throw new Error('Scan job is missing qr_payload metadata.');
      }
      return { kind: 'qr_payload', payload };
    }
    default:
      throw new Error(`Unsupported scan job input kind: ${job.input_kind}`);
  }
}

export type ScanRequestBody = {
  /** Phase 2 primary shape */
  sourceType?: 'qr_url' | 'manual_url';
  sourceUrl?: string;
  /** Legacy ScannerPanel / CAA-compat shape */
  url?: string;
  text?: string;
  qr_payload?: string;
};

export function scanInputFromRequestBody(body: ScanRequestBody): ScanInput | null {
  const sourceType = body.sourceType;
  const sourceUrl = body.sourceUrl?.trim();
  if (sourceType && sourceUrl) {
    if (sourceType === 'qr_url' || sourceType === 'manual_url') {
      return { kind: sourceType, url: sourceUrl };
    }
  }

  const qr = body.qr_payload?.trim();
  const text = body.text?.trim();
  const url = body.url?.trim();

  if (qr) {
    try {
      const parsed = new URL(qr);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return { kind: 'qr_url', url: parsed.toString() };
      }
    } catch {
      /* raw QR payload */
    }
    return { kind: 'qr_payload', payload: qr };
  }

  if (text) return { kind: 'text', text };
  if (url) return { kind: 'manual_url', url };

  return null;
}

export function jobMetadataForScanInput(input: ScanInput): Record<string, unknown> {
  switch (input.kind) {
    case 'text':
      return { input_text: input.text };
    case 'qr_payload':
      return { qr_payload: input.payload };
    default:
      return {};
  }
}
