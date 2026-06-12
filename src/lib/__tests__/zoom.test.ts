import { describe, it, expect } from 'vitest';
import {
  IDENTITY,
  MAX_SCALE,
  MIN_SCALE,
  centered,
  clampScale,
  clamp,
  distance,
  fitScale,
  midpoint,
  pan,
  scaleAbout,
  toCss,
  zoomBy,
} from '../zoom';

describe('zoom', () => {
  it('serializes the identity transform', () => {
    expect(toCss(IDENTITY)).toBe('translate(0px, 0px) scale(1)');
  });

  describe('clamp', () => {
    it('returns the lower bound when below range', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });
    it('returns the upper bound when above range', () => {
      expect(clamp(42, 0, 10)).toBe(10);
    });
    it('returns the value when within range', () => {
      expect(clamp(7, 0, 10)).toBe(7);
    });
  });

  describe('clampScale', () => {
    it('floors at MIN_SCALE', () => {
      expect(clampScale(0.001)).toBe(MIN_SCALE);
    });
    it('caps at MAX_SCALE', () => {
      expect(clampScale(1000)).toBe(MAX_SCALE);
    });
    it('passes a mid-range scale through', () => {
      expect(clampScale(2)).toBe(2);
    });
  });

  describe('distance', () => {
    it('measures the Euclidean span between two pointers', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });
  });

  describe('midpoint', () => {
    it('averages two pointers', () => {
      expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 4 })).toEqual({ x: 5, y: 2 });
    });
  });

  describe('fitScale', () => {
    it('returns 1 for non-positive content width', () => {
      expect(fitScale(0, 10, 100, 100)).toBe(1);
    });
    it('returns 1 for non-positive content height', () => {
      expect(fitScale(10, 0, 100, 100)).toBe(1);
    });
    it('returns 1 for non-positive viewport width', () => {
      expect(fitScale(10, 10, 0, 100)).toBe(1);
    });
    it('returns 1 for non-positive viewport height', () => {
      expect(fitScale(10, 10, 100, 0)).toBe(1);
    });
    it('downscales oversized content to the limiting axis', () => {
      expect(fitScale(200, 100, 100, 100)).toBe(0.5);
    });
    it('never upscales content smaller than the viewport', () => {
      expect(fitScale(10, 10, 100, 100)).toBe(1);
    });
    it('subtracts padding from the available area', () => {
      expect(fitScale(100, 100, 100, 100, 10)).toBe(0.8);
    });
  });

  describe('scaleAbout', () => {
    it('scales about a focal point, keeping it stationary', () => {
      const next = scaleAbout(IDENTITY, 2, { x: 10, y: 10 });
      expect(next).toEqual({ scale: 2, tx: -10, ty: -10 });
      // The content point under the focal point is unchanged: (focal - t)/scale.
      expect((10 - next.tx) / next.scale).toBe(10);
    });
    it('uses the clamped scale when computing the offset', () => {
      const next = scaleAbout(IDENTITY, 1000, { x: 10, y: 10 });
      expect(next.scale).toBe(MAX_SCALE);
      expect(next.tx).toBe(10 - 10 * MAX_SCALE);
    });
  });

  describe('zoomBy', () => {
    it('multiplies the current scale about a focal point', () => {
      const focal = { x: 4, y: 6 };
      expect(zoomBy(IDENTITY, 2, focal)).toEqual(scaleAbout(IDENTITY, 2, focal));
    });
  });

  describe('pan', () => {
    it('adds a screen-space delta to the translation', () => {
      expect(pan({ scale: 2, tx: 5, ty: 5 }, 3, -2)).toEqual({ scale: 2, tx: 8, ty: 3 });
    });
  });

  describe('centered', () => {
    it('centers a content box at the given scale', () => {
      expect(centered(100, 50, 200, 200, 1)).toEqual({ scale: 1, tx: 50, ty: 75 });
    });
  });

  describe('toCss', () => {
    it('serializes translate-then-scale', () => {
      expect(toCss({ scale: 1.5, tx: 12, ty: -8 })).toBe('translate(12px, -8px) scale(1.5)');
    });
  });
});
