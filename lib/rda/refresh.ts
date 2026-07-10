import { readRdaCacheSnapshot } from '@lib/repositories/rda';
import type { RetailStore } from '@/types/rda';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function cacheAgeMs(fetchedAt: string | undefined): number {
  if (!fetchedAt) return Number.POSITIVE_INFINITY;
  return Date.now() - new Date(fetchedAt).getTime();
}

function markStaleConfidence(store: RetailStore): RetailStore {
  if (store.source.source_confidence === 'low') return store;
  return {
    ...store,
    source: { ...store.source, source_confidence: 'low' },
  };
}

/**
 * Marks cached retail records as stale when they exceed TTL.
 * Does not wipe operator-imported data — live adapter refresh hooks in here later.
 */
export async function ensureFreshRdaCache(): Promise<void> {
  const cache = await readRdaCacheSnapshot();
  if (cache.stores.length === 0) return;

  const fetchedAt = cache.stores[0]?.source?.fetched_at;
  const ttl = Number(process.env.RDA_CACHE_TTL_MS ?? DEFAULT_TTL_MS);

  if (cacheAgeMs(fetchedAt) <= ttl) return;

  const staleStores = cache.stores.map(markStaleConfidence);
  const staleMenus = Object.fromEntries(
    Object.entries(cache.menus).map(([storeKey, items]) => [
      storeKey,
      items.map((item) =>
        item.source.source_confidence === 'low'
          ? item
          : { ...item, source: { ...item.source, source_confidence: 'low' as const } },
      ),
    ]),
  );

  const { importRdaCache } = await import('@lib/repositories/rda');
  await importRdaCache({ stores: staleStores, menus: staleMenus });
}
