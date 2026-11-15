import type { Face } from './face.js';

/**
 * 全局"生命感"循环：眨眼、视线跟随鼠标、靠近放大。
 * 任何模块把 Face 交给 track() 就能让它活起来，模块之间不用知道彼此。
 *
 * 性能要点：
 *   - 位置缓存：网格里的角色不会移动，只在窗口尺寸变化时重新测量，
 *     避免每帧对每只角色调用 getBoundingClientRect() 造成强制重排。
 *   - 先读后写：一帧内先把需要的位置全部读完，再统一写样式。
 *   - 变化很小就不写：大多数角色的放大值一直是 1，不必每帧写一遍。
 */
interface TrackOptions {
  /** 靠近鼠标时放大（网格角色用） */
  magnify?: boolean;
  /** 位置会变（比如在滑入的面板里），每帧重新测量 */
  live?: boolean;
}
interface Entry extends TrackOptions {
  rect: { cx: number; cy: number; w: number } | null;
  scale: number;
}

const tracked = new Map<Face, Entry>();
let mx = -1, my = -1, raf = 0;

export function track(face: Face, opts: TrackOptions = {}): void {
  tracked.set(face, { ...opts, rect: null, scale: 1 });
  schedule();
}

export function untrack(face: Face): void {
  tracked.delete(face);
}

/** 让所有缓存的位置失效（布局变化后调用） */
export function invalidateRects(): void {
  tracked.forEach((e) => { e.rect = null; });
  schedule();
}

function measure(face: Face, e: Entry) {
  const r = face.el.getBoundingClientRect();
  e.rect = r.width ? { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width } : null;
}

function schedule() {
  if (!raf && mx >= 0) raf = requestAnimationFrame(frame);
}

function frame() {
  raf = 0;
  // 第一步：只读
  tracked.forEach((e, face) => { if (e.live || !e.rect) measure(face, e); });
  // 第二步：只写
  tracked.forEach((e, face) => {
    if (!e.rect) return;
    const vx = mx - e.rect.cx, vy = my - e.rect.cy;
    const d = Math.hypot(vx, vy) || 1;
    const f = Math.min(1, d / (e.rect.w * 0.9)); // 鼠标贴近时回正，远一点就看满
    face.gaze((vx / d) * f, (vy / d) * f);
    if (e.magnify) {
      const s = 1 + 0.2 * Math.max(0, 1 - d / (e.rect.w * 2.2));
      if (Math.abs(s - e.scale) > 0.002) {
        e.scale = s;
        face.svg.style.scale = s.toFixed(3);
      }
    }
  });
}

export function startMotion(): void {
  addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    schedule();
  }, { passive: true });
  addEventListener('resize', invalidateRects, { passive: true });

  setInterval(() => {
    if (document.hidden) return;
    const now = performance.now();
    tracked.forEach((_, face) => {
      if (now < face.nextBlink) return;
      face.blink();
      face.nextBlink = now + (Math.random() < 0.2 ? 260 : 2000 + Math.random() * 4500); // 偶尔连眨两下
    });
  }, 60);
}
