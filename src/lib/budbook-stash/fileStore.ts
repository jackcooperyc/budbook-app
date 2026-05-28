import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { InventoryItem, Product } from '@/types/budbook';
import type { ScanProductInput } from '@/lib/stashStorage';

export type LocalStashData = {
  products: Product[];
  inventory: InventoryItem[];
};

const STASH_DIR = path.join(process.cwd(), 'data');
const STASH_FILE = path.join(STASH_DIR, 'local-stash.json');

const EMPTY: LocalStashData = { products: [], inventory: [] };

async function ensureFile(): Promise<void> {
  await mkdir(STASH_DIR, { recursive: true });
  try {
    await readFile(STASH_FILE, 'utf8');
  } catch {
    await writeFile(STASH_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

export async function readServerStash(): Promise<LocalStashData> {
  await ensureFile();
  const raw = await readFile(STASH_FILE, 'utf8');
  const parsed = JSON.parse(raw) as LocalStashData;
  return {
    products: parsed.products ?? [],
    inventory: parsed.inventory ?? [],
  };
}

export async function writeServerStash(data: LocalStashData): Promise<void> {
  await ensureFile();
  await writeFile(STASH_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function buildProductFromScan(input: ScanProductInput): {
  product: Product;
  inventory: InventoryItem;
} {
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

  return { product, inventory };
}

export async function addProductToServerStash(input: ScanProductInput): Promise<Product> {
  const stash = await readServerStash();
  const { product, inventory } = buildProductFromScan(input);
  await writeServerStash({
    products: [product, ...stash.products],
    inventory: [inventory, ...stash.inventory],
  });
  return product;
}
