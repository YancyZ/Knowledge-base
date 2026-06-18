# Hooks 与 Provider 测试

> 测 **自定义 Hook** 用 `renderHook`；测依赖 **Context / Query / Router** 的组件要包 **Provider 测试壳**。

---

## 一、renderHook

```tsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

it('increment', () => {
  const { result } = renderHook(() => useCounter(0));

  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
```

| API | 作用 |
|-----|------|
| `renderHook` | 跑 hook 无 UI |
| `act` | 包裹 setState 更新 |
| `result.current` | hook 返回值 |

---

## 二、Hook 依赖 Context

```tsx
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const { result } = renderHook(() => useAuth(), { wrapper });
expect(result.current.user).toBeNull();
```

---

## 三、QueryClient 测试壳

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

it('加载用户', async () => {
  vi.mocked(fetchUser).mockResolvedValue({ id: '1', name: 'Li' });
  render(<UserProfile id="1" />, { wrapper: createWrapper() });
  expect(await screen.findByText('Li')).toBeInTheDocument();
});
```

| 配置 | 原因 |
|------|------|
| `retry: false` | 失败立刻暴露 |
| 每测新 client | 隔离 cache |

---

## 四、MemoryRouter

```tsx
import { MemoryRouter, Route, Routes } from 'react-router-dom';

render(
  <MemoryRouter initialEntries={['/users/42']}>
    <Routes>
      <Route path="/users/:id" element={<UserDetail />} />
    </Routes>
  </MemoryRouter>,
  { wrapper: createWrapper() },
);
```

或 `createMemoryRouter` + `RouterProvider`。

---

## 五、组合 createTestProviders

```tsx
export function createTestProviders(options?: { route?: string }) {
  const queryClient = createTestQueryClient();
  return function Providers({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[options?.route ?? '/']}>
          <ThemeProvider>{children}</ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

render(<Dashboard />, { wrapper: createTestProviders({ route: '/dashboard' }) });
```

---

## 六、测试 Zustand

```tsx
import { useCartStore } from './cartStore';

beforeEach(() => {
  useCartStore.setState({ items: [] });
});
```

---

## 七、waitFor 与 Hook 异步

```tsx
const { result } = renderHook(() => useUser('1'), { wrapper });

await waitFor(() => expect(result.current.isSuccess).toBe(true));
expect(result.current.data?.name).toBe('Li');
```

---

## 八、反模式

| ❌ | ✅ |
|----|-----|
| 全局 QueryClient 污染 | 每测新建 |
| 不测 Provider 直接测子组件 | 集成测包 Provider |
| act 遗漏 | RTL 的 userEvent 多已包 act |

---

## 九、小结

| 工具 | 场景 |
|------|------|
| renderHook | 纯 hook |
| wrapper | Context / Query / Router |
| setState 重置 | Zustand |

**上一篇**：[03-组件测试模式](./03-组件测试模式.md)  
**下一篇**：[05-Storybook与视觉回归](./05-Storybook与视觉回归.md)
