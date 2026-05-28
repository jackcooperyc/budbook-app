import React from 'react';
import { Wrench } from 'lucide-react';
import type { Accessory } from '@/types/budbook';
import Chip from '@/components/Chip/Chip';
import './AccessoryCard.css';

interface AccessoryCardProps {
  accessory: Accessory;
}

export default function AccessoryCard({ accessory }: AccessoryCardProps) {
  const needsMaintenance = accessory.condition === 'needs_maintenance';

  return (
    <article className={`accessory-card glass-panel ${needsMaintenance ? 'accessory-card-alert' : ''}`}>
      <div className="accessory-card-header">
        <h3>{accessory.name}</h3>
        {needsMaintenance ? (
          <Chip label="Maintenance" variant="low" />
        ) : (
          <Chip label={accessory.condition_status || 'Good'} />
        )}
      </div>
      <p className="accessory-card-brand">{accessory.brand}</p>
      <p className="accessory-card-meta meta-numeric">
        {accessory.usage_sessions_count} sessions · {accessory.ecosystem_tag}
      </p>
      {accessory.next_maintenance_date && (
        <p className="accessory-card-maint">
          <Wrench size={12} strokeWidth={1.75} aria-hidden="true" />
          Next service {accessory.next_maintenance_date}
        </p>
      )}
    </article>
  );
}
