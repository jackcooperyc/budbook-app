import type { Product } from '@/types/pacs';
import type { CaaCoaParseResult } from '@/types/caa';
import { deriveProductKey } from '@lib/rda/keying';

const SAMPLE_UUID =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const TERPENE_LABELS: Record<string, string> = {
  alpha_bisabolol: 'Bisabolol',
  alpha_humulene: 'Humulene',
  alpha_pinene: 'Pinene',
  alpha_terpinene: 'Terpinene',
  alpha_terpineol: 'Terpineol',
  beta_caryophyllene: 'Caryophyllene',
  beta_humulene: 'Humulene',
  beta_myrcene: 'Myrcene',
  beta_pinene: 'Pinene',
  borneol: 'Borneol',
  camphene: 'Camphene',
  caryophyllene_oxide: 'Caryophyllene oxide',
  delta_3_carene: 'Carene',
  eucalyptol: 'Eucalyptol',
  gamma_terpinene: 'Terpinene',
  geraniol: 'Geraniol',
  guaiol: 'Guaiol',
  isopulegol: 'Isopulegol',
  limonene: 'Limonene',
  linalool: 'Linalool',
  nerolidol: 'Nerolidol',
  ocimene: 'Ocimene',
  p_cymene: 'p-Cymene',
  terpinolene: 'Terpinolene',
};

type DisplayValue = {
  value?: string;
  value_full?: string;
};

type AssayTest = {
  name?: string;
  display?: Record<string, DisplayValue>;
};

type ConfidentSample = {
  id?: number;
  name?: string;
  cover?: string;
  client?: { name?: string };
  lab?: { name?: string; abbreviation?: string };
  category?: { name?: string };
  lab_data?: {
    cannabinoids?: {
      thc_total?: { display?: Record<string, DisplayValue> };
      cbd_total?: { display?: Record<string, DisplayValue> };
    };
    terpenes?: { tests?: Record<string, AssayTest> };
  };
};

export function isConfidentLimsUrl(input: string): boolean {
  try {
    const host = new URL(input.trim()).hostname.toLowerCase();
    return host === 'share.confidentlims.com' || host === 'app.confidentlims.com';
  } catch {
    return false;
  }
}

export function extractConfidentSampleId(input: string): string | null {
  return input.match(SAMPLE_UUID)?.[0] ?? null;
}

function parsePercentValue(test?: AssayTest | { display?: Record<string, DisplayValue> }): number | null {
  const display = test && 'display' in test ? test.display?.['%'] : undefined;
  const raw = display?.value_full ?? display?.value;
  if (!raw || typeof raw !== 'string') return null;
  if (raw.startsWith('<')) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseProductType(category?: string): Product['type'] {
  const lower = (category ?? '').toLowerCase();
  if (/\bindica\b/.test(lower) && !/\bhybrid\b/.test(lower)) return 'indica';
  if (/\bsativa\b/.test(lower) && !/\bhybrid\b/.test(lower)) return 'sativa';
  return 'hybrid';
}

function labReportIdFromSample(sample: ConfidentSample, sampleId: string): string {
  const cover = sample.cover ?? '';
  const batch = cover.match(/samples\/([^/]+)\//)?.[1];
  if (batch) return `COA-${batch.toUpperCase()}`;
  if (sample.id) return `COA-CONF-${sample.id}`;
  return `COA-CONF-${sampleId.slice(0, 8).toUpperCase()}`;
}

function parseTerpenes(sample: ConfidentSample) {
  const tests = sample.lab_data?.terpenes?.tests ?? {};
  const terpenes: { terpene_name: string; percentage: number }[] = [];

  for (const [key, test] of Object.entries(tests)) {
    const percentage = parsePercentValue(test);
    if (percentage == null) continue;
    const terpene_name =
      test.name?.trim() ||
      TERPENE_LABELS[key] ||
      key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    terpenes.push({ terpene_name, percentage });
  }

  return terpenes.sort((a, b) => b.percentage - a.percentage).slice(0, 8);
}

export async function parseConfidentLimsUrl(
  url: string,
  source: 'url' | 'qr',
): Promise<CaaCoaParseResult | null> {
  const sampleId = extractConfidentSampleId(url);
  if (!sampleId) return null;

  const apiUrl = `https://share.confidentlims.com/samples/public/${sampleId}`;
  let payload: { data?: ConfidentSample };
  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    payload = (await res.json()) as { data?: ConfidentSample };
  } catch {
    return null;
  }

  const sample = payload.data;
  if (!sample) return null;

  const thc = parsePercentValue(sample.lab_data?.cannabinoids?.thc_total);
  if (thc == null) return null;

  const cbd = parsePercentValue(sample.lab_data?.cannabinoids?.cbd_total) ?? 0;
  const strain_name = sample.name?.trim() || 'Lab sample';
  const brand = sample.client?.name?.trim() || sample.lab?.name?.trim() || 'Confident LIMS';
  const category = (sample.category?.name ?? 'flower').toLowerCase();
  const terpene_profile = parseTerpenes(sample);

  return {
    lab_report_id: labReportIdFromSample(sample, sampleId),
    product_key: deriveProductKey(brand, strain_name, category),
    strain_name,
    brand,
    type: parseProductType(strain_name),
    category,
    thc_percentage: thc,
    cbd_percentage: cbd,
    terpene_profile,
    compliance_status: 'confirmed',
    confidence: 'high',
    parse_source: source,
  };
}
