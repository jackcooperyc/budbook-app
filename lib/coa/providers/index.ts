import { confidentLimsProvider } from '@lib/coa/providers/confidentLims';
import { fidelityProvider } from '@lib/coa/providers/fidelity';
import { genericHtmlProvider } from '@lib/coa/providers/genericHtml';
import { metrcProvider } from '@lib/coa/providers/metrc';
import type { CoaProvider, CoaProviderInput } from '@lib/coa/providers/types';

export type { CoaProvider, CoaProviderInput } from '@lib/coa/providers/types';
export { confidentLimsProvider } from '@lib/coa/providers/confidentLims';
export { fidelityProvider, looksLikeFidelitySource } from '@lib/coa/providers/fidelity';
export { genericHtmlProvider, parseGenericCoaHtml } from '@lib/coa/providers/genericHtml';
export { metrcProvider, looksLikeMetrcSource } from '@lib/coa/providers/metrc';

/** Ordered provider list — first specialized canHandle match wins; generic is last. */
export const COA_PROVIDERS: CoaProvider[] = [
  confidentLimsProvider,
  metrcProvider,
  fidelityProvider,
  genericHtmlProvider,
];

export function selectProvider(input: CoaProviderInput): CoaProvider {
  for (const provider of COA_PROVIDERS) {
    if (provider.id === 'generic_html') continue;
    if (provider.canHandle(input)) return provider;
  }
  return genericHtmlProvider;
}

/** @deprecated Prefer selectProvider */
export const selectCoaProvider = selectProvider;
