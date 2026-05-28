import React from 'react';
import { Lightbulb } from 'lucide-react';
import './InsightCard.css';

interface InsightCardProps {
  text: string;
  index?: number;
}

export default function InsightCard({ text, index = 0 }: InsightCardProps) {
  return (
    <article className="insight-card glass-panel">
      <Lightbulb size={18} strokeWidth={1.75} className="insight-card-icon" aria-hidden="true" />
      <p className="insight-card-text">{text}</p>
      <span className="insight-card-index meta-numeric">#{index + 1}</span>
    </article>
  );
}
