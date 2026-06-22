# React Router v6 基础

SPA 需要路由把 URL 映射到组件：**可分享、可后退**，路径即位置。React Router v6 用 `element={<Page />}` 映射组件，新项目优先 **createBrowserRouter**（Data Router）。

---

## 为什么需要路由？

```mermaid
flowchart LR
  URL[/users/42]
  URL --> Router[React Router]
  Router --> Page[UserDetail 组件]
```

| 无路由 | 有路由 |
|--------|--------|
| 用 state 切换「假页面」 | URL 可分享、可后退 |
| 刷新丢状态 | 路径即位置 |
| 难做鉴权边界 | 按路由守卫 |

---

## 安装与最小示例

```bash
pnpm add react-router-dom
```

```tsx
import { createBrowserRouter, RouterProvider, Link, Outlet } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'users/:userId', element: <UserDetail /> },
    ],
  },
]);

function RootLayout() {
  return (
    <>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/about">关于</Link>
      </nav>
      <main><Outlet /></main>
    </>
  );
}

// main.tsx
<RouterProvider router={router} />
```

| API | 作用 |
|-----|------|
| `createBrowserRouter` | 创建路由表（Data Router） |
| `RouterProvider` | 注入路由上下文 |
| `Link` | 声明式跳转，不刷新页 |
| `Outlet` | 子路由渲染出口 |

---

## 声明式 vs Data Router

### 旧式 JSX 路由（仍可用）

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/users/:userId" element={<UserDetail />} />
  </Routes>
</BrowserRouter>
```

### Data Router（推荐）

```tsx
createBrowserRouter([...])
```

| Data Router | JSX Routes |
|-------------|------------|
| 支持 loader / action | 需自己 fetch |
| 错误边界 `errorElement` | 需手写 |
| 推荐新项目 | 小 demo 够用 |

---

## 常用 Hooks

```tsx
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';

function UserDetail() {
  const { userId } = useParams();           // 路径 :userId
  const navigate = useNavigate();
  const location = useLocation();           // pathname、state
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <button type="button" onClick={() => navigate(-1)}>返回</button>
  );
}
```

| Hook | 用途 |
|------|------|
| `useParams` | 动态段 `/:id` |
| `useNavigate` | 编程式导航 |
| `useLocation` | 当前 location 对象 |
| `useSearchParams` | `?page=1` 读写 |

---

## Link vs NavLink

```tsx
<NavLink
  to="/users"
  className={({ isActive, isPending }) =>
    isActive ? 'nav active' : 'nav'
  }
>
  用户
</NavLink>
```

| | Link | NavLink |
|---|------|---------|
| 样式 | 普通链接 | 可感知 `isActive` |
| 场景 | 一般跳转 | 导航菜单高亮 |

---

## 相对路径

v6 路由**默认相对**父 path：

```tsx
{ path: 'users', children: [
  { index: true, element: <UserList /> },
  { path: ':userId', element: <UserDetail /> },  // 实际 /users/:userId
]}
```

`Link to="123"` 在 `/users` 下 → `/users/123`。

---

## 404 与通配

```tsx
{ path: '*', element: <NotFound /> }
```

放在路由表**最后**。

---

## 与 TanStack Query

路由变 → 组件 mount → `useParams` 变 → Query key 变：

```tsx
const { userId } = useParams();
const { data } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId!),
  enabled: !!userId,
});
```

---

## 小结

v6 用 **`element={<Page />}`** 映射组件；**`<Outlet />`** 渲染子路由。**useNavigate** 编程式导航；**useParams / useSearchParams** 读 URL 状态。

新项目优先 **createBrowserRouter**（Data Router）。**NavLink** 自带 active 样式；404 用 `path="*"`。

常见错因：路由参数是否进了 Query 的 queryKey？404 路由是否放在表末尾？
