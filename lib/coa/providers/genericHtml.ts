import {
  COA_PARSER_VERSION,
  emptyNormalizedCoaResult,
  fieldValue,
  normalizeCannabinoidEntry,
  normalizeTerpeneEntry,
  normalizeUrl,
} from '@lib/coa/normalize';
import type {
  ConfidenceLevel,
  FieldSource,
  NormalizedCannabinoid,
  NormalizedCoaResult,
  NormalizedTerpene,
  SafetyTestStatus,
} from '@lib/coa/types';
import type { CoaProvider, CoaProviderInput } from '@lib/coa/providers/types';

const SOURCE: FieldSource = 'coa';
const CONF: ConfidenceLevel = 'medium';
const CONF_LOW: ConfidenceLevel = 'low';

const CANNABINOID_LABELS = [
  'Total THC',
  'THC',
  'Delta-9 THC',
  'THCa',
  'Total CBD',
  'CBD',
  'CBDa',
  'CBG',
  'CBN',
  'CBC',
];

const TERPENE_LABELS = [
  'Myrcene',
  'Limonene',
  'Caryophyllene',
  'Pinene',
  'Linalool',
  'Humulene',
  'Terpinolene',
  'Ocimene',
  'Bisabolol',
];

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

/** Preserve line breaks so labeled `Field: value` patterns remain matchable. */
function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '\n')
      .replace(/<style[\s\S]*?<\/style>/gi, '\n')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '\n')
      .replace(/<!--[\s\S]*?-->/g, '\n')
      .replace(/<(?:br|hr)\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|tr|li|h1|h2|h3|h4|dt|dd|section|article|table)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );
}

/** Pull clearly paired definition-list fields before tag stripping. */
function extractDefinitionListFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const re = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) != null) {
    const key = stripTags(match[1]).replace(/:\s*$/, '').trim().toLowerCase();
    const value = stripTags(match[2]).trim();
    if (key && value) fields[key] = value.slice(0, 120);
  }
  return fields;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1] ? stripTags(match[1]).trim() : '';
  return title || undefined;
}

function extractCanonical(html: string, fallbackUrl: string): string {
  const match = html.match(
    /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  ) ?? html.match(
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i,
  );
  if (match?.[1]) {
    try {
      return normalizeUrl(new URL(match[1], fallbackUrl).toString());
    } catch {
      /* fall through */
    }
  }
  return normalizeUrl(fallbackUrl);
}

function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) != null) {
    try {
      const parsed = JSON.parse(match[1].trim()) as unknown;
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      /* ignore invalid JSON-LD */
    }
  }
  return blocks;
}

/** Extract a clearly labeled string field from flattened HTML text or dl pairs. */
function labeledValue(
  text: string,
  labels: string[],
  dlFields?: Record<string, string>,
): string | undefined {
  if (dlFields) {
    for (const label of labels) {
      const key = label.toLowerCase();
      if (dlFields[key]) return dlFields[key];
    }
  }

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `(?:^|[\\n\\r|;])\\s*${escaped}\\s*[:|]\\s*([^\\n\\r|;]+)`,
      'im',
    );
    const match = text.match(re);
    const value = match?.[1]?.trim().replace(/\s+/g, ' ');
    if (value && value.length > 0 && value.length <= 120) return value;
  }
  return undefined;
}

function labeledNumber(
  text: string,
  labels: string[],
): { value: number; unit: 'percent' | 'mg' | 'mg_g' } | undefined {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`${escaped}\\s*[:|]\\s*(\\d+(?:\\.\\d+)?)\\s*%`, 'i'),
      new RegExp(`${escaped}\\s*[:|]\\s*(\\d+(?:\\.\\d+)?)\\s*mg\\/g`, 'i'),
      new RegExp(`${escaped}\\s*[:|]\\s*(\\d+(?:\\.\\d+)?)\\s*mg\\b`, 'i'),
    ];
    for (let i = 0; i < patterns.length; i += 1) {
      const match = text.match(patterns[i]);
      if (!match) continue;
      const value = Number(match[1]);
      if (!Number.isFinite(value)) continue;
      const unit = i === 0 ? 'percent' : i === 1 ? 'mg_g' : 'mg';
      return { value, unit };
    }
  }
  return undefined;
}

