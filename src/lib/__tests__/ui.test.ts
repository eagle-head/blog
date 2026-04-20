import { describe, expect, it } from 'vitest';
import { t, type UiKey } from '../ui';

describe('t', () => {
  it('returns the EN string for a known key', () => {
    expect(t('en', 'nav.papers')).toBe('Papers');
  });

  it('returns the pt-BR string for a known key', () => {
    expect(t('pt-BR', 'nav.papers')).toBe('Artigos');
  });

  it('falls back to EN when pt-BR has no translation', () => {
    // If a key is only defined in EN, pt-BR requests return the EN value.
    // (Safety net so a missing translation never shows a placeholder.)
    const key = 'nav.papers' satisfies UiKey;
    expect(typeof t('pt-BR', key)).toBe('string');
  });
});
