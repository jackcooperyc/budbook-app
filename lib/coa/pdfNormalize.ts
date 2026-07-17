/**
 * Map PDF text-layer extraction into normalized COA with label_ocr provenance.
 * Never presents PDF text fields as lab-verified / high-confidence COA.
 */
import { parseCoaLabText } from '@lib/caa/adapters/httpExtract';
import {
  COA_PARSER_VERSION,
  emptyNormalizedCoaResult,
  fieldValue,
  normalizeCannabinoidEntry,
  normalizedFromCaaParse,
} from '@lib/coa/normalize';
import type {
  ConfidenceLevel,
  FieldSource,
  FieldValue,
  NormalizedCoaResult,
} from '@lib/coa/types';

const PDF_SOURCE: FieldSource = 'label_ocr';
const PDF_CONFIDENCE: ConfidenceLevel = 'medium';

function downgradeField<T>(field: FieldValue<T> | undefined): FieldValue<T> | undefined {
  if (!field) return undefined;
  return {
    value: field.value,
    source: PDF_SOURCE,
    confidence: field.confidence === 'low' ? 'low' : PDF_CONFIDENCE,
  };
}

/** Rewrite field provenance after CAA bridge so UI never shows PDF as lab-verified. */
export function markNormalizedAsPdfText(normalized: NormalizedCoaResult): NormalizedCoaResult {
  return {
    ...normalized,
    source: {
      ...normalized.source,
      provider: 'pdf_text',
      providerVersion: COA_PARSER_VERSION,
    },
    product: {
      name: downgradeField(normalized.product.name),
      brand: downgradeField(normalized.product.brand),
      category: downgradeField(normalized.product.category),
      strain: downgradeField(normalized.product.strain),
      batchNumber: downgradeField(normalized.product.batchNumber),
      lotNumber: downgradeField(normalized.product.lotNumber),
      packageDate: downgradeField(normalized.product.packageDate),
    },
    lab: {
      name: downgradeField(normalized.lab.name),
      reportNumber: downgradeField(normalized.lab.reportNumber),
      reportDate: downgradeField(normalized.lab.reportDate),
    },
    cannabinoids: normalized.cannabinoids.map((c) => ({
      ...c,
      source: PDF_SOURCE,
      confidence: c.confidence === 'low' ? 'low' : PDF_CONFIDENCE,
    })),
    terpenes: normalized.terpenes.map((t) => ({
      ...t,
      source: PDF_SOURCE,
      confidence: t.confidence === 'low' ? 'low' : PDF_CONFIDENCE,
    })),
    safety: {
      ...normalized.safety,
      overallStatus: downgradeField(normalized.safety.overallStatus),
    },
    warnings: [...normalized.warnings, 'PDF_TEXT_EXTRACTED'],
    extraction: {
      status: 'partial',
      confidence: PDF_CONFIDENCE,
      notes: [
        ...normalized.extraction.notes,
        'Extracted from PDF text layer — verify labeled fields before saving. Not lab-verified.',
      ],
    },
  };
}

/**
 * Build a normalized COA result from extracted PDF plain text.
 */
export function normalizedFromPdfText(
  text: string,
  sourceUrl: string,
  contentHash?: string | null,
): NormalizedCoaResult {
  const parse = parseCoaLabText(text, 'url', { requireTerpenes: false });
  if (parse) {
    const bridged = normalizedFromCaaParse(parse, sourceUrl, 'pdf_text', contentHash);
    const withBatch = { ...bridged };
    const batch = text.match(/(?:batch|lot)[#:\s-]*([A-Z0-9-]+)/i)?.[1];
    if (batch && !withBatch.product.batchNumber) {
      withBatch.product = {
        ...withBatch.product,
        batchNumber: fieldValue(batch, PDF_SOURCE, PDF_CONFIDENCE),
      };
    }
    const report = text.match(/(?:lab\s*report|report\s*(?:#|no\.?|number))[:\s]*([A-Z0-9-]+)/i)?.[1];
    if (report && !withBatch.lab.reportNumber) {
      withBatch.lab = {
        ...withBatch.lab,
        reportNumber: fieldValue(report, PDF_SOURCE, PDF_CONFIDENCE),
      };
    }
    return markNormalizedAsPdfText(withBatch);
  }

  // Heuristic partial fill when CAA bridge cannot build a full parse.
  const empty = emptyNormalizedCoaResult(sourceUrl, 'pdf_text', COA_PARSER_VERSION);
  empty.source.contentHash = contentHash ?? undefined;

  const thcMatch = text.match(/(?:total\s*)?thc[^\d]{0,20}(\d+(?:\.\d+)?)\s*%/i);
  const cbdMatch = text.match(/(?:total\s*)?cbd[^\d]{0,20}(\d+(?:\.\d+)?)\s*%/i);
  const strain = text.match(/strain[:\s]+([^\n\r|]+)/i)?.[1]?.trim();
  const brand = text.match(/(?:brand|client|producer)[:\s]+([^\n\r|]+)/i)?.[1]?.trim();

  const cannabinoids = [];
  if (thcMatch) {
    cannabinoids.push(
      normalizeCannabinoidEntry('THC', Number(thcMatch[1]), 'percent', PDF_SOURCE, 'low'),
    );
  }
  if (cbdMatch) {
    cannabinoids.push(
      normalizeCannabinoidEntry('CBD', Number(cbdMatch[1]), 'percent', PDF_SOURCE, 'low'),
    );
  }

  empty.product = {
    name: strain ? fieldValue(strain.slice(0, 80), PDF_SOURCE, 'low') : undefined,
    strain: strain ? fieldValue(strain.slice(0, 80), PDF_SOURCE, 'low') : undefined,
    brand: brand ? fieldValue(brand.slice(0, 80), PDF_SOURCE, 'low') : undefined,
  };
  empty.cannabinoids = cannabinoids;
  empty.extraction = {
    status: 'needs_review',
    confidence: 'low',
    notes: [
      'PDF text layer yielded incomplete labeled fields — review and fill before saving.',
    ],
  };
  empty.warnings.push('PDF_TEXT_INSUFFICIENT');
  return empty;
}

export function emptyImageOnlyPdfResult(
  sourceUrl: string,
  contentHash: string | null,
): NormalizedCoaResult {
  const normalized = emptyNormalizedCoaResult(sourceUrl, 'pdf_text', COA_PARSER_VERSION);
  normalized.source.contentHash = contentHash ?? undefined;
  normalized.extraction = {
    status: 'needs_review',
    confidence: 'low',
    notes: [
      'PDF has little or no extractable text (likely a scanned/image PDF). OCR is not available — paste labeled fields or use an HTML report URL.',
    ],
  };
  normalized.warnings.push('PDF_IMAGE_ONLY');
  return normalized;
}
