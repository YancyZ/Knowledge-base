# React 前端编码规范

> 本文档为**通用 React 编码标准**，适用于 React 18+、TypeScript、Vite 技术栈。

---

## 一、总则

### 1.1 核心原则

1. **可读性优先**：代码是写给人看的，清晰胜过炫技
2. **命名见名知意**：禁止拼音首字母缩写（约定俗成的除外）、无意义变量名
3. **禁止硬编码**：常量、配置、错误码统一管理
4. **禁止提交垃圾代码**：`console.log`、`debugger`、本地配置文件不得入库
5. **统一格式化与 Lint**：全项目 ESLint + Prettier 一致
6. **保护主分支**：禁止直接向 `main` / `master` / `production` 推送

### 1.2 技术选型约定

| 类别 | 推荐方案 | 说明 |
|------|----------|------|
| 语言 | TypeScript | 业务代码禁止纯 JavaScript |
| 组件 | 函数组件 + Hooks | 禁止 Class 组件（除非维护遗留代码） |
| 构建 | Vite | 遵循官方最佳实践 |
| 包管理 | pnpm | 须提交 lock 文件 |
| 路由 | React Router v6+ | 页面懒加载 |
| 服务端状态 | TanStack Query | 列表、详情、缓存、失效 |
| 客户端状态 | Zustand / Context | 主题、权限、全局 UI 状态 |

### 1.3 强制红线

- 禁止滥用 `any`、无说明的 `@ts-ignore`、大面积 `eslint-disable`
- 禁止硬编码密钥、Token、内网敏感地址
- 禁止 `eval`、`new Function`
- 禁止未处理的 Promise rejection
- 禁止在可重排列表中使用 `index` 作为 `key`
- 禁止直接修改 props 和 state

---

## 二、工程与目录规范

### 2.1 推荐目录结构

```plaintext
src/
├── api/                # 请求封装、接口定义
│   ├── request.ts      # HTTP 客户端实例、拦截器
│   └── modules/        # 按业务模块拆分接口
├── assets/             # 图片、字体、全局样式
├── components/         # 公共组件
│   ├── base/           # 基础封装（Button、Table、Form）
│   └── business/       # 业务通用组件
├── config/             # 全局配置（枚举、常量、菜单）
├── hooks/              # 自定义 Hooks
├── layouts/            # 布局组件
├── router/             # 路由配置
├── store/              # 客户端状态管理
│   ├── modules/        # 按业务拆分
│   └── index.ts
├── types/              # 全局 TypeScript 类型
├── utils/              # 工具函数
├── views/              # 页面组件
├── App.tsx
└── main.tsx
```

### 2.2 编码格式

| 规则 | 值 |
|------|-----|
| 缩进 | 2 空格 |
| 引号 | 单引号（JS/TS），双引号（JSX 属性） |
| 行宽 | 100–120 字符 |
| 分号 | 与 Prettier 配置一致，全项目统一 |
| 大括号 | `if` / `for` 即使单行也须写 `{}` |
| 文件编码 | UTF-8 |

### 2.3 模块依赖分层

模块依赖须**自上而下、单向**，禁止循环引用。

| 层级 | 典型目录 | 可依赖 |
|------|----------|--------|
| 基础 | `types/`、`config/` | 标准库、第三方类型 |
| 工具 | `utils/` | 上一层、`types` |
| 接口 | `api/` | `utils`、`types`；**禁止** import `views` |
| 状态与逻辑 | `store/`、`hooks/` | `api`、`utils`、`types` |
| UI | `components/` | 上述各层 |
| 页面 | `views/` | 全栈向上引用 |

**导入顺序**：`import type …` → 第三方库 → 路径别名（`@/`）→ 相对路径。

---

## 三、命名规范

### 3.1 文件命名

| 类型 | 规则 | 示例 |
|------|------|------|
| 页面 / 组件 | PascalCase | `UserProfile.tsx` |
| 自定义 Hooks | `use` + camelCase | `useUserQuery.ts` |
| 工具 / 接口 / 配置 | camelCase | `request.ts`、`userApi.ts` |
| 样式文件 | 组件同名 + `.module.scss` | `UserProfile.module.scss` |
| 全局样式 | kebab-case | `variables.scss` |

### 3.2 变量与常量

