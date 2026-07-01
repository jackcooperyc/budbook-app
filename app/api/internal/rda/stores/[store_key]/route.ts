import { NextResponse } from 'next/server';
import { getRetailStore } from '@lib/rda/gateway';
import { toDispensary } from '@lib/rda/resolvers';
import { mockApiDisabledResponse } from '@/lib/mockApi';

type Params = { params: Promise<{ store_key: string }> };

export async function GET(_request: Request, { params }: Params) {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;

  const { store_key } = await params;
  const store = await getRetailStore(store_key);
  if (!store) {
    return NextResponse.json({ message: 'Store not found' }, { status: 404 });
  }

  return NextResponse.json({ store, dispensary: toDispensary(store) });
}
