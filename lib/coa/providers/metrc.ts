import { isMetrcUrl, metrcCredentialsConfigured, parseMetrcUrl } from '@lib/caa/adapters/metrc';
import {
  emptyNormalizedCoaResult,
  fieldValue,
  normalizedFromCaaParse,
} from '@lib/coa/normalize';
import type { CoaProvider, CoaProviderInput } from '@lib/coa/providers/types';
import type { NormalizedCoaResult } from '@lib/coa/types';

export function looksLikeMetrcSource(input: CoaProviderInput): boolean {
  return isMetrcUrl(input.sourceUrl) || isMetrcUrl(input.finalUrl);
}

export const metrcProvider: CoaProvider = {
  id: 'metrc',
  canHandle(input) {
    return looksLikeMetrcSource(input) && metrcCredentialsConfigured();
  },
  async parse(input: CoaProviderInput): Promise<NormalizedCoaResult> {
    const url = input.finalUrl || input.sourceUrl;
    const caa = await parseMetrcUrl(url, 'url');
    if (!caa) {
      const empty = emptyNormalizedCoaResult(url, 'metrc');
      empty.extraction = {
        status: 'needs_review',
        confidence: 'low',
        notes: [
          metrcCredentialsConfigured()
            ? 'Metrc URL detected but package lab data could not be loaded.'
            : 'Metrc URL detected but METRC_* credentials are not configured.',
        ],
      };
      empty.product.name = fieldValue('Metrc package', 'coa', 'low');
      return empty;
    }
    return normalizedFromCaaParse(caa, url, 'metrc', input.contentHash);
  },
};
