# Jotai、Recoil 等原子化状态

**原子化**把状态拆成最小 **atom**，组件只订阅用到的单元，避免大对象 Context/store 牵连全树 re-render。Jotai 是现代首选之一；Recoil 多见于历史项目。服务端数据仍用 TanStack Query，不与 atom 重复缓存。

---

## 原子化思路

```mermaid
flowchart LR
  subgraph store [传统 store]
    Big[{ user theme cart }]
  end
  subgraph atom [原子]
    A1[userAtom]
    A2[themeAtom]
    A3[cartAtom]
  end
  C1[Component] --> A2
  C2[Component] --> A3
```

| 大对象 Context/store | atom |
|----------------------|------|
| 任字段变可能牵连多 consumer | 只订阅相关 atom |

---

## Jotai 示例

```bash
pnpm add jotai
```

```tsx
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

const countAtom = atom(0);
const doubleAtom = atom(get => get(countAtom) * 2);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

function DoubleDisplay() {
  const double = useAtomValue(doubleAtom);
  return <p>{double}</p>;
}
```

| API | 作用 |
|-----|------|
| `atom` | 定义状态或派生 |
| `useAtom` | 读写 |
| `useAtomValue` | 只读 |
| `useSetAtom` | 只写，不订阅 → 不 re-render |

---

## 派生 atom

```tsx
const userIdAtom = atom<string | null>(null);
const userAtom = atom(async get => {
  const id = get(userIdAtom);
  if (!id) return null;
  return fetchUser(id);
});
```

异步 atom 类似 Suspense 集成（视版本与用法）。

---

## Recoil（Meta 维护模式变化）

```tsx
const countState = atom({ key: 'count', default: 0 });

function Counter() {
  const [count, setCount] = useRecoilState(countState);
  ...
}
```

概念与 Jotai 类似；**新项目更常见 Jotai/Zustand**，Recoil 多见于历史项目。

---

## 与 Zustand 对比

| | Jotai | Zustand |
|---|-------|---------|
| 模型 | 分散 atom | 集中 store |
| 派生 | atom(get =>) | selector 在 hook 里 |
| 心智 | 细粒度 | 一个 hook 一个 store |

| 选 Jotai | 选 Zustand |
|----------|------------|
| 状态图分散、派生多 | 几个全局 slice 即可 |
| 表单字段级（配合 atomFamily） | UI 壳层 |

---

## atomFamily

```tsx
const todoAtomFamily = atomFamily((id: string) =>
  atom({ id, text: '', done: false }),
);
```

每个 id 独立 atom，列表项互不影响 re-render。

---

## 小结

**原子化**：状态拆成最小 **atom**，组件只订阅用到的单元。**Jotai** 是现代首选之一；**Recoil** 维护模式变化，新项目慎选。

**派生 atom** 表达 computed；**atomFamily** 参数化列表项 state。服务端数据仍用 **TanStack Query**，不与 atom 重复缓存。

常见错因：是否用 atom 缓存了 API 列表？列表项 state 是否应用 atomFamily 隔离？
