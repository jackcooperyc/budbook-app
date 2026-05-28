import React from 'react';
import type { Friend } from '@/data/socialMock';
import Avatar from '@/components/Avatar/Avatar';
import { getAvatarSeed } from '@/lib/media';
import './FriendCard.css';

interface FriendCardProps {
  friend: Friend;
}

export default function FriendCard({ friend }: FriendCardProps) {
  const lastActive = new Date(friend.lastActive).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="friend-card glass-panel">
      <Avatar name={friend.name} seed={getAvatarSeed(friend.name)} size="lg" />
      <div className="friend-card-body">
        <div className="friend-card-header">
          <h3>{friend.name}</h3>
          {friend.online && <span className="friend-card-online">Online</span>}
        </div>
        <p className="friend-card-username meta-numeric">@{friend.username}</p>
        <p className="friend-card-meta">
          {friend.sessionsShared} shared sessions · Active {lastActive}
        </p>
        {friend.favoriteStrain && (
          <p className="friend-card-strain">Fav: {friend.favoriteStrain}</p>
        )}
      </div>
    </article>
  );
}
