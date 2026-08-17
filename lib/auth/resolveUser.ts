import { getDefaultUser } from '@lib/pacs-user/defaultUser';
import { ensureUserExists } from '@lib/pacs-user/currentUser';
import { authEnabled, getSessionUser } from '@lib/auth/session';
import type { PacsUser } from '@/types/pacs';

/** Resolved user for API handlers — session when auth is on, dev user otherwise. */
export async function resolveCurrentUser(): Promise<PacsUser> {
  if (authEnabled()) {
    const sessionUser = await getSessionUser();
    if (sessionUser) {
      await ensureUserExists(sessionUser);
      return sessionUser;
    }
  }

  const devUser = getDefaultUser();
  await ensureUserExists(devUser);
  return devUser;
}

export async function requireAuthenticatedUser(): Promise<PacsUser | null> {
  if (!authEnabled()) {
    return resolveCurrentUser();
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  await ensureUserExists(sessionUser);
  return sessionUser;
}
