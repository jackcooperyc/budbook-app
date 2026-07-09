import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { sql } from 'drizzle-orm';
import { getDb } from '@lib/db/client';

function splitStatements(raw: string): string[] {
  return raw
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const db = getDb();
  if (!db) {
    console.error('Failed to initialize database client');
    process.exit(1);
  }

  const migrationsDir = path.join(process.cwd(), 'lib/db/migrations');
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const raw = await readFile(path.join(migrationsDir, file), 'utf8');
    for (const statement of splitStatements(raw)) {
      await db.execute(sql.raw(statement));
    }
    console.log(`Applied ${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
