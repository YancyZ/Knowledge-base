# HOC 与 Render Props

> **高阶组件（HOC）** 与 **Render Props** 是 Hooks 时代之前的逻辑复用模式。新代码优先 **自定义 Hook**；维护遗留库与理解 Radix 等仍需要认识它们。

---

## 一、高阶组件（HOC）

**HOC**：接收组件，返回增强后的新组件。

```tsx
function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;
    return <Component {...props} />;
  };
}

const ProtectedDashboard = withAuth(Dashboard);
```

```mermaid
flowchart LR
  In[Dashboard]
  HOC[withAuth]
  Out[ProtectedDashboard]
  In --> HOC --> Out
```

| 用途 | 示例 |
|------|------|
| 鉴权 | withAuth |
| 注入数据 | connect (Redux 旧) |
| 日志 | withLogger |

### 1.1 HOC 约定

| 规则 | 原因 |
|------|------|
| 透传 props | 不破坏原组件 |
| 复制 displayName | DevTools 可读 `WithAuth(Dashboard)` |
| 不要在内层改 ref | 用 forwardRef 或 Hook |

### 1.2 HOC 缺点

| 缺点 | 表现 |
|------|------|
| 嵌套地狱 | withA(withB(withC(C))) |
| props 来源不明 | 同名 props 冲突 |
| 类型推导繁琐 | TS 泛型多层 |

**替代**：`function Page() { useAuth(); ... }` 或布局路由守卫。

---

## 二、Render Props

```tsx
function MouseTracker({
  render,
}: {
  render: (pos: { x: number; y: number }) => React.ReactNode;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div
      onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}
      style={{ height: 200 }}
    >
      {render(pos)}
    </div>
  );
}

<MouseTracker render={({ x, y }) => <p>{x}, {y}</p>} />
```

| 对比 HOC | Render Props |
|----------|--------------|
| 包装组件 | 函数参数拿数据 |
| 隐式注入 props | 显式 render 参数 |

**children 作函数**：

```tsx
<MouseTracker>{pos => <p>{pos.x}</p>}</MouseTracker>
```

---

## 三、Hooks 替代

```tsx
function useMouse() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    node.addEventListener('mousemove', move);
    return () => node.removeEventListener('mousemove', move);
  }, []);
  return { pos, ref };
}
```

| 模式 | 现状 |
|------|------|
| HOC | 遗留、库内部 |
| Render Props | 部分库仍用 |
| **自定义 Hook** | **首选** |

---

## 四、何时仍会遇到

| 来源 | 说明 |
|------|------|
| `react-router` v5 `render prop` | v6 改 Hook |
| `react-helmet` 旧 API | — |
| Redux `connect` | 推荐 `useSelector` |

---

## 五、小结

| 模式 | 记忆 |
|------|------|
| HOC | 包一层组件 |
| Render Props | render={(data) => ...} |
| 新项目 | 自定义 Hook |

**上一篇**：[02-容器与展示分离](./02-容器与展示分离.md)  
**下一篇**：[04-插槽-多态与as-prop](./04-插槽-多态与as-prop.md)
