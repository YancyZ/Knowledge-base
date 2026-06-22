# React Compiler 概览

**React Compiler**（原 React Forget）在**构建期**分析组件，自动插入 **memo / useMemo / useCallback** 等价优化，目标：**少手写性能 Hook，且不改变语义**。

---

## 解决什么问题

```mermaid
flowchart LR
  Dev[开发者]
  Dev --> Manual[手写 memo/useMemo/useCallback]
  Manual --> Bug[漏写 / 依赖错]
  Compiler[React Compiler]
  Compiler --> Auto[自动记忆化]
```

| 痛点 | Compiler |
|------|----------|
| 不知何时 memo | 编译器分析数据流 |
| deps 数组错 | 自动推导 |
| 过度优化样板 | 减代码量 |

**仍建议**理解手动性能优化，未启用 Compiler 时要会手动优化。

---

## 工作原理（概念）

1. 分析组件与 Hooks 的**可变范围**  
2. 对「可缓存且有益」的 JSX / 计算插入 cache  
3. 生成等价但更少的 re-render  

| 不是 | 是 |
|------|-----|
| 运行时魔法 | **Babel 插件** 编译时 |
| 替代 Fiber | 配合现有 reconciler |

---

## 使用方式（概览）

```bash
pnpm add -D babel-plugin-react-compiler
```

```js
// babel.config.js 示意
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', { /* options */ }],
  ],
};
```

Next.js 15+ 可选 `experimental.reactCompiler: true`。

| 阶段 | 建议 |
|------|------|
| 试验 | 单模块 opt-in |
| 稳定后 | 全项目开启 + 回归测试 |

---

## 与手动 memo 对比

| | 手动 memo | Compiler |
|---|-----------|----------|
| 控制 | 精确 | 自动 |
| 风险 | deps 错 | 边界 case 需测 |
| 代码量 | 多 | 少 |
| 调试 | 熟悉 | 看编译产物 |

**规则不变**：状态下沉、虚拟列表、拆包仍需要。

---

## opt-out

编译器支持跳过特定组件（注解或配置），用于：

| 场景 | |
|------|，|
| 与 imperative 第三方库冲突 | |
| 实测 Compiler 反而变慢 | |
| 调试期对比 | |

查阅官方 `use no memo` 等 pragma（随版本演进）。

---

## 与 React 19

- React 19 **核心库**与 Compiler **解耦发布**  
- Meta 长期目标：新代码默认开 Compiler  
- 类组件 **不** 是 Compiler 主要目标（函数组件）

---

## 团队采纳要点

| 项 | 说明 |
|-----|------|
| React 19 + 现代构建链 | 前置条件 |
| Profiler 基线对比 | staging 验证 |
| 关键路径 E2E | 回归保障 |
| 文档：新人少写 useMemo「习惯」 | 团队规范 |

---

## 小结

Compiler 构建期自动 memo，不替代状态下沉/虚拟列表/拆包；staging 对比 Profiler 后再全量启用。

React Compiler 是 Babel 插件，构建期分析组件数据流，自动插入 memo/useMemo/useCallback 等价优化。解决手写 memo 漏写和 deps 错的问题，但不替代架构级优化（状态下沉、虚拟列表、拆包）。启用：babel-plugin-react-compiler 或 Next.js experimental.reactCompiler。与手动 memo 比：自动但边界 case 需测。可用 opt-out 跳过特定组件。与 React 19 解耦发布，主要面向函数组件。采纳流程：staging 开 → Profiler 对比 → E2E 回归 → 全量启用。
