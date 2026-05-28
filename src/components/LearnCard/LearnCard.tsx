import React from 'react';
import { BookMarked, ChefHat, GraduationCap } from 'lucide-react';
import type { LearnItem } from '@/data/socialMock';
import './LearnCard.css';

const icons = {
  course: GraduationCap,
  ebook: BookMarked,
  recipe: ChefHat,
};

interface LearnCardProps {
  item: LearnItem;
}

export default function LearnCard({ item }: LearnCardProps) {
  const Icon = icons[item.type];

  return (
    <article className="learn-card glass-panel">
      <div className="learn-card-icon-wrap">
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className="learn-card-body">
        <div className="learn-card-header">
          <h3>{item.title}</h3>
          <span className="learn-card-tag">{item.tag}</span>
        </div>
        <p className="learn-card-desc">{item.description}</p>
        <span className="learn-card-meta meta-numeric">
          {item.type} · {item.duration}
        </span>
      </div>
    </article>
  );
}
