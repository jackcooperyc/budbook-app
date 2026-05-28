import type { BudbookMockPayloads, InventoryItem, Product } from '@/types/budbook';

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

export type OverviewShape = {
  activity_summary?: {
    total_sessions_logged?: number;
    average_weekly_frequency?: number;
    macroscopic_trend?: string;
  };
  inventory_telemetry?: {
    low_product_alerts?: string[];
    hardware_alerts?: string[];
  };
  data_insights?: string[];
};

export function parseOverview(overview: unknown): OverviewShape {
  if (overview && typeof overview === 'object') {
    return overview as OverviewShape;
  }
  return {};
}

export type { BudbookMockPayloads };
