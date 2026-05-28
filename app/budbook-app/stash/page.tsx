"use client";

import React, { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Package, Plus } from 'lucide-react';
import ProductCard from '@/components/ProductCard/ProductCard';
import AccessoryCard from '@/components/AccessoryCard/AccessoryCard';
import EmptyState from '@/components/EmptyState/EmptyState';
import Skeleton from '@/components/Skeleton/Skeleton';
import Button from '@/components/Button/Button';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { useBudbookMock } from '@/hooks/useBudbookMock';
import { useServerStash } from '@/hooks/useServerStash';
import { inventoryByProductId, isLowStock, parseOverview } from '@/lib/budbook-data';
import { mergeInventory, mergeProducts } from '@/lib/stashStorage';
import './stash.css';

function StashContent() {
  const loading = useSimulatedLoad();
  const { data } = useBudbookMock();
  const { products: serverProducts, inventory: serverInventory, loading: stashLoading } =
    useServerStash();
  const searchParams = useSearchParams();
  const added = searchParams.get('added') === '1';

  const products = useMemo(() => {
    if (!data) return [];
    return mergeProducts(data.products, serverProducts);
  }, [data, serverProducts]);

  const inventory = useMemo(() => {
    if (!data) return [];
    return mergeInventory(data.inventory, serverInventory);
  }, [data, serverInventory]);

  const invMap = inventoryByProductId(inventory);
  const lowIds = new Set(
    products.filter((p) => isLowStock(p, invMap.get(p.id))).map((p) => p.id),
  );

  if (loading || !data || stashLoading) {
    return (
      <div className="stash-grid">
        <Skeleton className="skeleton-card" />
        <Skeleton className="skeleton-card" />
      </div>
    );
  }

  const overview = parseOverview(data.overview);
  const lowAlerts = overview.inventory_telemetry?.low_product_alerts ?? [];
  const hardwareAlerts = overview.inventory_telemetry?.hardware_alerts ?? [];

  return (
    <div className="stash-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">My Stash</h2>
          <p className="page-subtitle">
            {products.length} products · {data.accessories.length} hardware items
            {serverProducts.length > 0 && (
              <span className="stash-sync-note"> · {serverProducts.length} synced locally</span>
            )}
          </p>
        </div>
        <Link href="/budbook-app/scanner">
          <Button variant="primary" size="sm" icon={<Plus size={14} strokeWidth={1.75} />}>
            Add product
          </Button>
        </Link>
      </header>

      {added && (
        <p className="stash-toast-inline" role="status">
          Product saved to server stash.
        </p>
      )}

      {lowAlerts.length > 0 && (
        <div className="stash-alerts">
          {lowAlerts.map((a) => (
            <p key={a} className="stash-alert">
              {a}
            </p>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Your stash is empty"
          description="Scan a COA or add a product manually to start tracking potency and terpenes."
          action={
            <Link href="/budbook-app/scanner">
              <Button variant="primary" size="sm">
                Open scanner
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="stash-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              inventory={invMap.get(product.id)}
              lowStock={lowIds.has(product.id)}
            />
          ))}
        </div>
      )}

      {data.accessories.length > 0 && (
        <section className="stash-hardware">
          <h3 className="stash-section-title">Hardware & accessories</h3>
          {hardwareAlerts.map((a) => (
            <p key={a} className="stash-alert stash-alert-hardware">
              {a}
            </p>
          ))}
          <div className="stash-hardware-grid">
            {data.accessories.map((a) => (
              <AccessoryCard key={a.id} accessory={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function StashPage() {
  return (
    <Suspense fallback={<Skeleton className="skeleton-card" />}>
      <StashContent />
    </Suspense>
  );
}
