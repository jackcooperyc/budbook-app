import { THEME_STORAGE_KEY } from '@/lib/theme';

/** Runs before paint to avoid theme flash (FOUC). */
export default function ThemeScript() {
  const script = `
(function () {
  var key = ${JSON.stringify(THEME_STORAGE_KEY)};
  var stored = localStorage.getItem(key);
  var preference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  var resolved = preference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : preference;
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
  document.documentElement.setAttribute('data-theme-preference', preference);
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
