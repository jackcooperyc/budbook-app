"use client";

import { useCallback, useEffect, useState } from 'react';
import type { SocialPost } from '@/lib/budbook-posts/fileStore';

export function usePosts() {
  const [posts, setPosts] = useState<SocialPost[] | null>(null);

  const reload = useCallback(() => {
    fetch('/api/internal/budbook-posts')
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const createPost = useCallback(
    async (input: { body: string; strain?: string; circle?: string }) => {
      const res = await fetch('/api/internal/budbook-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create post');
      reload();
      return res.json() as Promise<SocialPost>;
    },
    [reload],
  );

  return { posts: posts ?? [], loading: posts === null, reload, createPost };
}
