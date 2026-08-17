import { readFile, writeFile, mkdir } from 'fs/promises';
import type { InventoryItem, Product } from '@/types/pacs';
import type { CaaCoaParseResult } from '@/types/caa';
import type { ScanProductInput } from '@/lib/stashStorage';
import { dataFile, getDataDir } from '@lib/data-dir';

export type LocalStashData = {
  products: Product[];
  inventory: InventoryItem[];
};

const STASH_FILE = dataFile('local-stash.json');
const EMPTY: LocalStashData = { products: [], inventory: [] };

async function ensureFile(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  try {
    await readFile(STASH_FILE, 'utf8');
  } catch {
    await writeFile(STASH_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

export async function readFileStash(): Promise<LocalStashData> {
  await ensureFile();
  const raw = await readFile(STASH_FILE, 'utf8');
  const parsed = JSON.parse(raw) as LocalStashData;
  return {
    products: parsed.products ?? [],
    inventory: parsed.inventory ?? [],
  };
}

export async function writeFileStash(data: LocalStashData): Promise<void> {
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
    product_key: undefined,
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

export type ManualProductInput = {
  strain: string;
  brand?: string;
  type?: Product['type'];
  category?: string;
  thc: number;
  cbd: number;
  quantity: number;
  unit?: string;
  terpenes?: string[];
};

export function buildProductFromManual(input: ManualProductInput): {
  product: Product;
  inventory: InventoryItem;
} {
  const id = `prod-local-${Date.now()}`;
  const terpenes = input.terpenes ?? [];
  const product: Product = {
    id,
    name: input.strain,
    strain_name: input.strain,
    brand: input.brand ?? 'Manual entry',
    type: input.type ?? 'hybrid',
    category: input.category ?? 'flower',
    thc_percentage: input.thc,
    cbd_percentage: input.cbd,
    terpene_profile: terpenes.map((name, i) => ({
      terpene_name: name,
      percentage: Math.max(0.15, 0.55 - i * 0.08),
    })),
    lab_report_id: `manual-${id}`,
    dispensary_id: '',
    product_key: undefined,
  };

  const inventory: InventoryItem = {
    id: `inv-${id}`,
    product_id: id,
    quantity: input.quantity,
    unit: input.unit ?? 'grams',
    is_active: true,
    purchase_date: new Date().toISOString().slice(0, 10),
    notes: 'Added manually',
  };

  return { product, inventory };
}

export type MenuStashInput = {
  product: Product;
  quantity?: number;
  unit?: string;
  notes?: string;
};

export function buildCoaProduct(parse: CaaCoaParseResult): {
  product: Product;
  inventory: InventoryItem;
} {
  const id = `prod-coa-${Date.now()}`;
  const product: Product = {
    id,
    name: parse.strain_name,
    strain_name: parse.strain_name,
    brand: parse.brand,
    type: parse.type,
    category: parse.category,
    thc_percentage: parse.thc_percentage,
    cbd_percentage: parse.cbd_percentage,
    terpene_profile: parse.terpene_profile,
    lab_report_id: parse.lab_report_id,
    dispensary_id: '',
    product_key: parse.product_key,
  };

  const inventory: InventoryItem = {
    id: `inv-${id}`,
    product_id: id,
    quantity: 3.5,
    unit: 'grams',
    is_active: true,
    purchase_date: new Date().toISOString().slice(0, 10),
    notes: 'Added via CAA COA scanner',
  };

  return { product, inventory };
}

export function buildMenuInventory(input: MenuStashInput): InventoryItem {
  return {
    id: `inv-${input.product.id}`,
    product_id: input.product.id,
    quantity: input.quantity ?? 3.5,
    unit: input.unit ?? 'grams',
    is_active: true,
    purchase_date: new Date().toISOString().slice(0, 10),
    notes: input.notes ?? 'Added from shop menu',
  };
}
