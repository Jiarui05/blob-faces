/**
 * blob-faces — 用代码组装可爱的软糖角色。
 *
 * 纯字符串输出，不依赖 DOM，浏览器、Node、SSR 都能用。
 * 先加载内置部件和情绪（它们会把自己登记到注册表），再导出 API。
 */
import './parts/eyes.js';
import './parts/brows.js';
import './parts/mouths.js';
import './parts/extras.js';
import './moods.js';

export { renderFace, renderParts, moodAnimClass } from './render.js';
export { createSpec, normalizeSpec, PALETTE } from './spec.js';
export type { CreateSpecOptions } from './spec.js';
export { PARTS, MOODS, KINDS, definePart, defineParts, defineMood, defineMoods } from './registry.js';
export { blobPath } from './shape.js';
export { mulberry32, pick } from './rng.js';
export { DEFAULT_INK } from './svg.js';
export type * from './types.js';
