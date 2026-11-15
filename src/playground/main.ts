/**
 * Playground 入口：唯一把各模块组装到一起的地方。
 * 每个模块只拿到它需要的 DOM 根节点、事件总线和 i18n，彼此不直接引用。
 */
import '../core/faces.css';
import './styles.css';
import { createBus } from './bus.js';
import { i18n } from './i18n.js';
import { startMotion } from './motion.js';
import { createToolbar } from './toolbar.js';
import { connectSound } from './sound.js';
import { createInspector } from './inspector.js';
import { createStage } from './stage.js';

const $ = (id: string) => document.getElementById(id)!;
const bus = createBus();

i18n.apply();
createToolbar({ root: $('stage'), bus, i18n });
connectSound({ bus });
createInspector({ root: $('insp'), bus, i18n });
createStage({ root: $('stage'), grid: $('grid'), bus });
startMotion();

bus.on('stage:built', ({ count }) => { $('cnt').textContent = String(count).padStart(3, '0'); });

// 切换语言：文案先淡出，换字，再淡入
i18n.onChange(() => {
  document.body.classList.add('lang-swap');
  setTimeout(() => {
    i18n.apply();
    document.body.classList.remove('lang-swap');
  }, 160);
});

// 快捷键：R 换一批 · M 静音 · Esc 关闭
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest('input, textarea')) return;
  if (e.key === 'Escape') bus.emit('ui:escape');
  else if (e.key === 'r' || e.key === 'R') bus.emit('ui:shuffle');
  else if (e.key === 'm' || e.key === 'M') bus.emit('ui:toggle-sound');
});
