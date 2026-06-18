# React Testing Library 基础

> **RTL** 通过 **role、label、text** 查询 DOM，模拟真实用户操作。核心：**render → query → userEvent → assert**。

---

## 一、基本流程

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Counter } from './Counter';

describe('Counter', () => {
  it('点击后计数增加', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole('button', { name: '加一' }));
    expect(screen.getByText('计数: 1')).toBeInTheDocument();
  });
});
```

```mermaid
flowchart LR
  R[render]
  Q[getByRole / findBy...]
  U[userEvent]
  A[expect]
  R --> Q --> U --> A
```

---

## 二、查询优先级

| 优先级 | 方法 | 场景 |
|--------|------|------|
| 1 | `getByRole` | button、heading、textbox |
| 2 | `getByLabelText` | 表单 |
| 3 | `getByPlaceholderText` | 无 label 时 |
| 4 | `getByText` | 非交互文本 |
| 5 | `getByTestId` | 最后手段 |

```tsx
screen.getByRole('button', { name: /提交/i });
screen.getByLabelText('邮箱');
```

**避免** `container.querySelector('.btn-primary')`。

---

## 三、getBy vs queryBy vs findBy

| API | 找不到 | 异步 |
|-----|--------|------|
| `getBy*` | **抛错** | 否 |
| `queryBy*` | 返回 null | 否 |
| `findBy*` | 超时抛错 | **是**（waitFor） |

```tsx
// 元素不应存在
expect(screen.queryByText('错误')).not.toBeInTheDocument();

// 异步出现
expect(await screen.findByText('加载完成')).toBeInTheDocument();
```

---

## 四、userEvent vs fireEvent

| | userEvent | fireEvent |
|---|-----------|-----------|
| 仿真 | 更接近真实（focus、hover 链） | 单事件 |
| 推荐 | ✅ 默认 | 特殊低层场景 |

```tsx
await user.type(screen.getByRole('textbox'), 'hello');
await user.keyboard('{Enter}');
```

---

## 五、within 缩小范围

```tsx
const dialog = screen.getByRole('dialog');
const submit = within(dialog).getByRole('button', { name: '确定' });
```

---

## 六、异步与 waitFor

```tsx
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('已保存')).toBeInTheDocument();
});
```

`findBy*` 等价于 `waitFor + getBy*`。

---

## 七、常见 matcher（jest-dom）

| matcher | 含义 |
|---------|------|
| `toBeInTheDocument()` | 在 document 中 |
| `toBeDisabled()` | disabled |
| `toHaveValue('x')` | input 值 |
| `toHaveAccessibleName()` | 可访问名 |

---

## 八、反模式

| ❌ | ✅ |
|----|-----|
| `wrapper.find('Button')` Enzyme 风格 | getByRole |
| 测组件 state | 测 UI 结果 |
| 过多 snapshot | 关键结构 snapshot |

---

## 九、小结

| 记住 | |
|------|--|
| getByRole 优先 | |
| userEvent.setup() | |
| findBy 等异步 | |

**上一篇**：[01-测试策略与金字塔](./01-测试策略与金字塔.md)  
**下一篇**：[03-组件测试模式](./03-组件测试模式.md)
