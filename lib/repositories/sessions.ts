import { desc, eq } from 'drizzle-orm';
import { readFile, writeFile, mkdir } from 'fs/promises';
import type { Session } from '@/types/budbook';
import { getCurrentUserId } from '@lib/budbook-user/currentUser';
import { dbEnabled, getDb } from '@lib/db/client';
import { toSession } from '@lib/db/mappers';
import { sessions } from '@lib/db/schema';
import { dataFile, getDataDir } from '@lib/data-dir';

const SESSIONS_FILE = dataFile('local-sessions.json');
const EMPTY: Session[] = [];

async function ensureFile(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  try {
    await readFile(SESSIONS_FILE, 'utf8');
  } catch {
    await writeFile(SESSIONS_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

async function readFileSessions(): Promise<Session[]> {
  await ensureFile();
  const raw = await readFile(SESSIONS_FILE, 'utf8');
  const rows = JSON.parse(raw) as Session[];
  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function writeFileSessions(rows: Session[]): Promise<void> {
  await ensureFile();
  await writeFile(SESSIONS_FILE, JSON.stringify(rows, null, 2), 'utf8');
}

export function createSessionId(): string {
  return `sess-${Date.now()}`;
}

export async function readServerSessions(): Promise<Session[]> {
  if (!dbEnabled()) return readFileSessions();

  const userId = await getCurrentUserId();
  const db = getDb()!;
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.date));

  return rows.map(toSession);
}

export async function addServerSession(
  input: Omit<Session, 'id'> & { id?: string },
): Promise<Session> {
  const session: Session = {
    ...input,
    id: input.id ?? createSessionId(),
  };

  if (!dbEnabled()) {
    const rows = await readFileSessions();
    await writeFileSessions([session, ...rows]);
    return session;
  }

  const userId = await getCurrentUserId();
  const db = getDb()!;

  await db.insert(sessions).values({
    id: session.id,
    userId,
    date: new Date(session.date),
    productId: session.product_id,
    consumptionMethod: session.consumption_method,
    dosage: session.dosage,
    pairingNotes: session.pairing_notes,
    rating: session.rating,
    moodBefore: session.mood_before,
    moodAfter: session.mood_after,
    painBefore: session.pain_before,
    painAfter: session.pain_after,
    anxietyBefore: session.anxiety_before,
    anxietyAfter: session.anxiety_after,
    effectsFelt: session.effects_felt,
    activities: session.activities,
    sessionNotes: session.session_notes,
    sessionName: session.session_name,
  });

  return session;
}
