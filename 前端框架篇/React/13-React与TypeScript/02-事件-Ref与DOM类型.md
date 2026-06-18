# 事件、Ref 与 DOM 类型

> 表单、点击、键盘与 **ref 挂 DOM** 是日常 TS 痛点。用 React 提供的 **SyntheticEvent** 泛型与 **RefObject** 类型即可。

---

## 一、事件类型

```tsx
function Form() {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    console.log(e.target.value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { ... }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} onKeyDown={handleKeyDown} />
    </form>
  );
}
```

| 事件 | 泛型 |
|------|------|
| change | `ChangeEvent<HTMLInputElement>` |
| click | `MouseEvent<HTMLButtonElement>` |
| submit | `FormEvent<HTMLFormElement>` |

**元素类型参数**决定 `e.target` 收窄。

---

## 二、不要滥用 any

```tsx
// ❌
function onChange(e: any) {}

// ✅
function onChange(e: React.ChangeEvent<HTMLInputElement>) {}
```

---

## 三、useRef 与 DOM

```tsx
function FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} />;
}
```

| 场景 | 类型 |
|------|------|
| DOM 节点 | `useRef<HTMLDivElement>(null)` |
| 可变值容器 | `useRef<number>(0)` 非 DOM |
| 必不为 null（罕见） | 断言或 callback ref |

---

## 四、forwardRef 类型

```tsx
interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  label: string;
}

const LabeledInput = React.forwardRef<HTMLInputElement, InputProps>(
  function LabeledInput({ label, ...props }, ref) {
    return (
      <label>
        {label}
        <input ref={ref} {...props} />
      </label>
    );
  },
);
```

React 19 起部分场景可 **ref 作为 prop**，无需 forwardRef（视版本文档）。

---

## 五、Callback Ref

```tsx
function Measure({ onHeight }: { onHeight: (h: number) => void }) {
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (node) onHeight(node.getBoundingClientRect().height);
  }, [onHeight]);

  return <div ref={ref}>...</div>;
}
```

---

## 六、useImperativeHandle

```tsx
export interface DialogHandle {
  open: () => void;
  close: () => void;
}

const Dialog = React.forwardRef<DialogHandle, { children: React.ReactNode }>(
  function Dialog(props, ref) {
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
    }), []);

    if (!open) return null;
    return <div role="dialog">{props.children}</div>;
  },
);
```

---

## 七、常见 DOM 清单

| 元素 | Ref 类型 |
|------|----------|
| div | `HTMLDivElement` |
| input | `HTMLInputElement` |
| canvas | `HTMLCanvasElement` |
| video | `HTMLVideoElement` |

---

## 八、小结

| API | 类型要点 |
|-----|----------|
| 事件 | `XxxEvent<HTMLElement>` |
| DOM ref | `useRef<HTMLInputElement>(null)` |
| forwardRef | 第一个泛型是 ref 类型 |

**上一篇**：[01-组件Props与Children类型](./01-组件Props与Children类型.md)  
**下一篇**：[03-泛型组件与forwardRef](./03-泛型组件与forwardRef.md)
