import type { InventoryItem, Product, Session } from '@/types/pacs';

export type BuddyContext = {
  products: Product[];
  inventory: InventoryItem[];
  sessions: Session[];
  userName: string;
};
