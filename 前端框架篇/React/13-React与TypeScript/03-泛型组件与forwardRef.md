# 泛型组件与 forwardRef

> **列表、Select、Table** 等组件常需「值类型可变」——用 **泛型组件** 让 `value` / `onChange` 与 `T` 一致，同时保持 ref 转发。

---

## 一、泛型函数组件

```tsx
interface SelectProps<T extends string | number> {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}

function Select<T extends string | number>({
  value,
  options,
  onChange,
}: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as T)}
    >
      {options.map(o => (
        <option key={String(o.value)} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// 使用
<Select value="a" options={[{ label: 'A', value: 'a' }]} onChange={v => console.log(v)} />
// v 推断为 string
```

---

## 二、泛型 + forwardRef

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function ListInner<T>(
  { items, renderItem }: ListProps<T>,
  ref: React.ForwardedRef<HTMLUListElement>,
) {
  return (
    <ul ref={ref}>
      {items.map((item, i) => (
        <li key={i}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

export const List = React.forwardRef(ListInner) as <T>(
  props: ListProps<T> & { ref?: React.ForwardedRef<HTMLUListElement> },
) => React.ReactElement;
```

`forwardRef` 与泛型组合需 **类型断言** 导出，否则 TS 丢失 `T`。

---

## 三、React 19 ref as prop（趋势）

```tsx
// React 19 示意：ref 可直接在 props
interface InputProps {
  ref?: React.Ref<HTMLInputElement>;
  label: string;
}
```

迁移期仍以 `forwardRef` 为主，见官方迁移指南。

---

## 四、约束泛型

```tsx
interface DataTableProps<T extends { id: string }> {
  rows: T[];
  columns: { key: keyof T; title: string }[];
}
```

`T` 必须有 `id` 才能当 key。

---

## 五、与第三方类型

```tsx
import type { ColumnDef } from '@tanstack/react-table';

function DataTable<TData>({ columns, data }: {
  columns: ColumnDef<TData>[];
  data: TData[];
}) { ... }
```

复用库自带泛型，少 reinvent。

---

## 六、常见错误

| 错误 | 修复 |
|------|------|
| `function Comp<T>(props: Props)` 调用无法推断 | 传具体 props 或显式 `<Comp<User> />` |
| forwardRef 丢泛型 | `as <T>(...) => ReactElement` |
| `as any` 断言 value | 约束 T extends string |

---

## 七、小结

| 模式 | |
|------|--|
| `function Foo<T>(props: Props<T>)` | 值类型联动 |
| forwardRef + 断言 | ref + 泛型 |
| extends 约束 | 保证字段存在 |

**上一篇**：[02-事件-Ref与DOM类型](./02-事件-Ref与DOM类型.md)  
**下一篇**：[04-Context与自定义Hooks类型](./04-Context与自定义Hooks类型.md)