```typescript
// 变量：小驼峰
const userList = [];
const totalCount = 0;

// 常量：全大写 + 下划线
const MAX_RETRY_COUNT = 3;
const DEFAULT_PAGE_SIZE = 20;

// Boolean：is / has / show 前缀
const isLoading = true;
const hasPermission = false;
const showModal = true;
```

### 3.3 函数与事件

```typescript
// 普通函数：动词 + 名词
function getUserList() {}
function updateProfile() {}

// 事件处理：handle 前缀
function handleSubmit() {}
function handleClick() {}
```

### 3.4 类型与接口

```typescript
// 接口数据类型
interface UserItem {
  id: string;
  name: string;
}

// 组件 Props
interface UserCardProps {
  user: UserItem;
  onEdit?: (id: string) => void;
}

// 枚举优于魔法数字
enum UserStatus {
  Active = 1,
  Inactive = 0,
  Banned = 2,
}
```

---

## 四、React 组件规范

### 4.1 基本规则

1. **一个文件一个组件**（小型私有子组件可同文件）
2. **固定结构顺序**：导入 → 类型 → Props → 状态 → Hooks → 计算属性 → 函数 → `useEffect` → JSX
3. **禁止 JSX 内复杂逻辑**：先计算再渲染
4. **条件嵌套不超过 3 层**：超出时用卫语句或抽取子组件

### 4.2 标准组件模板

```tsx
import { useState, useEffect, useCallback } from 'react';
import type { UserItem } from '@/types/user';

interface UserPanelProps {
  userId: string;
}

export function UserPanel({ userId }: UserPanelProps) {
  const [user, setUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserById(userId);
      setUser(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) return <div>加载中...</div>;
  if (!user) return null;

  return (
    <div className="user-panel">
      <h2>{user.name}</h2>
    </div>
  );
}
```

### 4.3 列表渲染

```tsx
// ✅ 正确：稳定 key + 先 filter 再 map
const visibleItems = list.filter((item) => item.visible);

return (
  <ul>
    {visibleItems.map((item) => (
      <li key={item.id}>{item.name}</li>
    ))}
  </ul>
);

// ❌ 错误：使用 index 作为 key（列表会重排时）
{list.map((item, index) => <li key={index}>{item.name}</li>)}
```

---

## 五、Hooks 规范

### 5.1 基本规则

- 自定义 Hook 必须以 `use` 开头
- **禁止**在条件、循环、`map` 内调用 Hooks
- `useEffect` 依赖项必须完整
- 副作用须返回清理函数（定时器、事件监听、订阅）

### 5.2 自定义 Hook 示例

```typescript
// hooks/useUserQuery.ts
import { useQuery } from '@tanstack/react-query';
import { getUserById } from '@/api/modules/user';

export function useUserQuery(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    enabled: Boolean(userId),
  });
}
```

### 5.3 useEffect 清理

```typescript
useEffect(() => {
  const timer = setInterval(fetchData, 5000);
  return () => clearInterval(timer);
}, [fetchData]);

useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [handleResize]);
```

---

## 六、TypeScript 规范

1. **禁止 `any`**：边界数据用 `unknown` 收窄
2. **禁止无说明的 `@ts-ignore`**
3. 类型统一放 `types/` 目录
4. 比较用 `===` / `!==`；空值合并用 `??`
5. 仅作类型使用的符号用 `import type`
6. 业务代码仅使用 ESM，禁止 `require`
7. 公共导出函数 / 组件宜写 JSDoc / TSDoc

### 边界类型收窄

```typescript
function parseUserId(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length === 0) {
    throw new Error('Invalid user id');
  }
  return raw;
}
```

---

## 七、状态管理规范

### 7.1 职责划分

| 场景 | 方案 |
|------|------|
| 组件内临时状态 | `useState` / `useReducer` |
| 跨组件共享（少量） | React Context |
| 客户端全局状态 | Zustand / Redux |
| 服务端数据 | TanStack Query |

**原则**：同一份服务端列表不要在 Store 和 Query 中重复缓存。

### 7.2 Zustand 示例

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStore {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'app-store' },
  ),
);
```

### 7.3 React Query 示例

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['users', { page, pageSize }],
  queryFn: () => fetchUsers({ page, pageSize }),
  staleTime: 60_000,
});

const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

---

## 八、请求与 API 规范

### 8.1 HTTP 客户端封装

```typescript
// api/request.ts
import axios from 'axios';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000,
});

