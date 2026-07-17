import { desc, eq } from 'drizzle-orm';
import type { LearnArticle, LearnArticleSummary } from '@/types/learn';
import { dbEnabled, getDb } from '@lib/db/client';
import { learnArticles } from '@lib/db/schema';
import {
  clearLearnFileCache,
  readLearnCache,
  writeLearnCache,
} from '@lib/learn/cacheStore';
import { SEED_LEARN_ARTICLES } from '@lib/learn/seedArticles';

export type LearnImportResult = {
  articlesImported: number;
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
    /relation ["']?learn_articles["']? does not exist/i.test(message) ||
    /relation ["']?learn_articles["']? does not exist/i.test(cause)
  );
}

function toSummary(article: LearnArticle): LearnArticleSummary {
  const { body: _body, ...summary } = article;
  return summary;
}

function sortByPublished(articles: LearnArticle[]): LearnArticle[] {
  return [...articles].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );
}

async function seedIfEmpty(articles: LearnArticle[]): Promise<LearnArticle[]> {
  if (articles.length > 0) return articles;
  await importLearnArticles(SEED_LEARN_ARTICLES);
  return sortByPublished(SEED_LEARN_ARTICLES);
}

export async function listLearnArticles(): Promise<LearnArticleSummary[]> {
  const articles = await listLearnArticlesFull();
  return articles.map(toSummary);
}

export async function listLearnArticlesFull(): Promise<LearnArticle[]> {
  if (!dbEnabled()) {
    const cache = await readLearnCache();
    const seeded = await seedIfEmpty(cache.articles);
    return sortByPublished(seeded);
  }

  try {
    const db = getDb()!;
    const rows = await db.select().from(learnArticles).orderBy(desc(learnArticles.publishedAt));
    if (rows.length === 0) {
      return seedIfEmpty([]);
    }
    return rows.map((r) => r.data);
  } catch (err) {
    if (isMissingRelationError(err)) {
      console.warn('[learn] learn_articles missing — returning seed until migration runs');
      return sortByPublished(SEED_LEARN_ARTICLES);
    }
    throw err;
  }
}

export async function getLearnArticle(slug: string): Promise<LearnArticle | null> {
  if (!dbEnabled()) {
    const articles = await listLearnArticlesFull();
    return articles.find((a) => a.slug === slug) ?? null;
  }

  try {
    const db = getDb()!;
    const rows = await db
      .select()
      .from(learnArticles)
      .where(eq(learnArticles.slug, slug))
      .limit(1);
    if (rows[0]) return rows[0].data;

    // Empty DB: seed once, then retry lookup
    const count = await db.select({ slug: learnArticles.slug }).from(learnArticles).limit(1);
    if (count.length === 0) {
      await seedIfEmpty([]);
      const after = await db
        .select()
        .from(learnArticles)
        .where(eq(learnArticles.slug, slug))
        .limit(1);
      return after[0]?.data ?? null;
    }
    return null;
  } catch (err) {
    if (isMissingRelationError(err)) {
      return SEED_LEARN_ARTICLES.find((a) => a.slug === slug) ?? null;
    }
    throw err;
  }
}

export async function importLearnArticles(articles: LearnArticle[]): Promise<LearnImportResult> {
  if (!dbEnabled()) {
    await writeLearnCache({ articles });
    return { articlesImported: articles.length };
  }

  const db = getDb()!;
  for (const article of articles) {
    await db
      .insert(learnArticles)
      .values({
        slug: article.slug,
        data: article,
        publishedAt: new Date(article.published_at),
        updatedAt: new Date(article.updated_at),
      })
      .onConflictDoUpdate({
        target: learnArticles.slug,
        set: {
          data: article,
          publishedAt: new Date(article.published_at),
          updatedAt: new Date(article.updated_at),
        },
      });
  }

  return { articlesImported: articles.length };
}

export async function clearLearnArticles(): Promise<void> {
  if (!dbEnabled()) {
    await clearLearnFileCache();
    return;
  }

  const db = getDb()!;
  await db.delete(learnArticles);
}
