"use client";

import React, { Suspense } from 'react';
import FriendCard from '@/components/FriendCard/FriendCard';
import EmptyState from '@/components/EmptyState/EmptyState';
import Skeleton from '@/components/Skeleton/Skeleton';
import { useFriends } from '@/hooks/useFriends';
import { Users } from 'lucide-react';
import './friends.css';

function FriendsContent() {
  const { friends, loading } = useFriends();

  return (
    <div className="friends-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Friends</h2>
          <p className="page-subtitle">People you share sessions and insights with</p>
        </div>
      </header>

      <div className="friends-list">
        {loading ? (
          <Skeleton className="skeleton-row" />
        ) : friends.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No friends yet"
            description="Connect with others to share session insights and wellness patterns."
          />
        ) : (
          friends.map((friend) => <FriendCard key={friend.id} friend={friend} />)
        )}
      </div>
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={<Skeleton className="skeleton-row" />}>
      <FriendsContent />
    </Suspense>
  );
}
