import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import type { Dispensary } from '@/types/pacs';
import './DispensaryCard.css';

interface DispensaryCardProps {
  dispensary: Dispensary;
}

function mapsUrl(d: Dispensary): string {
  const q = encodeURIComponent(`${d.address}, ${d.city}, ${d.state} ${d.zip_code}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default function DispensaryCard({ dispensary }: DispensaryCardProps) {
  return (
    <article className="dispensary-card glass-panel">
      <h3 className="dispensary-card-name">{dispensary.name}</h3>
      <p className="dispensary-card-address">
        <MapPin size={14} strokeWidth={1.75} aria-hidden="true" />
        {dispensary.address}, {dispensary.city}, {dispensary.state}
      </p>
      <p className="dispensary-card-notes">{dispensary.notes}</p>
      <div className="dispensary-card-footer">
        <span className="dispensary-card-visit meta-numeric">
          Last visit {dispensary.last_visit_date}
        </span>
        <a
          href={mapsUrl(dispensary)}
          target="_blank"
          rel="noopener noreferrer"
          className="dispensary-card-map-link"
        >
          <Navigation size={14} strokeWidth={1.75} aria-hidden="true" />
          Open in Maps
        </a>
      </div>
    </article>
  );
}
