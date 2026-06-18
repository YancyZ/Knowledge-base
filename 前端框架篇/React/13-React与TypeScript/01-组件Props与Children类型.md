# 组件 Props 与 Children 类型

> React + TypeScript 的第一步：**把 props 写对**。本篇覆盖基础 props、可选/默认值、`children`、联合 props 与 discriminated union。

---

## 一、基础 Props 类型

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

---

## 二、children 模式

### 2.1 普通 children

```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
}
```

### 2.2 无 children（显式禁止）

```tsx
interface IconProps {
  name: string;
  children?: never;
}
```

### 2.3 命名 slot（React 无原生 slot，用 props 模拟）

```tsx
interface ModalProps {
  header: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```

见 [07-插槽](../07-组件模式与架构/04-插槽-多态与as-prop.md)。

---

## 三、扩展原生 HTML 属性

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

---

## 四、Discriminated Union（互斥 props）

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

`variant` 收窄后 TS 知道有哪些字段必填。

---

## 五、defaultProps vs 默认参数

```tsx
// ✅ 推荐：解构默认值
function Badge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {}

// 类组件 legacy：defaultProps（函数组件少用）
```

---

## 六、FC 是否还用？

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

---

## 七、与 TypeScript 体系衔接

泛型、工具类型见 [TypeScript 体系](../../../前端基础体系/04-TypeScript体系.md)。

---

## 八、小结

| 要点 | |
|------|--|
| interface 描述 props | |
| ReactNode / ComponentProps | |
| 联合类型表达互斥 API | |

**下一篇**：[02-事件-Ref与DOM类型](./02-事件-Ref与DOM类型.md)
