import { NextResponse } from 'next/server';
import { getBudbookMockPayloads } from '@/lib/budbook-mock/buildPayloads';
import { mockApiDisabledResponse } from '@/lib/budbook-mock/guard';

/** Serialized mock entity payloads for the BudBook SPA bootstrap shim (?mock=1). */
export async function GET() {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;
  return NextResponse.json(await getBudbookMockPayloads());
}
