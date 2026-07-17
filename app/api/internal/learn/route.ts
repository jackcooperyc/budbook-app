import { NextResponse } from 'next/server';
import { listLearnArticles } from '@lib/repositories/learn';
import { internalApiGuard } from '@lib/auth/guard';

export async function GET() {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;
  return NextResponse.json(await listLearnArticles());
}
