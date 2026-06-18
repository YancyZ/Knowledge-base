# Zustand 与轻量全局状态

> **Zustand** 是小 API、无 Provider 包裹的 global store，支持**细粒度订阅**，适合主题、认证、UI 壳层等客户端全局 state。

---

## 一、最小示例

```bash
pnpm add zustand
```

```tsx
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
}));

function Sidebar() {
  const open = useUIStore(s => s.sidebarOpen);
  return open ? <aside>...</aside> : null;
}

function Toggle() {
  const toggle = useUIStore(s => s.toggleSidebar);
  return <button type="button" onClick={toggle}>切换</button>;
}
```

| 特点 | 说明 |
|------|------|
| 无 Provider | 任意处 import hook |
| selector | 只订阅用到的字段 |
| 外 mutative 可选 | `immer` 中间件 |

---

## 二、与 useState 对比

| | useState | Zustand |
|---|----------|---------|
| 范围 | 单组件 / 需 props 传递 | 全局 |
| 订阅 | — | selector |
| 持久化 | 手写 | `persist` 中间件 |

---

## 三、immer 中间件

```tsx
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useCartStore = create(
  immer<{
    items: { id: string; qty: number }[];
    add: (id: string) => void;
  }>((set) => ({
    items: [],
    add: (id) =>
      set(state => {
        const item = state.items.find(i => i.id === id);
        if (item) item.qty += 1;
        else state.items.push({ id, qty: 1 });
      }),
  })),
);
```

---

## 四、persist 持久化

```tsx
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist<{
    theme: 'light' | 'dark';
    setTheme: (t: 'light' | 'dark') => void;
  }>(
    (set) => ({
      theme: 'light',
      setTheme: theme => set({ theme }),
    }),
    { name: 'app-settings' },
  ),
);
```

---

## 五、分 store 还是单 store

| 多 store | 单 store slice |
|----------|----------------|
| `useUIStore` `useAuthStore` | 一个 store 多 domain |
| 边界清晰 | 易膨胀 |

中后台常见：**auth / ui / settings** 分开。

---

## 六、与 TanStack Query 分工

```tsx
// 用户资料：服务端
const { data: user } = useQuery(...);

// 仅 UI：客户端
const theme = useSettingsStore(s => s.theme);
```

不要把 API 列表塞 Zustand 除非离线缓存等特殊需求。

---

## 七、测试

```tsx
const state = useCartStore.getState();
useCartStore.setState({ items: [] });
```

可在测试里直接 `setState` 重置。

---

## 八、小结

| 场景 | Zustand |
|------|---------|
| 侧边栏、主题 | ✅ |
| 登录用户 token（配合 Query 拉 profile） | ✅ |
| 服务端列表 | ❌ 用 Query |

**上一篇**：[02-Context进阶与性能](./02-Context进阶与性能.md)  
**下一篇**：[04-Redux-Toolkit与RTK-Query](./04-Redux-Toolkit与RTK-Query.md)
