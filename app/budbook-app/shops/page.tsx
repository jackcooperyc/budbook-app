import { listRetailStores } from '@lib/rda/gateway';
import { toDispensary } from '@lib/rda/resolvers';
import ShopsContent from '@/components/ShopsContent/ShopsContent';
import './shops.css';

/** Avoid build-time DB access when Neon schema is not yet migrated. */
export const dynamic = 'force-dynamic';

export default async function ShopsPage() {
  let dispensaries: ReturnType<typeof toDispensary>[] = [];
  let stores: Awaited<ReturnType<typeof listRetailStores>> = [];

  try {
    stores = await listRetailStores();
    dispensaries = stores.map(toDispensary);
  } catch (err) {
    console.error('[shops] Failed to load retail stores:', err);
  }

  return <ShopsContent dispensaries={dispensaries} stores={stores} />;
}
