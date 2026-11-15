import { PARTS, MOODS } from './registry.js';
import { normalizeSpec } from './spec.js';
import { blobPath } from './shape.js';
import { DEFAULT_INK, strokeFor, at, escapeXml } from './svg.js';
import type { DrawContext, ExtraLayer, FaceSpecInput, MoodKey, RenderOptions, Side } from './types.js';

/** 五官位置（脸中心为原点） */
const LAYOUT = { eyeX: 16, eyeY: -4, browY: -17, mouthY: 17 } as const;

/**
 * 只渲染"脸本身"：以 (0, 0) 为中心，范围约 ±60。
 * 适合嵌进你自己的 <svg> 或 <g> 里。
 */
export function renderParts(spec: FaceSpecInput, { ink = DEFAULT_INK }: Pick<RenderOptions, 'ink'> = {}): string {
  const sp = normalizeSpec(spec);
  const S = strokeFor(ink);
  const ctx = (side: Side): DrawContext => ({ side, ink, S });
  const extras = (layer: ExtraLayer) =>
    sp.extras
      .filter((k) => PARTS.extras[k].layer === layer)
      .map((k) => PARTS.extras[k].draw(ctx(1)))
      .join('');

  const sides: Side[] = [-1, 1];
  const eyes = sides
    .map((side, i) => {
      const E = PARTS.eyes[sp.eyes[i]];
      return at(side * LAYOUT.eyeX, LAYOUT.eyeY, E.draw(ctx(side)), E.blink ? 'bf-eye' : '');
    })
    .join('');
  const brows = sides.map((side) => at(side * LAYOUT.eyeX, LAYOUT.browY, PARTS.brows[sp.brows].draw(ctx(side)))).join('');
  const mouth = at(0, LAYOUT.mouthY, PARTS.mouth[sp.mouth].draw(ctx(1)));

  return (
    `<path class="bf-body" d="${blobPath(sp.shape)}" fill="${sp.color}"/>` +
    `<g class="bf-look">${extras('under')}${eyes}${brows}${mouth}${extras('over')}</g>` +
    extras('out')
  );
}

/** 渲染一个完整的 <svg> 字符串 */
export function renderFace(
  spec: FaceSpecInput,
  { size, ink, animated = false, title, className = 'bf-face' }: RenderOptions = {},
): string {
  const sp = normalizeSpec(spec);
  const inner = renderParts(sp, { ink });
  const dims = size ? ` width="${size}" height="${size}"` : '';
  const label = title ? `<title>${escapeXml(title)}</title>` : '';
  const body = animated
    ? `<g class="bf-pop"><g class="bf-lean"><g class="bf-bob ${moodAnimClass(sp.mood)}"><g class="bf-squash">` +
      `<g class="bf-inner" transform="translate(60,60)">${inner}</g></g></g></g></g>`
    : `<g transform="translate(60,60)">${inner}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"${dims} class="${className}" role="img">${label}${body}</svg>`;
}

/** 某个情绪对应的身体动效 class，例如 'bf-a-bounce' */
export const moodAnimClass = (mood: MoodKey): string => `bf-a-${MOODS[mood]?.anim ?? 'bounce'}`;
