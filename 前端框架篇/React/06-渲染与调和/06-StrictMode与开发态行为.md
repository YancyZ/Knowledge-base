# Strict Mode 与开发态行为

> **`<StrictMode>`** 仅在**开发环境**启用额外检查，帮助发现不安全副作用与过时 API。**不会**在生产环境渲染两次或双调 effect。

---

## 一、如何启用

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

可包整个 App 或子树。

---

## 二、开发环境会做什么？

```mermaid
flowchart TB
  SM[StrictMode]
  SM --> D1[组件函数双调用 render]
  SM --> D2[useState 初始化函数双调用]
  SM --> D3[useEffect mount cleanup remount]
  SM --> D4[过时 API 警告]
```

| 行为 | 目的 |
|------|------|
| **双调用 render** | 暴露 render 中副作用 |
| **双调用 initializer** | 暴露昂贵 init 无缓存 |
| **effect: mount→cleanup→mount** | 暴露缺少 cleanup 的订阅 |
| 检测 legacy API | `findDOMNode`、`UNSAFE_*` 等 |

---

## 三、effect 双调用示例

```tsx
useEffect(() => {
  console.log('effect run');
  return () => console.log('cleanup');
}, []);

// 开发 + StrictMode 控制台：
// effect run
// cleanup
// effect run

// 生产：仅 effect run 一次
```

| 要求 | 你的 effect 必须 |
|------|------------------|
| cleanup 对称 | 取消订阅、abort、clearTimeout |
| 幂等 | 重复 mount 不出错 |

```tsx
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal });
  return () => ctrl.abort();
}, [url]);
```

---

## 四、render 双调用

```tsx
function Counter() {
  console.log('render');
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
// 开发 StrictMode：首次 mount 可能 log 两次 render
// 点击后仍按正常批处理
```

**不要在 render 里**：

- fetch
- 改全局变量
- 无 guard 的 `setState`

---

## 五、useState 惰性初始化双调用

```tsx
useState(() => {
  console.log('init');
  return expensive();
});
// StrictMode 可能 log init 两次 — init 应纯且可重复，或接受两次计算
```

昂贵 init 且只算一次需求：模块级缓存或 ref guard（少见）。

---

## 六、常见困惑 FAQ

| 问题 | 答案 |
|------|------|
| 生产会双 render 吗？ | **不会** |
| 要关掉 StrictMode 吗？ | 不建议；修 cleanup 而非关 |
| 请求发两次？ | 开发 effect 双调；加 cleanup 或 Query dedupe |
| 计数器点击翻倍？ | 不是 StrictMode；查重复绑定事件 |

---

## 七、与 Concurrent 的关系

StrictMode 还帮助准备 **Concurrent** 可中断/重试 语义：组件应能安全「丢弃一次 render 再重来」。

---

## 八、何时可暂时移除 StrictMode

| 场景 | 说明 |
|------|------|
| 调试第三方库不兼容 | 临时定位 |
| 库 fix 后 | 加回 |

长期应保留 StrictMode。

---

## 九、小结

| 要点 | 记忆 |
|------|------|
| 仅开发 | 生产无影响 |
| effect 双调 | 写 cleanup |
| render 纯 | 无副作用 |
| 不是 bug | 是故意的检测 |

**上一篇**：[05-批处理与自动批处理](./05-批处理与自动批处理.md)  
**下一批（P1）**：[07-组件模式与架构](../07-组件模式与架构/01-复合组件与状态共享.md)

---

## P0 阶段完成

至此 **入门与核心（P0）** 模块已全部覆盖：认知 → JSX → 组件 → 事件表单 → Hooks → 渲染调和。建议结合 [React 编码规范](../React编码规范.md) 做小项目练手，再进入 **P1（状态 / 路由 / 性能 / TS）**。
