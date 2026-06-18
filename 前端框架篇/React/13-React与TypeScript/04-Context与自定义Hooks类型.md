# Context 与自定义 Hooks 类型

> **Context** 和 **自定义 Hook** 是 TS 里最容易出现 `undefined`、循环依赖类型的地方。本篇给出类型安全的模板。

---

## 一、Context 完整模板

```tsx
interface AuthContextValue {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login: async creds => {
      const u = await apiLogin(creds);
      setUser(u);
    },
    logout: () => setUser(null),
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

| 要点 | 说明 |
|------|------|
| `null` 默认 | 区分「未包裹 Provider」 |
| 自定义 hook 断言 | 对外返回非 null 类型 |

---

## 二、分类型 Context（Discriminated）

```tsx
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function useRequest<T>(fetcher: () => Promise<T>): RequestState<T> {
  const [state, setState] = useState<RequestState<T>>({ status: 'idle' });
  ...
  return state;
}

// 使用
const state = useRequest(() => fetchUser(id));
if (state.status === 'success') {
  state.data.name; // 收窄为 User
}
```

---

## 三、自定义 Hook 返回类型

```tsx
interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

function useCounter(initial = 0): UseCounterReturn {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initial), [initial]);
  return { count, increment, decrement, reset };
}
```

显式接口便于文档与重构；简单 hook 可让 TS 推断。

---

## 四、泛型自定义 Hook

```tsx
function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

---

## 五、useReducer 类型

```tsx
type State = { count: number };
type Action =
  | { type: 'increment' }
  | { type: 'add'; payload: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'add': return { count: state.count + action.payload };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
```

`never` 保证 action 穷尽。

---

## 六、Hook 依赖与类型

```tsx
function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId,
  });
}
```

`enabled` 收窄后 `queryFn` 内仍可能需 `!` 或 throw——Query 仅在 enabled 时调用 fn。

---

## 七、导出规范

```tsx
// hooks/useAuth.ts
export { AuthProvider, useAuth };
export type { AuthContextValue };
```

类型与实现同文件 export，方便消费方 `import type`。

---

## 八、小结

| 模式 | |
|------|--|
| Context + 断言 hook | 防 undefined |
| 联合 state | 窄化 data |
| 泛型 useXxx | 复用逻辑保类型 |

**上一篇**：[03-泛型组件与forwardRef](./03-泛型组件与forwardRef.md)  
**下一篇**：[05-组件库类型导出](./05-组件库类型导出.md)
