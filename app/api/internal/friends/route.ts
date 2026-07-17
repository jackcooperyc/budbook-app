import { NextResponse } from 'next/server';
import { internalApiGuard } from '@lib/auth/guard';
import { listFriends } from '@lib/repositories/social';

export async function GET() {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;
  return NextResponse.json(await listFriends());
}
