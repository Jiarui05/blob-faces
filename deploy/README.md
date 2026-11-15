# 部署 Playground

线上地址：https://blob-face.jiarui.ink

应用是纯静态站点，不需要运行时环境变量、数据库或持久卷。
浏览器中的角色状态保留在内存，语言和静音偏好保存在 localStorage。

## 构建与运行

使用 Node.js 22 和 lockfile 安装依赖，再运行 `npm run build:site`，
构建产物位于 `site/`。Dockerfile 在构建阶段完成这些步骤，
运行阶段仅使用 Nginx 提供 HTML、CSS、JavaScript 和图片。

本地容器验证：

```sh
docker build -t blob-faces .
docker run --rm -p 8080:80 blob-faces
```

访问 `http://localhost:8080/`；`/healthz` 应返回 `ok`。
HTML 每次重新验证缓存，带内容哈希的资源可长期缓存。

## Dokploy

- Source：GitHub provider，仓库 `Jiarui05/blob-faces`，分支 `main`。
- Build type：Dockerfile；文件 `Dockerfile`，构建上下文 `.`。
- Auto deploy：开启，触发事件为 push。
- Domain：`blob-face.jiarui.ink`，容器端口 `80`，Dokploy HTTPS 关闭。
- HTTPS：宿主机 Caddy 接收 80/443，自动申请并续期证书，再转发至
  `127.0.0.1:8080` 的 Traefik，由其按 Host 分发到应用。
- DNS：域名 A 记录指向部署服务器，由 Dokploy DNS provider 管理。

发布链路：GitHub push → Dokploy 拉取代码并构建镜像 → 更新容器 →
Caddy 终止 HTTPS → Traefik 按域名转发给 Nginx。发布后检查部署日志、容器健康状态、
首页与静态资源，并实际打开页面验证角色生成和 DNA 面板。

GitHub Actions 独立执行类型检查、单元测试和构建；Dokploy 的 push 触发
不会等待 Actions 结果，所以推送前应先在本地完成这些检查。

该服务器的 Caddy 配置需要包含以下站点块；修改后先执行 `caddy validate`，
通过后再平滑 reload。不要把其他站点的配置替换成这个片段。

```caddyfile
blob-face.jiarui.ink {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8080 {
        header_up Host {host}
        header_up X-Forwarded-Proto https
    }
}
```
