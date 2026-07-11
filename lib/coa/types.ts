/**
 * COA scan domain types — Stashd Phase 1 foundation + Phase 2 resolver codes.
 * Extends CAA provenance patterns (see types/caa.ts, lib/caa/parse.ts).
 */

export type FieldSource = 'coa' | 'label_ocr' | 'user_confirmed' | 'manual';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type FieldValue<T> = {
  value: T;
  source: FieldSource;
  confidence: ConfidenceLevel;
};

export type ScanInput =
  | { kind: 'qr_url'; url: string }
  | { kind: 'manual_url'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'qr_payload'; payload: string };

export type ScanJobStatus =
  | 'queued'
  | 'processing'
  | 'resolved'
  | 'partial'
  | 'needs_review'
  | 'failed';

/** Predictable Phase 2 error codes (+ a few API/auth helpers). */
export type CoaScanErrorCode =
  | 'INVALID_URL'
  | 'INVALID_INPUT'
  | 'BLOCKED_URL'
  | 'UNSUPPORTED_CONTENT'
  | 'FETCH_TIMEOUT'
  | 'FETCH_FAILED'
  | 'PDF_NOT_SUPPORTED_YET'
  | 'PARSE_INSUFFICIENT_DATA'
  | 'INTERNAL_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'RETRY_NOT_ALLOWED'
  | 'RETRY_LIMIT_EXCEEDED'
  | 'CONFIRM_NOT_ALLOWED';

export type CannabinoidUnit = 'mg' | 'mg_g' | 'percent';
export type TerpeneUnit = 'percent' | 'mg_g';

export type NormalizedCannabinoid = {
  name: string;
  value?: number;
  unit?: CannabinoidUnit;
  source: FieldSource;
  confidence: ConfidenceLevel;
};

export type NormalizedTerpene = {
  name: string;
  value?: number;
  unit?: TerpeneUnit;
  source: FieldSource;
  confidence: ConfidenceLevel;
};

export type SafetyTestStatus = 'pass' | 'fail' | 'unknown';

export type NormalizedCoaResult = {
  source: {
    sourceUrl: string;
    provider: string;
    providerVersion: string;
    resolvedAt: string;
    contentHash?: string;
  };
  product: {
    name?: FieldValue<string>;
    brand?: FieldValue<string>;
    category?: FieldValue<string>;
    strain?: FieldValue<string>;
    batchNumber?: FieldValue<string>;
    lotNumber?: FieldValue<string>;
    packageDate?: FieldValue<string>;
  };
  lab: {
    name?: FieldValue<string>;
    reportNumber?: FieldValue<string>;
    reportDate?: FieldValue<string>;
  };
  cannabinoids: NormalizedCannabinoid[];
  terpenes: NormalizedTerpene[];
  safety: {
    overallStatus?: FieldValue<SafetyTestStatus>;
    tests?: Array<{ name: string; status: SafetyTestStatus }>;
  };
  warnings: string[];
  extraction: {
    status: 'resolved' | 'partial' | 'needs_review' | 'failed';
    confidence: ConfidenceLevel;
    notes: string[];
  };
};

export type ScanJob = {
  id: string;
  user_id: string;
  input_kind: ScanInput['kind'];
  source_url: string;
  status: ScanJobStatus;
  provider: string | null;
  attempt_count: number;
  error_code: CoaScanErrorCode | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type CoaReport = {
  id: string;
  scan_job_id: string;
  user_id: string;
  provider: string;
  parser_version: string;
  source_url: string;
  content_hash: string | null;
  raw_metadata: Record<string, unknown>;
  normalized_payload: NormalizedCoaResult;
  confidence_payload: Record<string, unknown>;
  extracted_at: string;
  created_at: string;
};

export type CoaReportStashLink = {
  coa_report_id: string;
  product_id: string;
  user_id: string;
  created_at: string;
};

/** Max resolve attempts (initial + retries). */
export const COA_SCAN_MAX_ATTEMPTS = 3;
