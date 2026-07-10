import { resolveCurrentUser } from '@lib/auth/resolveUser';
import { readServerStash } from '@/lib/budbook-stash/fileStore';
import { readServerSessions } from '@/lib/budbook-sessions/fileStore';

/** Server-side aggregate of persisted MVP data. */
export async function getAppData() {
  const [stash, sessions, user] = await Promise.all([
    readServerStash(),
    readServerSessions(),
    resolveCurrentUser(),
  ]);

  return {
    user,
    products: stash.products,
    inventory: stash.inventory,
    sessions,
  };
}
