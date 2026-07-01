import { desc, eq } from 'drizzle-orm';
import { readFile, writeFile, mkdir } from 'fs/promises';
import type { CaaCatalogEntry, CaaCoaParseResult, CaaEnrichment } from '@/types/caa';
import { dbEnabled, getDb } from '@lib/db/client';
import { toCaaCatalogEntry, toCaaEnrichment } from '@lib/db/mappers';
import { caaCatalogEntries } from '@lib/db/schema';
import { dataFile, getDataDir } from '@lib/data-dir';

const REGISTRY_FILE = dataFile('caa-registry.json');

type RegistryData = {
  by_product_key: Record<string, CaaCatalogEntry>;
  by_lab_report_id: Record<string, string>;
};

const EMPTY: RegistryData = { by_product_key: {}, by_lab_report_id: {} };

async function ensureFile(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  try {
    await readFile(REGISTRY_FILE, 'utf8');
  } catch {
    await writeFile(REGISTRY_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

async function readFileRegistry(): Promise<RegistryData> {
  await ensureFile();
  const raw = await readFile(REGISTRY_FILE, 'utf8');
  const parsed = JSON.parse(raw) as RegistryData;
  return {
    by_product_key: parsed.by_product_key ?? {},
    by_lab_report_id: parsed.by_lab_report_id ?? {},
  };
}

async function writeFileRegistry(data: RegistryData): Promise<void> {
  await ensureFile();
  await writeFile(REGISTRY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function parseToCatalogEntry(parse: CaaCoaParseResult): CaaCatalogEntry {
  return {
    product_key: parse.product_key,
    compliance_status: 'confirmed',
    lab_report_id: parse.lab_report_id,
    thc_percentage: parse.thc_percentage,
    cbd_percentage: parse.cbd_percentage,
    type: parse.type,
    terpene_profile: parse.terpene_profile,
    strain_name: parse.strain_name,
    brand: parse.brand,
    category: parse.category,
    registered_at: new Date().toISOString(),
  };
}

export async function registerCoaParse(parse: CaaCoaParseResult): Promise<CaaCatalogEntry> {
  const entry = parseToCatalogEntry(parse);

  if (!dbEnabled()) {
    const registry = await readFileRegistry();
    registry.by_product_key[parse.product_key] = entry;
    registry.by_lab_report_id[parse.lab_report_id] = parse.product_key;
    await writeFileRegistry(registry);
    return entry;
  }

  const db = getDb()!;
  await db
    .insert(caaCatalogEntries)
    .values({
      productKey: parse.product_key,
      labReportId: parse.lab_report_id,
      strainName: parse.strain_name,
      brand: parse.brand,
      category: parse.category,
      type: parse.type,
      thcPercentage: parse.thc_percentage,
      cbdPercentage: parse.cbd_percentage,
      terpeneProfile: parse.terpene_profile,
      complianceStatus: 'confirmed',
      registeredAt: new Date(),
    })
    .onConflictDoUpdate({
      target: caaCatalogEntries.productKey,
      set: {
        labReportId: parse.lab_report_id,
        strainName: parse.strain_name,
        brand: parse.brand,
        category: parse.category,
        type: parse.type,
        thcPercentage: parse.thc_percentage,
        cbdPercentage: parse.cbd_percentage,
        terpeneProfile: parse.terpene_profile,
        complianceStatus: 'confirmed',
        registeredAt: new Date(),
      },
    });

  return entry;
}

export async function getEnrichmentByProductKey(
  productKey: string,
): Promise<CaaEnrichment | null> {
  if (!dbEnabled()) {
    const registry = await readFileRegistry();
    return registry.by_product_key[productKey] ?? null;
  }

  const db = getDb()!;
  const [row] = await db
    .select()
    .from(caaCatalogEntries)
    .where(eq(caaCatalogEntries.productKey, productKey));

  return row ? toCaaEnrichment(row) : null;
}

export async function getEnrichmentByLabReportId(
  labReportId: string,
): Promise<CaaEnrichment | null> {
  if (!dbEnabled()) {
    const registry = await readFileRegistry();
    const productKey = registry.by_lab_report_id[labReportId];
    if (!productKey) return null;
    return registry.by_product_key[productKey] ?? null;
  }

  const db = getDb()!;
  const [row] = await db
    .select()
    .from(caaCatalogEntries)
    .where(eq(caaCatalogEntries.labReportId, labReportId));

  return row ? toCaaEnrichment(row) : null;
}

export async function listCatalogEntries(): Promise<CaaCatalogEntry[]> {
  if (!dbEnabled()) {
    const registry = await readFileRegistry();
    return Object.values(registry.by_product_key).sort(
      (a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime(),
    );
  }

  const db = getDb()!;
  const rows = await db.select().from(caaCatalogEntries).orderBy(desc(caaCatalogEntries.registeredAt));
  return rows.map(toCaaCatalogEntry);
}

export async function getCatalogEntry(productKey: string): Promise<CaaCatalogEntry | null> {
  if (!dbEnabled()) {
    const registry = await readFileRegistry();
    return registry.by_product_key[productKey] ?? null;
  }

  const db = getDb()!;
  const [row] = await db
    .select()
    .from(caaCatalogEntries)
    .where(eq(caaCatalogEntries.productKey, productKey));

  return row ? toCaaCatalogEntry(row) : null;
}
