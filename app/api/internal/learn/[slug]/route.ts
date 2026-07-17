import { NextResponse } from 'next/server';
import { getLearnArticle } from '@lib/repositories/learn';
import { internalApiGuard } from '@lib/auth/guard';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const { slug } = await params;
  const article = await getLearnArticle(decodeURIComponent(slug));
  if (!article) {
    return NextResponse.json({ message: 'Article not found' }, { status: 404 });
  }
  return NextResponse.json(article);
}
