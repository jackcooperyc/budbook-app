import { getDefaultUser } from '@lib/budbook-user/defaultUser';
import { readServerSessions } from '@lib/repositories/sessions';
import { readServerStash } from '@lib/repositories/stash';
import type { BuddyContext } from './types';

export async function buildBuddyContext(): Promise<BuddyContext> {
  const [stash, sessions] = await Promise.all([readServerStash(), readServerSessions()]);
  const user = getDefaultUser();

  return {
    products: stash.products,
    inventory: stash.inventory,
    sessions,
    userName: user.full_name.split(' ')[0] ?? user.full_name,
  };
}
