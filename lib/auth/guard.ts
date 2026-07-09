import { NextResponse } from 'next/server';
import { authEnabled, getSessionUser } from '@lib/auth/session';
import { mockApiDisabledResponse } from '@/lib/mockApi';

/** Guard internal BudBook APIs: env enable flag + optional session auth. */
export async function internalApiGuard(): Promise<NextResponse | null> {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;

  if (!authEnabled()) return null;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Sign in required' }, { status: 401 });
  }

  return null;
}
