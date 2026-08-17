import type { Session } from '@/types/pacs';

const STORAGE_KEY = 'pacsmt-local-sessions';
const LEGACY_STORAGE_KEY = 'budbook-local-sessions';

function migrateSessions(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(STORAGE_KEY)) return;
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) return;
  localStorage.setItem(STORAGE_KEY, legacy);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function getLocalSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    migrateSessions();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

export function saveLocalSession(session: Session): void {
  const existing = getLocalSessions();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([session, ...existing]));
}

export function createSessionId(): string {
  return `sess-local-${Date.now()}`;
}
