"use client";

import React, { useMemo } from 'react';
import type { Dispensary } from '@/types/budbook';
import './DispensaryMap.css';

interface DispensaryMapProps {
  dispensaries: Dispensary[];
  focus: Dispensary;
  onSelect?: (id: string) => void;
}

export default function DispensaryMap({
  dispensaries,
  focus,
  onSelect,
}: DispensaryMapProps) {
  const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const query = `${focus.address}, ${focus.city}, ${focus.state}`;

  const src = useMemo(() => {
    if (embedKey) {
      return `https://www.google.com/maps/embed/v1/place?key=${embedKey}&q=${encodeURIComponent(query)}`;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
  }, [embedKey, query]);

  return (
    <div className="dispensary-map glass-panel">
      <div className="dispensary-map-pins">
        {dispensaries.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`dispensary-map-pin-btn ${d.id === focus.id ? 'dispensary-map-pin-btn-active' : ''}`}
            onClick={() => onSelect?.(d.id)}
          >
            {d.name.split(' ')[0]}
          </button>
        ))}
      </div>
      <iframe
        title={`Map — ${focus.name}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <p className="dispensary-map-focus-label">
        Showing: <strong>{focus.name}</strong> · {focus.city}, {focus.state}
      </p>
    </div>
  );
}
