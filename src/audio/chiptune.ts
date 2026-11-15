/**
 * 8-bit 声音引擎：全部用 Web Audio 实时合成，没有任何音频文件。
 *
 * 独立模块，不认识角色、也不碰页面 DOM：
 *   const sfx = createChiptune();
 *   sfx.unlock();             // 必须在用户手势（点击/按键）里调用一次
 *   sfx.mood('happy', seed);  // 播放某个情绪的音效
 *   sfx.setMuted(true);       // 一键全部静音（音效 + 背景乐）
 */

export interface SoundState {
  /** 是否已在用户手势中解锁 */
  started: boolean;
  muted: boolean;
  /** 解锁时刻（performance.now()） */
  unlockedAt: number;
}

export interface ChiptuneOptions {
  /** 主音量 0–1 */
  volume?: number;
  onChange?: (state: SoundState) => void;
}

type Wave = OscillatorType | 'p25' | 'p12';
interface ToneOpts { f: number; t?: number; dur?: number; type?: Wave; vol?: number; to?: number; bus?: AudioNode; a?: number }
interface Player {
  tone(o: ToneOpts): void;
  seq(notes: number[], gap: number, o: Omit<ToneOpts, 'f'>, k?: number): void;
}

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/* 情绪音效表：k 是按角色 seed 算出的音高倍率，让每只角色声音略有不同 */
const MOOD_SOUNDS: Record<string, (p: Player, k: number) => void> = {
  happy:   (p, k) => p.seq([72, 76, 79, 84], 0.055, { type: 'p25', dur: 0.12, vol: 0.22 }, k),
  excited: (p, k) => p.seq([72, 76, 79, 84, 88, 91], 0.04, { type: 'p12', dur: 0.1, vol: 0.22 }, k),
  angry:   (p, k) => { p.tone({ f: 180 * k, to: 90 * k, dur: 0.22, type: 'sawtooth', vol: 0.16 }); p.tone({ f: 186 * k, to: 92 * k, dur: 0.22, type: 'p25', vol: 0.12 }); },
  sad:     (p, k) => p.tone({ f: mtof(76) * k, to: mtof(67) * k, dur: 0.45, type: 'triangle', vol: 0.4 }),
  shocked: (p, k) => p.tone({ f: 300 * k, to: 1400 * k, dur: 0.16, type: 'p25', vol: 0.18 }),
  smug:    (p, k) => p.seq([79, 74], 0.11, { type: 'triangle', dur: 0.14, vol: 0.4 }, k),
  dizzy:   (p, k) => p.seq([76, 72, 77, 71, 78, 70], 0.045, { type: 'p25', dur: 0.07, vol: 0.16 }, k),
  sleepy:  (p, k) => p.tone({ f: mtof(64) * k, to: mtof(55) * k, dur: 0.6, type: 'triangle', vol: 0.35, a: 0.08 }),
  meh:     (p, k) => p.seq([60, 59], 0.14, { type: 'p25', dur: 0.13, vol: 0.16 }, k),
  cringe:  (p, k) => { p.tone({ f: mtof(66) * k, dur: 0.2, type: 'p25', vol: 0.11 }); p.tone({ f: mtof(72) * k, dur: 0.2, type: 'p12', vol: 0.11 }); },
};

/* BGM：C - Am - F - G，64 个八分音符一循环。'_' 表示延长上一个音 */
const SONG = {
  bpm: 132,
  chords: [[48, 60, 64, 67], [45, 57, 60, 64], [41, 53, 57, 60], [43, 55, 59, 62]],
  melody: ('72 _ 76 79 76 _ 72 74  76 _ 72 69 72 _ _ _  77 _ 76 74 72 _ 74 76  79 _ 77 76 74 _ 71 _ ' +
           '79 _ 81 79 76 _ 79 _  81 _ 79 76 72 _ 76 _  77 _ 76 77 81 _ 79 77  76 74 72 74 71 _ 72 _').trim().split(/\s+/),
};

