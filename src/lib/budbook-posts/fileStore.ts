import { readFile, writeFile, mkdir } from 'fs/promises';
import { dataFile, getDataDir } from '@lib/data-dir';

export type SocialPost = {
  id: string;
  author: string;
  authorSeed: string;
  body: string;
  strain?: string;
  circle?: string;
  createdAt: string;
  likes: number;
};

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

export async function readPosts(): Promise<SocialPost[]> {
  await ensureFile();
  const raw = await readFile(POSTS_FILE, 'utf8');
  const posts = JSON.parse(raw) as SocialPost[];
  return posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function addPost(
  input: Omit<SocialPost, 'id' | 'createdAt' | 'likes'>,
): Promise<SocialPost> {
  const posts = await readPosts();
  const post: SocialPost = {
    ...input,
    id: `post-${Date.now()}`,
    createdAt: new Date().toISOString(),
    likes: 0,
  };
  await writeFile(POSTS_FILE, JSON.stringify([post, ...posts], null, 2), 'utf8');
  return post;
}
