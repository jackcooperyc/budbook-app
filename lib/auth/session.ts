import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { PacsUser } from '@/types/pacs';

export const SESSION_COOKIE = 'pacsmt_session';

export type SessionPayload = {
  sub: string;
  email: string;
  full_name: string;
  username: string;
  role: string;
};

function authSecret(): Uint8Array | null {
  const secret = process.env.PACSMT_AUTH_SECRET?.trim();
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export function authEnabled(): boolean {
  return Boolean(authSecret());
}

export function sessionToUser(payload: SessionPayload): PacsUser {
  return {
    id: payload.sub,
    email: payload.email,
    full_name: payload.full_name,
    username: payload.username,
    role: payload.role,
  };
}

export async function createSessionToken(user: PacsUser): Promise<string> {
  const secret = authSecret();
  if (!secret) throw new Error('PACSMT_AUTH_SECRET is not configured');

  return new SignJWT({
    email: user.email,
    full_name: user.full_name,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const secret = authSecret();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.email !== 'string') return null;

    return {
      sub: payload.sub,
      email: payload.email,
      full_name: String(payload.full_name ?? 'Pacs.MT User'),
      username: String(payload.username ?? payload.email.split('@')[0]),
      role: String(payload.role ?? 'user'),
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<PacsUser | null> {
  if (!authEnabled()) return null;

  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  return payload ? sessionToUser(payload) : null;
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
