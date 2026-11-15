/** 验证经过生产 tree shaking 的库仍能初始化内置注册表并生成 SVG。 */
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { build } from 'vite';
import { expect, it } from 'vitest';

it('preserves built-in registration in a production bundle', async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: true,
      lib: {
        entry: fileURLToPath(new URL('./fixtures/production-entry.ts', import.meta.url)),
        formats: ['es'],
      },
    },
  });
  const output = Array.isArray(result) ? result[0] : result;
  if (!('output' in output)) throw new Error('Expected a completed production bundle');
  const chunk = output.output.find((item) => item.type === 'chunk');
  if (!chunk) throw new Error('Expected JavaScript output');

  // 使用独立 Node 进程运行产物，避免测试进程中已初始化的注册表掩盖缺失模块。
  const url = `data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`;
  const { stdout } = await promisify(execFile)(process.execPath, [
    '--input-type=module', '--eval',
    `const { snapshot } = await import(${JSON.stringify(url)}); console.log(JSON.stringify(snapshot));`,
  ]);
  const snapshot = JSON.parse(stdout);
  expect(snapshot.moods).toHaveLength(10);
  expect(snapshot.parts.every((count: number) => count > 0)).toBe(true);
  expect(snapshot.svg).toContain('<svg');
  expect(snapshot.svg).not.toMatch(/undefined|NaN/);
});
