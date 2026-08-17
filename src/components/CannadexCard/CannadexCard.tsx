import React from 'react';
import Link from 'next/link';
import type { CaaCatalogEntry } from '@/types/caa';
import Chip from '@/components/Chip/Chip';
import TerpeneProfile from '@/components/TerpeneProfile/TerpeneProfile';
import './CannadexCard.css';

interface CannadexCardProps {
  entry: CaaCatalogEntry;
}

export default function CannadexCard({ entry }: CannadexCardProps) {
  return (
    <Link
      href={`/pacs/registry/${encodeURIComponent(entry.product_key)}`}
      className="cannadex-card-link"
    >
      <article className="cannadex-card glass-panel">
        <div className="cannadex-card-header">
          <h3>{entry.strain_name}</h3>
          <Chip label={entry.type} variant={entry.type} />
        </div>
        <p className="cannadex-card-brand">{entry.brand}</p>
        <p className="cannadex-card-category">{entry.category}</p>
        <div className="cannadex-card-stats meta-numeric">
          <span>THC {entry.thc_percentage}%</span>
          <span>CBD {entry.cbd_percentage}%</span>
        </div>
        <TerpeneProfile terpenes={entry.terpene_profile} compact />
        <p className="cannadex-card-status">
          CAA {entry.compliance_status} · {entry.lab_report_id}
        </p>
      </article>
    </Link>
  );
}
