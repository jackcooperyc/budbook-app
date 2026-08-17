import type { PacsUser } from '@/types/pacs';

/**
 * Dev-mode single user. Replace with auth session when login ships.
 * Override via env: PACSMT_USER_NAME, PACSMT_USER_USERNAME, PACSMT_USER_EMAIL
 */
export function getDefaultUser(): PacsUser {
  return {
    id: 'user-local-dev',
    email: process.env.PACSMT_USER_EMAIL ?? 'dev@pacsmt.local',
    full_name: process.env.PACSMT_USER_NAME ?? 'Pacs.MT User',
    username: process.env.PACSMT_USER_USERNAME ?? 'pacsmt',
    role: 'user',
  };
}
