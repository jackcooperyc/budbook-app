"use client";

import React, { useMemo, useState } from 'react';
import type { Dispensary } from '@/types/budbook';
import DispensaryMap from '@/components/DispensaryMap/DispensaryMap';
import DispensaryCard from '@/components/DispensaryCard/DispensaryCard';
import EmptyState from '@/components/EmptyState/EmptyState';
import { Search, Store } from 'lucide-react';
import './ShopsContent.css';

interface ShopsContentProps {
  dispensaries: Dispensary[];
}

export default function ShopsContent({ dispensaries }: ShopsContentProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    dispensaries[0]?.id ?? null,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dispensaries;
    return dispensaries.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q),
    );
  }, [dispensaries, query]);

  const mapFocus =
    filtered.find((d) => d.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="shops-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Dispensaries</h2>
          <p className="page-subtitle">Find saved shops — search, map, and budtender contacts</p>
        </div>
      </header>

      <div className="shops-search">
        <Search size={16} strokeWidth={1.75} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, city, or address…"
          aria-label="Search dispensaries"
        />
      </div>

      {filtered.length > 0 && mapFocus && (
        <DispensaryMap
          dispensaries={filtered}
          focus={mapFocus}
          onSelect={setSelectedId}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No matches"
          description="Try a different search term or clear the filter."
        />
      ) : (
        <div className="shops-grid">
          {filtered.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`shops-card-wrap ${selectedId === d.id ? 'shops-card-wrap-active' : ''}`}
              onClick={() => setSelectedId(d.id)}
            >
              <DispensaryCard dispensary={d} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
