import { desc, eq, sql } from 'drizzle-orm';
import { readFile, writeFile, mkdir } from 'fs/promises';
import type { SocialPost } from '@/types/pacs';
import { getCurrentUserId } from '@lib/pacs-user/currentUser';
import { dbEnabled, getDb } from '@lib/db/client';
import { toSocialPost } from '@lib/db/mappers';
import { posts } from '@lib/db/schema';
import { dataFile, getDataDir } from '@lib/data-dir';

const POSTS_FILE = dataFile('local-posts.json');
const EMPTY: SocialPost[] = [];

async function ensureFile(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  try {
    await readFile(POSTS_FILE, 'utf8');
  } catch {
    await writeFile(POSTS_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

async function readFilePosts(): Promise<SocialPost[]> {
  await ensureFile();
  const raw = await readFile(POSTS_FILE, 'utf8');
  const rows = JSON.parse(raw) as SocialPost[];
  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function writeFilePosts(rows: SocialPost[]): Promise<void> {
  await ensureFile();
  await writeFile(POSTS_FILE, JSON.stringify(rows, null, 2), 'utf8');
}

export async function readPosts(): Promise<SocialPost[]> {
  if (!dbEnabled()) return readFilePosts();

  const userId = await getCurrentUserId();
  const db = getDb()!;
  const rows = await db.select().from(posts).orderBy(desc(posts.createdAt));

  return rows.map(toSocialPost);
}

export async function addPost(
  input: Omit<SocialPost, 'id' | 'createdAt' | 'likes'>,
): Promise<SocialPost> {
  const post: SocialPost = {
    ...input,
    id: `post-${Date.now()}`,
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  if (!dbEnabled()) {
    const rows = await readFilePosts();
    await writeFilePosts([post, ...rows]);
    return post;
  }

  const userId = await getCurrentUserId();
  const db = getDb()!;

  await db.insert(posts).values({
    id: post.id,
    userId,
    author: post.author,
    authorSeed: post.authorSeed,
    body: post.body,
    strain: post.strain ?? null,
    circle: post.circle ?? null,
    likes: post.likes,
    createdAt: new Date(post.createdAt),
  });

  return post;
}

export async function likePost(postId: string): Promise<SocialPost | null> {
  if (!dbEnabled()) {
    const rows = await readFilePosts();
    const index = rows.findIndex((p) => p.id === postId);
    if (index === -1) return null;

    const updated: SocialPost = { ...rows[index], likes: rows[index].likes + 1 };
    const next = [...rows];
    next[index] = updated;
    await writeFilePosts(next);
    return updated;
  }

  const db = getDb()!;
  const [row] = await db
    .update(posts)
    .set({ likes: sql`${posts.likes} + 1` })
    .where(eq(posts.id, postId))
    .returning();

  return row ? toSocialPost(row) : null;
}
