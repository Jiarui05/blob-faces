import { createSpec, pick } from '../core/index.js';
import type { FaceSpec } from '../core/index.js';
import { Face } from './face.js';
import { track, untrack } from './motion.js';
import type { Bus } from './bus.js';

interface StageOptions {
  /** 舞台容器（选中时加 .focus，聚光灯变量写在这里） */
  root: HTMLElement;
  /** 网格容器 */
  grid: HTMLElement;
  bus: Bus;
}

/**
 * 舞台：按容器尺寸自动排满角色，负责悬停戳、自动换表情、换一批、选中态。
 */
export function createStage({ root, grid, bus }: StageOptions) {
  let faces: Face[] = [];
  let layout = { cols: 0, rows: 0 };
  let busy = false;
  let focused: Face | null = null;
  /** 入场动画结束的时刻；要和 styles.css 里 .char svg 的 enter 时长一致 */
  const ENTER_MS = 650;
  let introUntil = 0;

  /** 每格目标尺寸（越大角色越少）和同屏上限 */
  const CELL = { desktop: 140, mobile: 96 };
  const MAX_FACES = 64;

  function measure() {
    const W = grid.clientWidth, H = grid.clientHeight;
    let target = W < 520 ? CELL.mobile : CELL.desktop;
    let cols = 0, rows = 0;
    do {
      cols = Math.max(3, Math.round(W / target));
      rows = Math.max(3, Math.round(H / target));
      target += 8; // 大屏上也不要超过上限
    } while (cols * rows > MAX_FACES);
    return { cols, rows, cs: Math.min(W / cols, H / rows) * 0.94 };
  }

  function build(keepSpecs: boolean) {
    const L = measure();
    const old: FaceSpec[] = keepSpecs ? faces.map((f) => f.spec) : [];
    faces.forEach(untrack);
    layout = L;
    faces = [];
    if (focused) bus.emit('stage:background');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${L.cols},1fr)`;
    grid.style.gridTemplateRows = `repeat(${L.rows},1fr)`;
    grid.style.setProperty('--cs', `${L.cs.toFixed(1)}px`);

    const cx = (L.cols - 1) / 2, cy = (L.rows - 1) / 2;
    const jitter = () => ((Math.random() - 0.5) * L.cs * 0.12).toFixed(1);
    let lastDelay = 0;
    for (let i = 0; i < L.cols * L.rows; i++) {
      const col = i % L.cols, row = Math.floor(i / L.cols);
      const el = document.createElement('div');
      el.className = 'char';
      el.style.transform = `translate(${jitter()}px,${jitter()}px) scale(${(0.8 + Math.random() * 0.24).toFixed(2)})`;
      grid.appendChild(el);

      const face = new Face(el, old[i] ?? createSpec());
      face.delay = Math.round(Math.hypot(col - cx, row - cy) * 45 + Math.random() * 30); // 从中心向外的涟漪
      face.svg.style.setProperty('--d', `${face.delay}ms`);
      lastDelay = Math.max(lastDelay, face.delay);
      // 只对鼠标悬停生效：触屏上"悬停"和点击是同一下，先换表情会让 Safari 吞掉这次点击
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && face !== focused && settled()) poke(face); });
      el.addEventListener('click', (e) => { e.stopPropagation(); bus.emit('face:open', { face }); });
      track(face, { magnify: true });
      faces.push(face);
    }
    // 入场期间不被戳、也不自动换表情：最后一只落定（延迟 + 入场时长）之后才开始
    introUntil = performance.now() + lastDelay + ENTER_MS;
    bus.emit('stage:built', { count: faces.length });
  }

  /** 没在换批、入场也已结束 */
  function settled() {
    return !busy && performance.now() >= introUntil;
  }

  function poke(face: Face) {
    const spec = createSpec({ base: face.spec });
    face.setSpec(spec, { pop: true });
    bus.emit('face:poke', { spec, from: 'stage' });
  }

  function shuffle() {
    if (busy) return;
    busy = true;
    bus.emit('stage:shuffle');
    let max = 0;
    for (const f of faces) {
      const d = f.delay * 0.6;
      f.svg.style.animation = `exit .34s cubic-bezier(.5,0,.75,0) ${d}ms forwards`;
      max = Math.max(max, d);
    }
    setTimeout(() => { build(false); busy = false; }, max + 360);
  }

  function setFocus(face: Face | null) {
    focused = face;
    root.classList.toggle('focus', !!face);
    faces.forEach((f) => f.el.classList.toggle('sel', f === face));
  }

  // 首次拿到尺寸时生成；之后行列数变化才重排，并保留已有角色
  let timer: ReturnType<typeof setTimeout>;
  new ResizeObserver(() => {
    if (!grid.clientWidth || !grid.clientHeight) return;
    if (!faces.length) return build(false);
    clearTimeout(timer);
    timer = setTimeout(() => {
      const L = measure();
      if (L.cols !== layout.cols || L.rows !== layout.rows) { if (!busy) build(true); }
      else grid.style.setProperty('--cs', `${L.cs.toFixed(1)}px`);
    }, 180);
  }).observe(grid);

  // 时不时有一只自己换表情
  setInterval(() => {
    if (!settled() || document.hidden || !faces.length) return;
    const face = pick(faces);
    if (face === focused) return;
    face.setSpec(createSpec({ base: face.spec }), { pop: true });
    bus.emit('face:ambient');
  }, 700);

  // 跟随鼠标的背景聚光：每帧最多更新一次，只改 transform
  const spot = root.querySelector<HTMLElement>('.spot');
  let sx = 0, sy = 0, spotRaf = 0;
  let origin = root.getBoundingClientRect(); // 舞台位置只在窗口变化时重新读
  addEventListener('resize', () => { origin = root.getBoundingClientRect(); }, { passive: true });
  addEventListener('pointermove', (e) => {
    sx = e.clientX - origin.left;
    sy = e.clientY - origin.top;
    if (spot && !spotRaf) spotRaf = requestAnimationFrame(() => {
      spotRaf = 0;
      spot.style.transform = `translate3d(${sx}px,${sy}px,0)`;
    });
  }, { passive: true });

  grid.addEventListener('click', () => bus.emit('stage:background'));
  bus.on('ui:shuffle', shuffle);
  bus.on('inspector:focus', ({ face }) => setFocus(face));

  return { shuffle };
}
