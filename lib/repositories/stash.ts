import { and, eq } from 'drizzle-orm';
import type { Product, InventoryItem } from '@/types/pacs';
import type { CaaCoaParseResult } from '@/types/caa';
import type { ScanProductInput } from '@/lib/stashStorage';
import { isHttpSourceUrl } from '@lib/coa/userMessages';
import { getCurrentUserId } from '@lib/pacs-user/currentUser';
import { dbEnabled, getDb } from '@lib/db/client';
import { toInventoryItem, toProduct } from '@lib/db/mappers';
import { inventoryItems, products } from '@lib/db/schema';
import { getCoaSourceUrlsByProductId } from '@lib/repositories/coaScan';
import {
  buildCoaProduct,
  buildMenuInventory,
  buildProductFromManual,
  buildProductFromScan,
  readFileStash,
  writeFileStash,
  type LocalStashData,
  type ManualProductInput,
  type MenuStashInput,
} from '@lib/stash/stashCore';

export type { LocalStashData, ManualProductInput, MenuStashInput };

async function withCoaSourceUrls(data: LocalStashData): Promise<LocalStashData> {
  const urls = await getCoaSourceUrlsByProductId(data.products.map((p) => p.id));
  if (Object.keys(urls).length === 0) {
    return {
      ...data,
      products: data.products.map((p) =>
        isHttpSourceUrl(p.coa_source_url) ? p : omitNonOpenableCoaUrl(p),
      ),
    };
  }

  return {
    ...data,
    products: data.products.map((p) => {
      const fromLink = urls[p.id];
      const url = fromLink ?? (isHttpSourceUrl(p.coa_source_url) ? p.coa_source_url : undefined);
      if (!url) return omitNonOpenableCoaUrl(p);
      return { ...p, coa_source_url: url };
    }),
  };
}

function omitNonOpenableCoaUrl(product: Product): Product {
  if (!product.coa_source_url || isHttpSourceUrl(product.coa_source_url)) {
    return product;
  }
  const { coa_source_url: _, ...rest } = product;
  void _;
  return rest;
}

export async function readServerStash(): Promise<LocalStashData> {
  if (!dbEnabled()) {
    return withCoaSourceUrls(await readFileStash());
  }

  const userId = await getCurrentUserId();
  const db = getDb()!;

  const [productRows, inventoryRows] = await Promise.all([
    db.select().from(products).where(eq(products.userId, userId)),
    db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId)),
  ]);

  return withCoaSourceUrls({
    products: productRows.map(toProduct),
    inventory: inventoryRows.map(toInventoryItem),
  });
}

async function insertProductWithInventory(product: Product, inventory: InventoryItem): Promise<void> {
  const userId = await getCurrentUserId();
  const db = getDb()!;

  await db.insert(products).values({
    id: product.id,
    userId,
    name: product.name,
    strainName: product.strain_name,
    brand: product.brand,
    type: product.type,
    category: product.category,
    thcPercentage: product.thc_percentage,
    cbdPercentage: product.cbd_percentage,
    terpeneProfile: product.terpene_profile,
    labReportId: product.lab_report_id,
    dispensaryId: product.dispensary_id,
    productKey: product.product_key ?? null,
  });

  await db.insert(inventoryItems).values({
    id: inventory.id,
    userId,
    productId: inventory.product_id,
    quantity: inventory.quantity,
    unit: inventory.unit,
    isActive: inventory.is_active,
    purchaseDate: inventory.purchase_date,
    notes: inventory.notes,
  });
}

export async function addProductToServerStash(input: ScanProductInput): Promise<Product> {
  const { product, inventory } = buildProductFromScan(input);

  if (!dbEnabled()) {
    const stash = await readFileStash();
    await writeFileStash({
      products: [product, ...stash.products],
      inventory: [inventory, ...stash.inventory],
    });
    return product;
  }

  await insertProductWithInventory(product, inventory);
  return product;
}

export type AddCoaProductOptions = {
  /** Original COA / QR http(s) URL to denormalize onto the stash product (file store). */
  coaSourceUrl?: string;
};

