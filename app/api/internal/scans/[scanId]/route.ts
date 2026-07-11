import { NextResponse } from 'next/server';
import { apiError } from '@lib/coa/apiError';
import { getScanJobView } from '@lib/coa/orchestrate';
import { internalApiGuard } from '@lib/auth/guard';

type RouteContext = { params: Promise<{ scanId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const blocked = await internalApiGuard();
  if (blocked) {
    return apiError('UNAUTHORIZED', 'Sign in required', 401);
  }

  const { scanId } = await context.params;
  if (!scanId?.trim()) {
    return apiError('INVALID_INPUT', 'scanId is required.', 400);
  }

  const view = await getScanJobView(scanId.trim());
  if (!view) {
    return apiError('NOT_FOUND', 'Scan job not found.', 404);
  }

  return NextResponse.json(view);
}
