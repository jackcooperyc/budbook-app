import { NextResponse } from 'next/server';
import { apiError, statusForCode } from '@lib/coa/apiError';
import type { CoaFieldCorrections } from '@lib/coa/confirm';
import { confirmScanJob } from '@lib/coa/orchestrate';
import { CoaResolveError } from '@lib/coa/resolve';
import { internalApiGuard } from '@lib/auth/guard';

type RouteContext = { params: Promise<{ scanId: string }> };

function parseCorrections(raw: unknown): CoaFieldCorrections {
  if (!raw || typeof raw !== 'object') return {};
  const body = raw as Record<string, unknown>;

  const str = (key: string): string | undefined => {
    const v = body[key];
    return typeof v === 'string' ? v : undefined;
  };

  const num = (key: string): number | undefined => {
    const v = body[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  return {
    name: str('name'),
    brand: str('brand'),
    category: str('category'),
    strain: str('strain'),
    batchNumber: str('batchNumber'),
    lotNumber: str('lotNumber'),
    labName: str('labName'),
    reportNumber: str('reportNumber'),
    thc: num('thc'),
    cbd: num('cbd'),
  };
}

/**
 * POST /api/internal/scans/[scanId]/confirm
 * Apply user corrections, persist provenance, save to My Stash.
 */
export async function POST(request: Request, context: RouteContext) {
  const blocked = await internalApiGuard();
  if (blocked) {
    return apiError('UNAUTHORIZED', 'Sign in required', 401);
  }

  const { scanId } = await context.params;
  if (!scanId?.trim()) {
    return apiError('INVALID_INPUT', 'scanId is required.', 400);
  }

  let corrections: CoaFieldCorrections = {};
  try {
    const body = (await request.json()) as { corrections?: unknown };
    corrections = parseCorrections(body.corrections ?? body);
  } catch {
    /* empty body is fine — confirm with extracted values */
  }

  try {
    const result = await confirmScanJob(scanId.trim(), corrections);
    return NextResponse.json({
      scanId: result.job.id,
      status: result.job.status,
      coaReportId: result.coa_report_id,
      coa_report_id: result.coa_report_id,
      product: result.product,
      duplicate_in_stash: result.duplicate_in_stash,
      existing_product_id: result.existing_product_id,
      stash_link_created: result.stash_link_created,
      normalized: result.report.normalized_payload,
      parse: result.parse,
    });
  } catch (err) {
    if (err instanceof CoaResolveError) {
      return apiError(err.code, err.message, statusForCode(err.code));
    }
    const message = err instanceof Error ? err.message : 'Confirm failed.';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
