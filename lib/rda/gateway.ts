import type { RetailMenuItem, RetailStore, RetailStoreQuery } from '@/types/rda';
import * as rdaRepo from '@lib/repositories/rda';
import { ensureFreshRdaCache } from './refresh';

function matchesQuery(store: RetailStore, query: RetailStoreQuery): boolean {
  if (query.state && store.state.toLowerCase() !== query.state.toLowerCase()) return false;
  if (query.city && store.city.toLowerCase() !== query.city.toLowerCase()) return false;
  if (query.zip && store.zip !== query.zip) return false;
  return true;
}

export async function listRetailStores(query: RetailStoreQuery = {}): Promise<RetailStore[]> {
  await ensureFreshRdaCache();
  const stores = await rdaRepo.listStores();
  return stores.filter((s) => matchesQuery(s, query));
}

export async function getRetailStore(storeKey: string): Promise<RetailStore | null> {
  await ensureFreshRdaCache();
  return rdaRepo.getStore(storeKey);
}

export async function getRetailMenu(storeKey: string): Promise<RetailMenuItem[]> {
  await ensureFreshRdaCache();
  return rdaRepo.getMenu(storeKey);
}

export async function getRetailMenuItem(
  storeKey: string,
  menuItemKey: string,
): Promise<RetailMenuItem | null> {
  await ensureFreshRdaCache();
  return rdaRepo.getMenuItem(storeKey, menuItemKey);
}
