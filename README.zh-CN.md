# hyperf-admin-vue

基于 Art Design Pro 二次开发的管理后台前端（Vue 3 + Vite + TypeScript + Element Plus + Tailwind CSS）。

本仓库默认对接后端项目 `hyperf-admin-php`（Hyperf 3.1），后端返回统一 JSON：`{ code, msg, data }`，并使用 JWT 进行鉴权（`Authorization` 请求头）。

## 特性

- 登录鉴权：JWT（`Authorization: <token>` 或 `Authorization: Bearer <token>`）
- 权限模式：`VITE_ACCESS_MODE = backend`（动态菜单/按钮权限来自后端）
- API 代理：开发环境通过 Vite 代理转发 `/api`，避免跨域
- 工程化：ESLint / Prettier / Stylelint / Husky / lint-staged

## 环境要求

- Node.js >= 18
- pnpm

## 快速开始

1) 安装依赖

```bash
pnpm install
```

2) 启动开发环境

```bash
pnpm dev
```

默认端口见 `.env`（`VITE_PORT`）。

## 后端连接方式

本项目请求路径以 `/api` 开头，建议本地启动后端：`http://127.0.0.1:9503`。

开发环境通过 Vite Proxy 转发（见 `.env.development`）：

- `VITE_API_URL = /`
- `VITE_API_PROXY_URL = http://127.0.0.1:9503`
- 可选：`VITE_API_PROXY_HOST`（仅当后端需要按 Host 匹配时才设置）

代理实现：`vite.config.ts`。

生产环境默认 `VITE_API_URL = /`（建议由网关/Nginx 反向代理把同域 `/api` 转发到后端）。

## 构建

```bash
pnpm build
```

## 文档

- 后端说明（接口/权限/存储/校验等）：`hyperf-admin-php/doc.md`

## License

MIT
