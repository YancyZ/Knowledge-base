# Storybook 与视觉回归

> **Storybook** 在隔离环境展示组件各 **state / variant**，用于文档、设计对齐和**视觉回归测试**（Chromatic 等）。

---

## 一、Storybook 解决什么？

```mermaid
flowchart LR
  SB[Storybook]
  SB --> Doc[组件文档]
  SB --> Design[设计对照]
  SB --> Visual[视觉回归 CI]
  SB --> Manual[手工 QA 态]
```

| 价值 | 说明 |
|------|------|
| 隔离开发 | 不跑整应用 |
| 状态矩阵 | primary/disabled/loading |
| 设计协作 | 设计师可点 |

---

## 二、安装与 Story

```bash
pnpm dlx storybook@latest init
```

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', children: '确定' },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: '确定' },
};
```

---

## 三、Decorator 包 Provider

```tsx
const meta: Meta<typeof Dashboard> = {
  decorators: [
    Story => (
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};
```

全局 decorator 在 `.storybook/preview.tsx` 配置。

---

## 四、Controls 与 Args

```tsx
export const Playground: Story = {
  args: {
    size: 'md',
    variant: 'secondary',
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};
```

侧边栏动态改 props，快速验边界。

---

## 五、交互测试（Storybook Test）

```tsx
import { expect, userEvent, within } from '@storybook/test';

export const Submit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '提交' }));
    await expect(canvas.getByText('成功')).toBeInTheDocument();
  },
};
```

与 Vitest 集成可 CI 跑 story tests。

---

## 六、视觉回归

| 工具 | 方式 |
|------|------|
| **Chromatic** | 云端截图 diff |
| **lost-pixel** | 自托管 |
| Storybook + Playwright | 截图对比 |

流程：PR → 自动截图 → 与 baseline diff → 人工 approve。

---

## 七、与 RTL 分工

| Storybook | RTL |
|-----------|-----|
| 视觉、文档、设计态 | 逻辑、交互断言 |
| 组件矩阵 | 业务流程 |

**互补**，非替代。

---

## 八、最佳实践

| 实践 | |
|------|--|
| 每个 UI 组件至少 1 story | |
| 覆盖 empty / error / loading | |
| 与 Figma 同名 variant | |
| 大页面用 **feature story** 而非整 app | |

---

## 九、小结

| 要点 | |
|------|--|
| stories 描述组件态 | |
| decorator 包 Provider | |
| Chromatic 视觉 CI | |

**上一篇**：[04-Hooks与Provider测试](./04-Hooks与Provider测试.md)  
**下一模块**：[16-可访问性-安全-国际化](../16-可访问性-安全-国际化/01-可访问性基础与ARIA.md)