function parseSafety(text: string): SafetyTestStatus | undefined {
  const overall = text.match(
    /(?:overall|safety|compliance|result)\s*(?:status|test)?\s*[:|]\s*(pass|fail|failed|passed)/i,
  );
  if (overall?.[1]) {
    return /^pass/i.test(overall[1]) ? 'pass' : 'fail';
  }
  // Clearly labeled standalone status line
  const line = text.match(/(?:^|\n)\s*(?:status)\s*[:|]\s*(pass|fail)\b/i);
  if (line?.[1]) {
    return /^pass/i.test(line[1]) ? 'pass' : 'fail';
  }
  return undefined;
}

function applyJsonLdHints(
  result: NormalizedCoaResult,
  jsonLd: unknown[],
): void {
  for (const block of jsonLd) {
    if (!block || typeof block !== 'object') continue;
    const obj = block as Record<string, unknown>;
    const name = typeof obj.name === 'string' ? obj.name.trim() : '';
    const brand =
      typeof obj.brand === 'string'
        ? obj.brand.trim()
        : obj.brand && typeof obj.brand === 'object' && typeof (obj.brand as { name?: string }).name === 'string'
          ? (obj.brand as { name: string }).name.trim()
          : '';
    if (name && !result.product.name) {
      result.product.name = fieldValue(name.slice(0, 120), SOURCE, CONF_LOW);
    }
    if (brand && !result.product.brand) {
      result.product.brand = fieldValue(brand.slice(0, 120), SOURCE, CONF_LOW);
    }
  }
}

function scoreExtraction(result: NormalizedCoaResult): {
  status: NormalizedCoaResult['extraction']['status'];
  confidence: ConfidenceLevel;
  notes: string[];
} {
  const notes: string[] = [...result.extraction.notes];
  const hasProduct = Boolean(result.product.name?.value || result.product.strain?.value);
  const hasCannabinoids = result.cannabinoids.length > 0;
  const hasLab = Boolean(result.lab.name?.value || result.lab.reportNumber?.value);
  const hasBatch = Boolean(result.product.batchNumber?.value || result.product.lotNumber?.value);

  if (hasProduct && hasCannabinoids && (hasLab || hasBatch)) {
    return { status: 'resolved', confidence: 'medium', notes };
  }
  if (hasCannabinoids || (hasProduct && hasLab)) {
    notes.push('Partial labeled fields extracted from HTML.');
    return { status: 'partial', confidence: 'low', notes };
  }
  notes.push('Insufficient clearly labeled COA fields in HTML.');
  return { status: 'needs_review', confidence: 'low', notes };
}

