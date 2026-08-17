export const THEME_STORAGE_KEY = 'pacsmt-theme';
const LEGACY_THEME_STORAGE_KEY = 'budbook-theme';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: '#0f1a0e',
  light: '#f4f7f2',
};

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Read theme preference, migrating the legacy Pacs.MT key once. */
export function readThemePreference(): ThemePreference | null {
  if (typeof window === 'undefined') return null;
  const current = localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemePreference(current)) return current;
  const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (isThemePreference(legacy)) {
    localStorage.setItem(THEME_STORAGE_KEY, legacy);
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    return legacy;
  }
  return null;
}
