import { prefs } from './prefs.js';

/**
 * 多语言。新增语言：在 LANGS 加一行，在 DICT 加一份同结构的字典即可。
 * 缺失的词条会回退到英文，再回退到 key 本身。
 */
export interface LangInfo { code: string; short: string; name: string }

export const LANGS: LangInfo[] = [
  { code: 'zh-CN', short: '中', name: '简体中文' },
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'ja', short: '日', name: '日本語' },
];

type Dict = { [key: string]: string | Dict };

const DICT: Record<string, Dict> = {
  'zh-CN': {
    hint: '悬停戳一下 · 点击查看 DNA',
    tip: { soundLocked: '点任意处开启声音', mute: '静音', unmute: '开启声音', shuffle: '换一批', lang: '语言', close: '关闭' },
    sec: { mood: '情绪', parts: '五官', extras: '装饰', color: '颜色与脸型', code: '代码' },
    tab: { eyes: '眼睛', brows: '眉毛', mouth: '嘴巴' },
    side: { both: '双眼', left: '左眼', right: '右眼' },
    btn: { shape: '换形状', random: '随机', copy: '复制 JSON', copied: '已复制', download: '下载 SVG' },
    mood: { happy: '开心', angry: '生气', sad: '难过', shocked: '震惊', smug: '得意', dizzy: '晕乎', excited: '兴奋', sleepy: '困', meh: '无语', cringe: '尴尬' },
    part: {
      eyes: { dot: '豆豆眼', big: '大眼', wide: '瞪眼', happy: '笑眼', closed: '闭眼', squint: '眯眼', lid: '半睁', sideEye: '斜眼', spiral: '蚊香眼', x: '叉叉', star: '星星', heart: '爱心' },
      brows: { none: '无', angry: '怒眉', worried: '八字眉', raised: '挑眉', flat: '平眉' },
      mouth: { smile: '微笑', grin: '大笑', o: '哦', tri: '张嘴', wavy: '波浪', flat: '一字', frown: '撇嘴', cat: '猫嘴', tongue: '吐舌', zigzag: '咬牙', smirk: '坏笑', tiny: '小嘴', pout: '嘟嘴' },
      extras: { blush: '腮红', blushLines: '害羞线', tears: '眼泪', glasses: '眼镜', sweat: '汗滴', action: '惊叹线', hair: '呆毛', vein: '青筋', zzz: '睡着' },
    },
  },
  en: {
    hint: 'Hover to poke · Click to inspect DNA',
    tip: { soundLocked: 'Click anywhere for sound', mute: 'Mute', unmute: 'Unmute', shuffle: 'Shuffle', lang: 'Language', close: 'Close' },
    sec: { mood: 'Mood', parts: 'Features', extras: 'Extras', color: 'Color & shape', code: 'Code' },
    tab: { eyes: 'Eyes', brows: 'Brows', mouth: 'Mouth' },
    side: { both: 'Both', left: 'Left', right: 'Right' },
    btn: { shape: 'New shape', random: 'Random', copy: 'Copy JSON', copied: 'Copied', download: 'Download SVG' },
    mood: { happy: 'Happy', angry: 'Angry', sad: 'Sad', shocked: 'Shocked', smug: 'Smug', dizzy: 'Dizzy', excited: 'Excited', sleepy: 'Sleepy', meh: 'Meh', cringe: 'Cringe' },
    part: {
      eyes: { dot: 'Dot', big: 'Big', wide: 'Wide', happy: 'Happy', closed: 'Closed', squint: 'Squint', lid: 'Lidded', sideEye: 'Side-eye', spiral: 'Spiral', x: 'X', star: 'Star', heart: 'Heart' },
      brows: { none: 'None', angry: 'Angry', worried: 'Worried', raised: 'Raised', flat: 'Flat' },
      mouth: { smile: 'Smile', grin: 'Grin', o: 'O', tri: 'Open', wavy: 'Wavy', flat: 'Flat', frown: 'Frown', cat: 'Cat', tongue: 'Tongue', zigzag: 'Zigzag', smirk: 'Smirk', tiny: 'Tiny', pout: 'Pout' },
      extras: { blush: 'Blush', blushLines: 'Shy lines', tears: 'Tears', glasses: 'Glasses', sweat: 'Sweat', action: 'Action', hair: 'Tufts', vein: 'Vein', zzz: 'Zzz' },
    },
  },
  ja: {
    hint: 'ホバーでつつく · クリックで DNA を見る',
    tip: { soundLocked: 'どこかをクリックでサウンド開始', mute: 'ミュート', unmute: 'サウンドオン', shuffle: 'シャッフル', lang: '言語', close: '閉じる' },
    sec: { mood: '気分', parts: 'パーツ', extras: 'デコ', color: '色と形', code: 'コード' },
    tab: { eyes: '目', brows: '眉', mouth: '口' },
    side: { both: '両目', left: '左目', right: '右目' },
    btn: { shape: '形を変える', random: 'ランダム', copy: 'JSON をコピー', copied: 'コピー済み', download: 'SVG を保存' },
    mood: { happy: 'うれしい', angry: 'おこ', sad: 'かなしい', shocked: 'びっくり', smug: 'ドヤ', dizzy: 'くらくら', excited: 'わくわく', sleepy: 'ねむい', meh: 'ジト目', cringe: 'きまずい' },
    part: {
      eyes: { dot: 'てん', big: 'まるめ', wide: 'びっくり', happy: 'にっこり', closed: 'とじ', squint: '><', lid: 'はんめ', sideEye: 'ジト目', spiral: 'ぐるぐる', x: 'バツ', star: 'キラキラ', heart: 'ハート' },
      brows: { none: 'なし', angry: '怒り', worried: '困り', raised: '上がり', flat: 'まっすぐ' },
      mouth: { smile: 'にこ', grin: 'わはは', o: 'お', tri: 'あーん', wavy: 'ふにゃ', flat: 'むっ', frown: 'への字', cat: 'ω', tongue: 'べー', zigzag: 'ギザギザ', smirk: 'ニヤ', tiny: 'ちょこん', pout: 'むすっ' },
      extras: { blush: 'ほっぺ', blushLines: 'てれ線', tears: 'なみだ', glasses: 'メガネ', sweat: '汗', action: 'ハッ', hair: 'アホ毛', vein: '怒りマーク', zzz: 'すやすや' },
    },
  },
};

