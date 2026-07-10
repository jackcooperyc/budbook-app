import type { CaaCoaParseResult } from '@/types/caa';
import { deriveProductKey } from '@lib/rda/keying';
import type {
  CannabinoidUnit,
  ConfidenceLevel,
  FieldSource,
  FieldValue,
  NormalizedCannabinoid,
  NormalizedCoaResult,
  NormalizedTerpene,
  TerpeneUnit,
} from '@lib/coa/types';

export const COA_PARSER_VERSION = 'coa-scan-v1';

export function fieldValue<T>(
  value: T,
  source: FieldSource,
  confidence: ConfidenceLevel,
): FieldValue<T> {
  return { value, source, confidence };
}

export function normalizeUrl(url: string): string {
  const parsed = new URL(url.trim());
  parsed.hash = '';
  return parsed.toString();
}

const CANNABINOID_ALIASES: Record<string, string> = {
  'delta-9-thc': 'THC',
  'delta-9 tetrahydrocannabinol': 'THC',
  d9_thc: 'THC',
  thc: 'THC',
  'total thc': 'Total THC',
  thca: 'THCa',
  cbd: 'CBD',
  'total cbd': 'Total CBD',
  cbda: 'CBDa',
  cbg: 'CBG',
  cbn: 'CBN',
  cbc: 'CBC',
};

const TERPENE_ALIASES: Record<string, string> = {
  beta_myrcene: 'Myrcene',
  myrcene: 'Myrcene',
  beta_caryophyllene: 'Caryophyllene',
  caryophyllene: 'Caryophyllene',
  limonene: 'Limonene',
  linalool: 'Linalool',
  alpha_pinene: 'Pinene',
  beta_pinene: 'Pinene',
  humulene: 'Humulene',
  terpinolene: 'Terpinolene',
  ocimene: 'Ocimene',
};

function titleCaseWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeCompoundName(
  raw: string,
  aliases: Record<string, string>,
): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!key) return '';
  return aliases[key] ?? titleCaseWords(raw.trim());
}

export function normalizeCannabinoidName(raw: string): string {
  return normalizeCompoundName(raw, CANNABINOID_ALIASES);
}

export function normalizeTerpeneName(raw: string): string {
  return normalizeCompoundName(raw, TERPENE_ALIASES);
}

export function normalizeCannabinoidEntry(
  name: string,
  value: number | undefined,
  unit: CannabinoidUnit | undefined,
  source: FieldSource,
  confidence: ConfidenceLevel,
): NormalizedCannabinoid {
  return {
    name: normalizeCannabinoidName(name),
    value,
    unit,
    source,
    confidence,
  };
}

export function normalizeTerpeneEntry(
  name: string,
  value: number | undefined,
  unit: TerpeneUnit | undefined,
  source: FieldSource,
  confidence: ConfidenceLevel,
): NormalizedTerpene {
  return {
    name: normalizeTerpeneName(name),
    value,
    unit,
    source,
    confidence,
  };
}

export function emptyNormalizedCoaResult(
  sourceUrl: string,
  provider = 'unknown',
  providerVersion = COA_PARSER_VERSION,
): NormalizedCoaResult {
  return {
    source: {
      sourceUrl: /^https?:\/\//i.test(sourceUrl) ? normalizeUrl(sourceUrl) : sourceUrl,
      provider,
      providerVersion,
      resolvedAt: new Date().toISOString(),
    },
    product: {},
    lab: {},
    cannabinoids: [],
    terpenes: [],
    safety: {},
    warnings: [],
    extraction: {
      status: 'failed',
      confidence: 'low',
      notes: [],
    },
  };
}

/**
 * Bridge CAA parse output into the normalized COA shape with full provenance metadata.
 * Preserves CAA as authoritative for lab_report_id-derived fields in downstream flows.
 */
export function labReportIdFromNormalized(result: NormalizedCoaResult): string | null {
  return result.lab.reportNumber?.value ?? result.source.contentHash ?? null;
}

/**
 * Bridge normalized COA output back to CaaCoaParseResult for legacy consumers.
 */
export function normalizedToCaaParse(
  normalized: NormalizedCoaResult,
  parseSource: CaaCoaParseResult['parse_source'] = 'url',
): CaaCoaParseResult {
  const thc =
    normalized.cannabinoids.find((c) => c.name === 'THC')?.value ??
    normalized.cannabinoids.find((c) => c.name === 'Total THC')?.value ??
    0;
  const cbd =
    normalized.cannabinoids.find((c) => c.name === 'CBD')?.value ??
    normalized.cannabinoids.find((c) => c.name === 'Total CBD')?.value ??
    0;

  const strain_name = normalized.product.strain?.value ?? normalized.product.name?.value ?? 'Scanned product';
  const brand = normalized.product.brand?.value ?? 'Lab COA';
  const category = normalized.product.category?.value ?? 'flower';
  const lab_report_id = labReportIdFromNormalized(normalized) ?? `COA-SCAN-${Date.now()}`;

  const typeRaw = category.toLowerCase();
  let type: CaaCoaParseResult['type'] = 'hybrid';
  if (/\bindica\b/.test(typeRaw) && !/\bhybrid\b/.test(typeRaw)) type = 'indica';
  else if (/\bsativa\b/.test(typeRaw) && !/\bhybrid\b/.test(typeRaw)) type = 'sativa';

  return {
    lab_report_id,
    product_key: deriveProductKey(brand, strain_name, category),
    strain_name,
    brand,
    type,
    category,
    thc_percentage: thc,
    cbd_percentage: cbd,
    terpene_profile: normalized.terpenes.map((t) => ({
      terpene_name: t.name,
      percentage: t.value ?? 0,
    })),
    compliance_status: 'confirmed',
    confidence: normalized.extraction.confidence === 'high' ? 'high' : 'high',
    parse_source: parseSource,
  };
}

export function normalizedFromCaaParse(
  parse: CaaCoaParseResult,
  sourceUrl: string,
  provider = 'caa',
  contentHash?: string | null,
): NormalizedCoaResult {
  const source: FieldSource = 'coa';
  const confidence: ConfidenceLevel = parse.confidence === 'high' ? 'high' : 'medium';

  const cannabinoids: NormalizedCannabinoid[] = [
    normalizeCannabinoidEntry('THC', parse.thc_percentage, 'percent', source, confidence),
    normalizeCannabinoidEntry('CBD', parse.cbd_percentage, 'percent', source, confidence),
  ];

  const terpenes: NormalizedTerpene[] = parse.terpene_profile.map((t) =>
    normalizeTerpeneEntry(t.terpene_name, t.percentage, 'percent', source, confidence),
  );

  return {
    source: {
      sourceUrl: normalizeUrl(sourceUrl),
      provider,
      providerVersion: COA_PARSER_VERSION,
      resolvedAt: new Date().toISOString(),
      contentHash: contentHash ?? parse.lab_report_id,
    },
    product: {
      name: fieldValue(parse.strain_name, source, confidence),
      brand: fieldValue(parse.brand, source, confidence),
      category: fieldValue(parse.category, source, confidence),
      strain: fieldValue(parse.strain_name, source, confidence),
    },
    lab: {
      reportNumber: fieldValue(parse.lab_report_id, source, confidence),
    },
    cannabinoids,
    terpenes,
    safety: {
      overallStatus: fieldValue('unknown', source, 'low'),
    },
    warnings: [],
    extraction: {
      status: 'resolved',
      confidence,
      notes: [`Bridged from CAA parse (product_key=${parse.product_key}).`],
    },
  };
}
