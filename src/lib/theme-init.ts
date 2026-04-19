// Runs as an inline <script> in <head>. Must be synchronous and small.
// Exported as a string to be embedded via `set:html` in BaseLayout later.

export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.dataset.theme = stored;
      return;
    }
    var mql = window.matchMedia('(prefers-color-scheme: dark)');
    document.documentElement.dataset.theme = mql.matches ? 'dark' : 'light';
  } catch (_e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`.trim();
