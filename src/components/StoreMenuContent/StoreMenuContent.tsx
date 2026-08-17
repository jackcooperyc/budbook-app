"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store } from 'lucide-react';
import type { RetailStore } from '@/types/rda';
import MenuItemCard, { type MenuItemView } from '@/components/MenuItemCard/MenuItemCard';
import RetailSourceBadge from '@/components/RetailSourceBadge/RetailSourceBadge';
import Skeleton from '@/components/Skeleton/Skeleton';
import EmptyState from '@/components/EmptyState/EmptyState';
import './StoreMenuContent.css';

interface StoreMenuContentProps {
  storeKey: string;
}

export default function StoreMenuContent({ storeKey }: StoreMenuContentProps) {
  const router = useRouter();
  const [store, setStore] = useState<RetailStore | null>(null);
  const [menu, setMenu] = useState<MenuItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/internal/rda/stores/${encodeURIComponent(storeKey)}/menu`)
      .then((r) => {
        if (!r.ok) throw new Error('Store not found');
        return r.json();
      })
      .then((data: { store: RetailStore; menu: MenuItemView[] }) => {
        setStore(data.store);
        setMenu(data.menu);
      })
      .catch(() => setStore(null))
      .finally(() => setLoading(false));
  }, [storeKey]);

  const handleAdd = useCallback(
    async (menuItemKey: string) => {
      const res = await fetch(
        `/api/internal/rda/stores/${encodeURIComponent(storeKey)}/menu/${encodeURIComponent(menuItemKey)}/add-to-stash`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error('Failed to add');
      setToast('Added to stash — terpenes pending CAA confirmation.');
      setTimeout(() => setToast(null), 3000);
    },
    [storeKey],
  );

  if (loading) {
    return (
      <div className="store-menu-page">
        <Skeleton className="skeleton-row" />
        <Skeleton className="skeleton-card" />
      </div>
    );
  }

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title="Store not found"
        description="This shop may have been removed from the RDA cache."
        action={
          <Link href="/pacs/shops" className="store-back-link">
            Back to shops
          </Link>
        }
      />
    );
  }

  return (
    <div className="store-menu-page">
      <Link href="/pacs/shops" className="store-back-link">
        <ArrowLeft size={14} strokeWidth={1.75} />
        All shops
      </Link>

      <header className="page-header">
        <div>
          <div className="store-menu-title-row">
            <h2 className="page-title">{store.name}</h2>
            <RetailSourceBadge
              provider={store.source.provider}
              confidence={store.source.source_confidence}
            />
          </div>
          <p className="page-subtitle">
            {store.address}, {store.city}, {store.state} {store.zip}
          </p>
          {store.brands_carried.length > 0 && (
            <p className="store-brands">Brands: {store.brands_carried.join(', ')}</p>
          )}
        </div>
      </header>

      <section className="store-menu-section">
        <h3 className="store-menu-heading">Menu</h3>
        {menu.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No menu items"
            description="This store has no cached menu data yet."
          />
        ) : (
          <div className="store-menu-grid">
            {menu.map((entry) => (
              <MenuItemCard key={entry.item.menu_item_key} entry={entry} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </section>

      {toast && (
        <div className="store-toast" role="status">
          {toast}{' '}
          <button type="button" onClick={() => router.push('/pacs/stash')}>
            View stash
          </button>
        </div>
      )}
    </div>
  );
}
