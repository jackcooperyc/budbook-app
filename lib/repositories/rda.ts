import { eq } from 'drizzle-orm';
import type { RetailMenuItem, RetailStore } from '@/types/rda';
import { dbEnabled, getDb } from '@lib/db/client';
import { rdaMenuItems, rdaStores } from '@lib/db/schema';
import {
  clearRdaFileCache,
  readRdaCache,
  writeRdaCache,
  type RdaCache,
} from '@lib/rda/cacheStore';

export type RdaImportInput = {
  stores: RetailStore[];
  menus: Record<string, RetailMenuItem[]>;
};

export type RdaImportResult = {
  storesImported: number;
  menuItemsImported: number;
};

function isMissingRelationError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = 'code' in err ? String((err as { code?: unknown }).code) : '';
  const message = err instanceof Error ? err.message : String(err);
  const cause =
    'cause' in err && (err as { cause?: unknown }).cause instanceof Error
      ? (err as { cause: Error }).cause.message
      : '';
  return (
    code === '42P01' ||
    /relation ["']?rda_(stores|menu_items)["']? does not exist/i.test(message) ||
    /relation ["']?rda_(stores|menu_items)["']? does not exist/i.test(cause)
  );
}

export async function listStores(): Promise<RetailStore[]> {
  if (!dbEnabled()) {
    const cache = await readRdaCache();
    return cache.stores;
  }

  try {
    const db = getDb()!;
    const rows = await db.select().from(rdaStores);
    return rows.map((r) => r.data);
  } catch (err) {
    if (isMissingRelationError(err)) {
      console.warn('[rda] rda_stores missing — returning empty list until migration runs');
      return [];
    }
    throw err;
  }
}

export async function getStore(storeKey: string): Promise<RetailStore | null> {
  if (!dbEnabled()) {
    const cache = await readRdaCache();
    return cache.stores.find((s) => s.store_key === storeKey) ?? null;
  }

  try {
    const db = getDb()!;
    const rows = await db.select().from(rdaStores).where(eq(rdaStores.storeKey, storeKey)).limit(1);
    return rows[0]?.data ?? null;
  } catch (err) {
    if (isMissingRelationError(err)) return null;
    throw err;
  }
}

export async function getMenu(storeKey: string): Promise<RetailMenuItem[]> {
  if (!dbEnabled()) {
    const cache = await readRdaCache();
    return cache.menus[storeKey] ?? [];
  }

  try {
    const db = getDb()!;
    const rows = await db.select().from(rdaMenuItems).where(eq(rdaMenuItems.storeKey, storeKey));
    return rows.map((r) => r.data);
  } catch (err) {
    if (isMissingRelationError(err)) return [];
    throw err;
  }
}

export async function getMenuItem(
  storeKey: string,
  menuItemKey: string,
): Promise<RetailMenuItem | null> {
  const menu = await getMenu(storeKey);
  return menu.find((m) => m.menu_item_key === menuItemKey) ?? null;
}

export async function importRdaCache(input: RdaImportInput): Promise<RdaImportResult> {
  if (!dbEnabled()) {
    await writeRdaCache({ stores: input.stores, menus: input.menus });
    const menuCount = Object.values(input.menus).reduce((sum, items) => sum + items.length, 0);
    return { storesImported: input.stores.length, menuItemsImported: menuCount };
  }

  const db = getDb()!;
  let menuItemsImported = 0;

  for (const store of input.stores) {
    await db
      .insert(rdaStores)
      .values({
        storeKey: store.store_key,
        data: store,
        fetchedAt: new Date(store.source.fetched_at),
      })
      .onConflictDoUpdate({
        target: rdaStores.storeKey,
        set: {
          data: store,
          fetchedAt: new Date(store.source.fetched_at),
        },
      });
  }

  for (const [storeKey, items] of Object.entries(input.menus)) {
    for (const item of items) {
      await db
        .insert(rdaMenuItems)
        .values({
          menuItemKey: item.menu_item_key,
          storeKey,
          data: item,
        })
        .onConflictDoUpdate({
          target: rdaMenuItems.menuItemKey,
          set: { data: item, storeKey },
        });
      menuItemsImported += 1;
    }
  }

  return { storesImported: input.stores.length, menuItemsImported };
}

export async function clearRdaCache(): Promise<void> {
  if (!dbEnabled()) {
    await clearRdaFileCache();
    return;
  }

  const db = getDb()!;
  await db.delete(rdaMenuItems);
  await db.delete(rdaStores);
}

export async function readRdaCacheSnapshot(): Promise<RdaCache> {
  if (!dbEnabled()) return readRdaCache();

  const stores = await listStores();
  const menus: Record<string, RetailMenuItem[]> = {};
  for (const store of stores) {
    menus[store.store_key] = await getMenu(store.store_key);
  }
  return { stores, menus };
}
