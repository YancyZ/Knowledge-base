# Error Boundary 与错误恢复

**Error Boundary** 捕获子树 **render / 生命周期** 中的 JS 错误，展示降级 UI，避免整页白屏。它不捕事件 handler、异步、SSR 本身错误。

---

## 能捕 vs 不能捕

```mermaid
flowchart TB
  EB[Error Boundary]
  EB --> Y[子组件 render 抛错]
  EB --> Y2[子组件 lifecycle 抛错]
  EB --> N[事件 onClick 内 throw]
  EB --> N2[async/await 内 throw]
  EB --> N3[自己边界内 throw]
```

| ✅ 捕获 | ❌ 不捕获 |
|---------|-----------|
| 子组件 render | 事件处理器 |
| 子 lifecycle | setTimeout / Promise |
| 子 constructor | 边界自身 |

事件错误用 try/catch；异步用 `.catch` 或 Query error state。Boundary 只管渲染阶段的同步错误。

---

## 类组件实现（当前唯一官方方式）

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    // 上报 Sentry 等
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert">
          <h2>出错了</h2>
          <button type="button" onClick={() => this.setState({ hasError: false, error: null })}>
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Error Boundary 目前只能用类组件实现：`getDerivedStateFromError` 更新 state 显示 fallback，`componentDidCatch` 做上报。

---

## 放置策略

```tsx
<ErrorBoundary fallback={<AppCrash />}>
  <RouterProvider router={router} />
</ErrorBoundary>

// 路由级
{
  path: 'dashboard',
  element: <Dashboard />,
  errorElement: <RouteErrorPage />,
}

// 功能级
<ErrorBoundary fallback={<ChartError />}>
  <Suspense fallback={<ChartSkeleton />}>
    <Chart />
  </Suspense>
</ErrorBoundary>
```

| 层级 | 粒度 |
|------|------|
| 根 | 最后防线 |
| 路由 | 整页错误 |
| 组件 | 图表/侧边栏局部挂 |

分层放置：根 Boundary 防整页白屏，路由级用 `errorElement`，功能级隔离图表等独立模块。

---

## 与 Suspense / Query

```tsx
<ErrorBoundary fallback={<QueryError onRetry={refetch} />}>
  <Suspense fallback={<Spinner />}>
    <UserPanel />
  </Suspense>
</ErrorBoundary>
```

Query `isError` 也可组件内处理，不必全靠 Boundary，**预期错误**（404）用 UI 分支，**意外崩溃**用 Boundary。

Suspense 管 loading，Boundary 管 crash，Query isError 管预期业务错误，三者分工不同。

---

## react-error-boundary 库

```bash
pnpm add react-error-boundary
```

```tsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  FallbackComponent={({ error, resetErrorBoundary }) => (
    <div>
      <p>{error.message}</p>
      <button type="button" onClick={resetErrorBoundary}>重试</button>
    </div>
  )}
  onReset={() => queryClient.invalidateQueries()}
>
  <App />
</ErrorBoundary>
```

社区库 `react-error-boundary` 提供函数式 FallbackComponent 和 reset 机制，比手写类组件更简洁。

---

## 恢复策略

| 策略 | 说明 |
|------|------|
| reset state | 点重试清 `hasError` |
| 改 key remount | `<ErrorBoundary key={location.key}>` |
| invalidate 数据 | 配合 Query refetch |
| 跳安全路由 | Navigate to home |

路由变化时改 Boundary key 可以强制 remount 清错误态；数据错误配合 Query invalidate 重拉。

---

## 生产上报

```tsx
componentDidCatch(error, info) {
  reportError({
    message: error.message,
    stack: error.stack,
    componentStack: info.componentStack,
  });
}
```

勿把敏感 stack 直接展示给用户。`componentStack` 帮助定位出错组件树。

---

## 小结

Error Boundary 捕 render/lifecycle 错误但不捕事件和异步；分层放置，预期错误用 UI 分支，意外崩溃用 Boundary。

Error Boundary 捕获子树 render 和 lifecycle 的同步错误，不捕获事件 handler、setTimeout/Promise 和边界自身错误。目前只能用类组件实现，或用 `react-error-boundary` 库。放置策略：根级最后防线、路由级 errorElement、功能级隔离图表等模块。与 Suspense 配合：Suspense 管 loading，Boundary 管 crash；Query 预期错误（404）用 isError 分支，意外崩溃用 Boundary。恢复策略包括 reset state、改 key remount、invalidate 数据和跳转安全路由。生产环境在 componentDidCatch 上报 componentStack，勿向用户暴露完整 stack。
