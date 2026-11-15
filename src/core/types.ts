export type Side = -1 | 1;
export type Rng = () => number;

/** 描边属性生成器：S() / S(3, '#fff') / S(3, ink, ink) */
export type StrokeFn = (width?: number, color?: string, fill?: string) => string;

export interface DrawContext {
  /** -1 = 左，1 = 右（对称部件用来镜像） */
  side: Side;
  /** 墨线颜色 */
  ink: string;
  S: StrokeFn;
}

export type PartKind = 'eyes' | 'brows' | 'mouth' | 'extras';
export type ExtraLayer = 'under' | 'over' | 'out';

export interface PartDef {
  /** 返回 SVG 片段。眼睛/眉毛/嘴巴以自身中心为原点；装饰以整张脸中心为原点 */
  draw(ctx: DrawContext): string;
  /** 眼睛专用：是否参与眨眼 */
  blink?: boolean;
  /** 装饰专用：under 五官下 / over 五官上 / out 不跟随视线（默认 out） */
  layer?: ExtraLayer;
}

export type BuiltinEye = 'dot' | 'big' | 'wide' | 'happy' | 'closed' | 'squint' | 'lid' | 'sideEye' | 'spiral' | 'x' | 'star' | 'heart';
export type BuiltinBrow = 'none' | 'angry' | 'worried' | 'raised' | 'flat';
export type BuiltinMouth = 'smile' | 'grin' | 'o' | 'tri' | 'wavy' | 'flat' | 'frown' | 'cat' | 'tongue' | 'zigzag' | 'smirk' | 'tiny' | 'pout';
export type BuiltinExtra = 'blush' | 'blushLines' | 'tears' | 'glasses' | 'sweat' | 'action' | 'hair' | 'vein' | 'zzz';
export type BuiltinMood = 'happy' | 'angry' | 'sad' | 'shocked' | 'smug' | 'dizzy' | 'excited' | 'sleepy' | 'meh' | 'cringe';
export type MoodAnim = 'bounce' | 'shake' | 'droop' | 'jump' | 'sway' | 'wobble' | 'hyper' | 'sleep' | 'shiver';

/* 内置值有自动补全，同时允许自定义注册的新 key */
type Open<T extends string> = T | (string & {});
export type EyeKey = Open<BuiltinEye>;
export type BrowKey = Open<BuiltinBrow>;
export type MouthKey = Open<BuiltinMouth>;
export type ExtraKey = Open<BuiltinExtra>;
export type MoodKey = Open<BuiltinMood>;

export interface MoodDef {
  /** 身体动效，对应 faces.css 里的 .bf-a-<anim> */
  anim: Open<MoodAnim>;
  /** 是否可能随机眨一只眼 */
  wink?: boolean;
  /** 偏好的部件；重复写同一个值可以提高权重 */
  eyes: EyeKey[];
  brows: BrowKey[];
  mouth: MouthKey[];
  extras?: ExtraKey[];
}

/** 一个角色的全部"DNA" */
export interface FaceSpec {
  mood: MoodKey;
  /** 脸的颜色 */
  color: string;
  /** 脸型 seed（整数），同一个值永远是同一个形状 */
  shape: number;
  /** [左眼, 右眼] */
  eyes: [EyeKey, EyeKey];
  brows: BrowKey;
  mouth: MouthKey;
  extras: ExtraKey[];
}

/** 渲染时接受的宽松输入：字段都可省略，eyes 可以只写一个 */
export type FaceSpecInput = Partial<Omit<FaceSpec, 'eyes'>> & { eyes?: EyeKey | EyeKey[] };

export interface RenderOptions {
  /** 输出 width/height 属性（像素） */
  size?: number;
  /** 墨线颜色，默认藏青 #1d2b8f */
  ink?: string;
  /** 输出带动画层级的结构，需要同时引入 blob-faces/faces.css */
  animated?: boolean;
  /** 无障碍标题 */
  title?: string;
  className?: string;
}
