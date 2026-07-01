import type { InventoryItem, Product, Session } from '@/types/budbook';

export type BuddyContext = {
  products: Product[];
  inventory: InventoryItem[];
  sessions: Session[];
  userName: string;
};
