import type { NormalizedCoaResult } from '@lib/coa/types';

export type CoaProviderInput = {
  sourceUrl: string;
  finalUrl: string;
  html: string;
  contentType: string;
  contentHash: string;
};

export interface CoaProvider {
  readonly id: string;
  canHandle(input: CoaProviderInput): boolean;
  parse(input: CoaProviderInput): Promise<NormalizedCoaResult>;
}
