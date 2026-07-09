"use client";

import { useCallback, useEffect, useState } from 'react';
import type { FriendProfile } from '@/types/budbook';

export function useFriends() {
  const [friends, setFriends] = useState<FriendProfile[] | null>(null);

  const reload = useCallback(() => {
    fetch('/api/internal/budbook-friends')
      .then((r) => r.json())
      .then(setFriends)
      .catch(() => setFriends([]));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { friends: friends ?? [], loading: friends === null, reload };
}
