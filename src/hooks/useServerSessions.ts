"use client";

import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@/types/pacs';

export function useServerSessions() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    fetch('/api/internal/journal')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load sessions');
        return r.json();
      })
      .then((data: Session[]) => setSessions(data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveSession = useCallback(
    async (session: Session) => {
      const res = await fetch('/api/internal/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      if (!res.ok) throw new Error('Failed to save session');
      reload();
      return res.json() as Promise<Session>;
    },
    [reload],
  );

  return {
    sessions: sessions ?? [],
    loading: sessions === null && !error,
    error,
    reload,
    saveSession,
  };
}
