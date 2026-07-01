"use client";

import { useEffect, useState } from 'react';
import type { BudbookMockPayloads } from '@/types/budbook';

/** @deprecated Native UI uses file-backed stores. Legacy SPA / entity proxy only. */
export function useBudbookMock() {
  const [data, setData] = useState<BudbookMockPayloads | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/internal/budbook-mock/payloads')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load mock data');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  return { data, error };
}
