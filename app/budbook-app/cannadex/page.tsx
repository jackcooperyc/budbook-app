"use client";

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import CannadexCard from '@/components/CannadexCard/CannadexCard';
import { cannadexEntries } from '@/data/socialMock';
import './cannadex.css';

export default function CannadexPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cannadexEntries;
    return cannadexEntries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.typicalEffects.some((fx) => fx.toLowerCase().includes(q)) ||
        e.dominantTerpenes.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <div className="cannadex-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Cannadex</h2>
          <p className="page-subtitle">Strain reference — effects, lineage, and terpenes</p>
        </div>
      </header>

      <div className="cannadex-search">
        <Search size={16} strokeWidth={1.75} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search strains or effects…"
          aria-label="Search Cannadex"
        />
      </div>

      <div className="cannadex-grid">
        {filtered.map((entry) => (
          <CannadexCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
