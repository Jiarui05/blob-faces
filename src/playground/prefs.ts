/** 本地偏好（语言、静音）。隐私模式下 localStorage 可能抛错，所以全部包一层 */
const PREFIX = 'blob-faces:';

export const prefs = {
  get(key: string): string | null {
    try { return localStorage.getItem(PREFIX + key); } catch { return null; }
  },
  set(key: string, value: string): void {
    try { localStorage.setItem(PREFIX + key, value); } catch { /* 忽略 */ }
  },
};
