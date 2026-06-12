// src/components/DiagramViewerPanel.tsx
// Lazy fullscreen diagram viewer. Loaded on first tap by DiagramViewerHost.
// Re-renders the tapped diagram from its always-present <pre class="mermaid">
// SOURCE via mermaid.render (NOT a clone of the inline SVG — that would
// duplicate mermaid's `#mermaid-N`-scoped <style> and id into the live DOM).
// Pan/zoom is hand-rolled on Pointer Events (no third-party dependency) and
// writes the transform straight to the DOM for gesture-smooth updates. The
// dialog/focus-trap/ESC/overlay-close patterns mirror CommandPalettePanel.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { FunctionalComponent } from 'preact';
import type { Locale } from '../lib/content';
import { t } from '../lib/ui';
import {
  IDENTITY,
  centered,
  distance,
  fitScale,
  midpoint,
  pan,
  scaleAbout,
  toCss,
  zoomBy,
  type Point,
  type Transform,
} from '../lib/zoom';

interface Props {
  locale: Locale;
  source: string;
  label: string | null;
  onClose: () => void;
}

const FIT_PADDING = 24;
// Module-level counter guarantees a fresh, collision-free render id per open
// even if two opens land in the same millisecond.
let renderSeq = 0;

const DiagramViewerPanel: FunctionalComponent<Props> = ({ locale, source, label, onClose }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const transformRef = useRef<Transform>(IDENTITY);
  const naturalRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const pointers = useRef<Map<number, Point>>(new Map());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const mouseDownOnOverlay = useRef(false);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  function applyTransform() {
    const el = contentRef.current;
    if (el) el.style.transform = toCss(transformRef.current);
  }

  function stagePoint(clientX: number, clientY: number): Point {
    const rect = stageRef.current?.getBoundingClientRect();
    return rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: clientX, y: clientY };
  }

  function fitToStage() {
    const stage = stageRef.current;
    const { w, h } = naturalRef.current;
    if (!stage || w <= 0 || h <= 0) return;
    const rect = stage.getBoundingClientRect();
    const scale = fitScale(w, h, rect.width, rect.height, FIT_PADDING);
    transformRef.current = centered(w, h, rect.width, rect.height, scale);
    applyTransform();
  }

  // Render the diagram from source on mount / when the source changes.
  useEffect(() => {
    let alive = true;
    setStatus('loading');
    (async () => {
      try {
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({ startOnLoad: false });
        const { svg } = await mermaid.render(`dv-${++renderSeq}-${Date.now()}`, source);
        if (!alive) return;
        const content = contentRef.current;
        if (!content) return;
        content.innerHTML = svg; // first-party build content (same trust as MermaidRuntime)
        const svgEl = content.querySelector('svg');
        if (svgEl) {
          // Pin the SVG to its intrinsic size so we, not mermaid's max-width,
          // own scaling. Prefer the viewBox; fall back to the measured box.
          const vb = (svgEl.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
          let w = vb.length === 4 ? vb[2] : 0;
          let h = vb.length === 4 ? vb[3] : 0;
          svgEl.removeAttribute('style');
          if (w > 0 && h > 0) {
            svgEl.setAttribute('width', String(w));
            svgEl.setAttribute('height', String(h));
          } else {
            const box = svgEl.getBoundingClientRect();
            w = box.width;
            h = box.height;
          }
          svgEl.setAttribute('role', 'img');
          if (label) svgEl.setAttribute('aria-label', label);
          naturalRef.current = { w, h };
        }
        fitToStage();
        setStatus('ready');
      } catch (err) {
        if (alive) {
          console.error('[DiagramViewer] failed to render diagram', err);
          setStatus('error');
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [source, label]);

  // Move focus to the close button on open.
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  // ESC closes; +/-/0 drive zoom from the keyboard (parity with the buttons).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomFromButton(1.25);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomFromButton(0.8);
      } else if (e.key === '0') {
        e.preventDefault();
        fitToStage();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Pointer (pan + pinch) and wheel (desktop zoom) wired natively so wheel can
  // be non-passive and touch typing matches PointerEvent semantics exactly.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    function onPointerDown(e: PointerEvent) {
      stage!.setPointerCapture?.(e.pointerId);
      pointers.current.set(e.pointerId, stagePoint(e.clientX, e.clientY));
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinchStart.current = { dist: distance(a, b), scale: transformRef.current.scale };
      }
    }
    function onPointerMove(e: PointerEvent) {
      if (!pointers.current.has(e.pointerId)) return;
      const prev = pointers.current.get(e.pointerId)!;
      const cur = stagePoint(e.clientX, e.clientY);
      pointers.current.set(e.pointerId, cur);
      if (pointers.current.size >= 2 && pinchStart.current) {
        const [a, b] = [...pointers.current.values()];
        const focal = midpoint(a, b);
        const next = pinchStart.current.scale * (distance(a, b) / pinchStart.current.dist);
        transformRef.current = scaleAbout(transformRef.current, next, focal);
      } else {
        transformRef.current = pan(transformRef.current, cur.x - prev.x, cur.y - prev.y);
      }
      applyTransform();
    }
    function onPointerUp(e: PointerEvent) {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinchStart.current = null;
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      transformRef.current = zoomBy(transformRef.current, factor, stagePoint(e.clientX, e.clientY));
      applyTransform();
    }

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerUp);
      stage.removeEventListener('wheel', onWheel);
    };
  }, []);

  function zoomFromButton(factor: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    const focal: Point = rect ? { x: rect.width / 2, y: rect.height / 2 } : { x: 0, y: 0 };
    transformRef.current = zoomBy(transformRef.current, factor, focal);
    applyTransform();
  }

  // Tab focus-trap among the toolbar controls (verbatim from CommandPalettePanel).
  function handleTabTrap(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      class="dv-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={label ?? t(locale, 'viewer.label')}
      onMouseDown={(e) => {
        mouseDownOnOverlay.current = e.target === overlayRef.current;
      }}
      onClick={(e) => {
        // Close only if both mousedown and click landed on the backdrop — a
        // pan-drag released over the overlay must not dismiss the viewer.
        if (e.target === overlayRef.current && mouseDownOnOverlay.current) onClose();
        mouseDownOnOverlay.current = false;
      }}
    >
      <div class="dv-panel" ref={panelRef} onKeyDown={handleTabTrap}>
        <div class="dv-toolbar">
          <button
            ref={closeBtnRef}
            type="button"
            class="dv-btn"
            aria-label={t(locale, 'viewer.close')}
            onClick={onClose}
          >
            <span aria-hidden="true">✕</span>
          </button>
          <span class="dv-spacer"></span>
          <button
            type="button"
            class="dv-btn"
            aria-label={t(locale, 'viewer.zoom-out')}
            onClick={() => zoomFromButton(0.8)}
          >
            <span aria-hidden="true">−</span>
          </button>
          <button type="button" class="dv-btn" aria-label={t(locale, 'viewer.reset')} onClick={() => fitToStage()}>
            <span aria-hidden="true">⤢</span>
          </button>
          <button
            type="button"
            class="dv-btn"
            aria-label={t(locale, 'viewer.zoom-in')}
            onClick={() => zoomFromButton(1.25)}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
        <div class="dv-stage" ref={stageRef}>
          <div class="dv-content" ref={contentRef}></div>
          {status !== 'ready' && <p class="dv-hint">{status === 'error' ? '—' : '…'}</p>}
        </div>
      </div>
    </div>
  );
};

export default DiagramViewerPanel;
