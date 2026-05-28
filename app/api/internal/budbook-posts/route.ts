import { NextResponse } from 'next/server';
import { readPosts, addPost } from '@/lib/budbook-posts/fileStore';
import { mockApiDisabledResponse } from '@/lib/mockApi';

export async function GET() {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;
  return NextResponse.json(await readPosts());
}

export async function POST(request: Request) {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;

  const body = (await request.json()) as {
    author?: string;
    authorSeed?: string;
    body?: string;
    strain?: string;
    circle?: string;
  };

  if (!body?.body?.trim()) {
    return NextResponse.json({ message: 'Post body is required' }, { status: 400 });
  }

  const post = await addPost({
    author: body.author ?? 'Jordan Rivers',
    authorSeed: body.authorSeed ?? 'jordan-rivers',
    body: body.body.trim(),
    strain: body.strain?.trim() || undefined,
    circle: body.circle?.trim() || undefined,
  });

  return NextResponse.json(post);
}
