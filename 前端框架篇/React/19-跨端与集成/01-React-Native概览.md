# React Native 概览

> **React Native（RN）** 用 React 写 **iOS / Android**（及 Web）界面，渲染为**原生组件**而非 DOM。语法像 React，运行时与 Web 不同。

---

## 一、Web React vs RN

```mermaid
flowchart LR
  subgraph web [React Web]
    JSX1[JSX]
    DOM[react-dom → DOM]
  end
  subgraph rn [React Native]
    JSX2[JSX]
    Native[渲染器 → UIView / android.View]
  end
```

| | Web | RN |
|---|-----|-----|
| 容器 | div、span | View、Text |
| 样式 | CSS 文件 | StyleSheet（类似 CSS 子集） |
| 路由 | React Router | React Navigation / Expo Router |
| 打包 | Vite/Webpack | Metro |

---

## 二、最小示例

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';

export function Counter() {
  const [n, setN] = useState(0);
  return (
    <View style={styles.box}>
      <Text>{n}</Text>
      <Pressable onPress={() => setN(n + 1)}>
        <Text>加一</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 16, alignItems: 'center' },
});
```

| Web | RN |
|-----|-----|
| `<div>` | `<View>` |
| `<button>` | `<Pressable>` / `<Button>` |
| `onClick` | `onPress` |
| `className` | `style` |

---

## 三、Expo vs 裸 RN

| | Expo | 裸 RN |
|---|------|-------|
| 上手 | `npx create-expo-app` | 需 Xcode/Android Studio |
| 原生模块 | Expo SDK | 自行 link |
| OTA 更新 | EAS Update | 自建 |
| 适用 | 多数 App | 深度原生定制 |

**新项目**常从 **Expo** 开始。

---

## 四、与 Web 代码共享

| 可共享 | 需分叉 |
|--------|--------|
| 业务逻辑 Hook | JSX 组件（除非 react-native-web） |
| TanStack Query | 路由、布局 |
| TS 类型、utils | 样式 |
| Zustand | 部分 UI 库 |

Monorepo 结构：

```
packages/
├── app-mobile/     # RN
├── app-web/        # Vite
└── shared/         # hooks、api、types
```

---

## 五、导航

```tsx
// Expo Router 文件路由（类似 Next）
// app/(tabs)/index.tsx
// app/user/[id].tsx
```

或 **React Navigation** 声明式栈/Tab。

---

## 六、调试与性能

| 工具 | |
|------|--|
| Flipper / React Native DevTools | |
| Hermes 引擎 | 默认 JS 引擎 |
| 列表 | FlatList 虚拟化（类似 Web 虚拟列表） |

---

## 七、何时选 RN？

| ✅ | ❌ |
|----|-----|
| 要原生体验 App | 纯 H5 够用 |
| 团队会 React | 强依赖 DOM/SEO |
| 一套逻辑移动+Web（+ RN Web） | 极简静态页 |

---

## 八、小结

| 记住 | |
|------|--|
| 组件名不同、无 DOM | |
| Expo 降低门槛 | |
| 逻辑可 monorepo 共享 | |

**下一篇**：[02-微前端与模块联邦](./02-微前端与模块联邦.md)
