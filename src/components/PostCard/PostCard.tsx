"use client";

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import Avatar from '@/components/Avatar/Avatar';
import type { SocialPost } from '@/types/budbook';
import './PostCard.css';

interface PostCardProps {
  post: SocialPost;
  onLike?: (postId: string) => Promise<void>;
}

export default function PostCard({ post, onLike }: PostCardProps) {
  const [likes, setLikes] = useState(post.likes);
  const [liking, setLiking] = useState(false);

  const when = new Date(post.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  async function handleLike() {
    if (!onLike || liking) return;
    setLiking(true);
    try {
      await onLike(post.id);
      setLikes((n) => n + 1);
    } finally {
      setLiking(false);
    }
  }

  return (
    <article className="post-card glass-panel">
      <header className="post-card-header">
        <Avatar name={post.author} seed={post.authorSeed} size="sm" />
        <div>
          <span className="post-card-author">{post.author}</span>
          <span className="post-card-time">{when}</span>
        </div>
      </header>
      <p className="post-card-body">{post.body}</p>
      {(post.strain || post.circle) && (
        <p className="post-card-tags">
          {post.strain && <span>{post.strain}</span>}
          {post.circle && <span>{post.circle}</span>}
        </p>
      )}
      <footer className="post-card-footer">
        <button
          type="button"
          className="post-card-like"
          onClick={() => void handleLike()}
          disabled={!onLike || liking}
          aria-label={`Like post (${likes} likes)`}
        >
          <Heart size={14} strokeWidth={1.75} aria-hidden="true" />
          <span className="meta-numeric">{likes}</span>
        </button>
      </footer>
    </article>
  );
}
