# Context 与自定义 Hooks 类型

**Context** 和 **自定义 Hook** 是 TS 里最容易出现 `undefined`、循环依赖类型的地方。本篇给出类型安全的模板。

---

## Context 完整模板

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

Context 默认 `null`，自定义 hook 内断言并 throw，对外返回非 null 的 `AuthContextValue`。

---

## 分类型 Context（Discriminated）

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

联合 state 让 TS 在 `status` 收窄后知道 `data` 或 `error` 是否存在。

---

## 自定义 Hook 返回类型

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

## 泛型自定义 Hook

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

泛型 Hook 让 localStorage 读写保持类型一致，调用处传入 initial 即可推断 T。

---

## useReducer 类型

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

`never` 保证 action 穷尽。新增 action 类型时 default 分支会报错，防止遗漏 case。

---

## Hook 依赖与类型

```tsx
function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId,
  });
}
```

`enabled` 收窄后 `queryFn` 内仍可能需 `!` 或 throw，Query 仅在 enabled 时调用 fn，但 TS 不一定能自动推断。

---

## 导出规范

```tsx
// hooks/useAuth.ts
export { AuthProvider, useAuth };
export type { AuthContextValue };
```

类型与实现同文件 export，方便消费方 `import type`。

---

## 小结

Context 默认 null + 自定义 hook 断言；联合 state 窄化 data；复杂逻辑用 useReducer 穷尽 action。

Context 类型安全模板：createContext 默认 null，Provider 用 useMemo 稳定 value，自定义 hook 内断言 throw 后返回非 null 类型。联合 state（discriminated union）在 status 收窄后访问 data/error。自定义 Hook 可显式定义返回接口或用 TS 推断；泛型 Hook 如 useLocalStorage<T> 保持读写类型一致。useReducer 用 never 穷尽 action。Query 等 Hook 的 enabled 与 queryFn 内类型收窄需注意。导出时用 export type 分离类型，与实现同文件 export。
