import { findStashByLabReportId } from '@lib/caa/duplicates';
import { registerCoaParse } from '@lib/caa/registry';
import {
  applyUserCorrections,
  confirmedParseFromNormalized,
  parseSourceFromJobKind,
  type CoaFieldCorrections,
} from '@lib/coa/confirm';
import { scanInputFromJob } from '@lib/coa/input';
import { COA_PARSER_VERSION, normalizedToCaaParse } from '@lib/coa/normalize';
import { CoaResolveError, resolveCoaScan } from '@lib/coa/resolve';
import {
  COA_SCAN_MAX_ATTEMPTS,
  type CoaReport,
  type CoaScanErrorCode,
  type NormalizedCoaResult,
  type ScanJob,
  type ScanJobStatus,
} from '@lib/coa/types';
import { isHttpSourceUrl } from '@lib/coa/userMessages';
import type { CaaCoaParseResult, CaaParseResponse } from '@/types/caa';
import type { Product } from '@/types/pacs';
import { addCoaProductToServerStash } from '@lib/repositories/stash';
import {
  attachCoaReportToStashItem,
  createCoaReport,
  createScanJob,
  getCoaReportForScanJob,
  getScanJobForUser,
  updateCoaReportNormalized,
  updateScanJobStatus,
  type CreateScanJobInput,
} from '@lib/repositories/coaScan';

export type RunScanJobResult = {
  job: ScanJob;
  report: CoaReport | null;
  parse: CaaParseResponse['parse'] | null;
  normalized: NormalizedCoaResult | null;
  duplicate_in_stash: boolean;
  existing_product_id: string | null;
  coa_report_id: string | null;
};

