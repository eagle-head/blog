// src/components/DiagramViewerHost.tsx
// Tiny always-mounted host (client:idle) that turns a tapped diagram figure
// into a fullscreen viewer. Mirrors CommandPaletteHost: renders nothing until
// first use and lazy-imports the heavy panel on demand. If the page has no
// [data-zoomable] figure it registers no listener and never loads the panel,
// so diagram-free pages ship zero viewer JS (only this ~1KB host).
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import type { Locale } from '../lib/content';
import { resolveDiagramSource } from '../lib/diagram-source';

interface Props {
  locale: Locale;
}

interface Payload {
  source: string;
  label: string | null;
}

type PanelComponent = FunctionalComponent<Payload & { locale: Locale; onClose: () => void }>;

const DiagramViewerHost: FunctionalComponent<Props> = ({ locale }) => {
  const [Panel, setPanel] = useState<PanelComponent | null>(null);
  const [payload, setPayload] = useState<Payload | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const importStarted = useRef(false);

  useEffect(() => {
    // Empty-guard (mirrors MermaidRuntime): no zoomable figures -> do nothing.
    if (!document.querySelector('[data-zoomable]')) return;
    const root = document.querySelector('main') ?? document.body;

    function onClick(e: Event) {
      const target = e.target as HTMLElement | null;
      const trigger = target?.closest<HTMLElement>('[data-zoom-open]');
      if (!trigger) return;
      const figure = trigger.closest<HTMLElement>('[data-zoomable]');
      if (!figure) return;
      // mermaid.run() overwrites pre.mermaid's content with the rendered SVG, so
      // the source is read from data-mermaid-src (stashed by MermaidRuntime
      // before render); see resolveDiagramSource.
      const source = resolveDiagramSource(figure.querySelector<HTMLElement>('pre.mermaid'));
      if (!source) return; // not a diagram figure — nothing to open
      e.preventDefault();
      triggerRef.current = trigger;
      // The trigger is a real <button>, so native Enter/Space already fire this
      // click — no separate keyboard handler (avoids a double-open).
      setPayload({ source, label: figure.querySelector('figcaption')?.textContent?.trim() || null });
      if (!importStarted.current) {
        importStarted.current = true;
        void import('./DiagramViewerPanel').then((m) => setPanel(() => m.default));
      }
    }

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  function close() {
    setPayload(null);
    triggerRef.current?.focus(); // restore focus to the figure's trigger
  }

  if (!payload || !Panel) return null;
  return <Panel locale={locale} source={payload.source} label={payload.label} onClose={close} />;
};

export default DiagramViewerHost;
