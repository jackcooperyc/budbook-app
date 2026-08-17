import { NextResponse } from 'next/server';
import {
  readServerStash,
  addProductToServerStash,
  addManualProductToServerStash,
  addCoaProductToServerStash,
  updateProductQuantity,
  deleteProductFromServerStash,
} from '@/lib/stash-store/fileStore';
import { registerCoaParse } from '@lib/caa/registry';
import { isHttpSourceUrl } from '@lib/coa/userMessages';
import {
  attachCoaReportToStashItem,
  getCoaReportForUser,
} from '@lib/repositories/coaScan';
import { internalApiGuard } from '@lib/auth/guard';
import type { CaaCoaParseResult } from '@/types/caa';

export async function GET() {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;
  return NextResponse.json(await readServerStash());
}

export async function POST(request: Request) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const body = (await request.json()) as {
    kind?: 'scan' | 'manual' | 'coa';
    strain?: string;
    thc?: number;
    cbd?: number;
    coaId?: string;
    terpenes?: string[];
    brand?: string;
    type?: 'indica' | 'sativa' | 'hybrid';
    quantity?: number;
    unit?: string;
    category?: string;
    coa?: CaaCoaParseResult;
    coa_report_id?: string;
  };

  if (body.kind === 'coa' && body.coa) {
    await registerCoaParse(body.coa);
    let coaSourceUrl: string | undefined;
    if (body.coa_report_id) {
      const report = await getCoaReportForUser(body.coa_report_id);
      if (report) {
        if (isHttpSourceUrl(report.source_url)) {
          coaSourceUrl = report.source_url;
        } else if (isHttpSourceUrl(report.normalized_payload.source.sourceUrl)) {
          coaSourceUrl = report.normalized_payload.source.sourceUrl;
        }
      }
    }
    const product = await addCoaProductToServerStash(body.coa, { coaSourceUrl });
    if (body.coa_report_id) {
      await attachCoaReportToStashItem(body.coa_report_id, product.id);
    }
    return NextResponse.json({ product, caa_status: 'confirmed' });
  }

  if (!body?.strain || body.thc == null || body.cbd == null) {
    return NextResponse.json({ message: 'Invalid stash payload' }, { status: 400 });
  }

  if (body.kind === 'manual' || !body.coaId) {
    const product = await addManualProductToServerStash({
      strain: body.strain,
      brand: body.brand,
      type: body.type,
      category: body.category,
      thc: body.thc,
      cbd: body.cbd,
      quantity: body.quantity ?? 3.5,
      unit: body.unit,
      terpenes: body.terpenes,
    });
    return NextResponse.json({ product });
  }

  const product = await addProductToServerStash({
    strain: body.strain,
    thc: body.thc,
    cbd: body.cbd,
    coaId: body.coaId,
    terpenes: body.terpenes ?? [],
    brand: body.brand,
    type: body.type,
  });
  return NextResponse.json({ product });
}

export async function PATCH(request: Request) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const body = (await request.json()) as {
    productId?: string;
    quantity?: number;
    unit?: string;
  };

  if (!body?.productId || body.quantity == null) {
    return NextResponse.json({ message: 'productId and quantity are required' }, { status: 400 });
  }

  const inventory = await updateProductQuantity(body.productId, body.quantity, body.unit);
  if (!inventory) {
    return NextResponse.json({ message: 'Product not found in server stash' }, { status: 404 });
  }

  return NextResponse.json({ inventory });
}

export async function DELETE(request: Request) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const body = (await request.json()) as { productId?: string };

  if (!body?.productId) {
    return NextResponse.json({ message: 'productId is required' }, { status: 400 });
  }

  const deleted = await deleteProductFromServerStash(body.productId);
  if (!deleted) {
    return NextResponse.json({ message: 'Product not found in server stash' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
