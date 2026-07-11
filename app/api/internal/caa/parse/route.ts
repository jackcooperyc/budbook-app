import { NextResponse } from 'next/server';
import { createAndRunScanJob } from '@lib/coa/orchestrate';
import { CoaResolveError } from '@lib/coa/resolve';
import { scanInputFromRequestBody } from '@lib/coa/input';
import { internalApiGuard } from '@lib/auth/guard';
import type { CaaParseResponse } from '@/types/caa';

/** @deprecated Prefer POST /api/internal/scans — kept for backward compatibility. */
export async function POST(request: Request) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const body = (await request.json()) as {
    url?: string;
    text?: string;
    qr_payload?: string;
  };

  const scanInput = scanInputFromRequestBody(body);
  if (!scanInput) {
    return NextResponse.json(
      { code: 'INVALID_INPUT', message: 'url, text, or qr_payload is required' },
      { status: 400 },
    );
  }

  try {
    const result = await createAndRunScanJob({ input: scanInput });

    if (!result.parse) {
      return NextResponse.json(
        {
          code: result.job.error_code ?? 'PARSE_INSUFFICIENT_DATA',
          message:
            result.job.error_message ??
            'Could not extract lab data from that input.',
          scan_job_id: result.job.id,
          coa_report_id: result.coa_report_id,
        },
        { status: 422 },
      );
    }

    const response: CaaParseResponse = {
      parse: result.parse,
      duplicate_in_stash: result.duplicate_in_stash,
      existing_product_id: result.existing_product_id,
      coa_report_id: result.coa_report_id,
      scan_job_id: result.job.id,
    };

    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof CoaResolveError) {
      return NextResponse.json(
        { code: err.code, message: err.message },
        { status: 422 },
      );
    }
    const message =
      err instanceof Error
        ? err.message
        : 'CAA parse failed — check your input and try again.';
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message },
      { status: 422 },
    );
  }
}
