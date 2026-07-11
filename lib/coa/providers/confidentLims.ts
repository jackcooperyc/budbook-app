import { isConfidentLimsUrl, parseConfidentLimsUrl } from '@lib/caa/adapters/confidentLims';
import {
  COA_PARSER_VERSION,
  emptyNormalizedCoaResult,
  normalizedFromCaaParse,
} from '@lib/coa/normalize';
import type { NormalizedCoaResult } from '@lib/coa/types';
import type { CoaProvider, CoaProviderInput } from '@lib/coa/providers/types';

/**
 * Bridges Confident LIMS share/app URLs through the existing CAA adapter into
 * the normalized COA scan contract.
 */
export const confidentLimsProvider: CoaProvider = {
  id: 'confident_lims',
  canHandle(input: CoaProviderInput) {
    return isConfidentLimsUrl(input.sourceUrl) || isConfidentLimsUrl(input.finalUrl);
  },
  async parse(input: CoaProviderInput): Promise<NormalizedCoaResult> {
    const parse =
      (await parseConfidentLimsUrl(input.sourceUrl, 'url')) ??
      (await parseConfidentLimsUrl(input.finalUrl, 'url'));

    if (!parse) {
      const empty = emptyNormalizedCoaResult(
        input.sourceUrl,
        'confident_lims',
        COA_PARSER_VERSION,
      );
      empty.source.contentHash = input.contentHash;
      empty.extraction = {
        status: 'needs_review',
        confidence: 'low',
        notes: ['Confident LIMS URL detected but sample payload could not be loaded.'],
      };
      return empty;
    }

    const normalized = normalizedFromCaaParse(
      parse,
      input.sourceUrl,
      'confident_lims',
      input.contentHash,
    );
    normalized.extraction.notes.push('Bridged via CAA Confident LIMS adapter.');
    return normalized;
  },
};