export type ScanApiView = {
  scanId: string;
  status: ScanJobStatus;
  provider: string | null;
  attemptCount: number;
  sourceUrl: string;
  sourceType: ScanJob['input_kind'];
  normalized: NormalizedCoaResult | null;
  evidence: {
    contentHash: string | null;
    contentType?: string;
    finalUrl?: string;
    byteLength?: number;
    redirectCount?: number;
    isPdf?: boolean;
    htmlPersisted: boolean;
  } | null;
  error: { code: CoaScanErrorCode; message: string } | null;
  coaReportId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

function toResolveError(err: unknown): CoaResolveError {
  if (err instanceof CoaResolveError) return err;
  const message = err instanceof Error ? err.message : 'COA scan failed.';
  return new CoaResolveError('INTERNAL_ERROR', message);
}

function evidenceFromReport(report: CoaReport | null): ScanApiView['evidence'] {
  if (!report) return null;
  const meta = report.raw_metadata ?? {};
  return {
    contentHash: report.content_hash,
    contentType: typeof meta.content_type === 'string' ? meta.content_type : undefined,
    finalUrl: typeof meta.final_url === 'string' ? meta.final_url : undefined,
    byteLength: typeof meta.byte_length === 'number' ? meta.byte_length : undefined,
    redirectCount: typeof meta.redirect_count === 'number' ? meta.redirect_count : undefined,
    isPdf: typeof meta.is_pdf === 'boolean' ? meta.is_pdf : undefined,
    htmlPersisted: meta.html_persisted === true,
  };
}

export function toScanApiView(
  job: ScanJob,
  report: CoaReport | null,
): ScanApiView {
  return {
    scanId: job.id,
    status: job.status,
    provider: job.provider,
    attemptCount: job.attempt_count,
    sourceUrl: job.source_url,
    sourceType: job.input_kind,
    normalized: report?.normalized_payload ?? null,
    evidence: evidenceFromReport(report),
    error:
      job.error_code && job.error_message
        ? { code: job.error_code, message: job.error_message }
        : job.error_code
          ? { code: job.error_code, message: job.error_message ?? job.error_code }
          : null,
    coaReportId: report?.id ?? null,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    completedAt: job.completed_at,
  };
}

async function buildScanResult(
  job: ScanJob,
  report: CoaReport | null,
  parse: CaaCoaParseResult | null,
): Promise<RunScanJobResult> {
  let resolvedParse = parse;
  if (!resolvedParse && report) {
    const hasThc = report.normalized_payload.cannabinoids.some(
      (c) =>
        (c.name === 'THC' || c.name === 'Total THC') &&
        typeof c.value === 'number' &&
        Number.isFinite(c.value),
    );
    if (hasThc) {
      const parseSource =
        job.input_kind === 'text'
          ? 'text'
          : job.input_kind === 'qr_payload' || job.input_kind === 'qr_url'
            ? 'qr'
            : 'url';
      try {
        resolvedParse = normalizedToCaaParse(report.normalized_payload, parseSource);
      } catch {
        resolvedParse = null;
      }
    }
  }

  const duplicate = resolvedParse
    ? await findStashByLabReportId(resolvedParse.lab_report_id)
    : null;

  return {
    job,
    report,
    parse: resolvedParse,
    normalized: report?.normalized_payload ?? null,
    duplicate_in_stash: duplicate != null,
    existing_product_id: duplicate?.product_id ?? null,
    coa_report_id: report?.id ?? null,
  };
}

export async function runScanJob(
  jobId: string,
  options?: { force?: boolean },
): Promise<RunScanJobResult> {
  const existing = await getScanJobForUser(jobId);
  if (!existing) {
    throw new CoaResolveError('NOT_FOUND', 'Scan job not found.');
  }

  const priorReport = await getCoaReportForScanJob(jobId);
  if (
    !options?.force &&
    priorReport &&
    (existing.status === 'resolved' ||
      existing.status === 'partial' ||
      existing.status === 'needs_review')
  ) {
    return buildScanResult(existing, priorReport, null);
  }

  if (existing.attempt_count >= COA_SCAN_MAX_ATTEMPTS && options?.force) {
    throw new CoaResolveError(
      'RETRY_LIMIT_EXCEEDED',
      `Scan retry limit reached (max ${COA_SCAN_MAX_ATTEMPTS} attempts).`,
    );
  }

  const processing = await updateScanJobStatus(jobId, {
    status: 'processing',
    attemptCount: existing.attempt_count + 1,
    errorCode: null,
    errorMessage: null,
    completedAt: null,
  });
  if (!processing) {
    throw new CoaResolveError('NOT_FOUND', 'Scan job not found.');
  }

  const now = new Date().toISOString();

  try {
    const input = scanInputFromJob(processing);
    const resolved = await resolveCoaScan(input);

    if (resolved.parse) {
      await registerCoaParse(resolved.parse);
    }

    const report = await createCoaReport({
      scanJobId: jobId,
      provider: resolved.provider,
      parserVersion: COA_PARSER_VERSION,
      sourceUrl: resolved.normalized.source.sourceUrl,
      contentHash: resolved.contentHash,
      rawMetadata: resolved.rawMetadata,
      normalizedPayload: resolved.normalized,
      confidencePayload: {
        extraction: resolved.normalized.extraction,
      },
      extractedAt: resolved.normalized.source.resolvedAt,
    });

    const completed = await updateScanJobStatus(jobId, {
      status: resolved.jobStatus,
      provider: resolved.provider,
      errorCode: resolved.errorCode,
      errorMessage: resolved.errorMessage,
      completedAt: now,
    });

    if (!completed || !report) {
      throw new CoaResolveError('INTERNAL_ERROR', 'Failed to persist COA scan results.');
    }

    return buildScanResult(completed, report, resolved.parse);
  } catch (err) {
    const resolveErr = toResolveError(err);
    await updateScanJobStatus(jobId, {
      status: 'failed',
      errorCode: resolveErr.code,
      errorMessage: resolveErr.message,
      completedAt: now,
    });
    throw resolveErr;
  }
}

export async function createAndRunScanJob(input: CreateScanJobInput): Promise<RunScanJobResult> {
  const job = await createScanJob(input);
  try {
    return await runScanJob(job.id);
  } catch (err) {
    if (err instanceof CoaResolveError) {
      throw new CoaResolveError(err.code, err.message, job.id);
    }
    throw err;
  }
}

const RETRYABLE_STATUSES: ScanJobStatus[] = ['failed', 'needs_review'];

export async function retryScanJob(jobId: string): Promise<RunScanJobResult> {
  const existing = await getScanJobForUser(jobId);
  if (!existing) {
    throw new CoaResolveError('NOT_FOUND', 'Scan job not found.');
  }

  if (!RETRYABLE_STATUSES.includes(existing.status)) {
    throw new CoaResolveError(
      'RETRY_NOT_ALLOWED',
      `Only failed or needs_review scans can be retried (current: ${existing.status}).`,
    );
  }

  if (existing.attempt_count >= COA_SCAN_MAX_ATTEMPTS) {
    throw new CoaResolveError(
      'RETRY_LIMIT_EXCEEDED',
      `Scan retry limit reached (max ${COA_SCAN_MAX_ATTEMPTS} attempts).`,
    );
  }

  return runScanJob(jobId, { force: true });
}

export async function getScanJobView(jobId: string): Promise<ScanApiView | null> {
  const job = await getScanJobForUser(jobId);
  if (!job) return null;
  const report = await getCoaReportForScanJob(jobId);
  return toScanApiView(job, report);
}

/** Full POST /scans response: Phase 2 view + legacy CAA/ScannerPanel fields. */
export function toScanApiResponse(result: RunScanJobResult) {
  const view = toScanApiView(result.job, result.report);
  return {
    ...view,
    parse: result.parse,
    duplicate_in_stash: result.duplicate_in_stash,
    existing_product_id: result.existing_product_id,
    coa_report_id: result.coa_report_id,
    scan_job_id: result.job.id,
    job: result.job,
    report: result.report,
  };
}

const CONFIRMABLE_STATUSES: ScanJobStatus[] = [
  'resolved',
  'partial',
  'needs_review',
];

export type ConfirmScanJobResult = {
  job: ScanJob;
  report: CoaReport;
  parse: CaaCoaParseResult;
  product: Product;
  duplicate_in_stash: boolean;
  existing_product_id: string | null;
  coa_report_id: string;
  stash_link_created: boolean;
};

/**
 * Apply optional user corrections, persist provenance, and save to My Stash.
 *
 * Confirm intentionally marks the job `resolved` after the user reviews —
 * including when extraction was `partial` or `needs_review`. Field-level
 * sources stay honest (`user_confirmed` only where the user edited); overall
 * extraction notes record that the user verified before save.
 */
export async function confirmScanJob(
  jobId: string,
  corrections: CoaFieldCorrections = {},
): Promise<ConfirmScanJobResult> {
  const job = await getScanJobForUser(jobId);
  if (!job) {
    throw new CoaResolveError('NOT_FOUND', 'Scan job not found.');
  }

  if (!CONFIRMABLE_STATUSES.includes(job.status)) {
    throw new CoaResolveError(
      'CONFIRM_NOT_ALLOWED',
      `Only resolved, partial, or needs_review scans can be confirmed (current: ${job.status}).`,
    );
  }

  const report = await getCoaReportForScanJob(jobId);
  if (!report) {
    throw new CoaResolveError(
      'PARSE_INSUFFICIENT_DATA',
      'No COA report is available to confirm. Retry the scan or try another URL.',
    );
  }

  const correctedBase = applyUserCorrections(report.normalized_payload, corrections);
  const corrected: NormalizedCoaResult = {
    ...correctedBase,
    extraction: {
      ...correctedBase.extraction,
      status: 'resolved',
      confidence: 'high',
      notes: [
        ...correctedBase.extraction.notes.filter(
          (n) => n !== 'User confirmed or corrected fields before saving to stash.',
        ),
        'User reviewed and confirmed before saving to stash.',
      ],
    },
  };
  const strain =
    corrected.product.strain?.value?.trim() ||
    corrected.product.name?.value?.trim();
  if (!strain) {
    throw new CoaResolveError(
      'INVALID_INPUT',
      'Product name or strain is required before saving to stash.',
    );
  }

  const updatedReport = await updateCoaReportNormalized(report.id, {
    normalizedPayload: corrected,
    confidencePayload: {
      extraction: corrected.extraction,
      user_confirmed_at: new Date().toISOString(),
    },
    rawMetadata: {
      ...report.raw_metadata,
      user_confirmed: true,
      user_confirmed_at: new Date().toISOString(),
    },
  });

  if (!updatedReport) {
    throw new CoaResolveError('INTERNAL_ERROR', 'Failed to persist confirmed COA report.');
  }

  const parse = confirmedParseFromNormalized(
    updatedReport.normalized_payload,
    parseSourceFromJobKind(job.input_kind),
  );

  await registerCoaParse(parse);

  const duplicate = await findStashByLabReportId(parse.lab_report_id);
  const coaSourceUrl = isHttpSourceUrl(updatedReport.source_url)
    ? updatedReport.source_url
    : isHttpSourceUrl(updatedReport.normalized_payload.source.sourceUrl)
      ? updatedReport.normalized_payload.source.sourceUrl
      : undefined;
  const product = await addCoaProductToServerStash(parse, { coaSourceUrl });
  const link = await attachCoaReportToStashItem(updatedReport.id, product.id);

  if (!link) {
    throw new CoaResolveError(
      'INTERNAL_ERROR',
      'Saved to stash but failed to link COA report provenance.',
    );
  }

  const completed = await updateScanJobStatus(jobId, {
    status: 'resolved',
    errorCode: null,
    errorMessage: null,
    completedAt: job.completed_at ?? new Date().toISOString(),
    metadata: {
      ...job.metadata,
      user_confirmed: true,
      stash_product_id: product.id,
    },
  });

  if (!completed) {
    throw new CoaResolveError('INTERNAL_ERROR', 'Failed to update scan job after confirm.');
  }

  return {
    job: completed,
    report: updatedReport,
    parse,
    product,
    duplicate_in_stash: duplicate != null,
    existing_product_id: duplicate?.product_id ?? null,
    coa_report_id: updatedReport.id,
    stash_link_created: true,
  };
}
