# Next.js App Router 架构

**App Router**（`app/` 目录）是 Next.js 13+ 默认路由：**文件系统路由 + RSC + Layout + Server Action**。理解目录约定即可快速定位页面与数据逻辑。

---

## 目录结构

```
app/
├── layout.tsx          # 根布局
├── page.tsx            # /
├── loading.tsx         # Suspense fallback
├── error.tsx           # 错误边界
├── not-found.tsx
├── (marketing)/        # 路由组，不影响 URL
│   ├── about/page.tsx  # /about
│   └── layout.tsx
├── dashboard/
│   ├── layout.tsx      # /dashboard/*
│   └── page.tsx        # /dashboard
└── users/[id]/
    └── page.tsx        # /users/:id
```

```mermaid
flowchart TB
  Root[layout.tsx 根]
  Root --> Marketing["(marketing)/layout"]
  Root --> Dash[dashboard/layout]
  Marketing --> About[about/page]
  Dash --> DashPage[dashboard/page]
```

`app/` 目录即路由。括号 `(marketing)` 是路由组，不影响 URL，用于组织共享 layout。

---

## 特殊文件

| 文件 | 作用 |
|------|------|
| `layout.tsx` | 共享 UI，保留 state |
| `page.tsx` | 路由 UI |
| `loading.tsx` | 自动 Suspense 边界 |
| `error.tsx` | Client 错误 UI |
| `template.tsx` | 类似 layout 但 remount |
| `route.ts` | API Route Handler |

约定式文件：`loading.tsx` 自动包 Suspense，`error.tsx` 是 Client 错误边界，`route.ts` 定义 API 端点。

---

## Server / Client 默认

| 文件 | 默认 |
|------|------|
| `app/**/*.tsx`（无指令） | **Server Component** |
| 需 hooks / 事件 | 文件顶 `'use client'` |

```tsx
// app/users/[id]/page.tsx — Server
export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id);
  return <UserView user={user} />;
}
```

App Router 默认 Server Component，需要 Hooks 或事件的文件加 `'use client'`。

---

## 数据获取

```tsx
// 直接 async Server Component
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }, // ISR 60s
  });
  return res.json();
}

export default async function BlogPage() {
  const posts = await getPosts();
  return <PostList posts={posts} />;
}
```

| 缓存 | 写法 |
|------|------|
| 静态 | `fetch(..., { cache: 'force-cache' })` |
| 动态 | `{ cache: 'no-store' }` |
| 定时 | `{ next: { revalidate: N } }` |

Server Component 内直接 async fetch，通过 `cache` 和 `revalidate` 控制缓存策略。

---

## 与 Pages Router 对比

| | Pages (`pages/`) | App (`app/`) |
|---|------------------|--------------|
| 默认组件 | Client | Server |
| 数据 | getServerSideProps 等 | async 组件 / fetch |
| 布局 | `_app.tsx` 手写 | `layout.tsx` 嵌套 |
| 推荐 | 维护旧项目 | **新项目** |

新项目推荐 App Router；旧 Pages 项目可渐进迁移。

---

## Metadata 与 SEO

```tsx
export const metadata = {
  title: '用户详情',
  description: '...',
};

// 或动态
export async function generateMetadata({ params }) {
  const user = await getUser(params.id);
  return { title: user.name };
}
```

静态 metadata 导出对象；动态页面用 `generateMetadata` 异步生成 title 和 description。

---

## 部署

| 模式 | 平台 |
|------|------|
| Node server | Vercel、自托管 `next start` |
| Static export | `output: 'export'` 纯静态 |
| Edge | Middleware、部分 Route |

Node server 支持 SSR/RSC；static export 纯静态；Edge 跑 Middleware 和部分 Route Handler。

---

## 与 SPA 协作

| 模式 | 说明 |
|------|------|
| Next 全栈 | 主应用 |
| Next + 微前端 | 子应用 CSR |
| 仅 Next 做 marketing | 产品 SPA 子域 |

Next 不必包全站。marketing 用 Next SSR，产品区独立 SPA 子域，是常见分工。

---

## 小结

app/ 目录即路由；layout 嵌套共享 UI，默认 Server Component，交互加 use client。

Next.js App Router 用 `app/` 文件系统路由：layout 嵌套共享 UI 且保留 state，page 是路由 UI，loading/error 约定式 Suspense 和错误边界。默认 Server Component，需 Hooks/事件加 `'use client'`。数据获取在 async Server Component 内 fetch，用 cache/revalidate 控制静态/动态/ISR。与 Pages Router 比：App 默认 Server、layout 嵌套、async 组件取数。metadata/generateMetadata 处理 SEO。部署：Node server（SSR）、static export、Edge。可与 SPA 混合：Next 全栈、微前端子应用、或仅 marketing SSR。
