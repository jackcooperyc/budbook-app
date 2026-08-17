"use client";

import { useEffect, useState } from 'react';
import type { PacsUser } from '@/types/pacs';
import { getAvatarSeed } from '@/lib/media';

export function useCurrentUser() {
  const [user, setUser] = useState<PacsUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/internal/user')
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
    avatarSeed: user ? getAvatarSeed(user.full_name) : 'pacsmt-user',
    loading: !user && !error,
    error,
  };
}
