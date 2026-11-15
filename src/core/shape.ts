import { mulberry32 } from './rng.js';

/**
 * 脸型：由 seed 决定的不规则软糖轮廓。
 * 7 个控制点绕圆一圈加随机扰动，再用 Catmull-Rom 转成平滑的闭合贝塞尔曲线。
 * 输出以 (0, 0) 为中心，半径约 46。
 */
export function blobPath(seed: number): string {
  const r = mulberry32(seed);
  const n = 7;
  const sx = 0.98 + r() * 0.14;
  const sy = 0.86 + r() * 0.1;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.3;
    const rad = 46 * (0.93 + r() * 0.12);
    const x = Math.cos(a) * rad * sx;
    let y = Math.sin(a) * rad * sy;
    if (y > 0) y *= 0.94; // 底部略扁，更有"坐着"的重量感
    pts.push([x, y + 2]);
  }
  const P = (i: number) => pts[(i + n) % n];
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(P(0)[0])} ${f(P(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    d +=
      `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
      `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}
