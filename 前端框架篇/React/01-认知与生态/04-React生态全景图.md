# React 生态全景图

React 只管视图层，路由、请求、全局状态、样式、测试都要在生态里选；按分层模型梳理常见选型，并标出「全进 Redux」「到处 Context」这类反模式。

---

## 生态分层：各层回答什么问题

```mermaid
flowchart TB
  subgraph meta [元框架层]
    Next[Next.js]
    Remix[Remix]
    Expo[Expo Router]
  end
  subgraph ui [UI 层]
    React[React 核心]
    RUI[Radix / shadcn / MUI / Ant Design]
  end
  subgraph data [数据层]
    Query[TanStack Query]
    SWR[SWR]
    RTK[RTK Query]
  end
  subgraph state [客户端状态]
    Zustand[Zustand]
    Redux[Redux Toolkit]
    Jotai[Jotai]
  end
  subgraph route [路由]
    RR[React Router]
  end
  subgraph build [构建]
    Vite[Vite]
    Rspack[Rspack]
  end
  meta --> React
  React --> RUI
  React --> Query
  React --> Zustand
  React --> RR
  build --> meta
  build --> React
```

| 层次 | 回答的问题 |
|------|------------|
| **React 核心** | 组件如何渲染、更新 |
| **元框架** | 路由文件在哪、SSR/RSC 怎么做 |
| **数据/状态** | 服务端数据放哪、全局 UI 状态放哪 |
| **UI 库** | 按钮表格 Modal 谁提供 |
| **构建** | 如何打包、HMR、代码分割 |

---

## 元框架：在 React 之上集成路由与渲染模式

| 框架 | 特点 | 典型场景 |
|------|------|----------|
| **Next.js** | App Router、RSC、Server Actions、生态最大 | 官网、电商、全栈 TS |
| **Remix** | Web 标准、Loader/Action、嵌套路由数据 | 表单重、Web Fundamentals |
| **Expo Router** | React Native + 文件路由 | 移动 App |
| **Gatsby** | 静态站点、GraphQL 源 | 博客、营销（份额下降） |

```mermaid
flowchart LR
  subgraph csr [纯 CSR SPA]
    V[Vite] --> RR2[React Router]
  end
  subgraph ssr [SSR / 混合]
    N[Next.js] --> RSC2[RSC + Client]
  end
```

- 只要浏览器里跑、后端已有 API → **Vite SPA**
- 要强 SEO、首屏、服务端取数 → **Next.js**（或 Remix）

---

## 路由

| 库 | 版本 | 适用 |
|----|------|------|
| **React Router** | v6 / v7 | SPA、也可嵌在部分全栈方案 |
| **TanStack Router** | 类型安全路由 | 新项目可选 |
| 框架自带 | Next / Remix | 不必再装 RR |

React Router v6 核心 API：

| API | 作用 |
|-----|------|
| `<Routes>` / `<Route>` | 路径 → 组件映射 |
| `<Outlet />` | 嵌套子路由出口 |
| `useNavigate` | 编程式导航 |
| `useParams` / `useSearchParams` | 动态段、查询串 |
| Data Router | `loader` / `action` 与路由绑数据 |

---

## 服务端状态 vs 客户端状态

先分清数据从哪来：

```mermaid
flowchart TB
  Q[这份数据从哪来?]
  Q -->|HTTP/API| Server[服务端状态<br/>TanStack Query / SWR]
  Q -->|仅前端需要| Client[客户端状态<br/>useState / Zustand]
```

| 类型 | 例子 | 推荐 |
|------|------|------|
| **服务端状态** | 用户列表、商品详情、分页 | **TanStack Query** |
| **客户端 UI 状态** | 侧边栏开闭、主题、向导步骤 | useState / Zustand |
| **表单草稿** | 当前输入 | 本地 state 或 RHF |
| **URL 状态** | 页码、筛选、tab | searchParams |

