import React from 'react';
import { Heart } from 'lucide-react';
import Avatar from '@/components/Avatar/Avatar';
import type { SocialPost } from '@/lib/budbook-posts/fileStore';
import './PostCard.css';

interface PostCardProps {
  post: SocialPost;
}

export default function PostCard({ post }: PostCardProps) {
  const when = new Date(post.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

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
        <Heart size={14} strokeWidth={1.75} aria-hidden="true" />
        <span className="meta-numeric">{post.likes}</span>
      </footer>
    </article>
  );
}
