import React from 'react';
import Image from 'next/image';
import { FlaskConical } from 'lucide-react';
import type { InventoryItem, Product } from '@/types/budbook';
import Chip from '@/components/Chip/Chip';
import TerpeneProfile from '@/components/TerpeneProfile/TerpeneProfile';
import { formatQuantity, getStrainCoverUrl } from '@/lib/media';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  inventory?: InventoryItem;
  lowStock?: boolean;
}

export default function ProductCard({ product, inventory, lowStock }: ProductCardProps) {
  const qty = inventory
    ? formatQuantity(inventory.quantity, inventory.unit)
    : null;

  return (
    <article className={`product-card glass-panel ${lowStock ? 'product-card-low' : ''}`}>
      <div className="product-card-cover">
        <Image
          src={getStrainCoverUrl(product.id, 320, 200)}
          alt=""
          width={320}
          height={200}
          className="product-card-image"
        />
        <Chip label={product.type} variant={product.type} />
      </div>
      <div className="product-card-body">
        <h3 className="product-card-name">{product.strain_name}</h3>
        <p className="product-card-brand">{product.brand}</p>
        <div className="product-card-cannabinoids meta-numeric">
          <span>THC {product.thc_percentage}%</span>
          <span>CBD {product.cbd_percentage}%</span>
        </div>
        <TerpeneProfile terpenes={product.terpene_profile} compact />
        <div className="product-card-footer">
          {qty && (
            <span className={`product-card-qty ${lowStock ? 'product-card-qty-low' : ''}`}>
              {qty} left
            </span>
          )}
          <span className="product-card-coa">
            <FlaskConical size={12} strokeWidth={1.75} aria-hidden="true" />
            {product.lab_report_id}
          </span>
        </div>
      </div>
    </article>
  );
}
