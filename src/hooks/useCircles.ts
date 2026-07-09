"use client";

import { useCallback, useEffect, useState } from 'react';
import type { CircleGroup } from '@/types/budbook';

export function useCircles() {
  const [circles, setCircles] = useState<CircleGroup[] | null>(null);

  const reload = useCallback(() => {
    fetch('/api/internal/budbook-circles')
      .then((r) => r.json())
      .then(setCircles)
      .catch(() => setCircles([]));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const createCircle = useCallback(
    async (input: { name: string; description?: string; isPrivate?: boolean }) => {
      const res = await fetch('/api/internal/budbook-circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create circle');
      reload();
      return res.json() as Promise<CircleGroup>;
    },
    [reload],
  );

  return { circles: circles ?? [], loading: circles === null, reload, createCircle };
}
