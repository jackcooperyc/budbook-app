import type { LearnArticle } from '@/types/learn';

export type LearnValidationError = {
  path: string;
  message: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  errors: LearnValidationError[],
) {
  const value = obj[key];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push({ path: `${path}.${key}`, message: 'required string' });
  }
}

function validateArticle(
  raw: unknown,
  index: number,
  errors: LearnValidationError[],
): LearnArticle | null {
  const path = `articles[${index}]`;

  if (!isObject(raw)) {
    errors.push({ path, message: 'must be an object' });
    return null;
  }

  const before = errors.length;
  requireString(raw, 'slug', path, errors);
  requireString(raw, 'title', path, errors);
  requireString(raw, 'summary', path, errors);
  requireString(raw, 'category', path, errors);
  requireString(raw, 'body', path, errors);
  requireString(raw, 'published_at', path, errors);
  requireString(raw, 'updated_at', path, errors);

  if (!Array.isArray(raw.tags) || !raw.tags.every((t) => typeof t === 'string')) {
    errors.push({ path: `${path}.tags`, message: 'must be a string array' });
  }

  if (typeof raw.slug === 'string' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw.slug)) {
    errors.push({ path: `${path}.slug`, message: 'must be a kebab-case slug' });
  }

  if (errors.length > before) return null;
  return {
    slug: (raw.slug as string).trim(),
    title: (raw.title as string).trim(),
    summary: (raw.summary as string).trim(),
    category: (raw.category as string).trim(),
    tags: (raw.tags as string[]).map((t) => t.trim()).filter(Boolean),
    body: (raw.body as string).trim(),
    published_at: (raw.published_at as string).trim(),
    updated_at: (raw.updated_at as string).trim(),
  };
}

export function validateLearnImport(input: unknown): {
  ok: boolean;
  errors: LearnValidationError[];
  data?: { articles: LearnArticle[] };
} {
  const errors: LearnValidationError[] = [];

  if (!isObject(input)) {
    return { ok: false, errors: [{ path: '', message: 'body must be an object' }] };
  }

  if (!Array.isArray(input.articles)) {
    return { ok: false, errors: [{ path: 'articles', message: 'must be an array' }] };
  }

  const articles: LearnArticle[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < input.articles.length; i++) {
    const article = validateArticle(input.articles[i], i, errors);
    if (!article) continue;
    if (seen.has(article.slug)) {
      errors.push({ path: `articles[${i}].slug`, message: 'duplicate slug' });
      continue;
    }
    seen.add(article.slug);
    articles.push(article);
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors: [], data: { articles } };
}
