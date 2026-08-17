import type { InventoryItem, Product, Session } from '@/types/pacs';
import type { CaaCatalogEntry, CaaEnrichment } from '@/types/caa';
import type { SocialPost } from '@/types/pacs';
import type { CoaReport, CoaReportStashLink, ScanJob } from '@lib/coa/types';
import type {
  DbCaaCatalogEntry,
  DbCoaReport,
  DbCoaReportStashLink,
  DbInventoryItem,
  DbPost,
  DbProduct,
  DbScanJob,
  DbSession,
} from './schema';

export function toProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    strain_name: row.strainName,
    brand: row.brand,
    type: row.type as Product['type'],
    category: row.category,
    thc_percentage: row.thcPercentage,
    cbd_percentage: row.cbdPercentage,
    terpene_profile: row.terpeneProfile ?? [],
    lab_report_id: row.labReportId,
    dispensary_id: row.dispensaryId,
    product_key: row.productKey ?? undefined,
  };
}

export function toInventoryItem(row: DbInventoryItem): InventoryItem {
  return {
    id: row.id,
    product_id: row.productId,
    quantity: row.quantity,
    unit: row.unit,
    is_active: row.isActive,
    purchase_date: row.purchaseDate,
    notes: row.notes,
  };
}

export function toSession(row: DbSession): Session {
  return {
    id: row.id,
    date: row.date.toISOString(),
    product_id: row.productId,
    consumption_method: row.consumptionMethod,
    dosage: row.dosage,
    pairing_notes: row.pairingNotes,
    rating: row.rating,
    mood_before: row.moodBefore,
    mood_after: row.moodAfter,
    pain_before: row.painBefore,
    pain_after: row.painAfter,
    anxiety_before: row.anxietyBefore,
    anxiety_after: row.anxietyAfter,
    effects_felt: row.effectsFelt ?? [],
    activities: row.activities ?? [],
    session_notes: row.sessionNotes,
    session_name: row.sessionName,
  };
}

export function toSocialPost(row: DbPost): SocialPost {
  return {
    id: row.id,
    author: row.author,
    authorSeed: row.authorSeed,
    body: row.body,
    strain: row.strain ?? undefined,
    circle: row.circle ?? undefined,
    createdAt: row.createdAt.toISOString(),
    likes: row.likes,
  };
}

export function toCaaCatalogEntry(row: DbCaaCatalogEntry): CaaCatalogEntry {
  return {
    product_key: row.productKey,
    compliance_status: row.complianceStatus as CaaCatalogEntry['compliance_status'],
    lab_report_id: row.labReportId,
    thc_percentage: row.thcPercentage,
    cbd_percentage: row.cbdPercentage,
    type: row.type as CaaCatalogEntry['type'],
    terpene_profile: row.terpeneProfile ?? [],
    strain_name: row.strainName,
    brand: row.brand,
    category: row.category,
    registered_at: row.registeredAt.toISOString(),
  };
}

export function toCaaEnrichment(row: DbCaaCatalogEntry): CaaEnrichment {
  return {
    product_key: row.productKey,
    compliance_status: row.complianceStatus as CaaEnrichment['compliance_status'],
    lab_report_id: row.labReportId,
    thc_percentage: row.thcPercentage,
    cbd_percentage: row.cbdPercentage,
    type: row.type as CaaEnrichment['type'],
    terpene_profile: row.terpeneProfile ?? [],
    strain_name: row.strainName,
    brand: row.brand,
  };
}

export function toScanJob(row: DbScanJob): ScanJob {
  return {
    id: row.id,
    user_id: row.userId,
    input_kind: row.inputKind as ScanJob['input_kind'],
    source_url: row.sourceUrl,
    status: row.status as ScanJob['status'],
    provider: row.provider,
    attempt_count: row.attemptCount,
    error_code: (row.errorCode as ScanJob['error_code']) ?? null,
    error_message: row.errorMessage,
    metadata: row.metadata ?? {},
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    completed_at: row.completedAt?.toISOString() ?? null,
  };
}

export function toCoaReport(row: DbCoaReport): CoaReport {
  return {
    id: row.id,
    scan_job_id: row.scanJobId,
    user_id: row.userId,
    provider: row.provider,
    parser_version: row.parserVersion,
    source_url: row.sourceUrl,
    content_hash: row.contentHash,
    raw_metadata: row.rawMetadata ?? {},
    normalized_payload: row.normalizedPayload,
    confidence_payload: row.confidencePayload ?? {},
    extracted_at: row.extractedAt.toISOString(),
    created_at: row.createdAt.toISOString(),
  };
}

export function toCoaReportStashLink(row: DbCoaReportStashLink): CoaReportStashLink {
  return {
    coa_report_id: row.coaReportId,
    product_id: row.productId,
    user_id: row.userId,
    created_at: row.createdAt.toISOString(),
  };
}
