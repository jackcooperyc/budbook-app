"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MessageSquare, PenLine } from 'lucide-react';
import PostCard from '@/components/PostCard/PostCard';
import EmptyState from '@/components/EmptyState/EmptyState';
import Button from '@/components/Button/Button';
import Skeleton from '@/components/Skeleton/Skeleton';
import { usePosts } from '@/hooks/usePosts';
import './media.css';

function MediaContent() {
  const { posts, loading } = usePosts();
  const searchParams = useSearchParams();
  const posted = searchParams.get('posted') === '1';

  return (
    <div className="media-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Media</h2>
          <p className="page-subtitle">Community posts from your circles</p>
        </div>
        <Link href="/budbook-app/post/new">
          <Button variant="primary" size="sm" icon={<PenLine size={14} strokeWidth={1.75} />}>
            New post
          </Button>
        </Link>
      </header>

      {posted && (
        <p className="media-posted-banner" role="status">
          Post published to your feed.
        </p>
      )}

      <div className="media-feed">
        {loading ? (
          <Skeleton className="skeleton-row" />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No posts yet"
            description="Share session insights, pairings, or wins with your community."
            action={
              <Link href="/budbook-app/post/new">
                <Button variant="primary" size="sm">
                  Write your first post
                </Button>
              </Link>
            }
          />
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

export default function MediaPage() {
  return (
    <Suspense fallback={<Skeleton className="skeleton-row" />}>
      <MediaContent />
    </Suspense>
  );
}