const subs = new Set<(code: string) => void>();
const lookup = (dict: Dict | undefined, path: string): string | undefined => {
  const v = path.split('.').reduce<string | Dict | undefined>((o, k) => (o && typeof o === 'object' ? o[k] : undefined), dict);
  return typeof v === 'string' ? v : undefined;
};

function detect(): string {
  const saved = prefs.get('lang');
  if (saved && LANGS.some((l) => l.code === saved)) return saved;
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('zh')) return 'zh-CN';
  if (nav.startsWith('ja')) return 'ja';
  return 'en';
}

let current = detect();

export const getLang = () => current;
export const langInfo = (): LangInfo => LANGS.find((l) => l.code === current) ?? LANGS[1];

/** t('mood.happy') → '开心' */
export function t(path: string): string {
  return lookup(DICT[current], path) ?? lookup(DICT.en, path) ?? path;
}

export function setLang(code: string): void {
  if (code === current || !DICT[code]) return;
  current = code;
  prefs.set('lang', code);
  subs.forEach((fn) => fn(code));
}

export function onLangChange(fn: (code: string) => void): () => void {
  subs.add(fn);
  return () => { subs.delete(fn); };
}

/**
 * 填充页面上的静态文案：
 *   data-i18n="path"       → textContent
 *   data-i18n-tip="path"   → data-tip（悬浮提示）
 *   data-i18n-aria="path"  → aria-label
 */
export function applyI18n(root: ParentNode = document): void {
  document.documentElement.lang = current;
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n!); });
  root.querySelectorAll<HTMLElement>('[data-i18n-tip]').forEach((el) => { const tip = t(el.dataset.i18nTip!); el.dataset.tip = tip; el.setAttribute('aria-label', tip); });
  root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria!)));
}

/** 打包成一个对象，作为依赖传给各模块（模块只依赖这个类型，不直接 import 本文件） */
export const i18n = {
  t,
  getLang,
  setLang,
  langInfo,
  langs: LANGS,
  onChange: onLangChange,
  apply: applyI18n,
};
export type I18n = typeof i18n;
