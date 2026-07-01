"use client";

import { useEffect, useState } from 'react';
import type { BudbookUser } from '@/types/budbook';
import { getAvatarSeed } from '@/lib/media';

export function useCurrentUser() {
  const [user, setUser] = useState<BudbookUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/internal/budbook-user')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load user');
        return r.json();
      })
      .then(setUser)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  return {
    user,
    firstName: user?.full_name.split(' ')[0] ?? 'there',
    avatarSeed: user ? getAvatarSeed(user.full_name) : 'budbook-user',
    loading: !user && !error,
    error,
  };
}
