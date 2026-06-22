# 跨端选型与 Monorepo 实践

**Web + 移动 + 桌面** 是否共用代码，取决于产品形态。本篇对比 **Tauri / Electron / RN / Capacitor**，并给出 **pnpm workspace** 目录建议。

---

## 跨端方案对比

| 方案 | 技术 | 适用 |
|------|------|------|
| **Web SPA** | React + Vite | 浏览器 |
| **React Native** | 原生渲染 | iOS/Android App |
| **Expo** | RN 工具链 | 快速 App |
| **Capacitor** | WebView 包 H5 | 轻 App、复用 Web |
| **Electron** | Chromium 壳 | 桌面（重） |
| **Tauri** | 系统 WebView + Rust | 桌面（轻） |

```mermaid
flowchart TB
  Shared[shared 逻辑层]
  Shared --> Web[Web React]
  Shared --> RN[RN]
  Shared --> Desk[Tauri/Electron]
```

---

## 何时 WebView（Capacitor）

| ✅ | ❌ |
|----|-----|
| 已有成熟 H5 | 要复杂原生动画 |
| 快速上架 | 极致性能 |
| 团队只会 Web | 大量原生 API |

RN 适合**要原生列表/手势**的 App。

---

## Monorepo 结构

```
apps/
├── web/              # Vite
├── mobile/           # Expo
└── admin/            # 另一 SPA
packages/
├── ui-web/           # Web 组件
├── api-client/       # fetch + Query hooks
├── types/
└── utils/
pnpm-workspace.yaml
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

| 包 | 内容 |
|----|------|
| `api-client` | `fetchUser`、`useUsers` |
| `types` | User、Order |
| `ui-web` | 仅 Web 的 Button |

---

## 共享 TanStack Query

```tsx
// packages/api-client/users.ts
export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers });
}
```

Web 与 RN 各包一层 `QueryClientProvider`，**共享 hook 定义**。

---

## 样式策略

| 层 | Web | RN |
|----|-----|-----|
| 设计 token | CSS 变量 | 同一 JSON token |
| 组件 | Tailwind / shadcn | NativeWind 或独立 |

**完全共享 JSX** 需 react-native-web 或 Tamagui 等跨端 UI 库。

---

## 构建与 CI

```mermaid
flowchart LR
  PR[PR]
  PR --> Lint[lint 全仓]
  PR --> Test[test shared + web]
  PR --> BuildW[build web]
  PR --> BuildM[build mobile 可选]
```

Turborepo / Nx 可缓存 task（可选）。

---

## 选型决策

| 问题 | 倾向 |
|------|------|
| 只要浏览器 | 单体 Vite，不 monorepo |
| Web + App 业务一致 | monorepo + shared |
| 桌面内嵌现有 Web | Tauri/Capacitor |

---

## 小结

逻辑共享优于 UI 强行共享；pnpm workspace + shared 包，RN vs WebView 按体验选型。

跨端方案：Web SPA、RN/Expo（原生 App）、Capacitor（WebView 轻 App）、Electron/Tauri（桌面）。Capacitor 适合已有 H5 快速上架；RN 适合要原生体验。Monorepo：apps/（web/mobile/admin）+ packages/（api-client/types/utils/ui-web），pnpm workspace。共享 TanStack Query hook 定义，各端包 QueryClientProvider。样式：设计 token 跨端共享，组件通常分叉；完全共享 JSX 需 react-native-web/Tamagui。CI：lint/test/build 全仓。选型：仅浏览器→单体 Vite；Web+App→monorepo+shared；桌面→Tauri/Capacitor。
