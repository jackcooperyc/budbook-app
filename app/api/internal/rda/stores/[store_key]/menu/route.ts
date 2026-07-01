import { NextResponse } from 'next/server';
import { getRetailMenu, getRetailStore } from '@lib/rda/gateway';
import { getCaaEnrichment } from '@lib/caa/enrich';
import { toProduct } from '@lib/rda/resolvers';
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

  const items = await getRetailMenu(store_key);
  const menu = await Promise.all(
    items.map(async (item) => {
      const enrich = await getCaaEnrichment(item.product_key);
      return {
        item,
        product_preview: toProduct(item, enrich),
        caa_status: enrich?.compliance_status ?? 'pending',
      };
    }),
  );

  return NextResponse.json({ store, menu });
}
