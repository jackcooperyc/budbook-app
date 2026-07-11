import { NextResponse } from 'next/server';
import { apiError, statusForCode } from '@lib/coa/apiError';
import {
  createAndRunScanJob,
  getScanJobView,
  toScanApiResponse,
} from '@lib/coa/orchestrate';
import { CoaResolveError } from '@lib/coa/resolve';
import { scanInputFromRequestBody } from '@lib/coa/input';
import { internalApiGuard } from '@lib/auth/guard';

/**
 * POST /api/internal/scans
 * Phase 2: { sourceType: "qr_url" | "manual_url", sourceUrl: string }
 * Legacy (ScannerPanel): { url } | { text } | { qr_payload }
 */
export async function POST(request: Request) {
  const blocked = await internalApiGuard();
  if (blocked) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: 'Sign in required' },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError('INVALID_INPUT', 'Request body must be JSON.', 400);
  }

  const isPhase2Shape =
    typeof body.sourceType === 'string' && typeof body.sourceUrl === 'string';

  const scanInput = scanInputFromRequestBody({
    sourceType: body.sourceType as 'qr_url' | 'manual_url' | undefined,
    sourceUrl: typeof body.sourceUrl === 'string' ? body.sourceUrl : undefined,
    url: typeof body.url === 'string' ? body.url : undefined,
    text: typeof body.text === 'string' ? body.text : undefined,
    qr_payload: typeof body.qr_payload === 'string' ? body.qr_payload : undefined,
  });

  if (!scanInput) {
    return apiError(
      'INVALID_INPUT',
      'sourceType+sourceUrl (or legacy url/text/qr_payload) is required.',
      400,
    );
  }

  try {
    const result = await createAndRunScanJob({ input: scanInput });
    const payload = toScanApiResponse(result);

    // Prefer review path: return full Phase 2 payload whenever normalized exists
    // (URL, text paste, or QR), even if legacy CAA parse is missing.
    if (payload.normalized && payload.scanId) {
      const httpStatus =
        payload.status === 'needs_review' && payload.error
          ? statusForCode(payload.error.code)
          : 200;
      return NextResponse.json(
        {
          ...payload,
          ...(payload.error
            ? { code: payload.error.code, message: payload.error.message }
            : {}),
        },
        { status: httpStatus },
      );
    }

    // Legacy ScannerPanel expects a CAA parse payload when no normalized report.
    if (!isPhase2Shape && !payload.parse) {
      return NextResponse.json(
        {
          code: payload.error?.code ?? 'PARSE_INSUFFICIENT_DATA',
          message:
            payload.error?.message ??
            'Could not extract lab data from that input.',
          scanId: payload.scanId,
          scan_job_id: payload.scan_job_id,
          status: payload.status,
          normalized: payload.normalized,
          attemptCount: payload.attemptCount,
          error: payload.error,
        },
        { status: 422 },
      );
    }

    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof CoaResolveError) {
      const status = statusForCode(err.code);
      if (err.scanId) {
        const view = await getScanJobView(err.scanId);
        return NextResponse.json(
          {
            code: err.code,
            message: err.message,
            scanId: err.scanId,
            status: view?.status ?? 'failed',
            attemptCount: view?.attemptCount ?? 1,
            normalized: view?.normalized ?? null,
            provider: view?.provider ?? null,
            sourceUrl: view?.sourceUrl,
            error: { code: err.code, message: err.message },
          },
          { status },
        );
      }
      return apiError(err.code, err.message, status);
    }

    const message =
      err instanceof Error ? err.message : 'COA scan failed — check your input and try again.';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
