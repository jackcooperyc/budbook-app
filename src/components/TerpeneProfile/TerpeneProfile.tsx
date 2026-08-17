import React from 'react';
import type { TerpeneProfile as Terpene } from '@/types/pacs';
import { getTerpeneBarWidths } from '@/lib/media';
import './TerpeneProfile.css';

interface TerpeneProfileProps {
  terpenes: Terpene[];
  compact?: boolean;
}

export default function TerpeneProfile({ terpenes, compact = false }: TerpeneProfileProps) {
  const top = [...terpenes].sort((a, b) => b.percentage - a.percentage).slice(0, compact ? 3 : 5);
  const widths = getTerpeneBarWidths(terpenes, top.length);

  return (
    <div className={`terpene-profile ${compact ? 'terpene-profile-compact' : ''}`}>
      {top.map((t, i) => (
        <div key={t.terpene_name} className="terpene-row">
          <span className="terpene-name">{t.terpene_name}</span>
          <div className="terpene-track">
            <span
              className="terpene-fill"
              style={{ width: `${widths[i] ?? 40}%` }}
            />
          </div>
          {!compact && (
            <span className="terpene-pct meta-numeric">{t.percentage}%</span>
          )}
        </div>
      ))}
    </div>
  );
}
