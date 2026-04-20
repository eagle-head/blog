// src/components/CommandPaletteHost.tsx
import { useEffect, useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import type { Locale } from '../lib/content';

interface Props {
  locale: Locale;
}

type PanelComponent = FunctionalComponent<{ locale: Locale; onClose: () => void }>;

const CommandPaletteHost: FunctionalComponent<Props> = ({ locale }) => {
  const [open, setOpen] = useState(false);
  const [Panel, setPanel] = useState<PanelComponent | null>(null);

  useEffect(() => {
    function openPalette() {
      setOpen(true);
      if (!Panel) {
        void import('./CommandPalettePanel').then((m) => setPanel(() => m.default));
      }
    }
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }
      if (e.key === '/' && !mod) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        if (target?.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        openPalette();
      }
    }
    function onTrigger() {
      openPalette();
    }
    const trigger = document.getElementById('cmdk-trigger');
    window.addEventListener('keydown', onKey);
    trigger?.addEventListener('click', onTrigger);
    return () => {
      window.removeEventListener('keydown', onKey);
      trigger?.removeEventListener('click', onTrigger);
    };
  }, [Panel]);

  if (!open || !Panel) return null;
  return <Panel locale={locale} onClose={() => setOpen(false)} />;
};

export default CommandPaletteHost;
