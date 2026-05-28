import React from 'react';
import { FileText, Headphones, Play } from 'lucide-react';
import type { MediaItem } from '@/data/socialMock';
import './MediaCard.css';

const icons = {
  article: FileText,
  podcast: Headphones,
  video: Play,
};

interface MediaCardProps {
  item: MediaItem;
}

export default function MediaCard({ item }: MediaCardProps) {
  const Icon = icons[item.type];
  const date = new Date(item.published).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="media-card glass-panel">
      <div className="media-card-type">
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>{item.type}</span>
      </div>
      <h3 className="media-card-title">{item.title}</h3>
      <p className="media-card-source">
        {item.source} · {date}
      </p>
      <p className="media-card-summary">{item.summary}</p>
    </article>
  );
}
