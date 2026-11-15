import { defineMoods } from './registry.js';
import type { BuiltinMood, MoodDef } from './types.js';

/*
 * 情绪 = 一组部件偏好 + 一种身体动效。
 * 数组里重复写同一个值可以提高它被选中的概率。
 */
const BUILTIN_MOODS: Record<BuiltinMood, MoodDef> = {
  happy:   { anim: 'bounce', wink: true, eyes: ['happy', 'dot', 'big', 'closed'], brows: ['none', 'raised'], mouth: ['smile', 'grin', 'cat', 'tongue'], extras: ['blush', 'blushLines'] },
  angry:   { anim: 'shake', eyes: ['dot', 'squint', 'lid'], brows: ['angry'], mouth: ['frown', 'tri', 'zigzag', 'flat'], extras: ['vein', 'vein'] },
  sad:     { anim: 'droop', eyes: ['big', 'dot', 'closed'], brows: ['worried'], mouth: ['frown', 'wavy', 'tiny'], extras: ['tears', 'sweat'] },
  shocked: { anim: 'jump', eyes: ['wide', 'big', 'dot'], brows: ['raised', 'none'], mouth: ['o', 'tri', 'wavy'], extras: ['action', 'sweat', 'hair'] },
  smug:    { anim: 'sway', wink: true, eyes: ['lid', 'closed', 'dot', 'sideEye'], brows: ['flat', 'angry', 'none'], mouth: ['smirk', 'smile', 'flat'], extras: ['blush', 'glasses'] },
  dizzy:   { anim: 'wobble', eyes: ['spiral', 'x'], brows: ['none', 'worried'], mouth: ['wavy', 'tongue', 'zigzag'], extras: ['sweat'] },
  excited: { anim: 'hyper', wink: true, eyes: ['star', 'heart', 'big', 'squint'], brows: ['none', 'raised'], mouth: ['grin', 'tri', 'tongue'], extras: ['blush', 'blushLines', 'action'] },
  sleepy:  { anim: 'sleep', eyes: ['closed', 'lid'], brows: ['none', 'flat'], mouth: ['tiny', 'o', 'flat'], extras: ['zzz', 'zzz', 'blush'] },
  meh:     { anim: 'droop', eyes: ['sideEye', 'sideEye', 'lid'], brows: ['none'], mouth: ['pout', 'pout', 'flat'], extras: ['sweat'] },
  cringe:  { anim: 'shiver', eyes: ['squint'], brows: ['worried', 'angry'], mouth: ['zigzag', 'wavy', 'flat'], extras: ['action', 'sweat', 'blushLines', 'hair'] },
};

defineMoods(BUILTIN_MOODS);
