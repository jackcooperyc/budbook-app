import React from 'react';
import Image from 'next/image';
import { ExternalLink, FlaskConical, Pencil, Trash2 } from 'lucide-react';
import type { InventoryItem, Product } from '@/types/pacs';
import Chip from '@/components/Chip/Chip';
import TerpeneProfile from '@/components/TerpeneProfile/TerpeneProfile';
import Button from '@/components/Button/Button';
import { formatQuantity, getStrainCoverUrl } from '@/lib/media';
import { isHttpSourceUrl } from '@lib/coa/userMessages';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  inventory?: InventoryItem;
  lowStock?: boolean;
  editable?: boolean;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onDelete?: (productId: string) => void;
}

export default function ProductCard({
  product,
  inventory,
  lowStock,
  editable,
  onUpdateQuantity,
  onDelete,
}: ProductCardProps) {
  const qty = inventory
    ? formatQuantity(inventory.quantity, inventory.unit)
    : null;
  const coaUrl =
    product.coa_source_url && isHttpSourceUrl(product.coa_source_url)
      ? product.coa_source_url
      : null;

  function handleEditQuantity() {
    if (!onUpdateQuantity || !inventory) return;
    const next = window.prompt('Update quantity (grams):', String(inventory.quantity));
    if (next == null) return;
    const parsed = parseFloat(next);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    onUpdateQuantity(product.id, parsed);
  }

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
        {coaUrl && (
          <a
            className="product-card-coa-link"
            href={coaUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={12} strokeWidth={1.75} aria-hidden="true" />
            View COA
          </a>
        )}
        {editable && (
          <div className="product-card-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Pencil size={12} strokeWidth={1.75} />}
              onClick={handleEditQuantity}
            >
              Edit qty
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Trash2 size={12} strokeWidth={1.75} />}
              onClick={() => onDelete?.(product.id)}
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
