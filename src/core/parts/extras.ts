import { defineParts } from '../registry.js';
import { at } from '../svg.js';
import type { Side } from '../types.js';

/*
 * 装饰。坐标以整张脸中心为原点（脸半径约 46）。
 * layer:
 *   under  画在五官下面，跟着视线移动（腮红）
 *   over   画在五官上面，跟着视线移动（眼镜、眼泪）
 *   out    画在最外层，不跟视线（汗滴、呆毛、青筋……）
 */
const both = (fn: (side: Side) => string) => ([-1, 1] as Side[]).map(fn).join('');

defineParts('extras', {
  blush: {
    layer: 'under',
    draw: () => both((s) => at(s * 27, 9, `<ellipse rx="7" ry="4" fill="#ff4f8b" opacity=".42"/>`)),
  },
  blushLines: {
    layer: 'under',
    draw: ({ S }) => both((s) => at(s * 27, 9, `<path d="M-4-3L-5.5 3M0-3L-1.5 3M4-3L2.5 3" ${S(2.6)}/>`)),
  },
  tears: {
    layer: 'over',
    draw: ({ ink }) => at(-16, 8, `<path d="M0 0Q-4 6 0 8Q4 6 0 0Z" fill="#7fd3ff" stroke="${ink}" stroke-width="2.5"/>`, 'bf-drip'),
  },
  glasses: {
    layer: 'over',
    draw: ({ S, ink }) =>
      both((s) => at(s * 16, -4, `<rect x="-12.5" y="-10" width="25" height="20" rx="9" fill-opacity=".28" ${S(3.5, ink, '#fff')}/>`)) +
      `<path d="M-3.5-4L3.5-4" ${S(3.5)}/>`,
  },
  sweat: {
    layer: 'out',
    draw: ({ ink }) => at(33, -24, `<path d="M0-6Q-6 3 0 6Q6 3 0-6Z" fill="#9fe0ff" stroke="${ink}" stroke-width="2.5"/>`, 'bf-drip'),
  },
  action: {
    layer: 'out',
    draw: ({ S }) => at(34, -44, `<path d="M0 6L3-2M7 9L13 4" ${S(3.5, '#fff')}/>`, 'bf-flicker'),
  },
  hair: {
    layer: 'out',
    draw: ({ S }) => [-11, -4, 3, 10].map((x) => at(x, -37, `<path d="M0 0L0-9" ${S(3.6, '#eee')}/>`, 'bf-hair')).join(''),
  },
  vein: {
    layer: 'out',
    draw: ({ S }) => at(29, -29, `<path d="M-5-2Q0-2 0-7M2-7Q2-2 7-2M7 2Q2 2 2 7M0 7Q0 2-5 2" ${S(3, '#ff3355')}/>`, 'bf-throb'),
  },
  zzz: {
    layer: 'out',
    draw: () =>
      at(28, -36, `<text font-family="system-ui,sans-serif" font-weight="900" font-size="13" fill="#fff">z</text>`, 'bf-zz') +
      at(34, -44, `<text font-family="system-ui,sans-serif" font-weight="900" font-size="9" fill="#fff" class="bf-zz" style="animation-delay:-1.2s">z</text>`),
  },
});
