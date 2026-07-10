import { NextResponse } from 'next/server';
import { authEnabled, getSessionUser } from '@lib/auth/session';

/** Guard internal BudBook APIs: optional session auth when BUDBOOK_AUTH_SECRET is set. */
export async function internalApiGuard(): Promise<NextResponse | null> {
  if (!authEnabled()) return null;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Sign in required' }, { status: 401 });
  }

  return null;
}