request.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      redirectToLogin();
    }
    return Promise.reject(error);
  },
);

export default request;
```

### 8.2 接口组织

```plaintext
api/
├── request.ts
└── modules/
    ├── user.ts
    ├── order.ts
    └── product.ts
```

### 8.3 环境变量

- 仅使用 `import.meta.env` 中以 `VITE_` 前缀暴露的变量
- 须提供 `.env.example`，**禁止**提交真实 `.env`
- **禁止**密钥、Token 硬编码入库

---

## 九、路由规范

1. 页面使用 `lazy` + `Suspense`，须提供 fallback
2. 路由守卫集中处理权限
3. **path 使用 kebab-case**：如 `/user/profile`
4. 布局与页面分离

```tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

const UserProfile = lazy(() => import('@/views/UserProfile'));

const router = createBrowserRouter([
  {
    path: '/user/profile',
    element: (
      <Suspense fallback={<PageLoading />}>
        <UserProfile />
      </Suspense>
    ),
  },
]);
```

---

## 十、样式规范

### 10.1 核心选型

- **基础**：Sass (SCSS) + CSS Modules
- **Design Token**：CSS 变量集中管理颜色、间距、字体
- **命名**：BEM（`block__element--modifier`）

### 10.2 目录结构

```plaintext
src/assets/styles/
├── variables.scss    # 全局变量
├── mixins.scss       # 通用 mixin
├── reset.scss        # 样式重置
├── theme.scss        # 主题 CSS 变量
└── index.scss        # 全局入口
```

### 10.3 组件样式示例

```scss
// UserCard.module.scss
.card {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  &--highlight {
    border-color: var(--color-primary);
  }
}
```

### 10.4 样式红线

- 禁止 ID 选择器写样式
- 禁止滥用 `!important`
- 选择器嵌套不超过 3 层
- z-index 须用变量分层管理，禁止裸数字散落

---

## 十一、性能与可访问性

### 11.1 性能

- 路由级、重型组件使用懒加载
- 长列表使用虚拟滚动
- `memo` / `useMemo` / `useCallback` 按需使用，禁止无策略全树包裹
- 图片懒加载、适当压缩

### 11.2 可访问性

- 表单控件与 `label` 关联
- 纯图标按钮须提供 `aria-label`
- 禁止使用 `accessKey`
- 富文本渲染须白名单过滤（如 DOMPurify）

---

## 十二、测试规范

- 框架：**Vitest** + **Testing Library**
- 优先覆盖：`utils`、自定义 Hooks、纯逻辑函数
- 组件测试关注用户行为，而非实现细节

```typescript
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

test('renders user name', () => {
  render(<UserCard user={{ id: '1', name: 'Alice' }} />);
  expect(screen.getByText('Alice')).toBeInTheDocument();
});
```

---

## 十三、Git 与提交规范

### 13.1 分支命名

| 分支 | 用途 |
|------|------|
| `main` / `master` | 生产分支，不可直接提交 |
| `develop` | 日常开发集成分支 |
| `feature/模块-功能` | 新功能 |
| `bugfix/模块-问题` | Bug 修复 |
| `hotfix/模块-问题` | 紧急线上修复 |

### 13.2 Commit 格式（Conventional Commits）

```plaintext
type(scope): subject
```

| type | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 bug |
| docs | 文档 |
| style | 格式（不影响逻辑） |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试 |
| chore | 构建 / 依赖维护 |

示例：`feat(auth): 添加用户登录功能`

### 13.3 提交前检查

提交前须通过：`lint`、`typecheck`（若项目配置了对应脚本）。

---

## 十四、并发、性能与架构模式

### 14.1 React 18 并发特性

| API | 用途 | 注意 |
|-----|------|------|
| `useTransition` | 标记低优先级更新（筛选、Tab 切换） | 配合 `isPending` 展示 loading |
| `useDeferredValue` | 延迟渲染昂贵子树 | 适合搜索框 + 大列表 |
| `Suspense` | 异步组件 / 数据边界 | 须有 Error Boundary 兜底 |
| `startTransition` |  imperative 低优先级 | 勿包连点高频事件 |

```tsx
const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);
const isStale = query !== deferredQuery;

