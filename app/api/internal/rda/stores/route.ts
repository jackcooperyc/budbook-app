import { NextResponse } from 'next/server';
import { listRetailStores } from '@lib/rda/gateway';
import { internalApiGuard } from '@lib/auth/guard';
import type { RetailStoreQuery } from '@/types/rda';

export async function GET(request: Request) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const query: RetailStoreQuery = {
    state: searchParams.get('state') ?? undefined,
    city: searchParams.get('city') ?? undefined,
    zip: searchParams.get('zip') ?? undefined,
  };

  const stores = await listRetailStores(query);
  return NextResponse.json(stores);
}
