/** 供生产打包回归测试使用的最小库消费者，不依赖 DOM。 */
import { createSpec, renderFace, MOODS, PARTS, KINDS } from '../../src/core/index.js';

export const snapshot = {
  moods: Object.keys(MOODS),
  parts: KINDS.map((kind) => Object.keys(PARTS[kind]).length),
  svg: renderFace(createSpec({ mood: 'happy' })),
};
