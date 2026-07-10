import { findStashByLabReportId } from '@lib/caa/duplicates';
import { registerCoaParse } from '@lib/caa/registry';
import { scanInputFromJob } from '@lib/coa/input';
import { COA_PARSER_VERSION, normalizedToCaaParse } from '@lib/coa/normalize';
import { CoaResolveError, resolveCoaScan } from '@lib/coa/resolve';
import type { CoaReport, ScanJob } from '@lib/coa/types';
import type { CaaParseResponse } from '@/types/caa';
import {
  createCoaReport,
  createScanJob,
  getCoaReportForScanJob,
  getScanJobForUser,
  updateScanJobStatus,
  type CreateScanJobInput,
} from '@lib/repositories/coaScan';

export type RunScanJobResult = {
  job: ScanJob;
  report: CoaReport;
  parse: CaaParseResponse['parse'];
  duplicate_in_stash: boolean;
  existing_product_id: string | null;
  coa_report_id: string;
};

function toResolveError(err: unknown): CoaResolveError {
  if (err instanceof CoaResolveError) return err;
  const message = err instanceof Error ? err.message : 'COA scan failed.';
  return new CoaResolveError('RESOLVE_FAILED', message);
}

async function buildScanResult(job: ScanJob, report: CoaReport): Promise<RunScanJobResult> {
  const parseSource =
    job.input_kind === 'text'
      ? 'text'
      : job.input_kind === 'qr_payload' || job.input_kind === 'qr_url'
        ? 'qr'
        : 'url';

  const parse = normalizedToCaaParse(report.normalized_payload, parseSource);
  const duplicate = await findStashByLabReportId(parse.lab_report_id);

  return {
    job,
    report,
    parse,
    duplicate_in_stash: duplicate != null,
    existing_product_id: duplicate?.product_id ?? null,
    coa_report_id: report.id,
  };
}

export async function runScanJob(jobId: string): Promise<RunScanJobResult> {
  const existing = await getScanJobForUser(jobId);
  if (!existing) {
    throw new CoaResolveError('NOT_FOUND', 'Scan job not found.');
  }

  const priorReport = await getCoaReportForScanJob(jobId);
  if (
    priorReport &&
    (existing.status === 'resolved' ||
      existing.status === 'partial' ||
      existing.status === 'needs_review')
  ) {
    return buildScanResult(existing, priorReport);
  }

  const processing = await updateScanJobStatus(jobId, {
    status: 'processing',
    attemptCount: existing.attempt_count + 1,
  });
  if (!processing) {
    throw new CoaResolveError('NOT_FOUND', 'Scan job not found.');
  }

  const now = new Date().toISOString();

  try {
    const input = scanInputFromJob(processing);
    const resolved = await resolveCoaScan(input);

    await registerCoaParse(resolved.parse);

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
      completedAt: now,
    });

    if (!completed || !report) {
      throw new CoaResolveError('RESOLVE_FAILED', 'Failed to persist COA scan results.');
    }

    return buildScanResult(completed, report);
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
  return runScanJob(job.id);
}
