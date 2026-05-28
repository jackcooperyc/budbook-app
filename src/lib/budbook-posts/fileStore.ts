import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

const POSTS_DIR = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(POSTS_DIR, 'local-posts.json');

const SEED_POSTS: SocialPost[] = [
  {
    id: 'post-seed-1',
    author: 'Alex Chen',
    authorSeed: 'alex-chen',
    body: 'Evening GMO micro-dose hit different tonight — pain down, no anxiety rebound. Logged 0.19g via CŪPR.',
    strain: 'GMO Cookies',
    circle: 'PDX Evening Wind-Down',
    createdAt: '2026-04-28T20:10:00-07:00',
    likes: 12,
  },
  {
    id: 'post-seed-2',
    author: 'Morgan Lee',
    authorSeed: 'morgan-lee',
    body: "Charlotte's Web tincture at lunch keeps me functional. Tracking 15mg in BudBook made the pattern obvious.",
    strain: "Charlotte's Web",
    circle: 'CBD-Forward Wellness',
    createdAt: '2026-04-27T14:30:00-07:00',
    likes: 8,
  },
];

async function ensureFile(): Promise<void> {
  await mkdir(POSTS_DIR, { recursive: true });
  try {
    await readFile(POSTS_FILE, 'utf8');
  } catch {
    await writeFile(POSTS_FILE, JSON.stringify(SEED_POSTS, null, 2), 'utf8');
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
