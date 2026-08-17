import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import {
  authEnabled,
  createSessionToken,
  setSessionCookie,
} from '@lib/auth/session';
import { ensureUserExists } from '@lib/pacs-user/currentUser';
import { dbEnabled, getDb } from '@lib/db/client';
import { users } from '@lib/db/schema';
import type { PacsUser } from '@/types/pacs';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

async function upsertUserByEmail(email: string, fullName: string): Promise<PacsUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const username = slugify(normalizedEmail.split('@')[0] || 'user') || 'user';
  const id = `user-${slugify(normalizedEmail)}`;

  const user: PacsUser = {
    id,
    email: normalizedEmail,
    full_name: fullName.trim() || username,
    username,
    role: 'user',
  };

  if (dbEnabled()) {
    const db = getDb()!;
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        username: user.username,
        role: user.role,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          fullName: user.full_name,
          username: user.username,
        },
      });
  } else {
    await ensureUserExists(user);
  }

  return user;
}

export async function POST(request: Request) {
  if (!authEnabled()) {
    return NextResponse.json(
      { message: 'Auth is disabled. Set PACSMT_AUTH_SECRET to enable sign-in.' },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { email?: string; full_name?: string };
  const email = body?.email?.trim();
  const fullName = body?.full_name?.trim() ?? '';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ message: 'Valid email is required' }, { status: 400 });
  }

  const user = await upsertUserByEmail(email, fullName);
  const token = await createSessionToken(user);
  await setSessionCookie(token);

  return NextResponse.json({ user });
}
