import { resolveCurrentUser } from '@lib/auth/resolveUser';
import { readServerSessions } from '@lib/repositories/sessions';
import { readServerStash } from '@lib/repositories/stash';
import type { BuddyContext } from './types';

export async function buildBuddyContext(): Promise<BuddyContext> {
  const [stash, sessions, user] = await Promise.all([
    readServerStash(),
    readServerSessions(),
    resolveCurrentUser(),
  ]);

  return {
    products: stash.products,
    inventory: stash.inventory,
    sessions,
    userName: user.full_name.split(' ')[0] ?? user.full_name,
  };
}
