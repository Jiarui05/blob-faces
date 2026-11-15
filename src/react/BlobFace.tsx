import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { renderFace } from '../core/index.js';
import type { FaceSpecInput, RenderOptions } from '../core/index.js';

export interface BlobFaceProps extends Omit<RenderOptions, 'className'> {
  /** 角色 DNA，字段都可省略 */
  spec: FaceSpecInput;
  className?: string;
  style?: CSSProperties;
}

/**
 * React 组件：<BlobFace spec={{ mood: 'happy', color: '#ff8090' }} size={96} />
 * animated 为 true 时记得引入 'blob-faces/faces.css'。
 */
export function BlobFace({ spec, size = 120, ink, animated = false, title, className, style }: BlobFaceProps) {
  const key = JSON.stringify(spec);
  const html = useMemo(
    () => renderFace(JSON.parse(key) as FaceSpecInput, { size, ink, animated, title }),
    [key, size, ink, animated, title],
  );
  return (
    <span
      className={className}
      style={{ display: 'inline-block', lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
