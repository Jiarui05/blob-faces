/**
 * 部件与情绪的注册表。
 *
 * 核心渲染器只认识这里登记过的东西，不直接 import 任何具体部件。
 * 想加一个新眼睛、新情绪？调用 definePart / defineMood 即可，不用改核心代码。
 */
import type { MoodDef, PartDef, PartKind } from './types.js';

export const KINDS: readonly PartKind[] = ['eyes', 'brows', 'mouth', 'extras'];

export const PARTS: Record<PartKind, Record<string, PartDef>> = { eyes: {}, brows: {}, mouth: {}, extras: {} };

export const MOODS: Record<string, Required<MoodDef>> = {};

/** 登记一个部件：definePart('eyes', 'dot', { blink: true, draw: ({ ink }) => '...' }) */
export function definePart(kind: PartKind, key: string, def: PartDef): void {
  if (!PARTS[kind]) throw new Error(`Unknown part kind "${kind}". Use one of: ${KINDS.join(', ')}`);
  if (typeof def?.draw !== 'function') throw new Error(`Part "${kind}.${key}" needs a draw() function`);
  PARTS[kind][key] = kind === 'extras' ? { layer: 'out', ...def } : def;
}

/** 批量登记 */
export function defineParts(kind: PartKind, map: Record<string, PartDef>): void {
  for (const [key, def] of Object.entries(map)) definePart(kind, key, def);
}

/** 登记一个情绪 */
export function defineMood(key: string, def: MoodDef): void {
  for (const kind of ['eyes', 'brows', 'mouth'] as const) {
    if (!def[kind]?.length) throw new Error(`Mood "${key}" needs at least one ${kind}`);
  }
  MOODS[key] = { wink: false, extras: [], ...def };
}

export function defineMoods(map: Record<string, MoodDef>): void {
  for (const [key, def] of Object.entries(map)) defineMood(key, def);
}
