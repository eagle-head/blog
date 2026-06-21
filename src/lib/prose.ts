// src/lib/prose.ts
// Minimal inline-link support for hand-authored prose stored as plain-text JSON
// (e.g. the libraries' `summary`). Recognizes Markdown-style links
// `[label](href)` and returns ordered segments so callers render real <a>
// elements through JSX — never raw-HTML injection. Text outside a link stays
// literal. Only http(s), root-relative, hash, and mailto hrefs are linkified;
// any other scheme is left as literal text, so a stray `[x](javascript:…)` can
// never become an anchor. Pure and dependency-free, mirroring lib/open-source.ts
// so it is unit-testable in isolation.

/** One piece of parsed prose: either literal text or a resolved link. */
export type ProseSegment = { kind: 'text'; value: string } | { kind: 'link'; href: string; label: string };

// A link label has no `]` or newline; an href has no parentheses or whitespace
// (enough for the URLs used here and keeps the closing `)` unambiguous).
const LINK = /\[([^\]\n]+)\]\(([^()\s]+)\)/g;
const SAFE_HREF = /^(?:https?:\/\/|\/|#|mailto:)/;

/**
 * Split `text` into ordered text/link segments. A run with no recognized link
 * yields a single text segment; an unsafe or unrecognized href is emitted as
 * literal text rather than a link.
 */
export function parseInlineLinks(text: string): ProseSegment[] {
  const segments: ProseSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(LINK)) {
    const [raw, label, href] = match;
    const start = match.index ?? 0;
    if (!SAFE_HREF.test(href)) continue; // leave unsafe hrefs embedded as literal text
    if (start > cursor) segments.push({ kind: 'text', value: text.slice(cursor, start) });
    segments.push({ kind: 'link', href, label });
    cursor = start + raw.length;
  }

  if (cursor < text.length) segments.push({ kind: 'text', value: text.slice(cursor) });
  return segments;
}
