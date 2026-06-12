import { describe, it, expect } from 'vitest';
import { resolveDiagramSource, type DiagramSourceEl } from '../diagram-source';

function el(dataset: Record<string, string | undefined>, textContent: string | null): DiagramSourceEl {
  return { dataset: dataset as DOMStringMap, textContent };
}

describe('resolveDiagramSource', () => {
  it('returns the stashed source', () => {
    expect(resolveDiagramSource(el({ mermaidSrc: 'sequenceDiagram\n A->>B: hi' }, null))).toBe(
      'sequenceDiagram\n A->>B: hi',
    );
  });

  it('prefers the stash over textContent once mermaid has overwritten the <pre>', () => {
    // Regression: after mermaid.run(), textContent is SVG label text, not source.
    const pre = el({ mermaidSrc: 'classDiagram\n class A' }, 'Stub resolver Local server Root');
    expect(resolveDiagramSource(pre)).toBe('classDiagram\n class A');
  });

  it('falls back to textContent before the diagram is processed (no stash yet)', () => {
    expect(resolveDiagramSource(el({}, '  flowchart TD\n A-->B  '))).toBe('flowchart TD\n A-->B');
  });

  it('returns an empty string when the element is absent', () => {
    expect(resolveDiagramSource(null)).toBe('');
  });

  it('returns an empty string when both stash and textContent are missing', () => {
    expect(resolveDiagramSource(el({}, null))).toBe('');
  });
});
