import { defineParts } from '../registry.js';

/* 嘴巴。以嘴巴中心为原点 */
defineParts('mouth', {
  smile: { draw: ({ S }) => `<path d="M-8-1Q0 7 8-1" ${S()}/>` },
  grin: { draw: ({ S, ink }) => `<path d="M-9-3Q0 13 9-3Z" ${S(3, ink, ink)}/>` },
  o: { draw: ({ ink }) => `<ellipse rx="3.8" ry="5.2" fill="${ink}"/>` },
  tri: { draw: ({ S }) => `<path d="M-7-4L7-4L0 7Z" ${S(4)}/>` },
  wavy: { draw: ({ S }) => `<path d="M-12 0Q-9-4-6 0T0 0T6 0T12 0" ${S(3.8)}/>` },
  flat: { draw: ({ S }) => `<path d="M-6 0L6 0" ${S()}/>` },
  frown: { draw: ({ S }) => `<path d="M-8 4Q0-4 8 4" ${S()}/>` },
  cat: { draw: ({ S }) => `<path d="M-8-1Q-4 5 0 0Q4 5 8-1" ${S(4)}/>` },
  tongue: {
    draw: ({ S, ink }) =>
      `<g transform="translate(3,2)"><path class="bf-tongue" d="M-3 0L-3 5Q0 10 3 5L3 0Z" fill="#ff6b8a" stroke="${ink}" stroke-width="2.8" stroke-linejoin="round"/></g>` +
      `<path d="M-9-2Q0 6 9-2" ${S()}/>`,
  },
  zigzag: { draw: ({ S }) => `<path d="M-12 0L-8-3L-4 3L0-3L4 3L8-3L12 0" ${S(3.5)}/>` },
  smirk: { draw: ({ S }) => `<path d="M-7 2Q3 4 9-4" ${S()}/>` },
  tiny: { draw: ({ S }) => `<path d="M-3 0Q0 3 3 0" ${S(4)}/>` },
  pout: { draw: ({ S }) => `<path d="M-4.5 2Q0-3 4.5 2" ${S(4)}/>` },
});
