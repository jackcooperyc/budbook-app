import type { InventoryItem, Product } from '@/types/budbook';

const PRODUCTS_KEY = 'budbook-local-products';
const INVENTORY_KEY = 'budbook-local-inventory';

function readJson<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function getLocalProducts(): Product[] {
  return readJson<Product>(PRODUCTS_KEY);
}

export function getLocalInventory(): InventoryItem[] {
  return readJson<InventoryItem>(INVENTORY_KEY);
}

export type ScanProductInput = {
  strain: string;
  thc: number;
  cbd: number;
  coaId: string;
  terpenes: string[];
  brand?: string;
  type?: Product['type'];
};
