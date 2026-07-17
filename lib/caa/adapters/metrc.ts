/**
 * Metrc CAA adapter — env-gated live package lookup.
 *
 * Required for live fetches:
 *   METRC_BASE_URL   e.g. https://api-mt.metrc.com
 *   METRC_USER_KEY   API username / user key
 *   METRC_VENDOR_KEY API password / vendor key
 *
 * Without env, URL detection still works but live parse returns null (fallback to HTML/PDF).
 */
import type { Product } from '@/types/budbook';
import type { CaaCoaParseResult, CaaParseSource } from '@/types/caa';
import { deriveProductKey } from '@lib/rda/keying';

export type MetrcLabTestResult = {
  TestTypeName?: string;
  Name?: string;
  Quantity?: number | string;
  TestPassed?: boolean;
};

export type MetrcPackagePayload = {
  PackageLabel?: string;
  Label?: string;
  Id?: number;
  Item?: {
    Name?: string;
    StrainName?: string;
    ProductCategoryName?: string;
  };
  ItemFromFacilityName?: string;
  LabFacilityName?: string;
  LabTestResults?: MetrcLabTestResult[];
  LabTestingState?: string;
};

const METRC_HOST = /(^|\.)metrc\.com$/i;

export function metrcCredentialsConfigured(): boolean {
  return Boolean(
    process.env.METRC_BASE_URL?.trim() &&
      process.env.METRC_USER_KEY?.trim() &&
      process.env.METRC_VENDOR_KEY?.trim(),
  );
}

export function isMetrcUrl(input: string): boolean {
  try {
    const host = new URL(input.trim()).hostname.toLowerCase();
    return METRC_HOST.test(host) || host.includes('metrc');
  } catch {
    return false;
  }
}

/** Pull package label / id from a Metrc industry or public URL path. */
export function extractMetrcPackageLabel(input: string): string | null {
  try {
    const url = new URL(input.trim());
    const segments = url.pathname.split('/').filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = decodeURIComponent(segments[i]!).trim();
      if (/^[A-Z0-9-]{6,}$/i.test(seg) && !/^(packages|package|industry|lab|v[12]|api)$/i.test(seg)) {
        return seg;
      }
    }
    const q =
      url.searchParams.get('label') ||
      url.searchParams.get('packageLabel') ||
      url.searchParams.get('id');
    return q?.trim() || null;
  } catch {
    return null;
  }
}

function parseQuantity(raw: number | string | undefined): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const n = Number.parseFloat(raw.replace(/%/g, '').trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function findTestQuantity(
  results: MetrcLabTestResult[],
  labels: string[],
): number | null {
  for (const label of labels) {
    const re = new RegExp(label, 'i');
    for (const row of results) {
      const name = row.TestTypeName ?? row.Name ?? '';
      if (!re.test(name)) continue;
      const qty = parseQuantity(row.Quantity);
      if (qty != null) return qty;
    }
  }
  return null;
}

function parseProductType(text: string): Product['type'] {
  const lower = text.toLowerCase();
  if (/\bindica\b/.test(lower) && !/\bhybrid\b/.test(lower)) return 'indica';
  if (/\bsativa\b/.test(lower) && !/\bhybrid\b/.test(lower)) return 'sativa';
  return 'hybrid';
}

function terpenesFromResults(results: MetrcLabTestResult[]) {
  const terpNames = [
    'Myrcene',
    'Limonene',
    'Caryophyllene',
    'Pinene',
    'Linalool',
    'Humulene',
    'Terpinolene',
    'Ocimene',
  ];
  const out: { terpene_name: string; percentage: number }[] = [];
  for (const name of terpNames) {
    const qty = findTestQuantity(results, [`^${name}$`, name]);
    if (qty != null && qty > 0) out.push({ terpene_name: name, percentage: qty });
  }
  return out.slice(0, 8);
}

/** Map a Metrc package / lab-test payload into CAA parse shape (fixture + live). */
export function metrcPackageToCaaParse(
  payload: MetrcPackagePayload,
  source: CaaParseSource,
): CaaCoaParseResult {
  const results = payload.LabTestResults ?? [];
  const thc =
    findTestQuantity(results, ['total thc', '^thc$', 'delta.?9.?thc']) ?? 0;
  const cbd = findTestQuantity(results, ['total cbd', '^cbd$']) ?? 0;

  const strain_name =
    payload.Item?.StrainName?.trim() ||
    payload.Item?.Name?.trim() ||
    'Metrc package';
  const brand =
    payload.ItemFromFacilityName?.trim() ||
    payload.LabFacilityName?.trim() ||
    'Metrc';
  const category = (payload.Item?.ProductCategoryName ?? 'flower').toLowerCase();
  const label = payload.PackageLabel || payload.Label || String(payload.Id ?? 'unknown');

  return {
    lab_report_id: `METRC-${label}`.slice(0, 64),
    product_key: deriveProductKey(brand, strain_name, category),
    strain_name,
    brand,
    type: parseProductType(`${strain_name} ${category}`),
    category,
    thc_percentage: thc,
    cbd_percentage: cbd,
    terpene_profile: terpenesFromResults(results),
    compliance_status: 'confirmed',
    confidence: 'high',
    parse_source: source,
  };
}

async function fetchMetrcPackage(label: string): Promise<MetrcPackagePayload | null> {
  if (!metrcCredentialsConfigured()) return null;

  const base = process.env.METRC_BASE_URL!.trim().replace(/\/$/, '');
  const user = process.env.METRC_USER_KEY!.trim();
  const vendor = process.env.METRC_VENDOR_KEY!.trim();
  const auth = Buffer.from(`${user}:${vendor}`).toString('base64');

  const endpoints = [
    `${base}/packages/v2/${encodeURIComponent(label)}`,
    `${base}/packages/v1/${encodeURIComponent(label)}`,
  ];

  for (const apiUrl of endpoints) {
    try {
      const res = await fetch(apiUrl, {
        signal: AbortSignal.timeout(15_000),
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${auth}`,
        },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as MetrcPackagePayload | MetrcPackagePayload[];
      if (Array.isArray(json)) return json[0] ?? null;
      return json;
    } catch {
      /* try next endpoint */
    }
  }
  return null;
}

/**
 * Live Metrc URL → CAA parse. Returns null when credentials unset or fetch fails
 * so callers can fall through to HTML/PDF extractors.
 */
export async function parseMetrcUrl(
  url: string,
  source: 'url' | 'qr',
): Promise<CaaCoaParseResult | null> {
  if (!isMetrcUrl(url)) return null;
  if (!metrcCredentialsConfigured()) return null;

  const label = extractMetrcPackageLabel(url);
  if (!label) return null;

  const payload = await fetchMetrcPackage(label);
  if (!payload) return null;

  const parse = metrcPackageToCaaParse(payload, source);
  if (!parse.strain_name?.trim()) return null;
  // Require at least potency or a real strain name beyond the default fallback.
  if (!(parse.thc_percentage > 0) && parse.strain_name === 'Metrc package') return null;
  return parse;
}
