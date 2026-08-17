import { NextResponse } from 'next/server';
import { getRetailMenuItem } from '@lib/rda/gateway';
import { getCaaEnrichment } from '@lib/caa/enrich';
import { toProduct } from '@lib/rda/resolvers';
import { addProductFromMenu } from '@/lib/stash-store/fileStore';
import { internalApiGuard } from '@lib/auth/guard';

type Params = { params: Promise<{ store_key: string; menu_item_key: string }> };

export async function POST(_request: Request, { params }: Params) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const { store_key, menu_item_key } = await params;
  const item = await getRetailMenuItem(store_key, menu_item_key);
  if (!item) {
    return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
  }

  const enrich = await getCaaEnrichment(item.product_key);
  const product = toProduct(item, enrich);
  const saved = await addProductFromMenu({
    product,
    quantity: parseWeightGrams(item.display_weight),
    notes: `From menu · ${item.source.provider}${enrich ? ' · CAA confirmed' : ' · terpenes pending'}`,
  });

  return NextResponse.json({
    product: saved,
    caa_status: enrich?.compliance_status ?? 'pending',
  });
}

function parseWeightGrams(display: string | null): number {
  if (!display) return 3.5;
  const match = display.match(/([\d.]+)\s*g/i);
  return match ? parseFloat(match[1]) : 3.5;
}
