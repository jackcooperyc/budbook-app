import { NextResponse } from 'next/server';
import { internalApiGuard } from '@lib/auth/guard';
import { resolveCurrentUser } from '@lib/auth/resolveUser';

export async function GET() {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;
  return NextResponse.json(await resolveCurrentUser());
}
