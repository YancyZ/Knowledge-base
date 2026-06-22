# React 19 迁移与升级指南

从 React 18 升到 **19** 多数项目**平滑**，重点在 **依赖兼容、类型、弃用 API 清理** 与 **Actions 渐进采纳**。

---

## 升级步骤

```mermaid
flowchart TD
  S1[升 react / react-dom]
  S2[升 @types/react]
  S3[跑测试 + 构建]
  S4[修 peer 冲突]
  S5[可选：开 Compiler / Actions]
  S1 --> S2 --> S3 --> S4 --> S5
```

```bash
pnpm add react@^19 react-dom@^19
pnpm add -D @types/react@^19 @types/react-dom@^19
pnpm test --run
pnpm build
```

先升包和类型，跑测试和构建绿，再修 peer 冲突，最后渐进采纳新特性。

---

## 常见依赖问题

| 现象 | 处理 |
|------|------|
| peer dependency 警告 | 等库发版或 pnpm overrides（谨慎） |
| `@types/react` 冲突 | 统一 19 |
| Next.js 版本 | 用文档推荐的 15.x |
| 测试库 | @testing-library/react 新版本 |

---

## API 变更速查

| 变更 | 迁移 |
|------|------|
| `forwardRef` 可选 | 新组件直接 `ref` prop |
| `useFormState` 重命名 | → `useActionState` |
| `ref` 清理回调 | 仍支持 |
| `defaultProps` 函数组件 | 用默认参数（已弃用多年） |
| String ref | 早已移除 |

---

## 行为差异注意

| 项 | 说明 |
|----|------|
| Strict Mode | effect 仍双调用（开发） |
| Suspense | 边界行为微调，测异步页 |
| hydrate | 错误信息更清晰 |
| `useId` | 前缀格式可能变，勿依赖具体字符串 |

---

## 渐进采纳 Actions

| 阶段 | 做法 |
|------|------|
| 1 | 保持现有 onSubmit + Query |
| 2 | 新简单表单用 `useActionState` |
| 3 | Next 项目 Server Action + revalidate |

不必一次改完全部表单。

---

## Compiler 启用

1. 在 staging 开 Compiler  
2. Profiler 对比核心页  
3. 无回归再 production  

---

## 回滚策略

| 手段 | 说明 |
|------|------|
| lockfile 锁 18 | `package.json` 与 lock 回退到上一 tag |
| 特性开关分 PR | Compiler / Actions 独立 PR，便于 revert |
| 监控错误率 | Sentry release 对比，5xx / 白屏告警 |
| Canary 发布 | 5% 流量观察 30min 再全量 |

---

## Codemod 与自动化迁移

React 19 官方与社区 codemod 可批量处理部分 API 重命名：

```bash
# React 官方 codemod（示例，以 react.dev 文档为准）
pnpm dlx codemod@latest react/19/migration-recipe

# 或 types-react-codemod 处理 @types 变更
pnpm dlx types-react-codemod@latest preset-19 ./src
```

**升级前检索清单**：

```bash
# 已弃用 defaultProps（函数组件）
rg 'defaultProps\s*=' src/ --glob '*.{tsx,jsx}'

# String ref（极老代码）
rg 'ref="\w+"' src/

# useFormState（→ useActionState）
rg 'useFormState' src/

# ReactDOM.render（应已迁移 createRoot）
rg 'ReactDOM\.render' src/
```

---

## 常见报错与处理

| 报错 / 现象 | 原因 | 处理 |
|-------------|------|------|
| `Cannot read properties of null (reading 'useState')` | 双 React 实例 | `pnpm why react` 对齐版本；检查 linked 包 |
| `useFormState is not exported` | 包版本未升 | 升 react 到 19，`useActionState` 替代 |
| `@types/react` peer 冲突 | 类型版本不一致 | 统一 `@types/react@19` |
| Strict Mode 下 effect 跑两次 | 开发态预期行为 | 检查 cleanup，非 React 19 独有 |
| Suspense 边界闪屏 | 19 微调 fallback 时机 | 补 skeleton；E2E 断言 |
| `ref` 类型报错 | forwardRef 合并进 props | 移除多余 `forwardRef` 包装，直接 `ref` prop |
| Next.js `use client` 边界 | Server/Client 混用 | 交互组件加 `'use client'` |

**双 React 诊断**：

```bash
pnpm why react
pnpm ls react react-dom
# monorepo 时在根 package.json 设 pnpm overrides
```

```json
{
  "pnpm": {
    "overrides": {
      "react": "^19.0.0",
      "react-dom": "^19.0.0"
    }
  }
}
```

---

## 分阶段迁移计划

| 周次 | 目标 | 验收 |
|------|------|------|
| W1 | 升依赖 + 类型 + CI 绿 | `pnpm test --run && pnpm build` |
| W2 | 清弃用 API（defaultProps、旧 ref） | rg 检索 = 0 |
| W3 | 新表单试点 `useActionState` | 1～2 个低风险表单 |
| W4 | staging 开 Compiler（可选） | Profiler 无回归 |

---

## 小结

升 react 19 + @types，跑测试绿后再渐进采纳 Actions 和 Compiler；lockfile 锁版本便于回滚。

升级步骤：react@19 + @types@19 → 测试 + 构建 → 修 peer 冲突 → 可选开 Compiler/Actions。常见问题：peer 警告、@types 冲突、Next.js 15+、测试库版本。API 变更：forwardRef 可选、useFormState→useActionState、defaultProps 弃用。行为差异：Strict Mode 双 effect、Suspense 微调、useId 前缀可能变。Actions 三阶段渐进采纳；Compiler staging 对比后启用。回滚：lockfile 锁版本、特性分 PR、监控错误率。
