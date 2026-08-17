import { NextResponse } from 'next/server';
import { readPosts, addPost, likePost } from '@/lib/posts-store/fileStore';
import { resolveCurrentUser } from '@lib/auth/resolveUser';
import { internalApiGuard } from '@lib/auth/guard';
import { getAvatarSeed } from '@/lib/media';

export async function GET() {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;
  return NextResponse.json(await readPosts());
}

export async function POST(request: Request) {
  const blocked = await internalApiGuard();
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

  const user = await resolveCurrentUser();

  const post = await addPost({
    author: body.author ?? user.full_name,
    authorSeed: body.authorSeed ?? getAvatarSeed(user.full_name),
    body: body.body.trim(),
    strain: body.strain?.trim() || undefined,
    circle: body.circle?.trim() || undefined,
  });

  return NextResponse.json(post);
}

export async function PATCH(request: Request) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const body = (await request.json()) as { postId?: string; action?: string };

  if (!body?.postId || body.action !== 'like') {
    return NextResponse.json({ message: 'postId and action: "like" are required' }, { status: 400 });
  }

  const post = await likePost(body.postId);
  if (!post) {
    return NextResponse.json({ message: 'Post not found' }, { status: 404 });
  }

  return NextResponse.json(post);
}
