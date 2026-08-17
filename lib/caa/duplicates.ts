import { readServerStash } from '@/lib/stash-store/fileStore';

export async function findStashByLabReportId(labReportId: string): Promise<{
  product_id: string;
  strain_name: string;
} | null> {
  const stash = await readServerStash();
  const product = stash.products.find((p) => p.lab_report_id === labReportId);
  if (!product) return null;
  return { product_id: product.id, strain_name: product.strain_name };
}
