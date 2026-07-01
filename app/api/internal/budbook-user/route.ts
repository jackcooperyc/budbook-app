import { NextResponse } from 'next/server';
import { getDefaultUser } from '../../../../lib/budbook-user/defaultUser';
import { mockApiDisabledResponse } from '@/lib/mockApi';

export async function GET() {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;
  return NextResponse.json(getDefaultUser());
}
