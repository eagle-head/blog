// src/lib/diagram-source.ts
// Resolve a diagram figure's mermaid source for the fullscreen viewer.
//
// mermaid.run() reads the <pre class="mermaid"> source and then OVERWRITES the
// element's content with the rendered SVG (mermaid.core.mjs: element.innerHTML
// = svg). So once a diagram is processed, pre.textContent is SVG label text,
// not the source. MermaidRuntime therefore stashes the decoded source into
// data-mermaid-src BEFORE running mermaid; we prefer that here and fall back to
// textContent only for the brief pre-render window (when the figure has not yet
// been processed and textContent still holds the source).

export interface DiagramSourceEl {
  readonly dataset: DOMStringMap;
  readonly textContent: string | null;
}

export function resolveDiagramSource(pre: DiagramSourceEl | null | undefined): string {
  return (pre?.dataset.mermaidSrc ?? pre?.textContent ?? '').trim();
}