**TanStack Query** 是服务端数据的默认首选：

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['users', page],
  queryFn: () => fetchUsers(page),
});
```

| 能力 | 说明 |
|------|------|
| 缓存 | 同 key 不重复请求 |
| 后台刷新 | staleTime、refetchOnFocus |
| 突变 | `useMutation` + 失效缓存 |
| 乐观更新 | UI 先变，失败回滚 |

客户端全局状态选型：

| 库 | 特点 | 何时选 |
|----|------|--------|
| **Zustand** | 小 API、无 Provider 地狱 | 大多数全局 UI |
| **Redux Toolkit** | 规范强、DevTools、中间件 | 大型、时间旅行调试 |
| **Jotai / Recoil** | 原子化 | 细粒度订阅 |
| **Context** | 内置 | 低频、小范围主题/语言 |

---

## 样式与 UI 组件库

| 方案 | 优点 | 注意 |
|------|------|------|
| **CSS Modules** | 作用域清晰、零运行时 | Vite 原生支持 |
| **Tailwind CSS** | 快、设计一致 | 类名长；团队需约定 |
| **CSS-in-JS** styled-components / Emotion | 组件内聚 | 运行时成本；RSC 限制 |
| **Vanilla Extract** | 零运行时 CSS | 构建时生成 |
| **组件库** MUI / Ant Design / shadcn | 开箱即用 | 包体积、定制成本 |

UI 组件库代表：

| 类型 | 代表 | 说明 |
|------|------|------|
| 全量组件库 | Ant Design、MUI | 企业后台常见 |
| Headless + 样式 | **Radix** + **shadcn/ui** | 可访问性、可复制源码 |
| 移动端 | Ant Design Mobile | H5 |
| 图表 | ECharts、Recharts | 与 React 包装层配合 |

shadcn/ui 把组件复制进项目，不是 npm 里一个大包，便于改。

---

## 表单、测试、动画、国际化

**表单**：

| 方案 | 适用 |
|------|------|
| 受控 + useState | 字段极少 |
| **React Hook Form** + **zod** | 中大型表单、校验 |
| Formik | 遗留项目 |
| Server Actions + 19 Forms | Next 全栈 |

**测试**：

| 工具 | 用途 |
|------|------|
| **Vitest** | 单元测试运行器（Vite 系） |
| **React Testing Library** | 按用户行为测组件 |
| **MSW** | Mock HTTP |
| **Playwright / Cypress** | E2E |
| **Storybook** | 组件隔离开发、文档 |

**动画与交互**：

| 库 | 说明 |
|----|------|
| CSS transition / animation | 简单 hover、展开 |
| **Framer Motion** | 声明式动画、布局动画 |
| **@dnd-kit** | 拖拽 |

**国际化与无障碍**：

| 需求 | 工具 |
|------|------|
| i18n | **react-i18next**、FormatJS |
| a11y lint | eslint-plugin-jsx-a11y |
| 焦点陷阱 | Radix Dialog、focus-trap-react |

---

## 典型技术栈组合（2025 参考）

**中后台 SPA**：

| 层 | 选型 |
|----|------|
| 构建 | Vite |
| 路由 | React Router v6 |
| 服务端数据 | TanStack Query |
| 全局 UI | Zustand |
| UI | Ant Design 或 shadcn |
| 表单 | RHF + zod |
| 请求 | axios 封装 |

**面向 C 端 / SEO**：

| 层 | 选型 |
|----|------|
| 框架 | Next.js App Router |
| 数据 | Server Component 取数 + Query 客户端 |
| 样式 | Tailwind + shadcn |
| 部署 | Vercel / 自建 Node |

---

## 选型反模式

| 反模式 | 为什么不好 |
|--------|------------|
| 所有数据进 Redux | 服务端数据应用 Query，Redux 变缓存二份 |
| 到处 Context 大对象 | 任意字段变 → 全树重渲染 |
| 重复装多个 UI 库 | 体积、风格不统一 |
| 每个列表自己 fetch + useEffect | 无缓存、竞态、难维护 |
| 为了用 Hook 而拆过度细组件 | 可读性下降 |

**对错对比**：

```tsx
// ❌ 列表数据塞 Redux，还要自己管 loading/error/缓存
dispatch(fetchUsers());

// ✅ 服务端状态交给 Query
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
```

```tsx
// ❌ 一个 Context 包 user + theme + cart，theme 变全树 render
const AppContext = createContext({ user, theme, cart });

// ✅ 按变更频率拆分，或高频用 Zustand selector
```

---

## 生态学习顺序

```mermaid
flowchart LR
  R[React 核心] --> RR[React Router]
  R --> Q[TanStack Query]
  R --> Z[Zustand 按需]
  RR --> N[Next 可选]
  Q --> N
```

1. 熟练组件 + Hooks
2. React Router + Query
3. 按需 Zustand、RHF、UI 库
4. 需要 SSR 再上 Next / RSC

---

## 小结

React **只管视图**；路由、请求、全局状态、样式、测试由生态补齐，不宜全塞进 `useEffect`。

**元框架**：纯 SPA 用 Vite + React Router；SEO/全栈用 Next.js App Router。

**数据分工**：API 数据用 **TanStack Query**；全局 UI 状态用 **Zustand** 或小范围 **Context**；URL 可分享状态用 **searchParams**。

**表单**：字段少用受控 state；中大型用 **RHF + zod**。**UI**：shadcn / Ant Design / MUI 择一为主。**测试**：Vitest + RTL。

**反模式**：服务端数据全进 Redux、大 Context 包一切、多 UI 库混用、每页手写 fetch + useEffect。

**学习顺序**：组件 + Hooks → Router + Query → 按需 Zustand/RHF → SSR 再上 Next。

**易混点**：Context ≠ 状态管理万能解；Redux ≠ 服务端数据缓存；Query 管服务端状态，Redux/Zustand 管客户端 UI 状态。
