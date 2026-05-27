import { NextResponse } from 'next/server';
import { mockApiDisabledResponse } from '@/lib/budbook-mock/guard';

/**
 * BudBook / Base44 bootstrap calls:
 * GET /api/apps/public/prod/public-settings/by-id/{appId}
 * when hosted inside this Next app there is no upstream Base44 proxy — return a minimal payload
 * so the SPA can render (real deployments override via their gateway).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;

  const { slug } = await context.params;
  const path = (slug ?? []).join('/');
  if (path.includes('public-settings')) {
    return NextResponse.json({
      id: 'budbook-local-public-settings',
      name: 'BudBook',
      display_name: 'BudBook',
      login_providers: ['google'],
      theme: {},
      requires_registration: false,
    });
  }
  return NextResponse.json({ message: 'Not found' }, { status: 404 });
}
