import type { Rng } from './types.js';

/** 可复现的 32 位伪随机数生成器：同一个 seed 永远得到同一串数字 */
export function mulberry32(seed: number): Rng {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 从数组里随机取一个 */
export const pick = <T>(arr: readonly T[], rng: Rng = Math.random): T => arr[Math.floor(rng() * arr.length)];
