import type { Session } from '@/types/budbook';

const STORAGE_KEY = 'budbook-local-sessions';

export function getLocalSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
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
