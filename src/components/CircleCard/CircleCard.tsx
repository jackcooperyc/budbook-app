import React from 'react';
import { Lock, Users } from 'lucide-react';
import type { Circle } from '@/data/socialMock';
import './CircleCard.css';

interface CircleCardProps {
  circle: Circle;
}

export default function CircleCard({ circle }: CircleCardProps) {
  return (
    <article className="circle-card glass-panel">
      <div className="circle-card-header">
        <h3>{circle.name}</h3>
        {circle.isPrivate && (
          <span className="circle-card-private">
            <Lock size={12} strokeWidth={1.75} aria-hidden="true" />
            Private
          </span>
        )}
      </div>
      <p className="circle-card-desc">{circle.description}</p>
      <p className="circle-card-members">
        <Users size={14} strokeWidth={1.75} aria-hidden="true" />
        {circle.memberCount} members
      </p>
      <p className="circle-card-activity">{circle.recentActivity}</p>
    </article>
  );
}
