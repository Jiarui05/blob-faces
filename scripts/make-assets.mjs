// 用库本身生成 favicon 和 README 横幅。先运行 npm run build:lib。
//   node scripts/make-assets.mjs                 默认 Gochi Hand
//   FONT=caveat-brush node scripts/make-assets.mjs  换成 Caveat Brush
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as opentype from 'opentype.js';
import { renderFace, renderParts, createSpec, mulberry32 } from '../dist/core/index.js';

const require = createRequire(import.meta.url);

/* ---------- favicon ---------- */
writeFileSync('public/favicon.svg', renderFace({ mood: 'happy', color: '#ffb547', shape: 12, eyes: 'happy', mouth: 'cat', extras: ['blush'] }));

/* ---------- 手写体：把文字转成矢量路径，README 里用 <img> 显示时不依赖任何字体 ---------- */
const FONTS = {
  'caveat-brush': '@fontsource/caveat-brush/files/caveat-brush-latin-400-normal.woff',
  'gochi-hand': '@fontsource/gochi-hand/files/gochi-hand-latin-400-normal.woff',
};
const fontName = process.env.FONT ?? 'gochi-hand';
const buf = readFileSync(require.resolve(FONTS[fontName]));
const font = (opentype.parse ?? opentype.default.parse)(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

/**
 * 居中排版一行文字，返回 path 的 d 属性。
 * 逐个字形自己排，并把起点坐标取整到两位小数：
 * opentype.js 2.0 在格式化某些带长浮点尾数的坐标（如 681.3140000000001）时会输出 NaN。
 */
function textPath(text, cx, baseline, size) {
  const scale = size / font.unitsPerEm;
  const glyphs = [...text].map((ch) => font.charToGlyph(ch));
  const kern = (i) => (i < glyphs.length - 1 ? font.getKerningValue(glyphs[i], glyphs[i + 1]) || 0 : 0) * scale;
  const width = glyphs.reduce((w, g, i) => w + g.advanceWidth * scale + kern(i), 0);
  let x = cx - width / 2;
  let d = '';
  glyphs.forEach((g, i) => {
    d += g.getPath(Math.round(x * 100) / 100, baseline, size).toPathData(1);
    x += g.advanceWidth * scale + kern(i);
  });
  if (d.includes('NaN')) throw new Error(`Bad glyph path for "${text}"`);
  return d;
}

/* ---------- 颜色：HSL → hex ---------- */
function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, '0');
  return `#${f(0)}${f(8)}${f(4)}`;
}

/* ---------- 横幅：顶部手写标题 + 下面一整块彩虹表情矩阵 ---------- */
const W = 1280, H = 640;
const COLS = 12, ROWS = 4;
const GRID = { x: 40, y: 236, w: W - 80, h: H - 236 - 28 };
const cell = Math.min(GRID.w / COLS, GRID.h / ROWS);
const rng = mulberry32(2026);
const moods = ['happy', 'excited', 'shocked', 'smug', 'dizzy', 'meh', 'angry', 'sleepy', 'sad', 'cringe'];

let faces = '';
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    // 色相沿对角线扫一整圈，整块矩阵是一道彩虹
    const hue = ((col + row * 1.5) / COLS) * 360 % 360;
    const spec = createSpec({ mood: moods[Math.floor(rng() * moods.length)], rng });
    spec.color = hsl(hue, 92, 62);
    const x = GRID.x + (col + 0.5) * (GRID.w / COLS) + (rng() - 0.5) * 6;
    const y = GRID.y + (row + 0.5) * (GRID.h / ROWS) + (rng() - 0.5) * 6;
    const rot = ((rng() - 0.5) * 16).toFixed(1);
    const s = ((cell / 120) * (0.98 + rng() * 0.12)).toFixed(3);
    faces += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot}) scale(${s})">${renderParts(spec)}</g>`;
  }
}

const title = textPath('Blob Faces', W / 2, 150, 150);
const tagline = textPath('cute characters, assembled from code', W / 2, 206, 38);
const sparkle = (x, y, r, c) =>
  `<path transform="translate(${x},${y})" d="M0 ${-r}Q${r * 0.16} ${-r * 0.16} ${r} 0Q${r * 0.16} ${r * 0.16} 0 ${r}Q${-r * 0.16} ${r * 0.16} ${-r} 0Q${-r * 0.16} ${-r * 0.16} 0 ${-r}Z" fill="${c}"/>`;

const banner = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b1a5e"/><stop offset=".55" stop-color="#1a1840"/><stop offset="1" stop-color="#0f2a4a"/></linearGradient>
  <radialGradient id="glow" cx=".5" cy=".18" r=".55"><stop offset="0" stop-color="#ff5ea8" stop-opacity=".35"/><stop offset="1" stop-color="#ff5ea8" stop-opacity="0"/></radialGradient>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.3" fill="#fff" fill-opacity=".07"/></pattern>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="36"/></clipPath>
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  ${sparkle(268, 74, 16, '#ffd23f')}${sparkle(300, 128, 8, '#7df9ff')}${sparkle(1010, 62, 12, '#7df9ff')}${sparkle(1040, 118, 18, '#ff8fd0')}${sparkle(980, 140, 7, '#ffd23f')}
  <g transform="rotate(-3 ${W / 2} 110)">
    <path d="${title}" fill="#ff3d8b" transform="translate(6,7)"/>
    <path d="${title}" fill="#3dd6ff" transform="translate(3,3.5)"/>
    <path d="${title}" fill="#fff8e7"/>
  </g>
  <path d="${tagline}" fill="#ffd23f"/>
  ${faces}
</g>
</svg>`;
writeFileSync('docs/banner.svg', banner);
console.log(`wrote public/favicon.svg, docs/banner.svg (font: ${fontName}, ${(banner.length / 1024).toFixed(0)} KB)`);
