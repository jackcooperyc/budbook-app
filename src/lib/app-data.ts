import { getDefaultUser } from '../../lib/budbook-user/defaultUser';
import { readServerStash } from '@/lib/budbook-stash/fileStore';
import { readServerSessions } from '@/lib/budbook-sessions/fileStore';

/** Server-side aggregate of persisted MVP data (no mock seed merge). */
export async function getAppData() {
  const [stash, sessions] = await Promise.all([readServerStash(), readServerSessions()]);

  return {
    user: getDefaultUser(),
    products: stash.products,
    inventory: stash.inventory,
    sessions,
  };
}
