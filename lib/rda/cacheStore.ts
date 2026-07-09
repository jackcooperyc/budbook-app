import { readFile, writeFile, mkdir } from 'fs/promises';
import type { RetailMenuItem, RetailStore } from '@/types/rda';
import { dataFile, getDataDir } from '@lib/data-dir';
import { buildRdaSeed } from './seed-data';

export type RdaCache = {
  stores: RetailStore[];
  menus: Record<string, RetailMenuItem[]>;
};

const CACHE_FILE = dataFile('rda-cache.json');

const EMPTY: RdaCache = { stores: [], menus: {} };

function demoSeedingEnabled(): boolean {
  // Do not ship demo retail data into production.
  return process.env.NODE_ENV !== 'production' && process.env.BUDBOOK_MOCK_ENABLED === '1';
}

async function ensureCache(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  try {
    await readFile(CACHE_FILE, 'utf8');
  } catch {
    const seed = demoSeedingEnabled() ? buildRdaSeed() : EMPTY;
    await writeFile(CACHE_FILE, JSON.stringify(seed, null, 2), 'utf8');
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

export async function resetRdaCache(): Promise<RdaCache> {
  const seed = demoSeedingEnabled() ? buildRdaSeed() : EMPTY;
  await mkdir(getDataDir(), { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(seed, null, 2), 'utf8');
  return seed;
}
