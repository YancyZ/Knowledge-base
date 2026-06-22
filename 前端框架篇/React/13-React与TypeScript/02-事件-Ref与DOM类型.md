# 事件、Ref 与 DOM 类型

表单、点击、键盘与 **ref 挂 DOM** 是日常 TS 痛点。用 React 提供的 **SyntheticEvent** 泛型与 **RefObject** 类型即可。

---

## 事件类型

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

**元素类型参数**决定 `e.target` 收窄。泛型参数填实际 DOM 元素类型，`e.target` 才能正确推断属性。

---

## 不要滥用 any

```tsx
// ❌
function onChange(e: any) {}

// ✅
function onChange(e: React.ChangeEvent<HTMLInputElement>) {}
```

事件 handler 用 `any` 会丢失 target 类型收窄，后续访问属性无提示也不安全。

---

## useRef 与 DOM

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

DOM ref 初始值为 `null`，访问 `current` 时用可选链。非 DOM 的可变值容器不需要 null 初始。

---

## forwardRef 类型

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

React 19 起部分场景可 **ref 作为 prop**，无需 forwardRef（视版本文档）。迁移期仍以 forwardRef 为主，第一个泛型参数是 ref 指向的元素类型。

---

## Callback Ref

```tsx
function Measure({ onHeight }: { onHeight: (h: number) => void }) {
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (node) onHeight(node.getBoundingClientRect().height);
  }, [onHeight]);

  return <div ref={ref}>...</div>;
}
```

Callback ref 在节点 mount/unmount 时调用，适合测量 DOM 尺寸等需要在挂载瞬间读取的场景。

---

## useImperativeHandle

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

`useImperativeHandle` 自定义 ref 暴露的命令式 API，父组件通过 ref 调用 open/close 而不直接操作 DOM。

---

## 常见 DOM 清单

| 元素 | Ref 类型 |
|------|----------|
| div | `HTMLDivElement` |
| input | `HTMLInputElement` |
| canvas | `HTMLCanvasElement` |
| video | `HTMLVideoElement` |

---

## 小结

事件用 XxxEvent<HTMLElement> 泛型；DOM ref 用 useRef<HTMLInputElement>(null)；forwardRef 第一个泛型是 ref 类型。

事件 handler 用 `React.ChangeEvent<HTMLInputElement>` 等泛型，元素类型参数决定 target 收窄，避免 any。DOM ref 用 `useRef<HTMLInputElement>(null)`，访问 current 用可选链；非 DOM 可变值用 `useRef<number>(0)`。forwardRef 第一个泛型是 ref 元素类型，第二个是 props；React 19 部分场景 ref 可作为 prop。Callback ref 适合 mount 时测量；useImperativeHandle 暴露命令式 API。常见元素：div→HTMLDivElement、input→HTMLInputElement、canvas→HTMLCanvasElement。
