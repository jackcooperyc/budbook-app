import type { InventoryItem, Product } from '@/types/pacs';

export function inventoryByProductId(
  inventory: InventoryItem[],
): Map<string, InventoryItem> {
  return new Map(inventory.map((i) => [i.product_id, i]));
}

export function isLowStock(product: Product, inv?: InventoryItem): boolean {
  if (!inv) return false;
  if (inv.unit === 'grams' || inv.unit === 'g') return inv.quantity < 2;
  return inv.quantity < 50;
}

export function productNameById(products: Product[], id: string): string {
  return products.find((p) => p.id === id)?.strain_name ?? 'Unknown strain';
}
