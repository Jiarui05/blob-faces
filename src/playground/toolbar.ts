import type { SoundState } from '../audio/chiptune.js';
import type { Bus } from './bus.js';
import type { I18n } from './i18n.js';

interface ToolbarOptions {
  /** 包含 .tools 和 #langMenu 的容器 */
  root: HTMLElement;
  bus: Bus;
  i18n: I18n;
}

const CHECK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.6 6.3l2.1 2.1 4.7-4.9"/></svg>';

/**
 * 右上角工具条：声音开关、语言菜单、换一批。
 * 只发出 ui:* 事件，具体做什么由别的模块决定。
 */
export function createToolbar({ root, bus, i18n }: ToolbarOptions) {
  const tools = root.querySelector<HTMLElement>('.tools')!;
  const soundBtn = root.querySelector<HTMLButtonElement>('#sound')!;
  const langBtn = root.querySelector<HTMLButtonElement>('#lang')!;
  const shuffleBtn = root.querySelector<HTMLButtonElement>('#shuffle')!;
  const menu = root.querySelector<HTMLElement>('#langMenu')!;
  let sound: SoundState | null = null;

  /* ---------- 声音 ---------- */
  function syncSound() {
    const state = !sound?.started ? 'locked' : sound.muted ? 'off' : 'on';
    const tipKey = { locked: 'tip.soundLocked', on: 'tip.mute', off: 'tip.unmute' }[state];
    soundBtn.dataset.state = state;
    soundBtn.dataset.i18nTip = tipKey;
    soundBtn.dataset.tip = i18n.t(tipKey);
    soundBtn.setAttribute('aria-label', soundBtn.dataset.tip);
    soundBtn.setAttribute('aria-pressed', String(state === 'off'));
  }
  bus.on('sound:state', (s) => { sound = s; syncSound(); });
  soundBtn.addEventListener('click', () => bus.emit('ui:toggle-sound'));

  /* ---------- 换一批 ---------- */
  shuffleBtn.addEventListener('click', () => {
    shuffleBtn.classList.remove('spin-once');
    void shuffleBtn.offsetWidth;
    shuffleBtn.classList.add('spin-once');
    bus.emit('ui:shuffle');
  });

  /* ---------- 语言菜单 ---------- */
  function renderMenu() {
    const cur = i18n.getLang();
    menu.innerHTML = i18n.langs
      .map((l) => `<button role="menuitemradio" aria-checked="${l.code === cur}" data-lang="${l.code}"><span>${l.name}</span>${CHECK}</button>`)
      .join('');
    langBtn.querySelector('.lc')!.textContent = i18n.langInfo().short;
  }
  function setMenu(open: boolean) {
    menu.classList.toggle('open', open);
    tools.classList.toggle('menu-open', open);
    langBtn.setAttribute('aria-expanded', String(open));
  }
  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenu(!menu.classList.contains('open'));
  });
  menu.addEventListener('click', (e) => {
    const item = (e.target as Element).closest<HTMLElement>('[data-lang]');
    if (!item) return;
    i18n.setLang(item.dataset.lang!);
    setMenu(false);
  });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target as Node)) setMenu(false); });
  bus.on('ui:escape', () => setMenu(false));

  i18n.onChange(() => { renderMenu(); syncSound(); });
  renderMenu();
  syncSound();
}
