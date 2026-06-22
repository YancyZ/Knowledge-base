# 插槽、多态与 as prop

同一套样式与逻辑，有时要渲染成 `button`、`a` 或 Router `Link`，**`as` prop** 解决多态根元素问题。配合 **variant**（cva + Tailwind）和具名 slot，可构建灵活可复用的组件库 API。

---

## as prop 模式

```tsx
type ButtonProps<E extends React.ElementType = 'button'> = {
  as?: E;
  variant?: 'primary' | 'ghost';
} & React.ComponentPropsWithoutRef<E>;

function Button<E extends React.ElementType = 'button'>({
  as,
  variant = 'primary',
  className,
  ...rest
}: ButtonProps<E>) {
  const Component = as ?? 'button';
  return (
    <Component
      className={clsx('btn', `btn-${variant}`, className)}
      {...rest}
    />
  );
}

// 用法
<Button>提交</Button>
<Button as="a" href="/docs">文档</Button>
<Button as={Link} to="/home">首页</Button>
```

```mermaid
flowchart LR
  B[Button 逻辑+样式]
  B -->|as=button| BTN[button]
  B -->|as=a| A[a]
  B -->|as=Link| L[Router Link]
```

| 好处 | 说明 |
|------|------|
| 语义正确 | 导航用 `<a>` / Link |
| 一套样式 | variant 复用 |
| a11y | 保留原生角色 |

---

## TypeScript 多态组件

```tsx
type PolymorphicRef<E extends React.ElementType> =
  React.ComponentPropsWithRef<E>['ref'];

type PolymorphicProps<E extends React.ElementType, P = {}> = P &
  Omit<React.ComponentPropsWithoutRef<E>, keyof P | 'as'> & {
    as?: E;
  };
```

库如 **Radix Slot**、**MUI Box** 内置多态；手写可参考 `@radix-ui/react-slot`。

---

## Slot 组件（合并 props）

```tsx
import { Slot } from '@radix-ui/react-slot';

function Button({ asChild, ...props }: { asChild?: boolean } & React.ComponentProps<'button'>) {
  const Comp = asChild ? Slot : 'button';
  return <Comp {...props} />;
}

// asChild：子元素成为实际 DOM，合并 className 与事件
<Button asChild>
  <Link to="/">首页</Link>
</Button>
```

| `as` prop | `asChild` + Slot |
|-----------|------------------|
| 指定标签类型 | 子元素必须是唯一 ReactElement |
| 常见手写 | shadcn / Radix 风格 |

---

## 插槽（具名 props）

```tsx
<Layout header={<Header />} sidebar={<Sidebar />}>
  {content}
</Layout>
```

| children | header / footer props |
|----------|-------------------------|
| 默认槽 | 具名槽 |

children 是默认插槽；header、sidebar 等具名 props 扩展布局，不必把所有内容塞进 children。

---

## variant 设计

```tsx
const variants = {
  primary: 'bg-brand text-white',
  ghost: 'bg-transparent',
  danger: 'bg-red-600 text-white',
} as const;

type Variant = keyof typeof variants;
```

配合 **class-variance-authority (cva)**：

```tsx
const button = cva('btn', {
  variants: {
    variant: { primary: '...', ghost: '...' },
    size: { sm: 'text-sm', md: 'text-base' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});
```

---

## 反模式

| 反模式 | 问题 |
|--------|------|
| `isLink` `isButton` 多个 boolean | 组合爆炸 |
| 任何组件都 `as:any` | 丢类型安全 |
| div 模拟 button | a11y 差 |

---

## 小结

**`as` prop** 让同一组件渲染为 button、a、Link 等，保持样式与行为一致。**TypeScript 多态**用 `ElementType` + 泛型约束 props 合并。

**variant** 用 cva + Tailwind 管理 size/color；具名 props 做多 slot。Radix **`asChild` + Slot** 合并 props 是 shadcn 常用高级模式。

常见错因：是否用 div 模拟 button 导致 a11y 问题？boolean 组合是否应改为 `as` + variant？
