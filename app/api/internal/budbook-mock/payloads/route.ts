import { NextResponse } from 'next/server';
import { getBudbookMockPayloads, mockApiDisabledResponse } from '@/lib/mockApi';

/** Serialized mock entity payloads for the BudBook SPA bootstrap shim (?mock=1). */
export async function GET() {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;
  return NextResponse.json(await getBudbookMockPayloads());
}
