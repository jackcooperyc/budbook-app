import { NextResponse } from 'next/server';
import { getCatalogEntry } from '@lib/caa/registry';
import { findStashByLabReportId } from '@lib/caa/duplicates';
import { internalApiGuard } from '@lib/auth/guard';

type Params = { params: Promise<{ product_key: string }> };

export async function GET(_request: Request, { params }: Params) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const { product_key } = await params;
  const entry = await getCatalogEntry(decodeURIComponent(product_key));
  if (!entry) {
    return NextResponse.json({ message: 'Catalog entry not found' }, { status: 404 });
  }

  const inStash = entry.lab_report_id
    ? await findStashByLabReportId(entry.lab_report_id)
    : null;

  return NextResponse.json({ entry, in_stash: inStash });
}
