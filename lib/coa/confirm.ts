import type { CaaCoaParseResult, CaaParseSource } from '@/types/caa';
import {
  fieldValue,
  normalizeCannabinoidEntry,
  normalizedToCaaParse,
} from '@lib/coa/normalize';
import type {
  ConfidenceLevel,
  FieldSource,
  FieldValue,
  NormalizedCannabinoid,
  NormalizedCoaResult,
  ScanInput,
} from '@lib/coa/types';

/** User-editable fields on the scan review screen. */
export type CoaFieldCorrections = {
  name?: string;
  brand?: string;
  category?: string;
  strain?: string;
  batchNumber?: string;
  lotNumber?: string;
  labName?: string;
  reportNumber?: string;
  thc?: number;
  cbd?: number;
};

function trimOrUndefined(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function applyStringField(
  existing: FieldValue<string> | undefined,
  nextRaw: string | undefined,
): FieldValue<string> | undefined {
  const next = trimOrUndefined(nextRaw);
  if (next === undefined) return existing;

  const prior = existing?.value?.trim();
  if (prior === next && existing) return existing;

  return fieldValue(next, 'user_confirmed', 'high');
}

function upsertCannabinoid(
  list: NormalizedCannabinoid[],
  name: 'THC' | 'CBD',
  value: number | undefined,
): NormalizedCannabinoid[] {
  if (value === undefined || !Number.isFinite(value)) return list;

  const idx = list.findIndex((c) => c.name === name);
  const prior = idx >= 0 ? list[idx] : undefined;
  if (prior && prior.value === value) {
    return list;
  }

  const entry = normalizeCannabinoidEntry(name, value, 'percent', 'user_confirmed', 'high');
  if (idx >= 0) {
    const next = [...list];
    next[idx] = entry;
    return next;
  }
  return [...list, entry];
}

/**
 * Apply user corrections onto a normalized COA result.
 * Changed / newly filled fields are marked `user_confirmed` with high confidence.
 * Unchanged fields keep their original source and confidence.
 */
export function applyUserCorrections(
  normalized: NormalizedCoaResult,
  corrections: CoaFieldCorrections,
): NormalizedCoaResult {
  const product = { ...normalized.product };
  const lab = { ...normalized.lab };

  const name = applyStringField(product.name, corrections.name);
  const brand = applyStringField(product.brand, corrections.brand);
  const category = applyStringField(product.category, corrections.category);
  const strain = applyStringField(product.strain, corrections.strain);
  const batchNumber = applyStringField(product.batchNumber, corrections.batchNumber);
  const lotNumber = applyStringField(product.lotNumber, corrections.lotNumber);
  const labName = applyStringField(lab.name, corrections.labName);
  const reportNumber = applyStringField(lab.reportNumber, corrections.reportNumber);

  if (name) product.name = name;
  if (brand) product.brand = brand;
  if (category) product.category = category;
  if (strain) product.strain = strain;
  if (batchNumber) product.batchNumber = batchNumber;
  if (lotNumber) product.lotNumber = lotNumber;
  if (labName) lab.name = labName;
  if (reportNumber) lab.reportNumber = reportNumber;

  let cannabinoids = [...normalized.cannabinoids];
  cannabinoids = upsertCannabinoid(cannabinoids, 'THC', corrections.thc);
  cannabinoids = upsertCannabinoid(cannabinoids, 'CBD', corrections.cbd);

  const hadCorrections = Object.values(corrections).some(
    (v) => v !== undefined && v !== null && String(v).trim() !== '',
  );

  const notes = [...normalized.extraction.notes];
  if (hadCorrections) {
    notes.push('User confirmed or corrected fields before saving to stash.');
  }

  const extractionConfidence: ConfidenceLevel =
    hadCorrections && normalized.extraction.confidence !== 'high'
      ? 'high'
      : normalized.extraction.confidence;

  return {
    ...normalized,
    product,
    lab,
    cannabinoids,
    extraction: {
      ...normalized.extraction,
      status:
        normalized.extraction.status === 'failed'
          ? 'needs_review'
          : normalized.extraction.status === 'needs_review' && hadCorrections
            ? 'partial'
            : normalized.extraction.status,
      confidence: extractionConfidence,
      notes,
    },
  };
}

/** Draft form values from a normalized COA result. */
export function correctionsFromNormalized(
  normalized: NormalizedCoaResult,
): Required<
  Pick<
    CoaFieldCorrections,
    | 'name'
    | 'brand'
    | 'category'
    | 'strain'
    | 'batchNumber'
    | 'lotNumber'
    | 'labName'
    | 'reportNumber'
  >
> &
  Pick<CoaFieldCorrections, 'thc' | 'cbd'> {
  const thc =
    normalized.cannabinoids.find((c) => c.name === 'THC')?.value ??
    normalized.cannabinoids.find((c) => c.name === 'Total THC')?.value;
  const cbd =
    normalized.cannabinoids.find((c) => c.name === 'CBD')?.value ??
    normalized.cannabinoids.find((c) => c.name === 'Total CBD')?.value;

  return {
    name: normalized.product.name?.value ?? normalized.product.strain?.value ?? '',
    brand: normalized.product.brand?.value ?? '',
    category: normalized.product.category?.value ?? '',
    strain: normalized.product.strain?.value ?? normalized.product.name?.value ?? '',
    batchNumber: normalized.product.batchNumber?.value ?? '',
    lotNumber: normalized.product.lotNumber?.value ?? '',
    labName: normalized.lab.name?.value ?? '',
    reportNumber: normalized.lab.reportNumber?.value ?? '',
    thc,
    cbd,
  };
}

/** @deprecated Prefer correctionsFromNormalized */
export const draftCorrectionsFromNormalized = correctionsFromNormalized;

export function fieldConfidenceLabel(
  field: { source: FieldSource; confidence: ConfidenceLevel } | undefined,
): { label: string; level: ConfidenceLevel } {
  if (!field) {
    return { label: 'Missing — needs review', level: 'low' };
  }
  if (field.source === 'user_confirmed') {
    return { label: 'You confirmed', level: 'high' };
  }
  if (field.confidence === 'high' && field.source === 'coa') {
    return { label: 'Lab evidence', level: 'high' };
  }
  if (field.confidence === 'medium') {
    return { label: 'Needs review', level: 'medium' };
  }
  return { label: 'Low confidence', level: 'low' };
}

export function parseSourceFromJobKind(kind: ScanInput['kind']): CaaParseSource {
  if (kind === 'text') return 'text';
  if (kind === 'qr_payload' || kind === 'qr_url') return 'qr';
  return 'url';
}

/** Bridge confirmed normalized payload to CAA stash shape. */
export function confirmedParseFromNormalized(
  normalized: NormalizedCoaResult,
  parseSource: CaaParseSource = 'url',
): CaaCoaParseResult {
  return normalizedToCaaParse(normalized, parseSource);
}
