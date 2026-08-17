import type { InventoryItem, Product } from '@/types/pacs';

const PRODUCTS_KEY = 'pacsmt-local-products';
const INVENTORY_KEY = 'pacsmt-local-inventory';
const LEGACY_PRODUCTS_KEY = 'budbook-local-products';
const LEGACY_INVENTORY_KEY = 'budbook-local-inventory';

function migrateKey(next: string, legacy: string): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(next)) return;
  const raw = localStorage.getItem(legacy);
  if (!raw) return;
  localStorage.setItem(next, raw);
  localStorage.removeItem(legacy);
}

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
  migrateKey(PRODUCTS_KEY, LEGACY_PRODUCTS_KEY);
  return readJson<Product>(PRODUCTS_KEY);
}

export function getLocalInventory(): InventoryItem[] {
  migrateKey(INVENTORY_KEY, LEGACY_INVENTORY_KEY);
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