function withOptionalCoaSourceUrl(product: Product, coaSourceUrl?: string): Product {
  if (!isHttpSourceUrl(coaSourceUrl) || !coaSourceUrl) return product;
  return { ...product, coa_source_url: coaSourceUrl };
}

export async function addCoaProductToServerStash(
  parse: CaaCoaParseResult,
  options?: AddCoaProductOptions,
): Promise<Product> {
  const stash = await readServerStash();
  const existing = stash.products.find((p) => p.lab_report_id === parse.lab_report_id);
  if (existing) {
    const next = withOptionalCoaSourceUrl(existing, options?.coaSourceUrl);
    if (
      !dbEnabled() &&
      next.coa_source_url &&
      next.coa_source_url !== existing.coa_source_url
    ) {
      const raw = await readFileStash();
      await writeFileStash({
        products: raw.products.map((p) => (p.id === existing.id ? next : p)),
        inventory: raw.inventory,
      });
    }
    return next;
  }

  const built = buildCoaProduct(parse);
  const product = withOptionalCoaSourceUrl(built.product, options?.coaSourceUrl);
  const { inventory } = built;

  if (!dbEnabled()) {
    const raw = await readFileStash();
    await writeFileStash({
      products: [product, ...raw.products],
      inventory: [inventory, ...raw.inventory],
    });
    return product;
  }

  await insertProductWithInventory(product, inventory);
  return product;
}

export async function addManualProductToServerStash(input: ManualProductInput): Promise<Product> {
  const { product, inventory } = buildProductFromManual(input);

  if (!dbEnabled()) {
    const stash = await readFileStash();
    await writeFileStash({
      products: [product, ...stash.products],
      inventory: [inventory, ...stash.inventory],
    });
    return product;
  }

  await insertProductWithInventory(product, inventory);
  return product;
}

export async function updateProductQuantity(
  productId: string,
  quantity: number,
  unit?: string,
): Promise<InventoryItem | null> {
  if (!dbEnabled()) {
    const stash = await readFileStash();
    const inv = stash.inventory.find((i) => i.product_id === productId);
    if (!inv) return null;

    const updated: InventoryItem = {
      ...inv,
      quantity,
      unit: unit ?? inv.unit,
    };

    await writeFileStash({
      products: stash.products,
      inventory: stash.inventory.map((i) => (i.product_id === productId ? updated : i)),
    });

    return updated;
  }

  const userId = await getCurrentUserId();
  const db = getDb()!;
  const [row] = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.userId, userId), eq(inventoryItems.productId, productId)));

  if (!row) return null;

  const nextUnit = unit ?? row.unit;
  await db
    .update(inventoryItems)
    .set({ quantity, unit: nextUnit })
    .where(and(eq(inventoryItems.userId, userId), eq(inventoryItems.productId, productId)));

  return toInventoryItem({ ...row, quantity, unit: nextUnit });
}

export async function deleteProductFromServerStash(productId: string): Promise<boolean> {
  if (!dbEnabled()) {
    const stash = await readFileStash();
    const hadProduct = stash.products.some((p) => p.id === productId);
    if (!hadProduct) return false;

    await writeFileStash({
      products: stash.products.filter((p) => p.id !== productId),
      inventory: stash.inventory.filter((i) => i.product_id !== productId),
    });

    return true;
  }

  const userId = await getCurrentUserId();
  const db = getDb()!;
  const deleted = await db
    .delete(products)
    .where(and(eq(products.userId, userId), eq(products.id, productId)))
    .returning({ id: products.id });

  return deleted.length > 0;
}

export async function addProductFromMenu(input: MenuStashInput): Promise<Product> {
  const stash = await readServerStash();
  const existing = stash.products.find((p) => p.id === input.product.id);
  if (existing) return existing;

  const inventory = buildMenuInventory(input);

  if (!dbEnabled()) {
    await writeFileStash({
      products: [input.product, ...stash.products],
      inventory: [inventory, ...stash.inventory],
    });
    return input.product;
  }

  await insertProductWithInventory(input.product, inventory);
  return input.product;
}
