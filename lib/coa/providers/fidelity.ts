import { COA_PARSER_VERSION } from '@lib/coa/normalize';
import { parseGenericCoaHtml } from '@lib/coa/providers/genericHtml';
import type { CoaProvider, CoaProviderInput } from '@lib/coa/providers/types';
import type { NormalizedCoaResult } from '@lib/coa/types';

const FIDELITY_HOST_RE = /(^|\.)fidelity\.(com|io|lab|labs|testing)\b/i;
const FIDELITY_CONTENT_RE = /\bfidelity\s+(labs?|testing|analytics|coa|certificate)\b/i;

export function looksLikeFidelitySource(input: CoaProviderInput): boolean {
  try {
    const hosts = [input.sourceUrl, input.finalUrl].map((u) => new URL(u).hostname);
    if (hosts.some((h) => FIDELITY_HOST_RE.test(h))) return true;
  } catch {
    /* ignore */
  }
  return FIDELITY_CONTENT_RE.test(input.html);
}

/**
 * Placeholder Fidelity provider: detects Fidelity report sources and falls back
 * to generic parsing until real samples exist.
 */
export const fidelityProvider: CoaProvider = {
  id: 'fidelity',

  canHandle(input: CoaProviderInput): boolean {
    return looksLikeFidelitySource(input);
  },

  async parse(input: CoaProviderInput): Promise<NormalizedCoaResult> {
    const fallback = parseGenericCoaHtml(input.html, input.sourceUrl, {
      providerId: 'fidelity',
      finalUrl: input.finalUrl,
      contentHash: input.contentHash,
      extraNotes: [
        'Fidelity provider placeholder — awaiting sample reports for a dedicated parser.',
      ],
    });
    fallback.source.providerVersion = COA_PARSER_VERSION;
    fallback.warnings = [
      ...fallback.warnings,
      'Fidelity-specific parser not implemented yet; used generic HTML extraction.',
    ];
    return fallback;
  },
};
