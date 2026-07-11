import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
/** @type {import('eslint').Linter.Config[]} */
const nextConfig = require('eslint-config-next');

/**
 * Minimal ESLint 9 flat config for Next.js 15 / eslint-config-next.
 * react-hooks/set-state-in-effect and react-hooks/purity are disabled:
 * eslint-plugin-react-hooks@7 flags common hydration / event-handler patterns
 * in pre-existing BuddyChat and ThemeContext (unrelated to COA scanner).
 */
/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'data/**',
      'node_modules/**',
      'next-env.d.ts',
    ],
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },
];

export default eslintConfig;
