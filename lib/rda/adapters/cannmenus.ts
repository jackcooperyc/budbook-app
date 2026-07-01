import type { RetailAdapter } from '@/types/rda';
import { listRetailStores, getRetailMenu } from '../gateway';

/** CannMenus adapter — reads normalized data from the file-backed RDA cache. */
export const cannmenusAdapter: RetailAdapter = {
  id: 'cannmenus',
  capabilities: ['stores', 'menus', 'brands'],

  fetchStores(query) {
    return listRetailStores(query);
  },

  fetchMenu(storeKey) {
    return getRetailMenu(storeKey);
  },
};
