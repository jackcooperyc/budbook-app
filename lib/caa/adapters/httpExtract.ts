import type { Product } from '@/types/budbook';
import type { CaaCoaParseResult, CaaParseConfidence, CaaParseSource } from '@/types/caa';
import { deriveProductKey } from '@lib/rda/keying';

const TERPENE_NAMES = [
  'Limonene',
  'Myrcene',
  'Caryophyllene',
  'Pinene',
  'Linalool',
  'Humulene',
  'Terpinolene',
  'Bisabolol',
  'Ocimene',
];

function parsePercent(text: string, labels: string[]): number | null {
  for (const label of labels) {
    const re = new RegExp(`${label}[^\\d]{0,20}(\\d+(?:\\.\\d+)?)\\s*%`, 'i');
    const match = text.match(re);
    if (match) return Number(match[1]);
  }
  return null;
}

function parseType(text: string): Product['type'] {
  const lower = text.toLowerCase();
  if (/\bindica\b/.test(lower) && !/\bhybrid\b/.test(lower)) return 'indica';
  if (/\bsativa\b/.test(lower) && !/\bhybrid\b/.test(lower)) return 'sativa';
  if (/\bhybrid\b/.test(lower)) return 'hybrid';
  return 'hybrid';
}

function parseCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/\btincture\b/.test(lower)) return 'tincture';
  if (/\bedible\b|\bgumm/.test(lower)) return 'edible';
  if (/\bconcentrate\b|\brosin\b|\bwax\b/.test(lower)) return 'concentrate';
  if (/\bpre[- ]?roll\b/.test(lower)) return 'pre-roll';
  return 'flower';
}

function parseStrainName(text: string): string | null {
  const patterns = [
    /strain[:\s]+([^\n\r|]+)/i,
    /sample\s+name[:\s]+([^\n\r|]+)/i,
    /product[:\s]+([^\n\r|]+)/i,
  ];
  for (const re of patterns) {
    const match = text.match(re);
    if (match?.[1]) return match[1].trim().slice(0, 80);
  }
  return null;
}

function parseBrand(text: string): string | null {
  const match = text.match(/(?:client|brand|producer|manufacturer)[:\s]+([^\n\r|]+)/i);
  return match?.[1]?.trim().slice(0, 80) ?? null;
}

function parseTerpenes(text: string): { terpene_name: string; percentage: number }[] {
  const found: { terpene_name: string; percentage: number }[] = [];
  for (const name of TERPENE_NAMES) {
    const re = new RegExp(`${name}[^\\d]{0,12}(\\d+(?:\\.\\d+)?)\\s*%`, 'i');
    const match = text.match(re);
    if (match) {
      found.push({ terpene_name: name, percentage: Number(match[1]) });
    }
  }
  return found.slice(0, 6);
}

function labReportIdFromText(text: string): string {
  const batch = text.match(/(?:batch|lot|sample)[#:\s-]*([A-Z0-9-]+)/i)?.[1];
  if (batch) return `COA-${batch.toUpperCase().slice(0, 24)}`;
  const slug = text.replace(/[^a-z0-9]/gi, '').slice(-12).toUpperCase() || 'LIVE';
  return `COA-LIVE-${slug}`;
}

export function parseCoaLabText(
  text: string,
  source: CaaParseSource,
  options?: { requireTerpenes?: boolean },
): CaaCoaParseResult | null {
  const thc =
    parsePercent(text, ['total thc', 'thc', 'delta-9 thc', 'd9-thc']) ??
    parsePercent(text, ['thca']);
  const cbd = parsePercent(text, ['total cbd', 'cbd', 'cbda']) ?? 0;

  if (thc == null) return null;

  const strain_name = parseStrainName(text) ?? 'Scanned product';
  const brand = parseBrand(text) ?? 'Lab COA';
  const category = parseCategory(text);
  const type = parseType(text);
  const terpene_profile = parseTerpenes(text);
  if ((options?.requireTerpenes ?? true) && terpene_profile.length === 0) return null;

  const confidence: CaaParseConfidence = 'high';

  return {
    lab_report_id: labReportIdFromText(text),
    product_key: deriveProductKey(brand, strain_name, category),
    strain_name,
    brand,
    type,
    category,
    thc_percentage: thc,
    cbd_percentage: cbd,
    terpene_profile,
    compliance_status: 'confirmed',
    confidence,
    parse_source: source,
  };
}

export async function fetchCoaDocumentText(url: string): Promise<string | null> {
  const { fetchCoaUrl } = await import('@lib/coa/fetch');
  try {
    const result = await fetchCoaUrl(url);
    if (result.isPdf) return null;
    return result.body || null;
  } catch {
    return null;
  }
}

export async function parseCoaFromUrl(url: string): Promise<CaaCoaParseResult | null> {
  const body = await fetchCoaDocumentText(url);
  if (!body) return null;
  return parseCoaLabText(body, 'url');
}
