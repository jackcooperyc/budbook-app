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

function writeJson<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
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

export function addScannedProduct(input: ScanProductInput): Product {
  const id = `prod-local-${Date.now()}`;
  const product: Product = {
    id,
    name: input.strain,
    strain_name: input.strain,
    brand: input.brand ?? 'Scanned COA',
    type: input.type ?? 'hybrid',
    category: 'flower',
    thc_percentage: input.thc,
    cbd_percentage: input.cbd,
    terpene_profile: input.terpenes.map((name, i) => ({
      terpene_name: name,
      percentage: Math.max(0.15, 0.55 - i * 0.08),
    })),
    lab_report_id: input.coaId,
    dispensary_id: '',
  };

  const inventory: InventoryItem = {
    id: `inv-${id}`,
    product_id: id,
    quantity: 3.5,
    unit: 'grams',
    is_active: true,
    purchase_date: new Date().toISOString().slice(0, 10),
    notes: 'Added via COA scanner',
  };

  writeJson(PRODUCTS_KEY, [product, ...getLocalProducts()]);
  writeJson(INVENTORY_KEY, [inventory, ...getLocalInventory()]);

  return product;
}

export function mergeProducts(mock: Product[], local: Product[]): Product[] {
  const map = new Map<string, Product>();
  for (const p of [...mock, ...local]) map.set(p.id, p);
  return [...map.values()];
}

export function mergeInventory(mock: InventoryItem[], local: InventoryItem[]): InventoryItem[] {
  const map = new Map<string, InventoryItem>();
  for (const i of [...mock, ...local]) map.set(i.product_id, i);
  return [...map.values()];
}
