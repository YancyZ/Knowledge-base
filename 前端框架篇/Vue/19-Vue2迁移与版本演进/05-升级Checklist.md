# Vue 2→3 升级流程

Vue 2→3 分准备、工具链、代码迁移、测试、发布五阶段；走 compat 的项目还要跟踪警告清零和 alias 移除。

## 升级全景

```mermaid
flowchart LR
  Prep[准备] --> Build[构建迁移]
  Build --> Code[代码迁移]
  Code --> Test[测试验证]
  Test --> Release[发布回滚]
```

---

## 准备阶段

确认业务窗口与冻结期；做依赖审计（`npm ls vue`、UI 库、内部包）；建立迁移分支；若无关键路径 E2E 应补全；记录当前 bundle 大小与 LCP 基线；团队培训 Composition API 与破坏性变更；选择 compat 渐进或大爆炸策略。

---

## 构建与工具链

Vue CLI 迁移到 Vite（推荐）或 CLI 5 + Vue 3。`vue` 升至 3.x，按需引入 `@vue/compat`。升级 `vue-router@4`、`pinia` 或 `vuex@4`；配置 `@vitejs/plugin-vue` 与 TS `moduleResolution: bundler`。`vue-tsc` 与 ESLint vue3 规则集须通过；UI 库换 Vue 3 版本（Element Plus 等）；环境变量改为 `VITE_*` 前缀。

---

## 代码迁移

`new Vue` → `createApp`；全局 API 迁至 `app.config` / `app.use`。filters 全部移除；`$on` 事件总线 → mitt / Pinia。组件 v-model 协议更新；`$listeners` 合并进 `$attrs`。`v-if` + `v-for` 拆分到 `<template v-for>`；生命周期重命名。Router `addRoutes` → `addRoute`。若用 compat，警告清零后移除 `@vue/compat` alias。

---

## 测试验证

单元测试全绿；VTU 升至 v2 API。组件快照更新需有意审查。E2E 主流程通过；手工验证登录、表单、权限、支付。SSR/Nuxt 项目确认 hydration 无警告。多浏览器冒烟；性能对比无显著回退。

---

## 发布与回滚

预发环境全量回归；Source map 上传监控平台。灰度发布或功能开关；回滚包/镜像 tag 就绪。上线后 24h 监控错误率；CHANGELOG 与团队公告；关闭迁移 Epic，更新 README Node 版本。

---

## 上线后一周

Sentry 新错误分类处理；性能指标对比报告；遗留 TODO/issue 归档；回顾估时准确度。

---

## 风险登记

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 第三方插件不兼容 | 中 | 高 | 提前 spike |
| 测试不足导致回归 | 中 | 高 | E2E + 灰度 |
| 工期膨胀 | 高 | 中 | 垂直切片 |

---

## CI 门禁

合并前必过：`pnpm vue-tsc ，noEmit`、`pnpm lint`、`pnpm test:run`、`pnpm exec playwright test ，grep @smoke`。compat 阶段可加警告数不超过基线。

---

## 小结

Vue 2→3 升级分准备、工具链、代码迁移、测试验证、发布回滚五阶段。compat 项目额外跟踪警告清零与移除 `@vue/compat` alias。CI 门禁 typecheck + unit + E2E 合并前必过。发布前预发全量回归，保留回滚 artifact，上线后 24h 盯错误率与 Vitals。第三方插件不兼容与测试不足是主要风险，宜提前 spike 与补 E2E。
