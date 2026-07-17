import { readFile, writeFile, mkdir } from 'fs/promises';
import type { LearnArticle } from '@/types/learn';
import { dataFile, getDataDir } from '@lib/data-dir';

export type LearnCache = {
  articles: LearnArticle[];
};

const CACHE_FILE = dataFile('learn-articles.json');

const EMPTY: LearnCache = { articles: [] };

async function ensureCache(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  try {
    await readFile(CACHE_FILE, 'utf8');
  } catch {
    await writeFile(CACHE_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

export async function readLearnCache(): Promise<LearnCache> {
  await ensureCache();
  const raw = await readFile(CACHE_FILE, 'utf8');
  const parsed = JSON.parse(raw) as LearnCache;
  return { articles: parsed.articles ?? [] };
}

export async function writeLearnCache(cache: LearnCache): Promise<void> {
  await ensureCache();
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export async function clearLearnFileCache(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
}
