# 泛型组件与 forwardRef

**列表、Select、Table** 等组件常需「值类型可变」，用 **泛型组件** 让 `value` / `onChange` 与 `T` 一致，同时保持 ref 转发。

---

## 泛型函数组件

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

泛型 `T` 让 value、options 和 onChange 的类型联动，调用处 TS 自动推断 `T` 为 string。

---

## 泛型 + forwardRef

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

`forwardRef` 与泛型组合需 **类型断言** 导出，否则 TS 丢失 `T`。这是泛型组件 + ref 转发的标准写法。

---

## React 19 ref as prop（趋势）

```tsx
// React 19 示意：ref 可直接在 props
interface InputProps {
  ref?: React.Ref<HTMLInputElement>;
  label: string;
}
```

迁移期仍以 `forwardRef` 为主。React 19 起 ref 可作为普通 prop 传入，简化部分组件写法。

---

## 约束泛型

```tsx
interface DataTableProps<T extends { id: string }> {
  rows: T[];
  columns: { key: keyof T; title: string }[];
}
```

`T` 必须有 `id` 才能当 key。用 `extends` 约束泛型字段，保证组件内部能安全访问特定属性。

---

## 与第三方类型

```tsx
import type { ColumnDef } from '@tanstack/react-table';

function DataTable<TData>({ columns, data }: {
  columns: ColumnDef<TData>[];
  data: TData[];
}) { ... }
```

复用库自带泛型，少 reinvent。TanStack Table 的 `ColumnDef<TData>` 直接传入，保持一致性。

---

## 常见错误

| 错误 | 修复 |
|------|------|
| `function Comp<T>(props: Props)` 调用无法推断 | 传具体 props 或显式 `<Comp<User> />` |
| forwardRef 丢泛型 | `as <T>(...) => ReactElement` |
| `as any` 断言 value | 约束 T extends string |

---

## 小结

泛型组件让 value/onChange 与 T 一致；forwardRef 与泛型组合需类型断言导出。

泛型函数组件 `function Select<T>(props: SelectProps<T>)` 让 value/onChange 与 T 联动，调用处自动推断。forwardRef + 泛型需 `as <T>(props) => ReactElement` 断言导出，否则 TS 丢失 T。React 19 趋势是 ref 作为 prop，迁移期仍用 forwardRef。用 `extends { id: string }` 约束泛型字段；复用第三方库泛型如 `ColumnDef<TData>`。常见错误：无法推断 T 时显式传 `<Comp<User>>`、forwardRef 丢泛型需断言、value 断言用 extends 约束而非 as any。
