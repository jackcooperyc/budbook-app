import { readFile, writeFile, mkdir } from 'fs/promises';
import type { InventoryItem, Product } from '@/types/budbook';
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

export async function addProductToServerStash(input: ScanProductInput): Promise<Product> {
  const stash = await readServerStash();
  const { product, inventory } = buildProductFromScan(input);
  await writeServerStash({
    products: [product, ...stash.products],
    inventory: [inventory, ...stash.inventory],
  });
  return product;
}

export async function addCoaProductToServerStash(parse: CaaCoaParseResult): Promise<Product> {
  const stash = await readServerStash();
  const existing = stash.products.find((p) => p.lab_report_id === parse.lab_report_id);
  if (existing) return existing;

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

  await writeServerStash({
    products: [product, ...stash.products],
    inventory: [inventory, ...stash.inventory],
  });

  return product;
}

export async function addManualProductToServerStash(input: ManualProductInput): Promise<Product> {
  const stash = await readServerStash();
  const { product, inventory } = buildProductFromManual(input);
  await writeServerStash({
    products: [product, ...stash.products],
    inventory: [inventory, ...stash.inventory],
  });
  return product;
}

export async function updateProductQuantity(
  productId: string,
  quantity: number,
  unit?: string,
): Promise<InventoryItem | null> {
  const stash = await readServerStash();
  const inv = stash.inventory.find((i) => i.product_id === productId);
  if (!inv) return null;

  const updated: InventoryItem = {
    ...inv,
    quantity,
    unit: unit ?? inv.unit,
  };

  await writeServerStash({
    products: stash.products,
    inventory: stash.inventory.map((i) => (i.product_id === productId ? updated : i)),
  });

  return updated;
}

export async function deleteProductFromServerStash(productId: string): Promise<boolean> {
  const stash = await readServerStash();
  const hadProduct = stash.products.some((p) => p.id === productId);
  if (!hadProduct) return false;

  await writeServerStash({
    products: stash.products.filter((p) => p.id !== productId),
    inventory: stash.inventory.filter((i) => i.product_id !== productId),
  });

  return true;
}

export type MenuStashInput = {
  product: Product;
  quantity?: number;
  unit?: string;
  notes?: string;
};

export async function addProductFromMenu(input: MenuStashInput): Promise<Product> {
  const stash = await readServerStash();
  const existing = stash.products.find((p) => p.id === input.product.id);
  if (existing) {
    return existing;
  }

  const inventory: InventoryItem = {
    id: `inv-${input.product.id}`,
    product_id: input.product.id,
    quantity: input.quantity ?? 3.5,
    unit: input.unit ?? 'grams',
    is_active: true,
    purchase_date: new Date().toISOString().slice(0, 10),
    notes: input.notes ?? 'Added from shop menu',
  };

  await writeServerStash({
    products: [input.product, ...stash.products],
    inventory: [inventory, ...stash.inventory],
  });

  return input.product;
}
