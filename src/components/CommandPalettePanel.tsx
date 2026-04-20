// src/components/CommandPalettePanel.tsx
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import type { Locale } from '../lib/content';
import { t } from '../lib/ui';

interface PagefindSubResult {
  url: string;
  excerpt: string;
  meta: { title?: string } & Record<string, string>;
}
interface PagefindResult {
  id: string;
  data: () => Promise<PagefindSubResult>;
}
interface PagefindApi {
  search: (
    q: string,
    opts?: { filters?: Record<string, string | string[]> },
  ) => Promise<{ results: PagefindResult[] }>;
  options?: (o: Record<string, unknown>) => void;
}

type Kind = 'all' | 'paper' | 'post';

interface Props {
  locale: Locale;
  onClose: () => void;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Pagefind excerpts are HTML fragments containing only <mark>…</mark> tags.
// Parse by hand so we render pure JSX — no raw HTML sink, no XSS surface.
function Excerpt({ html }: { html: string }) {
  const parts: { text: string; mark: boolean }[] = [];
  const matches = Array.from(html.matchAll(/<mark>([\s\S]*?)<\/mark>/g));
  let last = 0;
  for (const m of matches) {
    const start = m.index ?? 0;
    if (start > last) parts.push({ text: decodeEntities(html.slice(last, start)), mark: false });
    parts.push({ text: decodeEntities(m[1]), mark: true });
    last = start + m[0].length;
  }
  if (last < html.length) parts.push({ text: decodeEntities(html.slice(last)), mark: false });
  return (
    <span class="cmdk-hit-excerpt">
      {parts.map((p, i) => (p.mark ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
    </span>
  );
}

const CommandPalettePanel: FunctionalComponent<Props> = ({ locale, onClose }) => {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<Kind>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PagefindSubResult[]>([]);
  const pagefindRef = useRef<PagefindApi | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // @ts-expect-error Pagefind bundle is emitted to /dist/pagefind at build time; resolves at runtime.
        const mod = (await import(/* @vite-ignore */ '/pagefind/pagefind.js')) as PagefindApi;
        if (!alive) return;
        mod.options?.({ excerptLength: 24 });
        pagefindRef.current = mod;
      } catch {
        // Pagefind index is produced at build time. In dev it loads only
        // after one prior `astro build`.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const pf = pagefindRef.current;
    if (!pf) return;
    setLoading(true);
    const handle = setTimeout(async () => {
      const filters: Record<string, string> = { lang: locale };
      if (kind !== 'all') filters.kind = kind;
      const { results: hits } = await pf.search(query, { filters });
      const top = await Promise.all(hits.slice(0, 8).map((r) => r.data()));
      setResults(top);
      setLoading(false);
    }, 120);
    return () => clearTimeout(handle);
  }, [query, kind, locale]);

  const kinds: { id: Kind; label: string }[] = useMemo(
    () => [
      { id: 'all', label: t(locale, 'search.filter.all') },
      { id: 'paper', label: t(locale, 'search.filter.papers') },
      { id: 'post', label: t(locale, 'search.filter.posts') },
    ],
    [locale],
  );

  return (
    <div
      class="cmdk-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={t(locale, 'search.label')}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div class="cmdk-panel">
        <input
          ref={inputRef}
          class="cmdk-input"
          type="search"
          value={query}
          placeholder={t(locale, 'search.placeholder')}
          aria-label={t(locale, 'search.label')}
          onInput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
        />
        <div class="cmdk-filters" role="tablist">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              role="tab"
              aria-selected={kind === k.id}
              class={`cmdk-chip ${kind === k.id ? 'is-active' : ''}`}
              onClick={() => setKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div class="cmdk-results" role="listbox">
          {loading ? (
            <p class="cmdk-hint">{t(locale, 'search.loading')}</p>
          ) : !query.trim() ? (
            <p class="cmdk-hint">{t(locale, 'search.empty')}</p>
          ) : results.length === 0 ? (
            <p class="cmdk-hint">{t(locale, 'search.no-results')}</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.url}>
                  <a href={r.url} class="cmdk-hit" onClick={onClose}>
                    <span class="cmdk-hit-title">{r.meta.title ?? r.url}</span>
                    <Excerpt html={r.excerpt} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalettePanel;
