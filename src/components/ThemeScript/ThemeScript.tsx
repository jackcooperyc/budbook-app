import { THEME_STORAGE_KEY } from '@/lib/theme';

/** Runs before paint to avoid theme flash (FOUC). Migrates legacy Pacs.MT key. */
export default function ThemeScript() {
  const script = `
(function () {
  var key = ${JSON.stringify(THEME_STORAGE_KEY)};
  var legacy = 'budbook-theme';
  var stored = localStorage.getItem(key);
  if (!stored) {
    var old = localStorage.getItem(legacy);
    if (old === 'light' || old === 'dark' || old === 'system') {
      localStorage.setItem(key, old);
      localStorage.removeItem(legacy);
      stored = old;
    }
  }
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
