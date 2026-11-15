import { renderFace, renderParts, createSpec, PARTS, PALETTE } from '../core/index.js';
import type { EyeKey, FaceSpec, PartKind } from '../core/index.js';
import { MOODS } from '../core/index.js';
import { Face } from './face.js';
import { track } from './motion.js';
import type { Bus } from './bus.js';
import type { I18n } from './i18n.js';

type Tab = 'eyes' | 'brows' | 'mouth';
type EyeSide = 'both' | 'left' | 'right';

interface InspectorOptions {
  /** 检查器面板根元素（结构见 index.html） */
  root: HTMLElement;
  bus: Bus;
  i18n: I18n;
}

const CHECK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.6 6.3l2.1 2.1 4.7-4.9"/></svg>';

/** 把 JSON 着色成 HTML（key / 字符串 / 数字） */
function highlight(json: string): string {
  return json.replace(/"(\w+)":|"([^"]*)"|(-?\d+)/g, (_m, key, str, num) =>
    key ? `<span class="k">${key}</span>:` : str !== undefined ? `<span class="s">"${str}"</span>` : `<span class="n">${num}</span>`,
  );
}

/**
 * 检查器：查看和编辑一个角色的 spec。
 * 所有选项都渲染成"当前角色换上这个部件"的缩略图，选中态一眼可见。
 */
