import React from 'react';
import type { CannadexEntry } from '@/data/socialMock';
import Chip from '@/components/Chip/Chip';
import './CannadexCard.css';

interface CannadexCardProps {
  entry: CannadexEntry;
}

export default function CannadexCard({ entry }: CannadexCardProps) {
  return (
    <article className="cannadex-card glass-panel">
      <div className="cannadex-card-header">
        <h3>{entry.name}</h3>
        <Chip label={entry.type} variant={entry.type} />
      </div>
      <p className="cannadex-card-lineage">{entry.lineage}</p>
      <p className="cannadex-card-best">{entry.bestFor}</p>
      <div className="cannadex-card-stats meta-numeric">
        <span>THC {entry.thcRange}</span>
        <span>CBD {entry.cbdRange}</span>
      </div>
      <div className="cannadex-card-effects">
        {entry.typicalEffects.map((e) => (
          <span key={e} className="cannadex-effect-tag">
            {e}
          </span>
        ))}
      </div>
      <p className="cannadex-card-terps">
        Terps: {entry.dominantTerpenes.join(' · ')}
      </p>
    </article>
  );
}
