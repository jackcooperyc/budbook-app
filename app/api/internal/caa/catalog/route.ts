import { NextResponse } from 'next/server';
import { listCatalogEntries } from '@lib/caa/registry';
import { mockApiDisabledResponse } from '@/lib/mockApi';

export async function GET() {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;
  return NextResponse.json(await listCatalogEntries());
}
