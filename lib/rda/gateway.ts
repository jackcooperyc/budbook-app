import type { RetailMenuItem, RetailStore, RetailStoreQuery } from '@/types/rda';
import { readRdaCache } from './cacheStore';

function matchesQuery(store: RetailStore, query: RetailStoreQuery): boolean {
  if (query.state && store.state.toLowerCase() !== query.state.toLowerCase()) return false;
  if (query.city && store.city.toLowerCase() !== query.city.toLowerCase()) return false;
  if (query.zip && store.zip !== query.zip) return false;
  return true;
}

export async function listRetailStores(query: RetailStoreQuery = {}): Promise<RetailStore[]> {
  const cache = await readRdaCache();
  return cache.stores.filter((s) => matchesQuery(s, query));
}

export async function getRetailStore(storeKey: string): Promise<RetailStore | null> {
  const cache = await readRdaCache();
  return cache.stores.find((s) => s.store_key === storeKey) ?? null;
}

export async function getRetailMenu(storeKey: string): Promise<RetailMenuItem[]> {
  const cache = await readRdaCache();
  return cache.menus[storeKey] ?? [];
}

export async function getRetailMenuItem(
  storeKey: string,
  menuItemKey: string,
): Promise<RetailMenuItem | null> {
  const menu = await getRetailMenu(storeKey);
  return menu.find((m) => m.menu_item_key === menuItemKey) ?? null;
}
