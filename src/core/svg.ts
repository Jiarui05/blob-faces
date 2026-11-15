import type { StrokeFn } from './types.js';

/** 默认墨线颜色（藏青） */
export const DEFAULT_INK = '#1d2b8f';

/** 生成绑定了墨色的描边属性工具 */
export const strokeFor =
  (ink: string): StrokeFn =>
  (w = 4.5, color = ink, fill = 'none') =>
    `stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="${fill}"`;

/**
 * 把一段 SVG 放到 (x, y)。
 * 外层 <g> 负责定位，内层 <g> 留给 CSS 动画——CSS transform 会覆盖 transform 属性，所以必须分两层。
 */
export const at = (x: number, y: number, inner: string, cls = ''): string =>
  `<g transform="translate(${x},${y})"><g${cls ? ` class="${cls}"` : ''}>${inner}</g></g>`;

const XML_ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
export const escapeXml = (s: string): string => String(s).replace(/[&<>"']/g, (c) => XML_ESC[c]);
