import { readRdaCache, resetRdaCache } from './cacheStore';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function cacheAgeMs(fetchedAt: string | undefined): number {
  if (!fetchedAt) return Number.POSITIVE_INFINITY;
  return Date.now() - new Date(fetchedAt).getTime();
}

/** Refresh seed cache when records exceed TTL (live adapter hook point). */
export async function ensureFreshRdaCache(): Promise<void> {
  const cache = await readRdaCache();
  const fetchedAt = cache.stores[0]?.source?.fetched_at;
  const ttl = Number(process.env.RDA_CACHE_TTL_MS ?? DEFAULT_TTL_MS);

  if (cacheAgeMs(fetchedAt) > ttl) {
    await resetRdaCache();
  }
}
