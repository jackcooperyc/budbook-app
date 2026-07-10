import { readFile, writeFile, mkdir } from 'fs/promises';
import type { RetailMenuItem, RetailStore } from '@/types/rda';
import { dataFile, getDataDir } from '@lib/data-dir';

export type RdaCache = {
  stores: RetailStore[];
  menus: Record<string, RetailMenuItem[]>;
};

const CACHE_FILE = dataFile('rda-cache.json');

const EMPTY: RdaCache = { stores: [], menus: {} };

async function ensureCache(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  try {
    await readFile(CACHE_FILE, 'utf8');
  } catch {
    await writeFile(CACHE_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

export async function readRdaCache(): Promise<RdaCache> {
  await ensureCache();
  const raw = await readFile(CACHE_FILE, 'utf8');
  const parsed = JSON.parse(raw) as RdaCache;
  return {
    stores: parsed.stores ?? [],
    menus: parsed.menus ?? {},
  };
}

export async function writeRdaCache(cache: RdaCache): Promise<void> {
  await ensureCache();
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export async function clearRdaFileCache(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
}
