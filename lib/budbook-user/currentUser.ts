import { resolveCurrentUser } from '@lib/auth/resolveUser';
import { dbEnabled, getDb } from '@lib/db/client';
import { users } from '@lib/db/schema';

export async function getCurrentUserId(): Promise<string> {
  const user = await resolveCurrentUser();
  return user.id;
}

export async function ensureUserExists(user: {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: string;
}): Promise<void> {
  if (!dbEnabled()) return;

  const db = getDb();
  if (!db) return;

  await db
    .insert(users)
    .values({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      username: user.username,
      role: user.role,
    })
    .onConflictDoNothing();
}
