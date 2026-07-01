import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function dbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  return drizzle(neon(url), { schema });
}

export type BudbookDb = NonNullable<ReturnType<typeof getDb>>;
