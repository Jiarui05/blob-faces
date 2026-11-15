import type { FaceSpec } from '../core/index.js';
import type { SoundState } from '../audio/chiptune.js';
import type { Face } from './face.js';

/**
 * playground 各模块之间只通过事件总线说话，互相不 import 对方的实现。
 * 这里是全部事件的清单：  事件名 → 载荷类型    （谁发 → 谁听）
 */
export interface Events {
  'face:poke': { spec: FaceSpec; from: 'stage' | 'inspector' }; // stage / inspector → sound
  'face:ambient': void;                                  // stage → sound
  'face:open': { face: Face };                           // stage → inspector, sound
  'stage:shuffle': void;                                 // stage → inspector, sound
  'stage:built': { count: number };                      // stage → main
  'stage:background': void;                              // stage → inspector
  'inspector:focus': { face: Face | null };              // inspector → stage
  'inspector:edit': { spec: FaceSpec; sound: 'blip' | 'mood' }; // inspector → sound
  'sound:state': SoundState;                             // sound → toolbar
  'ui:shuffle': void;                                    // toolbar / 快捷键 → stage
  'ui:toggle-sound': void;                               // toolbar / 快捷键 → sound
  'ui:escape': void;                                     // 快捷键 → inspector, toolbar
}

type Handler<K extends keyof Events> = (payload: Events[K]) => void;
type Args<K extends keyof Events> = Events[K] extends void ? [] : [Events[K]];

export function createBus() {
  const map = new Map<keyof Events, Set<Handler<never>>>();
  return {
    on<K extends keyof Events>(type: K, fn: Handler<K>): () => void {
      if (!map.has(type)) map.set(type, new Set());
      map.get(type)!.add(fn as Handler<never>);
      return () => map.get(type)!.delete(fn as Handler<never>);
    },
    emit<K extends keyof Events>(type: K, ...args: Args<K>): void {
      map.get(type)?.forEach((fn) => (fn as (p?: Events[K]) => void)(args[0]));
    },
  };
}

export type Bus = ReturnType<typeof createBus>;
