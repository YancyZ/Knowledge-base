# 组件 Props 与 Children 类型

React + TypeScript 的第一步：**把 props 写对**。本篇覆盖基础 props、可选/默认值、`children`、联合 props 与 discriminated union。

---

## 基础 Props 类型

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

function Button({ variant = 'primary', disabled, onClick, children }: ButtonProps) {
  return (
    <button type="button" className={variant} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
```

| 类型 | 用途 |
|------|------|
| `React.ReactNode` | 几乎任何可渲染内容 |
| `React.ReactElement` | 仅 JSX 元素 |
| `string` | 纯文本 children |

用 interface 描述 props，可选字段加 `?`，默认值在解构时给。`ReactNode` 最宽，适合 children；需要限制为 JSX 元素时用 `ReactElement`。

---

## children 模式

### 普通 children

```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
}
```

### 无 children（显式禁止）

```tsx
interface IconProps {
  name: string;
  children?: never;
}
```

`children?: never` 显式禁止传入 children，TS 会在调用处报错。

### 命名 slot（React 无原生 slot，用 props 模拟）

```tsx
interface ModalProps {
  header: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```

React 没有 Vue 式 slot，用命名 props 模拟 header/footer 等插槽。

---

## 扩展原生 HTML 属性

```tsx
type InputProps = React.ComponentPropsWithoutRef<'input'> & {
  label: string;
  error?: string;
};

function TextField({ label, error, ...inputProps }: InputProps) {
  return (
    <label>
      {label}
      <input {...inputProps} />
      {error && <span>{error}</span>}
    </label>
  );
}
```

| 工具类型 | 说明 |
|----------|------|
| `ComponentPropsWithoutRef<'button'>` | button 属性 minus ref |
| `ComponentPropsWithRef<'input'>` | 含 ref |

封装原生元素时，用 `ComponentPropsWithoutRef` 继承全部 HTML 属性，再叠加自定义 props，避免手写 `onChange` 等重复定义。

---

## Discriminated Union（互斥 props）

```tsx
type AlertProps =
  | { variant: 'success'; onDismiss?: () => void }
  | { variant: 'error'; errorCode: number; onRetry: () => void };

function Alert(props: AlertProps) {
  if (props.variant === 'error') {
    return <div>错误 {props.errorCode} <button onClick={props.onRetry}>重试</button></div>;
  }
  return <div>成功</div>;
}
```

`variant` 收窄后 TS 知道有哪些字段必填。互斥 props 用 discriminated union 比全部 optional 更安全。

---

## defaultProps vs 默认参数

```tsx
// ✅ 推荐：解构默认值
function Badge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {}

// 类组件 legacy：defaultProps（函数组件少用）
```

函数组件推荐解构默认值，比 `defaultProps` 更直观，TS 推断也更好。

---

## FC 是否还用

```tsx
// 旧
const Comp: React.FC<Props> = (props) => ...

// 现推荐：直接写函数 + Props 接口
function Comp(props: Props) { ... }
```

| React.FC | 直接函数 |
|----------|----------|
| 隐式 children（已不推荐） | children 显式声明 |
| 隐式 displayName | 手动或 infer |

`React.FC` 曾隐式包含 children，现已不推荐。直接写函数 + Props interface，children 显式声明更清晰。

---

## 小结

用 interface 描述 props，ReactNode 表 children，ComponentProps 扩展原生属性；联合类型表达互斥 API。

React + TS 的基础是用 interface 描述 props，可选字段加 `?`，默认值在解构时给。children 用 `ReactNode`（最宽）或 `ReactElement`（仅 JSX）；禁止 children 用 `children?: never`；命名 slot 用 header/footer 等 props 模拟。封装原生元素用 `ComponentPropsWithoutRef<'input'>` 继承 HTML 属性。互斥 props 用 discriminated union，靠 `variant` 等字段收窄。函数组件用解构默认值，不用 defaultProps。不推荐 `React.FC`，直接写函数 + Props interface，children 显式声明。
