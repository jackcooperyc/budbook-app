"use client";

import React, { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Package, Plus } from 'lucide-react';
import ProductCard from '@/components/ProductCard/ProductCard';
import ManualAddProductForm from '@/components/ManualAddProductForm/ManualAddProductForm';
import EmptyState from '@/components/EmptyState/EmptyState';
import Skeleton from '@/components/Skeleton/Skeleton';
import Button from '@/components/Button/Button';
import { useServerStash } from '@/hooks/useServerStash';
import { inventoryByProductId, isLowStock } from '@/lib/budbook-data';
import { computeLowStockAlerts } from '@/lib/app-stats';
import './stash.css';

function StashContent() {
  const {
    products,
    inventory,
    loading,
    error,
    addManualProduct,
    updateQuantity,
    deleteProduct,
  } = useServerStash();
  const searchParams = useSearchParams();
  const added = searchParams.get('added') === '1';
  const [manualOpen, setManualOpen] = useState(false);

  const invMap = inventoryByProductId(inventory);
  const lowIds = new Set(
    products.filter((p) => isLowStock(p, invMap.get(p.id))).map((p) => p.id),
  );
  const lowAlerts = computeLowStockAlerts(products, inventory);

  const handleManualAdd = useCallback(
    async (input: Parameters<typeof addManualProduct>[0]) => {
      await addManualProduct(input);
      setManualOpen(false);
    },
    [addManualProduct],
  );

  const handleDelete = useCallback(
    async (productId: string) => {
      if (!window.confirm('Remove this product from your stash?')) return;
      await deleteProduct(productId);
    },
    [deleteProduct],
  );

  if (loading) {
    return (
      <div className="stash-grid">
        <Skeleton className="skeleton-card" />
        <Skeleton className="skeleton-card" />
      </div>
    );
  }

  if (error) {
    return <p className="stash-alert">Could not load stash: {error}</p>;
  }

  return (
    <div className="stash-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">My Stash</h2>
          <p className="page-subtitle">
            {products.length} product{products.length === 1 ? '' : 's'} in your stash
          </p>
        </div>
        <div className="stash-header-actions">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} strokeWidth={1.75} />}
            onClick={() => setManualOpen((v) => !v)}
          >
            Manual add
          </Button>
          <Link href="/budbook-app/scanner">
            <Button variant="primary" size="sm" icon={<Plus size={14} strokeWidth={1.75} />}>
              Scan COA
            </Button>
          </Link>
        </div>
      </header>

      {manualOpen && (
        <ManualAddProductForm onSave={handleManualAdd} onCancel={() => setManualOpen(false)} />
      )}

      {added && (
        <p className="stash-toast-inline" role="status">
          Product saved to your stash.
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
            <div className="stash-header-actions">
              <Button variant="secondary" size="sm" onClick={() => setManualOpen(true)}>
                Add manually
              </Button>
              <Link href="/budbook-app/scanner">
                <Button variant="primary" size="sm">
                  Open scanner
                </Button>
              </Link>
            </div>
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
              editable
              onUpdateQuantity={(id, qty) => updateQuantity(id, qty)}
              onDelete={handleDelete}
            />
          ))}
        </div>
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
