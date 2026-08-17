import { NextResponse } from 'next/server';
import { authEnabled, getSessionUser } from '@lib/auth/session';

/** Guard internal Pacs.MT APIs: optional session auth when PACSMT_AUTH_SECRET is set. */
export async function internalApiGuard(): Promise<NextResponse | null> {
  if (!authEnabled()) return null;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Sign in required' }, { status: 401 });
  }

  return null;
}