return (
  <>
    <input value={query} onChange={(e) => setQuery(e.target.value)} />
    <div style={{ opacity: isStale ? 0.6 : 1 }}>
      <HeavyList filter={deferredQuery} />
    </div>
  </>
);
```

### 14.2 何时 memo / useMemo / useCallback

**不要默认包裹所有组件**。仅在以下情况考虑：

1. 子组件渲染成本高（大列表项、复杂图表）且 props 常不变
2. 作为 Context value 的对象/函数，避免 Consumer 全量重渲染
3. 依赖数组传给 `useEffect` / `memo` 的比较函数

**无效优化**：简单 DOM 组件包 `memo`；每次 render 都 `useMemo(() => ({ ... }), [])` 但 deps 含新对象。

用 **React DevTools Profiler** 量化再优化。

### 14.3 状态分层决策树

```plaintext
数据是否来自服务端？
  ├─ 是 → TanStack Query（缓存、重试、失效）
  └─ 否 → 是否跨路由/多 subtree 共享？
           ├─ 是 → 全局频变？Zustand : Context + useMemo value
           └─ 否 → useState / useReducer
```

**反模式**：把所有 API 数据 copy 进 Zustand；Query 与 Store 双写同一列表。

### 14.4 组合模式（Composition Patterns）

**Compound Components** — 共享隐式状态、灵活布局：

```tsx
const TabsContext = createContext<{ active: string; setActive: (v: string) => void } | null>(null);

function Tabs({ children, defaultValue }: { children: React.ReactNode; defaultValue: string }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }: { children: React.ReactNode }) {
  return <div role="tablist">{children}</div>;
}

Tabs.List = TabList;
// Tab, TabPanel 同理 — API 如 <Tabs><Tabs.List>...</Tabs.List></Tabs>
```

优于 props 爆炸的 `<Tabs tabList={} onChange={} renderPanel={} />`。

### 14.5 Error Boundary 分层

```plaintext
App Root Boundary     ← 全页 fallback + 上报
  └─ Route Boundary     ← 单页崩溃不影响壳
       └─ Widget Boundary ← 图表/地图等隔离
```

Boundary **无法**捕获：事件 handler 内错误、async、SSR — 须 `try/catch` + 全局 `unhandledrejection`。

### 14.6 自定义 Hook 契约设计

公开 Hook 应明确：

- **输入契约**：参数类型、空值语义
- **输出契约**：loading / error / data 是否互斥
- **副作用边界**：是否订阅全局、何时 cleanup
- **稳定性**：返回的 callback 是否 `useCallback` 稳定

```typescript
interface UsePaginatedQueryResult<T> {
  data: T[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  page: number;
  setPage: (p: number) => void;
}
```

### 14.7 React Server Components（了解边界）

RSC（Next App Router 等）在**服务端**渲染组件，零 client JS 体积。  
**Client Component** 顶加 `'use client'`。须了解：

- 不能把 useState/useEffect 用于 Server Component
- 数据获取在服务端直读 DB，减少 client waterfall
- 与纯 SPA（Vite CSR）架构不同 — 选型在立项时确定

### 14.8 列表与表单性能

- 虚拟列表：`@tanstack/react-virtual`，overscan 调优
- 受控表单大字段：React Hook Form **非受控** + ref，避免每 keystroke 全树 render
- 避免在 Context 放高频更新值（如 scroll position）— 用 ref + 订阅或拆分 Context

---

## 十五、禁止行为汇总

| 类别 | 禁止项 |
|------|--------|
| 类型 | `any`、无说明 `@ts-ignore`、大面积 `eslint-disable` |
| React | 直接改 props/state、条件内调 Hooks、不稳定 key |
| 安全 | 硬编码密钥、`eval`、`dangerouslySetInnerHTML` 未过滤 |
| 调试 | 提交 `console.log`、`debugger` |
| 异步 | 未处理 Promise rejection |
| 模块 | 循环依赖、`api` 引用 `views` |
| 样式 | ID 选择器、裸 z-index、嵌套超 3 层 |

---

## 十六、小结

React 编码规范以 **函数组件 + Hooks + TypeScript** 为核心：状态分层（Query / Zustand / 本地 state）、组合模式优于 props 爆炸、Profiler 驱动性能优化、Error Boundary 分层隔离故障。并发特性（transition、deferred value）改善 INP；安全与可访问性须内建于组件 API 设计。规范须与 ESLint、CI 门禁配合，而非仅靠口头约定。
