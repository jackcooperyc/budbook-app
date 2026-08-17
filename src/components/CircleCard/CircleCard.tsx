"use client";

import React from 'react';
import type { CircleGroup } from '@/types/pacs';
import './CircleCard.css';

export default function CircleCard({ circle }: { circle: CircleGroup }) {
  return (
    <article className="circle-card glass-panel">
      <div className="circle-card-header">
        <h3 className="circle-card-name">{circle.name}</h3>
        <span className="circle-card-badge">{circle.isPrivate ? 'Private' : 'Open'}</span>
      </div>
      <p className="circle-card-description">{circle.description}</p>
      <p className="circle-card-meta">
        {circle.memberCount} members · {circle.recentActivity}
      </p>
    </article>
  );
}
