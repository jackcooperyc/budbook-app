import { readFile, writeFile, mkdir } from 'fs/promises';
import type { Session } from '@/types/budbook';
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

export async function readServerSessions(): Promise<Session[]> {
  await ensureFile();
  const raw = await readFile(SESSIONS_FILE, 'utf8');
  const sessions = JSON.parse(raw) as Session[];
  return sessions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function writeServerSessions(sessions: Session[]): Promise<void> {
  await ensureFile();
  await writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
}

export function createSessionId(): string {
  return `sess-${Date.now()}`;
}

export async function addServerSession(
  input: Omit<Session, 'id'> & { id?: string },
): Promise<Session> {
  const sessions = await readServerSessions();
  const session: Session = {
    ...input,
    id: input.id ?? createSessionId(),
  };
  await writeServerSessions([session, ...sessions]);
  return session;
}
