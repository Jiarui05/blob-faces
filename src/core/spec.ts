import { PARTS, MOODS } from './registry.js';
import { pick } from './rng.js';
import type { EyeKey, FaceSpec, FaceSpecInput, MoodKey, PartKind, Rng } from './types.js';

/** 默认调色板：偏饱和，在深色和浅色背景上都好看 */
export const PALETTE: readonly string[] = [
  '#2e8b7a', '#d9783f', '#9b7fd1', '#d9a63a', '#2f8fc4', '#d97a6a', '#b07cd9', '#c96f3a', '#9bb04a', '#d987a6',
  '#4e6fc4', '#7fbf6a', '#c4c43a', '#3fb8b0', '#2e9e4e', '#d93a3a', '#e07a2e', '#6fb8d9', '#e05fd1', '#e0a830',
  '#2f9ec4', '#f0a050', '#f06a4a', '#8fc0f0', '#2f8fe0', '#e080c0', '#ff8c1a', '#ff2e8c', '#1fd89a', '#ff7a6a',
  '#ff4a1a', '#8ff01a', '#ff8090',
];

export interface CreateSpecOptions {
  /** 指定情绪；不传则随机 */
  mood?: MoodKey;
  /** 保留其中的 color / shape，用于"同一个角色换表情" */
  base?: Partial<Pick<FaceSpec, 'color' | 'shape'>>;
  /** 自定义随机源，传 mulberry32(seed) 可得到可复现的结果 */
  rng?: Rng;
}

/** 按情绪偏好随机生成一个 spec */
export function createSpec({ mood, base, rng = Math.random }: CreateSpecOptions = {}): FaceSpec {
  const moodKey = mood && MOODS[mood] ? mood : pick(Object.keys(MOODS), rng);
  const M = MOODS[moodKey];
  const e = pick(M.eyes, rng);
  const eyes: [EyeKey, EyeKey] = [e, e];
  if (M.wink && rng() < 0.22) eyes[rng() < 0.5 ? 0 : 1] = pick(['closed', 'squint', 'happy'], rng);
  const extras = [...new Set(M.extras.filter(() => rng() < 0.45))].slice(0, 2);
  if (rng() < 0.06 && PARTS.extras.glasses && !extras.includes('glasses')) extras.push('glasses');
  return {
    mood: moodKey,
    color: base?.color ?? pick(PALETTE, rng),
    shape: base?.shape ?? Math.floor(rng() * 1e9),
    eyes,
    brows: pick(M.brows, rng),
    mouth: pick(M.mouth, rng),
    extras,
  };
}

const firstKey = (obj: object) => Object.keys(obj)[0];
const valid = (kind: PartKind, key: string | undefined, fallback: string) =>
  key && PARTS[kind][key] ? key : PARTS[kind][fallback] ? fallback : firstKey(PARTS[kind]);

/**
 * 把任意输入整理成合法的 spec：缺的补默认值，未知的部件换成默认部件。
 * 渲染前都会过一遍，所以手写 spec 时可以只写关心的字段。
 */
export function normalizeSpec(input: FaceSpecInput = {}): FaceSpec {
  const eyesIn = Array.isArray(input.eyes) ? input.eyes : [input.eyes, input.eyes];
  return {
    mood: input.mood && MOODS[input.mood] ? input.mood : firstKey(MOODS),
    color: typeof input.color === 'string' ? input.color : PALETTE[0],
    shape: Number.isFinite(input.shape) ? Math.trunc(input.shape as number) : 1,
    eyes: [valid('eyes', eyesIn[0], 'dot'), valid('eyes', eyesIn[1] ?? eyesIn[0], 'dot')],
    brows: valid('brows', input.brows, 'none'),
    mouth: valid('mouth', input.mouth, 'smile'),
    extras: (input.extras ?? []).filter((k) => PARTS.extras[k]),
  };
}
