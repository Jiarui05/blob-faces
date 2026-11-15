import { createChiptune } from '../audio/chiptune.js';
import { prefs } from './prefs.js';
import type { Bus } from './bus.js';

/**
 * 声音接线：把总线上的事件翻译成音效。
 * 这是 playground 里唯一知道声音引擎存在的地方——删掉这个文件，其他功能照常运行。
 */
export function connectSound({ bus }: { bus: Bus }) {
  const sfx = createChiptune({ onChange: (s) => bus.emit('sound:state', s) });
  if (prefs.get('muted') === '1') sfx.setMuted(true);


  const setMuted = (muted: boolean) => {
    sfx.setMuted(muted);
    prefs.set('muted', muted ? '1' : '0');
  };

  // 浏览器要求用户先交互才能出声：第一次按下鼠标或按键时解锁。
  // unlockGesture 标记"当前这一下就是解锁的那一下"，直到这次点击的 click 事件处理完才清掉。
  let unlockGesture = false;
  const unlock = (e: Event) => {
    if (sfx.state.started) return;
    sfx.unlock();
    unlockGesture = true;
    const clear = () => setTimeout(() => { unlockGesture = false; });
    if (e.type === 'keydown') clear();
    else addEventListener('click', clear, { capture: true, once: true });
  };
  addEventListener('pointerdown', unlock, { once: true });
  addEventListener('keydown', unlock, { once: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? sfx.suspend() : sfx.resume()));

  // 右侧检查器打开时，背后网格里的角色保持安静（悬停、自动换表情都不出声），只有检查器里的操作有声音
  let inspecting = false;
  bus.on('inspector:focus', ({ face }) => { inspecting = !!face; });

  bus.on('face:poke', ({ spec, from }) => { if (!(inspecting && from === 'stage')) sfx.mood(spec.mood, spec.shape); });
  bus.on('face:ambient', () => { if (!inspecting) sfx.pluck(); });
  bus.on('face:open', () => sfx.coin());
  bus.on('inspector:edit', ({ spec, sound }) => (sound === 'mood' ? sfx.mood(spec.mood, spec.shape) : sfx.blip()));
  bus.on('stage:shuffle', () => sfx.sweep());
  bus.on('ui:toggle-sound', () => {
    // 第一次点声音按钮时，按钮显示的是"未开启"，用户的意思一定是"开声音"：
    // 解锁已在 pointerdown 完成，这里只需确保不是静音（上次静音过的话这一下要取消静音），不能再切换
    if (unlockGesture) {
      if (sfx.state.muted) setMuted(false);
      return;
    }
    setMuted(!sfx.state.muted);
  });

  bus.emit('sound:state', sfx.state);
}
