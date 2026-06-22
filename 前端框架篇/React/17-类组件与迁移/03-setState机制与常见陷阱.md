# setState 机制与常见陷阱

类组件的 **`this.setState`** 是**异步批量合并**的；函数组件的 **`useState`** 更新方式不同。读懂这些，才能解释「为什么连点两次只加 1」以及迁移时的行为差异。

---

## setState 是合并，不是替换

```tsx
this.state = { a: 1, b: 2 };
this.setState({ a: 10 });
// 结果 { a: 10, b: 2 } — b 保留
```

| 误解 | 事实 |
|------|------|
| setState 替换整个 state | **浅合并** partial state |

---

## 异步与批处理

```tsx
handleClick = () => {
  this.setState({ count: this.state.count + 1 });
  this.setState({ count: this.state.count + 1 });
  // 可能只 +1：两次都基于同一 this.state.count
};
```

```mermaid
sequenceDiagram
  participant E as 事件
  participant R as React
  E->>R: setState +1
  E->>R: setState +1
  Note over R: 批处理，合并一次 render
  R->>R: 两次都读旧 count
```

**函数式更新**：

```tsx
this.setState(prev => ({ count: prev.count + 1 }));
this.setState(prev => ({ count: prev.count + 1 }));
// 正确 +2
```

函数组件同理：

```tsx
setCount(c => c + 1);
setCount(c => c + 1);
```

React 18 自动批处理，连续 setState 合并一次 render，基于旧 state 的连续更新会丢失。

---

## setState 回调（类专属）

```tsx
this.setState({ count: 1 }, () => {
  console.log(this.state.count); // 已更新
});
```

Hooks **无** 直接等价，用 `useEffect` 监听 state 或 `flushSync` 极少数场景。

---

## 常见陷阱

### 依赖旧 state 连调

```tsx
// ❌
this.setState({ value: this.state.value + 1 });
this.setState({ value: this.state.value + 1 });

// ✅
this.setState(s => ({ value: s.value + 1 }));
this.setState(s => ({ value: s.value + 1 }));
```

### 在 setState 后立即读

```tsx
this.setState({ open: true });
console.log(this.state.open); // 可能仍是 false
```

### props + state 双源

```tsx
// ❌ props 变又 setState 镜像
componentDidUpdate(prev) {
  if (prev.id !== this.props.id) {
    this.setState({ data: fetch(...) }); // 应用 useEffect([id])
  }
}
```

### 可变 state 直接改

```tsx
// ❌
this.state.list.push(item);
this.setState({ list: this.state.list });

// ✅ 新引用
this.setState(s => ({ list: [...s.list, item] }));
```

---

## 与 useState 对比

| | class setState | useState |
|---|----------------|----------|
| 合并 | 自动浅合并 | 替换该 state 槽 |
| 多字段 | 一次对象 | 多个 useState 或 useReducer |
| 批处理 | React 18 自动批处理 | 同左 |
| 函数更新 | `setState(fn)` | `setState(fn)` |

```tsx
// useState 不合并多个字段到一个对象槽 — 每个 hook 独立
const [a, setA] = useState(1);
const [b, setB] = useState(2);
```

复杂对象用 `useReducer`。

---

## forceUpdate

```tsx
this.forceUpdate(); // 跳过 shouldComponentUpdate
```

**避免使用**，找 root cause。Hooks 无等价物。

---

## 迁移提示

| 类模式 | Hook 模式 |
|--------|-----------|
| 多个 setState 字段 | `useReducer` |
| setState callback | `useEffect` |
| 连续依赖更新 | 函数式 setState |

---

## 小结

setState 浅合并、异步批处理；连续更新用函数式 setState，勿在 setState 后立即读 state。

setState 浅合并 partial state，不替换整个 state。异步批处理导致连续基于旧 state 的更新只生效一次，用函数式 setState(prev => ...) 解决。setState 回调是类专属，Hooks 用 useEffect 监听。陷阱：连调基于旧 state、setState 后立即读、props+state 双源、可变 state 直接 push。useState 每个 hook 独立槽，不自动合并多字段；复杂对象用 useReducer。forceUpdate 应避免。迁移：多字段→useReducer，callback→useEffect，连续更新→函数式 setState。
