"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Dispensary } from '@/types/budbook';
import type { RetailStore } from '@/types/rda';
import DispensaryMap from '@/components/DispensaryMap/DispensaryMap';
import DispensaryCard from '@/components/DispensaryCard/DispensaryCard';
import RetailSourceBadge from '@/components/RetailSourceBadge/RetailSourceBadge';
import EmptyState from '@/components/EmptyState/EmptyState';
import { Search, Store } from 'lucide-react';
import './ShopsContent.css';

interface ShopsContentProps {
  dispensaries: Dispensary[];
  stores: RetailStore[];
}

export default function ShopsContent({ dispensaries, stores }: ShopsContentProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    dispensaries[0]?.id ?? null,
  );

  const storeByKey = useMemo(
    () => new Map(stores.map((s) => [s.store_key, s])),
    [stores],
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
          <p className="page-subtitle">
            {dispensaries.length} shop{dispensaries.length === 1 ? '' : 's'} via RDA cache
          </p>
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
          disabled={dispensaries.length === 0}
        />
      </div>

      {dispensaries.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No dispensaries in cache"
          description="RDA cache is empty. Run npm run reset-rda to seed shop data for development."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No matches"
          description="Try a different search term or clear the filter."
        />
      ) : (
        <>
          {mapFocus && (
            <DispensaryMap
              dispensaries={filtered}
              focus={mapFocus}
              onSelect={setSelectedId}
            />
          )}
          <div className="shops-grid">
            {filtered.map((d) => {
              const store = storeByKey.get(d.id);
              return (
                <Link
                  key={d.id}
                  href={`/budbook-app/shops/${encodeURIComponent(d.id)}`}
                  className={`shops-card-wrap ${selectedId === d.id ? 'shops-card-wrap-active' : ''}`}
                  onMouseEnter={() => setSelectedId(d.id)}
                >
                  {store && (
                    <div className="shops-card-badge">
                      <RetailSourceBadge
                        provider={store.source.provider}
                        confidence={store.source.source_confidence}
                      />
                    </div>
                  )}
                  <DispensaryCard dispensary={d} />
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
