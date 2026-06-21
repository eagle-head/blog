import { describe, it, expect } from 'vitest';
import { parseInlineLinks, type ProseSegment } from '../prose';

describe('parseInlineLinks', () => {
  it('returns a single text segment when there are no links', () => {
    expect(parseInlineLinks('plain prose with no links')).toEqual<ProseSegment[]>([
      { kind: 'text', value: 'plain prose with no links' },
    ]);
  });

  it('splits text around a single mid-sentence link', () => {
    expect(parseInlineLinks('listed in [awesome](https://example.com/x), a catalog')).toEqual<ProseSegment[]>([
      { kind: 'text', value: 'listed in ' },
      { kind: 'link', href: 'https://example.com/x', label: 'awesome' },
      { kind: 'text', value: ', a catalog' },
    ]);
  });

  it('handles a link at the very start and at the very end', () => {
    expect(parseInlineLinks('[home](/) is here')).toEqual<ProseSegment[]>([
      { kind: 'link', href: '/', label: 'home' },
      { kind: 'text', value: ' is here' },
    ]);
    expect(parseInlineLinks('see [docs](https://d.example)')).toEqual<ProseSegment[]>([
      { kind: 'text', value: 'see ' },
      { kind: 'link', href: 'https://d.example', label: 'docs' },
    ]);
  });

  it('parses multiple links in one string', () => {
    const out = parseInlineLinks('[a](https://a.example) and [b](https://b.example)');
    expect(out).toEqual<ProseSegment[]>([
      { kind: 'link', href: 'https://a.example', label: 'a' },
      { kind: 'text', value: ' and ' },
      { kind: 'link', href: 'https://b.example', label: 'b' },
    ]);
  });

  it('preserves a URL fragment in the href', () => {
    const out = parseInlineLinks('in [list](https://github.com/org/repo#section-anchor) now');
    expect(out).toContainEqual<ProseSegment>({
      kind: 'link',
      href: 'https://github.com/org/repo#section-anchor',
      label: 'list',
    });
  });

  it('linkifies http, root-relative, hash, and mailto hrefs', () => {
    for (const href of ['http://x.example', 'https://x.example', '/path', '#anchor', 'mailto:a@b.example']) {
      const out = parseInlineLinks(`x [l](${href}) y`);
      expect(out.some((s) => s.kind === 'link' && s.href === href)).toBe(true);
    }
  });

  it('leaves an unsafe scheme as literal text instead of a link', () => {
    const malicious = '[click](javascript:alert(1))';
    const out = parseInlineLinks(malicious);
    expect(out.every((s) => s.kind === 'text')).toBe(true);
    expect(out.map((s) => (s.kind === 'text' ? s.value : '')).join('')).toBe(malicious);
  });

  it('emits nothing for an empty string', () => {
    expect(parseInlineLinks('')).toEqual<ProseSegment[]>([]);
  });

  it('round-trips the rendered text of a real two-link paragraph', () => {
    const input =
      'It is now listed in [erlang-punch/awesome-erlang](https://github.com/erlang-punch/awesome-erlang#x).';
    const rendered = parseInlineLinks(input)
      .map((s) => (s.kind === 'link' ? s.label : s.value))
      .join('');
    expect(rendered).toBe('It is now listed in erlang-punch/awesome-erlang.');
  });
});
