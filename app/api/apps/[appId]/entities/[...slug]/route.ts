import { NextResponse } from 'next/server';
import { getBudbookMockPayloads } from '@/lib/budbook-mock/buildPayloads';
import { resolveMockEntityGet } from '@/lib/budbook-mock/resolveMockEntityGet';
import { mockApiDisabledResponse } from '@/lib/budbook-mock/guard';

/**
 * Local BudBook (Base44 build with appId undefined) calls relative URLs like
 * `/api/apps/null/entities/{Entity}`. Proxy mock payloads so the SPA works offline.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ appId: string; slug?: string[] }> },
) {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;

  const { appId } = await context.params;
  if (appId !== 'null') {
    return NextResponse.json(
      { message: 'Mock entities are only served for the local BudBook stub (app id null).' },
      { status: 404 },
    );
  }

  const payloads = await getBudbookMockPayloads();
  const resolved = resolveMockEntityGet(request.url, payloads);
  if (resolved === null) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(resolved);
}
