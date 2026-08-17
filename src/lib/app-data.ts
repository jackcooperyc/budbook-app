import { resolveCurrentUser } from '@lib/auth/resolveUser';
import { readServerStash } from '@/lib/stash-store/fileStore';
import { readServerSessions } from '@/lib/sessions-store/fileStore';

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
