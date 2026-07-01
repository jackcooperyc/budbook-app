import StoreMenuContent from '@/components/StoreMenuContent/StoreMenuContent';

type Params = { params: Promise<{ storeKey: string }> };

export default async function StoreMenuPage({ params }: Params) {
  const { storeKey } = await params;
  return <StoreMenuContent storeKey={decodeURIComponent(storeKey)} />;
}
