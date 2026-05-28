"use client";

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PenLine } from 'lucide-react';
import MediaCard from '@/components/MediaCard/MediaCard';
import PostCard from '@/components/PostCard/PostCard';
import Button from '@/components/Button/Button';
import Skeleton from '@/components/Skeleton/Skeleton';
import { mediaItems } from '@/data/socialMock';
import { usePosts } from '@/hooks/usePosts';
import './media.css';

function MediaContent() {
  const { posts, loading } = usePosts();
  const searchParams = useSearchParams();
  const posted = searchParams.get('posted') === '1';
  const [tab, setTab] = useState<'feed' | 'curated'>('feed');

  const feed = useMemo(() => posts, [posts]);

  return (
    <div className="media-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Media</h2>
          <p className="page-subtitle">Community feed and curated wellness content</p>
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

      <div className="media-tabs">
        <button
          type="button"
          className={`media-tab ${tab === 'feed' ? 'media-tab-active' : ''}`}
          onClick={() => setTab('feed')}
        >
          Community feed
        </button>
        <button
          type="button"
          className={`media-tab ${tab === 'curated' ? 'media-tab-active' : ''}`}
          onClick={() => setTab('curated')}
        >
          Curated
        </button>
      </div>

      {tab === 'feed' && (
        <div className="media-feed">
          {loading ? (
            <Skeleton className="skeleton-row" />
          ) : (
            feed.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      )}

      {tab === 'curated' && (
        <div className="media-grid">
          {mediaItems.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      )}
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
