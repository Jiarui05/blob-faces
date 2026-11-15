import { defineParts } from '../registry.js';

/* 眉毛。以单侧眉毛中心为原点，m = -side 让"内侧"永远朝向脸中间 */
defineParts('brows', {
  none: { draw: () => '' },
  angry: { draw: ({ S, side }) => { const m = -side; return `<path d="M${-7 * m} -3L${7 * m} 3" ${S()}/>`; } },
  worried: { draw: ({ S, side }) => { const m = -side; return `<path d="M${-7 * m} 3L${7 * m} -3" ${S()}/>`; } },
  raised: { draw: ({ S }) => `<path d="M-6 1Q0-4 6 1" ${S()}/>` },
  flat: { draw: ({ S }) => `<path d="M-6 0L6 0" ${S()}/>` },
});
