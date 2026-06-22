# 图标与原子化 CSS

图标推荐 **unplugin-icons + Iconify** 按需 SVG；页面布局用 **Tailwind / UnoCSS** 原子类，与 UI 库组件分工。装饰性图标加 **aria-hidden**，独立图标按钮加 **aria-label**。

---

## 图标方案对比

| 方案 | 体积 | 灵活度 | 维护 |
|------|------|--------|------|
| 字体图标 iconfont | 全字体 | 单色为主 | 需自己更新 |
| SVG 组件 | 按需 | 多色、动画 | 推荐 |
| UI 库图标 | 随库 | 风格统一 | 绑定库 |
| Iconify | 按需集合 | 10 万+ | 社区 |

---

## unplugin-icons

```bash
pnpm add -D unplugin-icons @iconify/json
```

```ts
// vite.config.ts
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';

Components({
  resolvers: [
    IconsResolver({ prefix: 'icon' }),
  ],
}),
Icons({ autoInstall: true }),
```

```vue
<template>
  <!-- 编译为 SVG 组件 -->
  <icon-mdi-account />
  <icon-ep-edit />
</template>
```

| 前缀 | 集合 |
|------|------|
| `~icons/ep/` | Element Plus Icons |
| `~icons/mdi/` | Material Design |
| `~icons/tabler/` | Tabler |

---

## 手动导入 SVG 组件

```vue
<script setup>
import IconLogo from '@/assets/logo.svg?component';
</script>
<template>
  <IconLogo class="w-8 h-8" aria-hidden="true" />
</template>
```

Vite `?component` 将 SVG 转为 Vue 组件。

---

## 可访问性

```vue
<!-- 装饰性 -->
<icon-mdi-check aria-hidden="true" />

<!-- 有意义 -->
<button aria-label="删除">
  <icon-mdi-delete aria-hidden="true" />
</button>

<!-- 或可见文字 + 图标 -->
<button>
  <icon-mdi-delete aria-hidden="true" />
  <span>删除</span>
</button>
```

勿仅用颜色/icon 传达唯一信息。

---

## Tailwind CSS 接入

```bash
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```css
/* src/styles/tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```ts
// main.ts
import '@/styles/tailwind.css';
```

```vue
<template>
  <div class="flex items-center gap-4 p-4 rounded-lg bg-white shadow-sm">
    <h1 class="text-xl font-semibold text-gray-900">标题</h1>
  </div>
</template>
```

---

## UnoCSS（可选）

```bash
pnpm add -D unocss
```

```ts
// vite.config.ts
import UnoCSS from 'unocss/vite';

plugins: [vue(), UnoCSS()],
```

```ts
// uno.config.ts
import { defineConfig, presetUno, presetIcons } from 'unocss';

export default defineConfig({
  presets: [presetUno(), presetIcons()],
});
```

UnoCSS 启动快、预设图标；语法与 Tailwind 高度相似。

---

## 与 scoped / UI 库

| 实践 | 说明 |
|------|------|
| 布局用 atomic | flex/grid/padding |
| 组件视觉用 UI 库 | Button、Input |
| 勿 `@apply` 泛滥 | 难搜索，适度用 |
| preflight 冲突 | 只保留一份 reset |

```vue
<!-- 在 ElCard 上用 Tailwind 做外层布局 -->
<div class="grid grid-cols-12 gap-4">
  <ElCard class="col-span-8">...</ElCard>
</div>
```

---

## 设计 token 桥接

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: 'var(--color-brand)',
      },
    },
  },
};
```

原子类引用 CSS 变量，与主题 token 一致。

---

## 性能

| 点 | 建议 |
|----|------|
| Icon tree-shake | unplugin-icons 按需 |
| Tailwind purge | content 含 `.vue` |
| 大列表 icon | 避免重复复杂 SVG 动画 |

生产构建后未用类会被 purge，体积可控。

---

## 小结

**图标**：`unplugin-icons` + Iconify 按需 SVG；或 UI 库内置图标；品牌 logo 可用 `?component` 导入。

**布局**：Tailwind / UnoCSS 原子类负责 flex/grid/spacing；Button/Input 等视觉交给 UI 库。

**a11y**：纯装饰 `aria-hidden="true"`；仅图标的按钮加 `aria-label` 或配可见文字。

**共存**：勿 `@apply` 泛滥；Tailwind preflight 与 UI 库 reset 只保留一份。

**token 桥接**：Tailwind `extend.colors.brand: 'var(，color-brand)'` 与 CSS 变量主题联动。

**性能**：icons 按需 tree-shake；Tailwind content 含 `.vue` 才能 purge。

核对：图标按钮有 aria-label 吗？preflight 冲突了吗？purge 配置含 vue 吗？