export function createChiptune({ volume = 0.55, onChange }: ChiptuneOptions = {}) {
  let ctx: AudioContext, master: GainNode, sfxBus: GainNode, musicBus: GainNode;
  let p25: PeriodicWave, p12: PeriodicWave, noiseBuf: AudioBuffer;
  let timer: ReturnType<typeof setInterval> | null = null, step = 0, nextT = 0, lastMood = 0;
  const state: SoundState = { started: false, muted: false, unlockedAt: 0 };
  const notify = () => onChange?.({ ...state });

  function init() {
    const Ctx = globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = state.muted ? 0 : volume;
    master.connect(ctx.destination);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7000; // 磨掉方波最刺耳的高频
    lp.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(lp);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.22; musicBus.connect(lp);
    p25 = pulseWave(0.25);
    p12 = pulseWave(0.125); // FC 经典占空比
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function pulseWave(duty: number) {
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 1; i < n; i++) re[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    return ctx.createPeriodicWave(re, im);
  }

  function tone({ f, t = ctx.currentTime, dur = 0.1, type = 'square', vol = 0.3, to, bus = sfxBus, a = 0.005 }: ToneOpts) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    if (type === 'p25') o.setPeriodicWave(p25);
    else if (type === 'p12') o.setPeriodicWave(p12);
    else o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function noise({ t, dur = 0.05, vol = 0.2, hp = 6000 }: { t: number; dur?: number; vol?: number; hp?: number }) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = 'highpass';
    f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(musicBus);
    s.start(t);
    s.stop(t + dur + 0.03);
  }

  const player: Player = {
    tone,
    seq(notes, gap, opts, k = 1) {
      const now = ctx.currentTime;
      notes.forEach((n, i) => tone({ ...opts, f: mtof(n) * k, t: now + i * gap }));
    },
  };
  const audible = () => !!ctx && state.started && !state.muted;

  /* ---------- BGM 调度：25ms 一次，提前 150ms 排好音符 ---------- */
  const E8 = 60 / SONG.bpm / 2;
  function playStep(s: number, t: number) {
    const b = s % 8, ch = SONG.chords[Math.floor(s / 8) % 4];
    if (b % 2 === 0) tone({ f: mtof(ch[0] + (b % 4 === 2 ? 12 : 0)), t, dur: E8 * 0.9, type: 'triangle', vol: 0.55, bus: musicBus });
    for (let h = 0; h < 2; h++) tone({ f: mtof(ch[1 + ((b * 2 + h) % 3)] + 12), t: t + (h * E8) / 2, dur: E8 * 0.4, type: 'p12', vol: 0.07, bus: musicBus });
    const m = SONG.melody[s];
    if (m !== '_') {
      let len = 1;
      while (SONG.melody[(s + len) % 64] === '_') len++;
      tone({ f: mtof(+m), t, dur: E8 * len * 0.95, type: 'p25', vol: 0.14, bus: musicBus, a: 0.01 });
    }
    if (b === 0 || b === 4) tone({ f: 150, to: 40, t, dur: 0.12, type: 'sine', vol: 0.7, bus: musicBus });
    if (b === 2 || b === 6) noise({ t, dur: 0.12, vol: 0.22, hp: 1500 });
    noise({ t: t + E8 / 2, dur: 0.03, vol: 0.07, hp: 8000 });
  }
  function tick() {
    while (nextT < ctx.currentTime + 0.15) {
      playStep(step, nextT);
      nextT += E8;
      step = (step + 1) % 64;
    }
  }
  function startMusic() {
    if (timer || !audible()) return;
    step = 0;
    nextT = ctx.currentTime + 0.08;
    timer = setInterval(tick, 25);
  }
  function stopMusic() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  return {
    get state(): SoundState { return { ...state }; },

    /** 在用户手势里调用；重复调用无副作用 */
    unlock() {
      if (state.started) return;
      init();
      void ctx.resume();
      state.started = true;
      state.unlockedAt = performance.now();
      startMusic();
      notify();
    },

    /** true = 音效和背景乐全部静音 */
    setMuted(muted: boolean) {
      state.muted = muted;
      if (ctx) {
        master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.05);
        if (muted) stopMusic(); else startMusic();
      }
      notify();
    },

    /** 页面隐藏时暂停、回来时恢复（由调用方决定何时调用） */
    suspend() { if (ctx) { stopMusic(); void ctx.suspend(); } },
    resume() { if (ctx) { void ctx.resume(); startMusic(); } },

    /** 播放情绪音效；seed 决定音高偏移 */
    mood(name: string, seed = 0) {
      if (!audible()) return;
      const now = ctx.currentTime;
      if (now - lastMood < 0.05) return; // 快速扫过一排时不要糊成一团
      lastMood = now;
      const k = Math.pow(2, ((Math.abs(seed) % 5) - 2) / 12);
      MOOD_SOUNDS[name]?.(player, k);
    },
    /** 很轻的"叮"，C 大调五声音阶，和 BGM 同调 */
    pluck() { if (audible()) tone({ f: mtof(pick([84, 86, 88, 91, 93])), dur: 0.25, type: 'p12', vol: 0.05 }); },
    coin() {
      if (!audible()) return;
      const t = ctx.currentTime;
      tone({ f: mtof(83), t, dur: 0.07, type: 'p25', vol: 0.2 });
      tone({ f: mtof(88), t: t + 0.07, dur: 0.3, type: 'p25', vol: 0.2 });
    },
    blip() { if (audible()) tone({ f: mtof(79 + Math.floor(Math.random() * 5)), dur: 0.05, type: 'p12', vol: 0.15 }); },
    sweep() { if (audible()) tone({ f: 200, to: 1800, dur: 0.35, type: 'p25', vol: 0.14 }); },
  };
}

export type Chiptune = ReturnType<typeof createChiptune>;
