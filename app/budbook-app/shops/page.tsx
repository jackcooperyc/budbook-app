import Link from 'next/link';
import { listRetailStores } from '@lib/rda/gateway';
import { toDispensary } from '@lib/rda/resolvers';
import ShopsContent from '@/components/ShopsContent/ShopsContent';
import './shops.css';

export default async function ShopsPage() {
  const stores = await listRetailStores();
  const dispensaries = stores.map(toDispensary);

  return <ShopsContent dispensaries={dispensaries} stores={stores} />;
}
