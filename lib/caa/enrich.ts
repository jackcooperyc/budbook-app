import type { CaaEnrichment } from '@/types/caa';
import { getEnrichmentByProductKey } from './registry';

export async function getCaaEnrichment(productKey: string): Promise<CaaEnrichment | null> {
  return getEnrichmentByProductKey(productKey);
}
