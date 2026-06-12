// src/lib/zoom.ts
// Pure pan/zoom geometry for the diagram viewer. Kept dependency-free and
// framework-agnostic so the math is unit-testable in isolation — the Preact
// panel only wires Pointer/Wheel events to these functions and writes the
// resulting transform to the DOM.

export interface Point {
  x: number;
  y: number;
}

/** A 2-D transform: uniform `scale` then `translate(tx, ty)`, origin at 0,0. */
export interface Transform {
  scale: number;
  tx: number;
  ty: number;
}

export const MIN_SCALE = 0.2;
export const MAX_SCALE = 8;
export const IDENTITY: Transform = { scale: 1, tx: 0, ty: 0 };

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function clampScale(scale: number): number {
  return clamp(scale, MIN_SCALE, MAX_SCALE);
}

/** Euclidean distance between two pointers (pinch span). */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Midpoint between two pointers (pinch focal point). */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Largest scale that fits a `contentW x contentH` box inside a `viewW x viewH`
 * viewport with `pad` px of breathing room per side, never upscaling past 1x.
 * Returns 1 for any non-positive (degenerate / unmeasured) dimension.
 */
export function fitScale(contentW: number, contentH: number, viewW: number, viewH: number, pad = 0): number {
  if (contentW <= 0 || contentH <= 0 || viewW <= 0 || viewH <= 0) return 1;
  const availW = Math.max(viewW - pad * 2, 1);
  const availH = Math.max(viewH - pad * 2, 1);
  return clampScale(Math.min(availW / contentW, availH / contentH, 1));
}

/**
 * Set an absolute scale while keeping the content point under `focal` (in stage
 * coordinates) stationary. The new scale is clamped, so the applied factor uses
 * the clamped value — zooming into a wall does not drift the image.
 */
export function scaleAbout(t: Transform, nextScaleRaw: number, focal: Point): Transform {
  const next = clampScale(nextScaleRaw);
  const applied = next / t.scale;
  return {
    scale: next,
    tx: focal.x - (focal.x - t.tx) * applied,
    ty: focal.y - (focal.y - t.ty) * applied,
  };
}

/** Multiply the current scale by `factor` about a focal point. */
export function zoomBy(t: Transform, factor: number, focal: Point): Transform {
  return scaleAbout(t, t.scale * factor, focal);
}

/** Translate by a screen-space delta. */
export function pan(t: Transform, dx: number, dy: number): Transform {
  return { scale: t.scale, tx: t.tx + dx, ty: t.ty + dy };
}

/**
 * Center a `contentW x contentH` box at `scale` inside a `viewW x viewH`
 * viewport, returning the full transform.
 */
export function centered(contentW: number, contentH: number, viewW: number, viewH: number, scale: number): Transform {
  return {
    scale,
    tx: (viewW - contentW * scale) / 2,
    ty: (viewH - contentH * scale) / 2,
  };
}

/** CSS transform string: translate first, then scale (matches origin 0,0). */
export function toCss(t: Transform): string {
  return `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`;
}
