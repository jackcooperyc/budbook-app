import { NextResponse } from 'next/server';
import { createAndRunScanJob } from '@lib/coa/orchestrate';
import { CoaResolveError } from '@lib/coa/resolve';
import { scanInputFromRequestBody } from '@lib/coa/input';
import { internalApiGuard } from '@lib/auth/guard';
import type { CaaParseResponse } from '@/types/caa';

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
      { message: 'url, text, or qr_payload is required' },
      { status: 400 },
    );
  }

  try {
    const result = await createAndRunScanJob({ input: scanInput });

    const response: CaaParseResponse & {
      job: typeof result.job;
      report: typeof result.report;
    } = {
      job: result.job,
      report: result.report,
      parse: result.parse,
      duplicate_in_stash: result.duplicate_in_stash,
      existing_product_id: result.existing_product_id,
      coa_report_id: result.coa_report_id,
      scan_job_id: result.job.id,
    };

    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof CoaResolveError) {
      const status =
        err.code === 'INVALID_INPUT' || err.code === 'INVALID_URL' ? 400 : 422;
      return NextResponse.json({ message: err.message, code: err.code }, { status });
    }

    const message =
      err instanceof Error ? err.message : 'COA scan failed — check your input and try again.';
    return NextResponse.json({ message }, { status: 422 });
  }
}
