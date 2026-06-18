# Query 与 Mutation 实战模式

> 会用 `useQuery` 只是起点。生产里还要处理：**分页、乐观更新、预取、并行/依赖查询、mutation 后 cache 怎么变**。

---

## 一、分页与无限滚动

### 1.1 页码分页

```tsx
import { keepPreviousData } from '@tanstack/react-query';

function OrderList() {
  const [page, setPage] = useState(1);

  const { data, isPending } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => fetchOrders(page),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      {data?.items.map(o => <OrderRow key={o.id} order={o} />)}
      <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
      <button disabled={!data?.hasNext} onClick={() => setPage(p => p + 1)}>下一页</button>
    </>
  );
}
```

| `keepPreviousData` | 切页时先显示上一页数据，减少闪烁 |

### 1.2 useInfiniteQuery

```tsx
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

const posts = data?.pages.flatMap(p => p.items) ?? [];
```

```mermaid
flowchart LR
  P1[page 1] --> P2[page 2]
  P2 --> P3[page 3]
  P3 --> More[fetchNextPage]
```

---

## 二、依赖查询（串行）

```tsx
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});

const { data: projects } = useQuery({
  queryKey: ['projects', user?.teamId],
  queryFn: () => fetchProjects(user!.teamId),
  enabled: !!user?.teamId,
});
```

B 依赖 A 的结果 → B 的 `enabled` 等 A 就绪。

---

## 三、并行查询

```tsx
const results = useQueries({
  queries: userIds.map(id => ({
    queryKey: ['users', id],
    queryFn: () => fetchUser(id),
  })),
});
```

或组件层多个 `useQuery`（同 key 会去重）。

---

## 四、预取 prefetchQuery

```tsx
function UserRow({ id, name }: { id: string; name: string }) {
  const queryClient = useQueryClient();

  return (
    <Link
      to={`/users/${id}`}
      onMouseEnter={() =>
        queryClient.prefetchQuery({
          queryKey: ['users', id],
          queryFn: () => fetchUser(id),
        })
      }
    >
      {name}
    </Link>
  );
}
```

悬停时预拉详情，点击进入页几乎无 loading。

---

## 五、Mutation 后更新 cache

### 5.1 invalidate（简单可靠）

```tsx
const queryClient = useQueryClient();

useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

标记 stale → 有 observer 的 query 自动 refetch。

### 5.2 setQueryData（即时 UI）

```tsx
useMutation({
  mutationFn: updateTodo,
  onSuccess: (updated) => {
    queryClient.setQueryData(['todos'], (old: Todo[] | undefined) =>
      old?.map(t => (t.id === updated.id ? updated : t)),
    );
  },
});
```

| 方式 | 何时用 |
|------|--------|
| invalidate | 列表复杂、服务端算字段 |
| setQueryData | 已知如何合并、要快 |

### 5.3 乐观更新

```tsx
useMutation({
  mutationFn: toggleTodo,
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previous = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old: Todo[]) =>
      old.map(t => (t.id === id ? { ...t, done: !t.done } : t)),
    );
    return { previous };
  },
  onError: (_err, _id, ctx) => {
    queryClient.setQueryData(['todos'], ctx?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

```mermaid
sequenceDiagram
  participant UI
  participant Cache
  participant API
  UI->>Cache: onMutate 先改 UI
  UI->>API: mutate
  API-->>UI: 失败则 rollback
  API-->>Cache: onSettled invalidate
```

---

## 六、select 派生数据

```tsx
const { data: names } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  select: users => users.map(u => u.name),
});
```

`select` 结果变才触发组件 re-render，减少大列表引用不变时的渲染。

---

## 七、Query 与表单

| 模式 | 说明 |
|------|------|
| 详情页 | `useQuery` 填初始值 → RHF `values` / `reset` |
| 提交 | `useMutation` + toast |
| 编辑后 | invalidate 详情 + 列表 key |

```tsx
const { data } = useQuery({ queryKey: ['user', id], queryFn: () => fetchUser(id) });
const form = useForm({ values: data }); // RHF v7+ values 同步
```

---

## 八、反模式

| ❌ | ✅ |
|----|-----|
| mutation 成功手动 `setUsers` 在 useState | invalidate / setQueryData |
| queryKey 不含筛选参数 | key 含 filters |
| 每个列表项里 useQuery 同一 key 不同 fn | 统一 key + 正确 fn |

---

## 九、小结

| 场景 | API |
|------|-----|
| 分页 | `keepPreviousData` |
| 无限滚动 | `useInfiniteQuery` |
| 预取 | `prefetchQuery` |
| 写后刷新 | `invalidateQueries` / 乐观更新 |

**上一篇**：[02-TanStack-Query核心概念](./02-TanStack-Query核心概念.md)  
**下一篇**：[04-SWR与Alternatives对比](./04-SWR与Alternatives对比.md)
