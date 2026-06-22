#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const INTRO_FIXES = {
  "前端框架篇/Vue/16-Nuxt与SSR/01-CSR-SSR-SSG概念.md":
    "CSR、SSR、SSG 的差别在首屏 HTML 由谁、在何时生成。先想清楚 SEO 和首屏要求，再权衡运维成本；工程上 Nuxt 3 能统一路由和部署。",
  "前端框架篇/Vue/16-Nuxt与SSR/02-createSSRApp与hydration.md":
    "SSR 用 `createSSRApp`，服务端 `renderToString`，客户端 `mount` 做 hydration。关键是双端渲染结果一致；`setup` 里慎用仅客户端 API。",
  "前端框架篇/Vue/16-Nuxt与SSR/03-Nuxt3目录与路由.md":
    "Nuxt 3 靠约定式目录组织工程：`pages` 生成路由，`layouts` 套骨架，`middleware` 做守卫；`definePageMeta` 能写进高效 SSR 应用。",
  "前端框架篇/Vue/16-Nuxt与SSR/04-useFetch与Server-Routes.md":
    "Nuxt SSR 数据层用 `useFetch` / `useAsyncData`，自动去重并避免双端重复请求；`server/` 目录当 BFF，`runtimeConfig` 管密钥。",
  "前端框架篇/Vue/16-Nuxt与SSR/05-预渲染与部署.md":
    "Nuxt 3 的 Nitro 把 SSR、SSG、API 打成 `.output` 产物；`routeRules` 可按路由混用渲染模式。部署前分清 `build` 和 `generate`，用 `preview` 验 hydration。",
  "前端框架篇/Vue/17-测试/01-Vitest与测试分层.md":
    "Vue 3 + Vite 项目默认用 Vitest 做单元和组件测试。常见分层：底层 composables/utils，中层 Vue Test Utils，上层 Playwright 守关键路径。",
  "前端框架篇/Vue/17-测试/03-Router-Pinia-mock.md":
    "组件测试要隔离全局依赖：每个用例新建 Pinia；Router 用 Memory History 或 stub；Store 逻辑优先单测 action。",
  "前端框架篇/Vue/17-测试/04-Composables单测.md":
    "无生命周期的 composable 可直接在 Vitest 里调用；含 `onMounted` 的要包进 setup。异步用 `flushPromises`，定时器用 `vi.useFakeTimers`。",
  "前端框架篇/Vue/17-测试/05-Playwright-E2E.md":
    "Playwright 适合守少量高价值用户路径：用 `getByRole` 定位，`storageState` 复用登录，CI 开 trace 和重试。",
  "前端框架篇/Vue/18-国际化-安全与可访问性/01-vue-i18n组合式用法.md":
    "vue-i18n v9+ 开 `legacy: false`，在组件里用 `useI18n` 的 `t` / `locale`。大项目懒加载语言包、key 语义化；Nuxt 优先 `@nuxtjs/i18n`。",
  "前端框架篇/Vue/18-国际化-安全与可访问性/02-v-html与XSS防护.md":
    "Vue 插值默认安全；`v-html` 是常见的破防入口。不可信 HTML 走 DOMPurify 白名单，再配合 CSP 做纵深防御。",
  "前端框架篇/Vue/18-国际化-安全与可访问性/03-可访问性基础.md":
    "a11y 从语义 HTML 起步：真按钮、关联 label、图片 alt；动态 UI 再补 ARIA。配合 ESLint a11y 规则和 axe 做回归。",
  "前端框架篇/Vue/18-国际化-安全与可访问性/04-焦点管理与弹层.md":
    "弹层打开时移焦点并做 Tab 陷阱，关闭后把焦点还给触发器。Vue 里用 Teleport，配合 `useFocusTrap` 或成熟 UI 库。",
  "前端框架篇/Vue/18-国际化-安全与可访问性/05-Review清单.md":
    "PR Review 要覆盖 i18n、XSS、a11y、Vue 惯用法和测试。作者先自检，Reviewer 按 Blocker → Major 卡点。",
  "前端框架篇/Vue/19-Vue2迁移与版本演进/01-Vue2遗留项目现状.md":
    "Vue 2 已 EOL，策略在冻结、维持、迁移之间取舍；2.7 可作过渡，长期出路是 Vue 3 + Vite + Pinia。",
  "前端框架篇/Vue/19-Vue2迁移与版本演进/02-破坏性变更清单.md":
    "Vue 2→3 的破坏性变更集中在应用入口、v-model 协议、filters/事件总线移除、v-if/v-for 优先级等；用 codemod 和 compat 抓遗漏。",
  "前端框架篇/Vue/19-Vue2迁移与版本演进/03-vue-compat渐进迁移.md":
    "`@vue/compat` 在 Vue 3 运行时兼容 Vue 2 行为：配 Vite alias 和 `configureCompat`，按警告 ID 逐项关闭，最后移除 compat。",
  "前端框架篇/Vue/19-Vue2迁移与版本演进/04-Vue3.4-3.5新特性.md":
    "3.4/3.5 强化了 Props 解构、`defineModel`、`useTemplateRef` 和 SSR hydration；多数项目可低风险 MINOR 升级，跟进 CHANGELOG 即可。",
  "前端框架篇/Vue/19-Vue2迁移与版本演进/05-升级Checklist.md":
    "Vue 2→3 分准备、工具链、代码迁移、测试、发布五阶段；走 compat 的项目还要跟踪警告清零和 alias 移除。",
  "前端框架篇/Vue/20-跨端与生产实践/01-uni-app与小程序.md":
    "uni-app 用 Vue 语法加条件编译覆盖国内小程序和 H5；要熟悉 `pages.json`、view 标签、uni 导航 API 和 `#ifdef`。",
  "前端框架篇/Vue/20-跨端与生产实践/02-微前端与模块联邦.md":
    "Vue 微前端可选 qiankun（应用级）或 Module Federation（模块级）；关键是 Vue 单例、路由 base 和样式隔离，先评估运维能力再引入。",
  "前端框架篇/Vue/20-跨端与生产实践/03-性能调优.md":
    "Vue 性能调优先测量再动手：减渲染（v-memo/shallow）、减包体（懒加载）、减 DOM（虚拟列表）；KeepAlive 记得设 max。",
  "前端框架篇/Vue/20-跨端与生产实践/04-监控与排障.md":
    "生产监控靠 `errorHandler` 加 Sentry 兜底；熟记 hydration、inject、动态 import 的高频错误。Source Map 上传平台，别公开暴露。",
  "前端框架篇/Vue/20-跨端与生产实践/05-上线Checklist.md":
    "上线前核对构建产物、环境变量、路由 fallback、监控、安全与回滚；SPA 和 Nuxt 按差异项验证，发布后 24 小时盯指标。",
};

for (const [rel, intro] of Object.entries(INTRO_FIXES)) {
  const file = path.join(ROOT, rel);
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  if (!lines[0]?.startsWith("# ")) continue;
  let idx = 1;
  while (idx < lines.length && lines[idx].trim() === "") idx++;
  if (idx >= lines.length) continue;
  lines[idx] = intro;
  fs.writeFileSync(file, lines.join("\n"), "utf8");
  console.log("intro:", rel);
}
