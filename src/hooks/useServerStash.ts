"use client";

import { useCallback, useEffect, useState } from 'react';
import type { InventoryItem, Product } from '@/types/budbook';
import type { LocalStashData } from '@/lib/budbook-stash/fileStore';
import type { ScanProductInput } from '@/lib/stashStorage';

export function useServerStash() {
  const [stash, setStash] = useState<LocalStashData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    fetch('/api/internal/budbook-stash')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load stash');
        return r.json();
      })
      .then((data: LocalStashData) => setStash(data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addProduct = useCallback(
    async (input: ScanProductInput) => {
      const res = await fetch('/api/internal/budbook-stash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to save product');
      reload();
      return res.json() as Promise<{ product: Product }>;
    },
    [reload],
  );

  return {
    products: stash?.products ?? [],
    inventory: stash?.inventory ?? [],
    loading: stash === null && !error,
    error,
    reload,
    addProduct,
  };
}
