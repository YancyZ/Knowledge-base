# React Server Components（RSC）

> **Server Component** 只在服务端运行，产物是 **UI 描述（非 JS bundle）**，默认不能 useState/useEffect。用来**减客户端 JS、直连数据库**，与 Client Component 组合成现代全栈 React。

---

## 一、Server vs Client

```mermaid
flowchart LR
  subgraph server [Server Component]
    SC[async 读 DB]
    SC --> HTML[序列化 UI 树]
  end
  subgraph client [Client Component]
    CC[useState / onClick]
    CC --> JS[打包进 bundle]
  end
  server -->|嵌入| client
```

| | Server Component | Client Component |
|---|------------------|------------------|
| 运行位置 | 仅服务端 | 浏览器（+ SSR 时在服务端跑一次出 HTML） |
| Hooks | ❌ 无 | ✅ |
| 事件 | ❌ | ✅ |
| 包体积 | **不**进客户端 bundle | 进 bundle |
| 异步组件 | ✅ `async function` | 需 Suspense 等 |

---

## 二、'use client' 边界

Client Component 文件**顶部**声明：

```tsx
'use client';

import { useState } from 'react';

export function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

```tsx
// Server Component（默认，无指令）
import { Counter } from './Counter';

export default async function Page() {
  const posts = await db.post.findMany();
  return (
    <div>
      <h1>文章</h1>
      <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
      <Counter />
    </div>
  );
}
```

| 规则 | 说明 |
|------|------|
| Server 可 import Client | Client 作为子节点 |
| Client **不可** import Server | 只能作为 children 传入 |
| 边界宜**尽量下推** | 少 `'use client'` 整页 |

---

## 三、为何用 RSC？

| 收益 | 例子 |
|------|------|
| 零客户端成本的大列表 | 服务端 map 成 HTML |
| 直连后端 | `await db.user.find()` 无 API 层 |
| 秘密不进 bundle | API key、连接串留服务端 |
| 与 Suspense 流式 | 慢块晚到 |

---

## 四、数据模式

```tsx
// Server Component
async function UserProfile({ id }: { id: string }) {
  const user = await fetchUser(id); // 或直接 db
  return <Card name={user.name} />;
}
```

客户端交互部分拆出去：

```tsx
'use client';
function FollowButton({ userId }: { userId: string }) {
  const [following, setFollowing] = useState(false);
  ...
}
```

---

## 五、Context 限制

Server Component **不能** `useContext` 读 Client 的 Context Provider。

```tsx
// ✅ Provider 在 Client 子树
'use client';
export function ThemeProvider({ children }) { ... }

// Server Page
export default function Page() {
  return (
    <ThemeProvider>
      <ClientChild />
    </ThemeProvider>
  );
}
```

见 [05-useContext](../05-Hooks体系/04-useContext与跨层通信.md)。

---

## 六、序列化 props

Server → Client 的 props 必须 **可序列化**（JSON 类）。

| ✅ | ❌ |
|----|-----|
| string、number、plain object | 函数 |
| Date（框架可能转 string） | class 实例 |
| JSX children | Symbol |

---

## 七、与 TanStack Query

| 场景 | 建议 |
|------|------|
| 首屏 | Server Component fetch |
| 客户端 refetch、mutation | Client + Query |
| 勿重复 | Server 数据作初始，Query `initialData` |

---

## 八、心智模型

> RSC 不是「在服务器跑的 useEffect」，而是**另一种组件类型**，输出并入 UI 流，默认不增加客户端 JS。

---

## 九、小结

| 关键词 | |
|--------|--|
| 默认 Server | |
| `'use client'` 标记交互 | |
| 边界下推 | |
| props 可序列化 | |

**上一篇**：[02-SSR基础与请求生命周期](./02-SSR基础与请求生命周期.md)  
**下一篇**：[04-Server-Actions与表单变更](./04-Server-Actions与表单变更.md)
