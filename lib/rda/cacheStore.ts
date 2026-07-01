import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { RetailMenuItem, RetailStore } from '@/types/rda';
import { buildRdaSeed } from './seed-data';

export type RdaCache = {
  stores: RetailStore[];
  menus: Record<string, RetailMenuItem[]>;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(DATA_DIR, 'rda-cache.json');

const EMPTY: RdaCache = { stores: [], menus: {} };

async function ensureCache(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(CACHE_FILE, 'utf8');
  } catch {
    const seed = buildRdaSeed();
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
  const seed = buildRdaSeed();
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(seed, null, 2), 'utf8');
  return seed;
}
