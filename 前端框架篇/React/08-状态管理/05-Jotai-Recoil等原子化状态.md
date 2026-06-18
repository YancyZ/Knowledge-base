# Jotai、Recoil 等原子化状态

> **原子（atom）** 把状态拆成最小单元，组件只订阅用到的 atom，避免大 store 对象变更牵连全树。

---

## 一、原子化思路

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

## 二、Jotai 示例

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

## 三、派生 atom

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

## 四、Recoil（Meta 维护模式变化）

```tsx
const countState = atom({ key: 'count', default: 0 });

function Counter() {
  const [count, setCount] = useRecoilState(countState);
  ...
}
```

概念与 Jotai 类似；**新项目更常见 Jotai/Zustand**，Recoil 多见于历史项目。

---

## 五、与 Zustand 对比

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

## 六、atomFamily

```tsx
const todoAtomFamily = atomFamily((id: string) =>
  atom({ id, text: '', done: false }),
);
```

每个 id 独立 atom，列表项互不影响 re-render。

---

## 七、小结

| 要点 | 说明 |
|------|------|
| 原子化 | 细订阅 |
| Jotai | 现代首选之一 |
| 服务端数据 | 仍用 Query |

**上一篇**：[04-Redux-Toolkit与RTK-Query](./04-Redux-Toolkit与RTK-Query.md)  
**下一篇**：[06-URL状态与路由参数](./06-URL状态与路由参数.md)
