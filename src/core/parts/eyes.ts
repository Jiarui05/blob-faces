import { defineParts } from '../registry.js';

const SPIRAL = (() => {
  let d = '';
  for (let t = 0; t <= 10.5; t += 0.35) {
    const r = 0.3 + t * 0.82;
    d += (t ? 'L' : 'M') + (Math.cos(t) * r).toFixed(1) + ' ' + (Math.sin(t) * r).toFixed(1);
  }
  return d;
})();

/*
 * 眼睛。每只眼以自身中心为原点绘制，side = -1 左眼 / 1 右眼。
 * class 约定（由 faces.css 驱动，没加载 CSS 时也能静态显示）：
 *   bf-pupil  瞳孔，会跟着视线在眼白里移动
 *   bf-pr/pl  朝右 / 朝左两种瞳孔，按视线方向二选一（pl 默认隐藏）
 *   bf-spin / bf-twinkle  部件自带的小动画
 */
defineParts('eyes', {
  dot: { blink: true, draw: ({ ink }) => `<ellipse rx="4.5" ry="5.5" fill="${ink}"/>` },

  big: {
    blink: true,
    draw: ({ ink }) =>
      `<circle r="9.5" fill="#fff" stroke="${ink}" stroke-width="4"/>` +
      `<g class="bf-pupil"><circle cy="1" r="4.6" fill="${ink}"/><circle cx="1.6" cy="-1" r="1.5" fill="#fff"/></g>`,
  },

  wide: {
    blink: true,
    draw: ({ ink }) =>
      `<circle r="10" fill="#fff" stroke="${ink}" stroke-width="4"/><g class="bf-pupil"><circle r="2.6" fill="${ink}"/></g>`,
  },

  happy: { draw: ({ S }) => `<path d="M-7 3Q0-7 7 3" ${S()}/>` },

  closed: { draw: ({ S }) => `<path d="M-7-2Q0 6 7-2" ${S()}/>` },

  // 左眼画成 >，右眼画成 <
  squint: {
    draw: ({ S, side }) => {
      const k = -side;
      return `<path d="M${-6 * k} -6L${5 * k} 0L${-6 * k} 6" ${S()}/>`;
    },
  },

  lid: { draw: ({ S, ink }) => `<path d="M-9-2L9-2" ${S()}/><path d="M-6-2A6 6 0 0 0 6-2Z" fill="${ink}"/>` },

  sideEye: {
    draw: ({ S, ink }) =>
      `<path d="M-8.5-3A8.5 6.5 0 0 0 8.5-3Z" fill="#fff"/>` +
      `<path class="bf-pr" d="M0-3A4.3 4.3 0 0 0 8.4-3Z" fill="${ink}"/>` +
      `<path class="bf-pl" display="none" d="M-8.4-3A4.3 4.3 0 0 0 0-3Z" fill="${ink}"/>` +
      `<path d="M-10.5-3L10.5-3" ${S(5.5)}/>`,
  },

  spiral: { draw: ({ S }) => `<path class="bf-spin" d="${SPIRAL}" ${S(3.2)}/>` },

  x: { draw: ({ S }) => `<path d="M-5-5L5 5M5-5L-5 5" ${S()}/>` },

  star: {
    draw: ({ ink }) =>
      `<path class="bf-twinkle" d="M0-10Q1.6-1.6 10 0Q1.6 1.6 0 10Q-1.6 1.6-10 0Q-1.6-1.6 0-10Z" fill="#fff" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
  },

  heart: {
    draw: ({ ink }) =>
      `<path class="bf-twinkle" d="M0 7C-11-1-7-11 0-4C7-11 11-1 0 7Z" fill="#ff3b6b" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`,
  },
});
