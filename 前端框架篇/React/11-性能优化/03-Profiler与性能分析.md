# Profiler 与性能分析

**React DevTools Profiler** 记录每次 commit 的耗时与原因，是前端 React 性能排查的**首选工具**，比猜 memo 有效得多。

---

## 打开 Profiler

1. 安装 [React Developer Tools](https://react.dev/learn/react-developer-tools) 浏览器扩展  
2. DevTools → **Profiler** 标签  
3. 点击录制 ● → 操作页面 → 停止 ■

```mermaid
flowchart LR
  Record[录制交互]
  Record --> Flame[火焰图]
  Record --> Rank[Ranked 排序]
  Record --> Why[为什么 render]
```

录制时尽量复现用户真实操作，输入、滚动、切换 Tab，而不是静态页面。停止后可切换火焰图、Ranked 和 render 原因视图。

---

## 火焰图（Flamegraph）

| 视觉 | 含义 |
|------|------|
| 条块宽度 | 该组件及子树耗时占比 |
| 颜色黄/红 | 相对慢 |
| 灰色 | 未 render（memo 跳过等） |

**看谁最宽**，优先优化最宽且 render 频繁的组件。灰色条块表示 memo 跳过或 props 未变，说明优化已生效。

---

## Ranked 视图

按**单组件自身 render 耗时**排序，适合找「单次很重」的组件（大 DOM、复杂计算）。火焰图看子树占比，Ranked 看单个组件自身耗时，两者配合使用。

---

## 「Why did this render?」

Profiler 设置里开启 **Record why each component rendered**（或 Components 面板查看）：

| 原因 | 处理方向 |
|------|----------|
| Hooks changed | 哪个 state/context 变了 |
| Parent re-rendered | 考虑 memo 或状态下沉 |
| Props changed | 稳定引用 / 少传对象 |

「Parent re-rendered」最常见，说明问题可能在父组件 state 范围过大，而不一定是子组件本身慢。

---

## 典型排查流程

```mermaid
flowchart TD
  S[用户反馈卡顿]
  S --> P[Profiler 录输入/滚动]
  P --> Q{多次 commit?}
  Q -->|是| R[查触发源 / memo]
  Q -->|否| T{单次很慢?}
  T -->|是| V[虚拟列表 / 减 DOM]
  T -->|否| N[查网络 / bundle]
```

每次按键都触发 commit → 渲染次数过多；单次 commit 很慢 → 单次渲染过重或 DOM 过大；都不慢但页面仍卡 → 查网络、bundle 或第三方脚本。

---

## Profiler API（代码内）

```tsx
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRender: ProfilerOnRenderCallback = (
  id, phase, actualDuration, baseDuration, startTime, commitTime,
) => {
  if (actualDuration > 16) {
    console.warn(`[${id}] ${phase} took ${actualDuration.toFixed(1)}ms`);
  }
};

<Profiler id="UserList" onRender={onRender}>
  <UserList />
</Profiler>
```

| phase | 含义 |
|-------|------|
| mount | 首次 |
| update | 更新 |

生产环境可采样上报，勿全量 log。`actualDuration` 超过 16ms 意味着可能掉帧。

---

## 与浏览器 Performance

| 工具 | 擅长 |
|------|------|
| React Profiler | 组件级、为何 render |
| Chrome Performance | 长任务、布局、脚本总览 |
| Lighthouse | 加载指标、建议 |

React 问题先用 Profiler；INP 长任务可叠加 Chrome Performance 看主线程总览。

---

## 案例：输入框卡

**现象**：搜索框每键 re-render 整表。

**Profiler**：每次按键 `UserTable` 全绿 render。

**修复**：`SearchBox` 状态下沉 + `UserRow` memo + 稳定 `onSelect` useCallback。

改完再录一次对比：理想情况是按键时只有 `SearchBox` render，`UserTable` 变灰或不再出现。

---

## 小结

React DevTools Profiler 是性能排查首选：录制真实交互、看火焰图热点、查 render 原因，改完再录对比。

安装 React DevTools 后，Profiler 标签录制 → 操作 → 停止，火焰图看条块宽度找热点，Ranked 找单次重 render，开启「Why did this render」看触发原因。排查流程：多次 commit 查触发源和 memo，单次慢查虚拟列表和 DOM，都不慢查网络与 bundle。代码内 `<Profiler>` 可采样上报慢 commit。与 Chrome Performance、Lighthouse 分工：React 组件问题用 Profiler，长任务和加载指标用浏览器工具。典型输入框卡顿案例：状态下沉 + 行 memo + 稳定 callback，改完务必再录对比验证。
