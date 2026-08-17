import { NextResponse } from 'next/server';
import { authEnabled, getSessionUser } from '@lib/auth/session';
import { getDefaultUser } from '@lib/pacs-user/defaultUser';

export async function GET() {
  if (!authEnabled()) {
    return NextResponse.json({ authenticated: false, user: getDefaultUser(), authEnabled: false });
  }

  const user = await getSessionUser();
  return NextResponse.json({
    authenticated: Boolean(user),
    user,
    authEnabled: true,
  });
}
