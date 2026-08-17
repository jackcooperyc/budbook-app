"use client";

import React from 'react';
import Avatar from '@/components/Avatar/Avatar';
import { getAvatarSeed } from '@/lib/media';
import type { FriendProfile } from '@/types/pacs';
import './FriendCard.css';

export default function FriendCard({ friend }: { friend: FriendProfile }) {
  const when = new Date(friend.lastActive).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="friend-card glass-panel">
      <div className="friend-card-main">
        <Avatar name={friend.name} seed={getAvatarSeed(friend.name)} size="md" />
        <div>
          <div className="friend-card-name-row">
            <span className="friend-card-name">{friend.name}</span>
            <span className={`friend-card-status ${friend.online ? 'is-online' : ''}`}>
              {friend.online ? 'Online' : 'Offline'}
            </span>
          </div>
          <span className="friend-card-username">@{friend.username}</span>
        </div>
      </div>
      <p className="friend-card-meta">
        {friend.sessionsShared} shared sessions · last active {when}
        {friend.favoriteStrain ? ` · favors ${friend.favoriteStrain}` : ''}
      </p>
    </article>
  );
}
