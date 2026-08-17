"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Sprout } from 'lucide-react';
import type { CaaCatalogEntry } from '@/types/caa';
import CannadexCard from '@/components/CannadexCard/CannadexCard';
import EmptyState from '@/components/EmptyState/EmptyState';
import Button from '@/components/Button/Button';
import Skeleton from '@/components/Skeleton/Skeleton';
import './cannadex.css';

export default function CannadexPageClient() {
  const [entries, setEntries] = useState<CaaCatalogEntry[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/internal/caa/catalog')
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.strain_name.toLowerCase().includes(q) ||
        e.brand.toLowerCase().includes(q) ||
        e.product_key.toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <div className="cannadex-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Registry</h2>
          <p className="page-subtitle">
            CAA-confirmed certified products · {entries?.length ?? 0} entries
          </p>
        </div>
        <Link href="/pacs/scanner">
          <Button variant="secondary" size="sm">
            Scan COA
          </Button>
        </Link>
      </header>

      <div className="cannadex-search">
        <Search size={16} strokeWidth={1.75} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search strains…"
          aria-label="Search Registry"
          disabled={!entries?.length}
        />
      </div>

      {entries === null ? (
        <div className="cannadex-grid">
          <Skeleton className="skeleton-card" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="Registry empty"
          description="Scan a COA to register authoritative terpene profiles with the Compliance Abstraction Adapter."
          action={
            <Link href="/pacs/scanner">
              <Button variant="primary" size="sm">
                Open COA scanner
              </Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try a different search term."
        />
      ) : (
        <div className="cannadex-grid">
          {filtered.map((entry) => (
            <CannadexCard key={entry.product_key} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
