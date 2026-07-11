import { NextResponse } from 'next/server';
import { apiError, statusForCode } from '@lib/coa/apiError';
import { retryScanJob, toScanApiResponse } from '@lib/coa/orchestrate';
import { CoaResolveError } from '@lib/coa/resolve';
import { internalApiGuard } from '@lib/auth/guard';

type RouteContext = { params: Promise<{ scanId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const blocked = await internalApiGuard();
  if (blocked) {
    return apiError('UNAUTHORIZED', 'Sign in required', 401);
  }

  const { scanId } = await context.params;
  if (!scanId?.trim()) {
    return apiError('INVALID_INPUT', 'scanId is required.', 400);
  }

  try {
    const result = await retryScanJob(scanId.trim());
    return NextResponse.json(toScanApiResponse(result));
  } catch (err) {
    if (err instanceof CoaResolveError) {
      return apiError(err.code, err.message, statusForCode(err.code));
    }

    const message = err instanceof Error ? err.message : 'Scan retry failed.';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
