import { NextResponse } from 'next/server';
import { parseCoaUrl } from '@lib/caa/parse';
import { findStashByLabReportId } from '@lib/caa/duplicates';
import { internalApiGuard } from '@lib/auth/guard';

/** @deprecated Use POST /api/internal/caa/parse */
export async function POST(request: Request) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const body = (await request.json()) as { url?: string };
  const url = body?.url?.trim();

  if (!url) {
    return NextResponse.json({ message: 'URL is required' }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ message: 'Invalid URL' }, { status: 400 });
  }

  const parse = await parseCoaUrl(url);
  const existing = await findStashByLabReportId(parse.lab_report_id);

  return NextResponse.json({
    parse,
    duplicate_in_stash: existing != null,
    existing_product_id: existing?.product_id ?? null,
    // Legacy flat shape for older clients
    strain: parse.strain_name,
    thc: parse.thc_percentage,
    cbd: parse.cbd_percentage,
    coaId: parse.lab_report_id,
    terpenes: parse.terpene_profile.map((t) => t.terpene_name),
    brand: parse.brand,
    type: parse.type,
    confidence: parse.confidence === 'high' ? 'high' : 'demo',
  });
}
