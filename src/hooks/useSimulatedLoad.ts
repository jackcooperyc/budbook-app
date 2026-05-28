"use client";

import { useEffect, useState } from 'react';

export function useSimulatedLoad(delayMs = 450): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  return loading;
}
