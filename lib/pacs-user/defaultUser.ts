import type { BudbookUser } from '@/types/budbook';

/**
 * Dev-mode single user. Replace with auth session when login ships.
 * Override via env: BUDBOOK_USER_NAME, BUDBOOK_USER_USERNAME, BUDBOOK_USER_EMAIL
 */
export function getDefaultUser(): BudbookUser {
  return {
    id: 'user-local-dev',
    email: process.env.BUDBOOK_USER_EMAIL ?? 'dev@budbook.local',
    full_name: process.env.BUDBOOK_USER_NAME ?? 'BudBook User',
    username: process.env.BUDBOOK_USER_USERNAME ?? 'budbookuser',
    role: 'user',
  };
}