export function parseGenericCoaHtml(
  html: string,
  sourceUrl: string,
  options?: { providerId?: string; finalUrl?: string; contentHash?: string; extraNotes?: string[] },
): NormalizedCoaResult {
  const providerId = options?.providerId ?? 'generic_html';
  const finalUrl = options?.finalUrl ?? sourceUrl;
  const title = extractTitle(html);
  const canonicalUrl = extractCanonical(html, finalUrl);
  const jsonLd = extractJsonLd(html);
  const dlFields = extractDefinitionListFields(html);
  const visibleText = stripTags(html);

  const result = emptyNormalizedCoaResult(sourceUrl, providerId, COA_PARSER_VERSION);
  result.source.sourceUrl = normalizeUrl(sourceUrl);
  result.source.contentHash = options?.contentHash;
  result.extraction.status = 'needs_review';
  result.extraction.notes = [
    `Parsed with ${providerId}.`,
    ...(options?.extraNotes ?? []),
  ];

  const category = labeledValue(visibleText, ['Category', 'Product type', 'Type'], dlFields);
  const productName = labeledValue(
    visibleText,
    ['Product name', 'Product', 'Sample name', 'Strain name', 'Strain'],
    dlFields,
  );
  const brand = labeledValue(
    visibleText,
    ['Brand', 'Client', 'Producer', 'Manufacturer', 'Cultivator'],
    dlFields,
  );
  const batch = labeledValue(
    visibleText,
    ['Batch number', 'Batch #', 'Batch ID', 'Batch'],
    dlFields,
  );
  const lot = labeledValue(visibleText, ['Lot number', 'Lot #', 'Lot ID', 'Lot'], dlFields);
  const lab = labeledValue(
    visibleText,
    ['Laboratory', 'Lab name', 'Testing lab', 'Lab'],
    dlFields,
  );
  const reportDate = labeledValue(
    visibleText,
    ['Report date', 'Date reported', 'Analyzed on', 'Test date', 'Date tested'],
    dlFields,
  );
  const reportNumber = labeledValue(
    visibleText,
    ['Report number', 'Report #', 'Lab report ID', 'Sample ID', 'COA number'],
    dlFields,
  );

  if (productName) {
    result.product.name = fieldValue(productName, SOURCE, CONF);
    result.product.strain = fieldValue(productName, SOURCE, CONF_LOW);
  } else if (title && /coa|certificate|lab\s*report/i.test(title)) {
    // Title alone is not a product name — keep as warning only.
    result.warnings.push(`Page title: ${title.slice(0, 120)}`);
  }

  if (brand) result.product.brand = fieldValue(brand, SOURCE, CONF);
  if (category) result.product.category = fieldValue(category, SOURCE, CONF_LOW);
  if (batch) result.product.batchNumber = fieldValue(batch, SOURCE, CONF);
  if (lot) result.product.lotNumber = fieldValue(lot, SOURCE, CONF);
  if (lab) result.lab.name = fieldValue(lab, SOURCE, CONF);
  if (reportDate) result.lab.reportDate = fieldValue(reportDate, SOURCE, CONF);
  if (reportNumber) result.lab.reportNumber = fieldValue(reportNumber, SOURCE, CONF);

  applyJsonLdHints(result, jsonLd);

  const cannabinoids: NormalizedCannabinoid[] = [];
  const seenCannabinoids = new Set<string>();
  for (const label of CANNABINOID_LABELS) {
    const found = labeledNumber(visibleText, [label]);
    if (!found) continue;
    const entry = normalizeCannabinoidEntry(label, found.value, found.unit, SOURCE, CONF);
    const key = entry.name.toLowerCase();
    if (seenCannabinoids.has(key)) continue;
    seenCannabinoids.add(key);
    cannabinoids.push(entry);
  }
  result.cannabinoids = cannabinoids;

  const terpenes: NormalizedTerpene[] = [];
  for (const label of TERPENE_LABELS) {
    const found = labeledNumber(visibleText, [label]);
    if (!found) continue;
    const unit = found.unit === 'mg' ? 'mg_g' : found.unit;
    terpenes.push(normalizeTerpeneEntry(label, found.value, unit, SOURCE, CONF));
  }
  result.terpenes = terpenes;

  const safety = parseSafety(visibleText);
  if (safety) {
    result.safety.overallStatus = fieldValue(safety, SOURCE, CONF);
  }

  // Attach non-persisted evidence metadata into warnings/notes only (not full HTML).
  result.extraction.notes.push(`canonical=${canonicalUrl}`);
  if (title) result.extraction.notes.push(`title=${title.slice(0, 160)}`);
  if (jsonLd.length > 0) result.extraction.notes.push(`json_ld_blocks=${jsonLd.length}`);

  const scored = scoreExtraction(result);
  result.extraction.status = scored.status;
  result.extraction.confidence = scored.confidence;
  result.extraction.notes = scored.notes;

  return result;
}

export const genericHtmlProvider: CoaProvider = {
  id: 'generic_html',
  canHandle() {
    return true;
  },
  async parse(input: CoaProviderInput) {
    return parseGenericCoaHtml(input.html, input.sourceUrl, {
      providerId: 'generic_html',
      finalUrl: input.finalUrl,
      contentHash: input.contentHash,
    });
  },
};
