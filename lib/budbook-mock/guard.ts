import { NextResponse } from 'next/server';

/**
 * Allow BudBook mock API routes only outside production OR when the operator has
 * explicitly opted in via `BUDBOOK_MOCK_ENABLED=1`. Production builds otherwise
 * never serve fake data.
 */
export function mockApiDisabledResponse(): NextResponse | null {
  const enabled =
    process.env.NODE_ENV !== 'production' || process.env.BUDBOOK_MOCK_ENABLED === '1';
  if (enabled) return null;
  return NextResponse.json(
    { message: 'BudBook mock API is disabled in this environment.' },
    { status: 404 },
  );
}
