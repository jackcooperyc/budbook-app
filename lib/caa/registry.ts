import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { CaaCatalogEntry, CaaCoaParseResult, CaaEnrichment } from '@/types/caa';

const DATA_DIR = path.join(process.cwd(), 'data');
const REGISTRY_FILE = path.join(DATA_DIR, 'caa-registry.json');

type RegistryData = {
  by_product_key: Record<string, CaaCatalogEntry>;
  by_lab_report_id: Record<string, string>;
};

const EMPTY: RegistryData = { by_product_key: {}, by_lab_report_id: {} };

async function ensureFile(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(REGISTRY_FILE, 'utf8');
  } catch {
    await writeFile(REGISTRY_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

async function readRegistry(): Promise<RegistryData> {
  await ensureFile();
  const raw = await readFile(REGISTRY_FILE, 'utf8');
  const parsed = JSON.parse(raw) as RegistryData;
  return {
    by_product_key: parsed.by_product_key ?? {},
    by_lab_report_id: parsed.by_lab_report_id ?? {},
  };
}

async function writeRegistry(data: RegistryData): Promise<void> {
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
  const registry = await readRegistry();
  const entry = parseToCatalogEntry(parse);
  registry.by_product_key[parse.product_key] = entry;
  registry.by_lab_report_id[parse.lab_report_id] = parse.product_key;
  await writeRegistry(registry);
  return entry;
}

export async function getEnrichmentByProductKey(
  productKey: string,
): Promise<CaaEnrichment | null> {
  const registry = await readRegistry();
  return registry.by_product_key[productKey] ?? null;
}

export async function getEnrichmentByLabReportId(
  labReportId: string,
): Promise<CaaEnrichment | null> {
  const registry = await readRegistry();
  const productKey = registry.by_lab_report_id[labReportId];
  if (!productKey) return null;
  return registry.by_product_key[productKey] ?? null;
}

export async function listCatalogEntries(): Promise<CaaCatalogEntry[]> {
  const registry = await readRegistry();
  return Object.values(registry.by_product_key).sort(
    (a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime(),
  );
}

export async function getCatalogEntry(productKey: string): Promise<CaaCatalogEntry | null> {
  const registry = await readRegistry();
  return registry.by_product_key[productKey] ?? null;
}
