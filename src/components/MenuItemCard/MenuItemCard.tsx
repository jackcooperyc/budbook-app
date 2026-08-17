"use client";

import React, { useState } from 'react';
import type { Product } from '@/types/pacs';
import type { RetailMenuItem } from '@/types/rda';
import Button from '@/components/Button/Button';
import RetailSourceBadge from '@/components/RetailSourceBadge/RetailSourceBadge';
import { Plus } from 'lucide-react';
import './MenuItemCard.css';

export type MenuItemView = {
  item: RetailMenuItem;
  product_preview: Product;
  caa_status: 'pending' | 'confirmed';
};

interface MenuItemCardProps {
  entry: MenuItemView;
  onAdd: (menuItemKey: string) => Promise<void>;
}

export default function MenuItemCard({ entry, onAdd }: MenuItemCardProps) {
  const { item, product_preview, caa_status } = entry;
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setAdding(true);
    try {
      await onAdd(item.menu_item_key);
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="menu-item-card glass-panel">
      <div className="menu-item-card-header">
        <div>
          <h3 className="menu-item-card-name">{item.product_name}</h3>
          <p className="menu-item-card-brand">{item.brand_name}</p>
        </div>
        {item.price != null && (
          <span className="menu-item-card-price meta-numeric">${item.price.toFixed(2)}</span>
        )}
      </div>
      <div className="menu-item-card-meta meta-numeric">
        <span>{item.display_weight}</span>
        <span>THC {item.percentage_thc ?? '—'}%</span>
        <span>CBD {item.percentage_cbd ?? '—'}%</span>
        <RetailSourceBadge
          provider={item.source.provider}
          confidence={item.source.source_confidence}
        />
      </div>
      {caa_status === 'pending' && (
        <p className="menu-item-card-pending">
          Terpene profile pending CAA confirmation
        </p>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={<Plus size={12} strokeWidth={1.75} />}
        onClick={handleAdd}
        disabled={adding}
      >
        {adding ? 'Adding…' : 'Add to stash'}
      </Button>
    </article>
  );
}
