# 上线发布流程

上线前核对构建产物、环境变量、路由 fallback、监控、安全与回滚；SPA 和 Nuxt 按差异项验证，发布后 24 小时盯指标。

## 发布流程概览

```mermaid
flowchart LR
  Dev[开发完成] --> CI[CI 构建测试]
  CI --> Staging[预发验证]
  Staging --> Prod[生产发布]
  Prod --> Watch[监控 24h]
  Watch -->|异常| Rollback[回滚]
```

---

## 构建与产物

`pnpm build` 无错误警告；`vue-tsc` 类型检查通过；单元测试与冒烟 E2E 通过。bundle 体积无异常膨胀；Source map 上传 Sentry。SPA 的 `index.html` 短缓存，静态资源 hash 长缓存；Nuxt 确认 `.output` 部署路径正确。

---

## 环境变量

生产 API 地址非 dev/staging；`.env.production` 敏感信息不提交仓库。`VITE_*` / `NUXT_PUBLIC_*` 与运维台账一致；服务端密钥仅在 Nitro `runtimeConfig` 私有字段。功能开关默认值符合生产策略。

---

## 路由与服务器

History 模式需 fallback 到 `index.html`；`BASE_URL` 与子路径部署正确。HTTPS 强制跳转；gzip/brotli 已启用；CDN 刷新或版本化路径。Nuxt 确认 `routeRules` prerender/ssr 符合预期。

```nginx
# SPA fallback 示例
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 安全

CSP 头已配置；`X-Frame-Options` / `frame-ancestors` 设置。Cookie 设 `Secure` `HttpOnly` `SameSite`。依赖 `pnpm audit` 无未处理高危；无裸 `v-html` 用户内容；CORS 非 `*` 带凭证。

---

## 性能与体验

Lighthouse 性能达团队基线；LCP 关键图 preload；路由懒加载生效。404 / 500 友好页；加载骨架屏或 Suspense fallback。favicon、meta、OG 标签完整。

---

## 监控与日志

Sentry DSN 指向生产项目；`release` 版本号与 git tag 一致。Web Vitals 上报；告警规则已启用。BFF 健康检查端点 `/healthz`（如有）；日志无 console.debug 泄漏敏感信息。

---

## 业务与数据

支付/下单等核心流程预发走通；权限角色矩阵抽样验证。国际化各语言抽检；时区与日期格式正确。第三方 SDK（统计、客服）使用生产 key。

---

## 回滚预案

上一稳定版镜像/包可一键部署；数据库迁移可逆或向前兼容。动态 import 失败刷新策略已上线；on-call 与升级窗口已通知；回滚演练在预发做过。

---

## 微前端额外项

remoteEntry URL 生产可达；主应用与子应用版本兼容；共享 vue 版本一致；子应用独立回滚不影响主壳。

---

## 发布后 24 小时

错误率对比发布前；LCP/INP 大盘；客服/运营反馈通道；关闭迁移 feature flag（如适用）；发布说明归档。

---

## 发布前一键验证脚本

本地或 CI 在 `staging` 镜像上跑：

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "== 构建与类型 =="
pnpm vue-tsc --noEmit
pnpm build

echo "== 单元测试 =="
pnpm test:run

echo "== 依赖审计 =="
pnpm audit --audit-level=high || true  # 人工确认

echo "== 产物检查 =="
test -d dist && test -f dist/index.html
# 确认无 source map 泄露到公开目录（若策略为 hidden）
! ls dist/assets/*.map 2>/dev/null || echo "WARN: .map 在 dist 中"

echo "== 环境变量抽检 =="
rg 'localhost|127\.0\.0\.1|staging' dist/ && echo "FAIL: 产物含 dev 地址" && exit 1 || true

echo "OK"
```

**HTTP 头抽检**（生产 URL）：

```bash
curl -sI https://app.example.com | rg -i 'content-security-policy|x-frame-options|strict-transport'

# SPA fallback
curl -sI https://app.example.com/dashboard/deep | rg '200|text/html'
```

---

## Nuxt 与 SPA 差异项

| 项 | SPA (Vite) | Nuxt 3 |
|----|------------|--------|
| 产物目录 | `dist/` | `.output/` |
| 环境变量 | `VITE_*` | `NUXT_PUBLIC_*` + `runtimeConfig` |
| 路由 fallback | Nginx `try_files` | Nitro 自动 / `routeRules` |
| SSR 检查 | — | `curl` 看 view-source 含内容 |
| 预渲染 | — | `nitro prerender` 路由列表 |

**Nuxt 预发 smoke**：

```bash
node .output/server/index.mjs &
sleep 2
curl -sf http://localhost:3000/healthz || curl -sf http://localhost:3000/
pnpm exec playwright test --grep @smoke
```

---

## 回滚演练记录模板

| 字段 | 示例 |
|------|------|
| 上一稳定 tag | `v2.4.1` |
| 回滚命令 | `kubectl rollout undo` / 重新部署 artifact |
| 数据库迁移 | 可逆 / 向前兼容 |
| 验证项 | 登录 + 下单 smoke |
| 演练时间 | 2026-06-20 预发 |
| 耗时 | 8 min |

每次大版本发布前在预发完成一次回滚演练并归档。

---

## 小结

上线前 prod build 通过，环境变量注入正确，无 dev 依赖泄漏。History 模式 SPA 需服务器 fallback；HTTPS 与安全头就绪。Sentry / RUM 监控与告警配置完成；保留上一版本 artifact 以便快速回滚。发布后 24h 盯错误率与 Web Vitals，微前端场景额外验证 remoteEntry 可达与 vue 版本一致。
