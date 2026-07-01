"use client";

import { useCallback, useEffect, useState } from 'react';
import type { SocialPost } from '@/types/budbook';

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

  const likePost = useCallback(async (postId: string) => {
    const res = await fetch('/api/internal/budbook-posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, action: 'like' }),
    });
    if (!res.ok) throw new Error('Failed to like post');
    reload();
  }, [reload]);

  return { posts: posts ?? [], loading: posts === null, reload, createPost, likePost };
}
