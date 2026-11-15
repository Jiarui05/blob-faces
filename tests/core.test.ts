import { describe, expect, it } from 'vitest';
import {
  createSpec, normalizeSpec, renderFace, renderParts, definePart, defineMood,
  mulberry32, PARTS, MOODS, KINDS,
} from '../src/core/index.js';
import type { FaceSpec } from '../src/core/index.js';

const BAD = /undefined|NaN|\[object Object\]/;

describe('renderFace', () => {
  const spec: FaceSpec = { mood: 'happy', color: '#ff8090', shape: 42, eyes: ['big', 'big'], brows: 'raised', mouth: 'grin', extras: ['blush'] };

  it('is deterministic for the same spec', () => {
    expect(renderFace(spec)).toBe(renderFace(spec));
  });

  it('outputs a standalone svg with size and title', () => {
    const svg = renderFace(spec, { size: 64, title: 'Hi <you>' });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('width="64" height="64"');
    expect(svg).toContain('<title>Hi &lt;you&gt;</title>');
  });

  it('adds animation layers only when animated', () => {
    expect(renderFace(spec)).not.toContain('bf-pop');
    const animated = renderFace(spec, { animated: true });
    expect(animated).toContain('bf-pop');
    expect(animated).toContain('bf-a-bounce');
  });

  it('respects a custom ink color', () => {
    expect(renderFace(spec, { ink: '#000000' })).toContain('stroke="#000000"');
  });
});

describe('every built-in part', () => {
  for (const kind of KINDS) {
    for (const key of Object.keys(PARTS[kind])) {
      it(`${kind}.${key} renders cleanly`, () => {
        const base = normalizeSpec({});
        const spec = kind === 'eyes' ? { ...base, eyes: [key, key] } : kind === 'extras' ? { ...base, extras: [key] } : { ...base, [kind]: key };
        const out = renderParts(spec);
        expect(out).not.toMatch(BAD);
      });
    }
  }
});

describe('createSpec', () => {
  it('is reproducible with a seeded rng', () => {
    expect(createSpec({ rng: mulberry32(7) })).toEqual(createSpec({ rng: mulberry32(7) }));
  });

  it('only uses registered parts for every mood', () => {
    for (const mood of Object.keys(MOODS)) {
      for (let i = 0; i < 30; i++) {
        const s = createSpec({ mood });
        expect(s.mood).toBe(mood);
        s.eyes.forEach((e) => expect(PARTS.eyes[e]).toBeDefined());
        expect(PARTS.brows[s.brows]).toBeDefined();
        expect(PARTS.mouth[s.mouth]).toBeDefined();
        s.extras.forEach((x) => expect(PARTS.extras[x]).toBeDefined());
      }
    }
  });

  it('keeps color and shape from base', () => {
    const s = createSpec({ base: { color: '#123456', shape: 99 } });
    expect(s.color).toBe('#123456');
    expect(s.shape).toBe(99);
  });
});

describe('normalizeSpec', () => {
  it('fills defaults and drops unknown parts', () => {
    const s = normalizeSpec({ eyes: 'nope', mouth: 'nope', extras: ['blush', 'nope'] });
    expect(s.eyes).toEqual(['dot', 'dot']);
    expect(s.mouth).toBe('smile');
    expect(s.extras).toEqual(['blush']);
  });

  it('accepts a single eye value for both eyes', () => {
    expect(normalizeSpec({ eyes: 'star' }).eyes).toEqual(['star', 'star']);
  });
});

describe('registry', () => {
  it('lets you add a custom part and mood', () => {
    definePart('mouth', 'test-o', { draw: ({ ink }) => `<circle r="3" fill="${ink}" data-test="yes"/>` });
    defineMood('test-mood', { anim: 'bounce', eyes: ['dot'], brows: ['none'], mouth: ['test-o'] });
    const svg = renderFace(createSpec({ mood: 'test-mood' }));
    expect(svg).toContain('data-test="yes"');
  });

  it('rejects invalid definitions', () => {
    // @ts-expect-error 故意传错类型
    expect(() => definePart('hats', 'top', { draw: () => '' })).toThrow(/Unknown part kind/);
    // @ts-expect-error 缺少 draw
    expect(() => definePart('eyes', 'broken', {})).toThrow(/draw/);
    expect(() => defineMood('empty', { anim: 'bounce', eyes: [], brows: ['none'], mouth: ['smile'] })).toThrow();
  });
});
