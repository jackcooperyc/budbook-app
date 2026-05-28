import { getBudbookMockPayloads } from '@/lib/mockApi';
import ShopsContent from '@/components/ShopsContent/ShopsContent';
import './shops.css';

export default async function ShopsPage() {
  const data = await getBudbookMockPayloads();
  return <ShopsContent dispensaries={data.dispensaries} />;
}
