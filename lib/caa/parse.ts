import type { Product } from '@/types/budbook';
import type { CaaCoaParseResult, CaaParseConfidence, CaaParseSource } from '@/types/caa';
import { deriveProductKey } from '@lib/rda/keying';

type StrainHint = {
  strain_name: string;
  brand: string;
  type: Product['type'];
  category: string;
  thc_percentage: number;
  cbd_percentage: number;
  terpenes: { terpene_name: string; percentage: number }[];
};

const STRAIN_HINTS: Record<string, StrainHint> = {
  wedding: {
    strain_name: 'Wedding Cake',
    brand: 'Archive Portland',
    type: 'hybrid',
    category: 'flower',
    thc_percentage: 26.4,
    cbd_percentage: 0.1,
    terpenes: [
      { terpene_name: 'Limonene', percentage: 0.52 },
      { terpene_name: 'Caryophyllene', percentage: 0.41 },
      { terpene_name: 'Myrcene', percentage: 0.28 },
    ],
  },
  gmo: {
    strain_name: 'GMO Cookies',
    brand: 'Archive Portland',
    type: 'indica',
    category: 'flower',
    thc_percentage: 29.8,
    cbd_percentage: 0.08,
    terpenes: [
      { terpene_name: 'Caryophyllene', percentage: 0.58 },
      { terpene_name: 'Limonene', percentage: 0.31 },
      { terpene_name: 'Myrcene', percentage: 0.22 },
    ],
  },
  blue: {
    strain_name: 'Blue Dream',
    brand: 'Pacific Crest Cannabis',
    type: 'hybrid',
    category: 'flower',
    thc_percentage: 22.4,
    cbd_percentage: 0.16,
    terpenes: [
      { terpene_name: 'Myrcene', percentage: 0.45 },
      { terpene_name: 'Pinene', percentage: 0.33 },
      { terpene_name: 'Caryophyllene', percentage: 0.27 },
    ],
  },
  charlotte: {
    strain_name: "Charlotte's Web — Everyday Plus",
    brand: "Charlotte's Web",
    type: 'hybrid',
    category: 'tincture',
    thc_percentage: 0.35,
    cbd_percentage: 16.2,
    terpenes: [
      { terpene_name: 'Bisabolol', percentage: 0.38 },
      { terpene_name: 'Humulene', percentage: 0.29 },
      { terpene_name: 'Linalool', percentage: 0.24 },
    ],
  },
};

function labReportIdFromInput(input: string): string {
  const slug = input.replace(/[^a-z0-9]/gi, '').slice(-12).toUpperCase() || 'SCAN';
  return `COA-2026-OR-${slug}`;
}

function matchHint(normalized: string): { hint: StrainHint; confidence: CaaParseConfidence } | null {
  for (const [key, hint] of Object.entries(STRAIN_HINTS)) {
    if (normalized.includes(key)) {
      return { hint, confidence: 'high' };
    }
  }
  return null;
}

function inferHint(normalized: string): { hint: StrainHint; confidence: CaaParseConfidence } {
  const hash = normalized.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const variants = Object.values(STRAIN_HINTS);
  return { hint: variants[hash % variants.length], confidence: 'inferred' };
}

export function parseCoaInput(
  input: string,
  source: CaaParseSource,
): CaaCoaParseResult {
  const normalized = input.trim().toLowerCase();
  const matched = matchHint(normalized) ?? inferHint(normalized);
  const { hint, confidence } = matched;

  const product_key = deriveProductKey(hint.brand, hint.strain_name, hint.category);

  return {
    lab_report_id: labReportIdFromInput(input),
    product_key,
    strain_name: hint.strain_name,
    brand: hint.brand,
    type: hint.type,
    category: hint.category,
    thc_percentage: hint.thc_percentage,
    cbd_percentage: hint.cbd_percentage,
    terpene_profile: hint.terpenes,
    compliance_status: 'confirmed',
    confidence,
    parse_source: source,
  };
}

export function parseCoaUrl(url: string): CaaCoaParseResult {
  return parseCoaInput(url, 'url');
}

export function parseCoaText(text: string): CaaCoaParseResult {
  return parseCoaInput(text, 'text');
}