export function createInspector({ root, bus, i18n }: InspectorOptions) {
  const { t } = i18n;
  const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const els = {
    title: $('#moodTitle'),
    pv: $('#pv'),
    moods: $('#moods'),
    tabs: $('#tabs'),
    sides: $('#sides'),
    partTiles: $('#partTiles'),
    extraTiles: $('#extraTiles'),
    swatches: $('#swatches'),
    code: $('#code'),
    copy: $('#copy'),
  };

  let target: Face | null = null;
  let preview: Face | null = null;
  let tab: Tab = 'eyes';
  let side: EyeSide = 'both';

  /* ---------- 打开 / 关闭 / 编辑 ---------- */
  function open(face: Face) {
    target = face;
    root.classList.add('open');
    if (!preview) {
      preview = new Face(els.pv, face.spec);
      track(preview, { live: true }); // 面板会滑入、预览会缩放，位置要每帧重新量
    } else {
      preview.setSpec(face.spec, { pop: true });
    }
    bus.emit('inspector:focus', { face });
    render(true);
  }

  function close() {
    if (!target) return;
    target = null;
    root.classList.remove('open');
    bus.emit('inspector:focus', { face: null });
  }

  function edit(spec: FaceSpec, sound: 'blip' | 'mood' = 'blip') {
    if (!target || !preview) return;
    target.setSpec(spec);
    preview.setSpec(spec, { pop: true });
    bus.emit('inspector:edit', { spec, sound });
    render();
  }

  /* ---------- 渲染 ---------- */
  const thumb = (s: FaceSpec) => `<svg viewBox="-54 -54 108 108" aria-hidden="true">${renderParts(s)}</svg>`;

  function tile(kind: PartKind, key: string, previewSpec: FaceSpec, on: boolean, i: number, badge = CHECK) {
    const label = t(`part.${kind}.${key}`);
    return (
      `<button class="tile${on ? ' on' : ''}" data-kind="${kind}" data-key="${key}" style="--k:${i}" title="${label}" aria-pressed="${on}">` +
      `<span class="th">${thumb(previewSpec)}</span><span class="tl">${label}</span><span class="bd">${badge}</span></button>`
    );
  }

  function replay(el: HTMLElement, animate: boolean) {
    el.classList.remove('anim');
    if (!animate) return;
    void el.offsetWidth;
    el.classList.add('anim');
  }

  function renderSeg(el: HTMLElement, active: string) {
    const btns = [...el.querySelectorAll<HTMLButtonElement>('button')];
    const i = Math.max(0, btns.findIndex((b) => (b.dataset.tab ?? b.dataset.side) === active));
    el.style.setProperty('--i', String(i));
    btns.forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', String(j === i)); });
  }

  function renderPartTiles(sp: FaceSpec, animate: boolean) {
    els.partTiles.innerHTML = Object.keys(PARTS[tab])
      .map((key, i) => {
        if (tab !== 'eyes') return tile(tab, key, { ...sp, [tab]: key }, sp[tab] === key, i);
        if (side === 'both') {
          const l = sp.eyes[0] === key, r = sp.eyes[1] === key;
          const badge = l && r ? CHECK : l ? 'L' : 'R'; // 左右眼不同时，用 L / R 标出各自用的哪个
          return tile('eyes', key, { ...sp, eyes: [key, key] }, l || r, i, badge);
        }
        const idx = side === 'left' ? 0 : 1;
        const eyes = [...sp.eyes] as [EyeKey, EyeKey];
        eyes[idx] = key;
        return tile('eyes', key, { ...sp, eyes }, sp.eyes[idx] === key, i);
      })
      .join('');
    replay(els.partTiles, animate);
  }

  function renderExtraTiles(sp: FaceSpec, animate: boolean) {
    els.extraTiles.innerHTML = Object.keys(PARTS.extras)
      .map((key, i) => {
        const on = sp.extras.includes(key);
        return tile('extras', key, on ? sp : { ...sp, extras: [...sp.extras, key] }, on, i);
      })
      .join('');
    replay(els.extraTiles, animate);
  }

  function render(animate = false) {
    if (!target) return;
    const sp = target.spec;
    els.title.textContent = `${t(`mood.${sp.mood}`)} · ${sp.mood}`;

    els.moods.innerHTML = Object.keys(MOODS)
      .map((m) => {
        const on = m === sp.mood;
        return `<button class="pill${on ? ' on' : ''}" data-mood="${m}" aria-pressed="${on}">${t(`mood.${m}`)}</button>`;
      })
      .join('');

    renderSeg(els.tabs, tab);
    renderSeg(els.sides, side);
    els.sides.classList.toggle('show', tab === 'eyes');
    renderPartTiles(sp, animate);
    renderExtraTiles(sp, animate);

    els.swatches.innerHTML = PALETTE.slice(0, 18)
      .map((c) => `<button class="sw${c === sp.color ? ' on' : ''}" data-color="${c}" style="--c:${c}" aria-label="${c}">${CHECK}</button>`)
      .join('');

    const json = JSON.stringify(sp, null, 2).replace(/\[\s+([^\]]*?)\s+\]/g, (_m, a: string) => `[${a.replace(/\s+/g, ' ')}]`);
    els.code.innerHTML =
      `<span class="kw">import</span> { renderFace } <span class="kw">from</span> <span class="s">'blob-faces'</span>\n\n` +
      `<span class="kw">const</span> spec = ${highlight(json)}\n\n` +
      `renderFace(spec) <span class="c">// → &lt;svg&gt;…&lt;/svg&gt;</span>`;
  }

  /* ---------- 交互（事件委托） ---------- */
  root.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('button');
    if (!btn || !target) return;
    const d = btn.dataset;
    const sp = target.spec;

    if (d.mood) return edit(createSpec({ mood: d.mood, base: sp }), 'mood');
    if (d.tab) { tab = d.tab as Tab; renderSeg(els.tabs, tab); els.sides.classList.toggle('show', tab === 'eyes'); return renderPartTiles(sp, true); }
    if (d.side) { side = d.side as EyeSide; renderSeg(els.sides, side); return renderPartTiles(sp, true); }
    if (d.kind === 'extras') {
      const key = d.key!;
      return edit({ ...sp, extras: sp.extras.includes(key) ? sp.extras.filter((k) => k !== key) : [...sp.extras, key] });
    }
    if (d.kind === 'eyes') {
      const eyes = [...sp.eyes] as [EyeKey, EyeKey];
      if (side !== 'right') eyes[0] = d.key!;
      if (side !== 'left') eyes[1] = d.key!;
      return edit({ ...sp, eyes });
    }
    if (d.kind) return edit({ ...sp, [d.kind]: d.key });
    if (d.color) return edit({ ...sp, color: d.color });

    switch (btn.id) {
      case 'shape': return edit({ ...sp, shape: Math.floor(Math.random() * 1e9) });
      case 'rnd': return edit(createSpec(), 'mood');
      case 'close': return close();
      case 'copy': {
        void navigator.clipboard?.writeText(JSON.stringify(sp, null, 2));
        els.copy.textContent = t('btn.copied');
        setTimeout(() => { els.copy.textContent = t('btn.copy'); }, 1200);
        return;
      }
      case 'dl': {
        const svg = renderFace(sp, { size: 512, title: t(`mood.${sp.mood}`) });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        a.download = `blob-${sp.mood}-${sp.shape}.svg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
    }
  });

  // 内容滚下去后预览收成紧凑尺寸（带一点回差，避免在临界点来回跳）
  const body = $('.body');
  body.addEventListener('scroll', () => {
    const y = body.scrollTop;
    if (y > 32) root.classList.add('compact');
    else if (y < 8) root.classList.remove('compact');
  }, { passive: true });

  // 点大预览：弹一下并播放它的情绪音效
  els.pv.addEventListener('click', () => {
    if (!preview) return;
    preview.pop();
    bus.emit('face:poke', { spec: preview.spec, from: 'inspector' });
  });

  bus.on('face:open', ({ face }) => open(face));
  bus.on('stage:background', close);
  bus.on('stage:shuffle', close);
  bus.on('ui:escape', close);
  i18n.onChange(() => render());

  return { open, close };
}
