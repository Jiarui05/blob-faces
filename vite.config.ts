import { defineConfig } from 'vite';

export default defineConfig({
  // 相对路径，构建产物可以直接部署到 GitHub Pages 的子路径
  base: './',
  server: { port: 5199 },
  build: { outDir: 'site' },
});
