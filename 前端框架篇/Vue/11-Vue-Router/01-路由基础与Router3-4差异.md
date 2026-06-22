# 路由基础与 Router 3/4 差异

单页应用只有一个 HTML 入口，页面切换靠 JavaScript 替换组件。Vue Router 把 URL 映射到组件，让路径可分享、后退可用、守卫可拦截。Vue 3 配套 Router 4：`createRouter` + `createWebHistory`，组合式 API 用 `useRoute` / `useRouter`；从 Router 3 迁移时，`addRoutes` 改为 `addRoute`，通配符改为 `pathMatch`。

---

## 为什么需要 Vue Router

没有路由时，常见做法是用 `v-if` 或全局 state 模拟「页面」，URL 不可分享、浏览器后退失效、权限边界模糊。

```mermaid
flowchart LR
  URL["/users/42"]
  URL --> VR[Vue Router]
  VR --> Comp[UserDetail.vue]
  Comp --> DOM[DOM 更新]
```

| 无路由 | 有路由 |
|--------|--------|
| 刷新丢失「当前页」 | 路径即位置，可书签 |
| 难以做登录拦截 | 全局/路由级守卫 |
| SEO 与分享差 | 可配合 SSR/Nuxt |

---

## Vue Router 4 最小示例

```bash
pnpm add vue-router@4
```

```ts
// router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Home from '@/views/Home.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Home },
  { path: '/about', name: 'About', component: () => import('@/views/About.vue') },
  { path: '/users/:id', name: 'UserDetail', component: () => import('@/views/UserDetail.vue') },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
```

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';

createApp(App).use(router).mount('#app');
```

```vue
<!-- App.vue -->
<template>
  <nav>
    <RouterLink to="/">首页</RouterLink>
    <RouterLink to="/about">关于</RouterLink>
  </nav>
  <RouterView />
</template>
```

| API | 作用 |
|-----|------|
| `createRouter` | 创建路由实例（Router 4 入口） |
| `createWebHistory` | HTML5 History 模式 |
| `RouterLink` | 声明式导航，自动加 active 类 |
| `RouterView` | 当前匹配组件的渲染出口 |

---

## History 模式对比

| 模式 | 创建函数 | URL 形态 | 部署注意 |
|------|----------|----------|----------|
| History | `createWebHistory()` | `/about` | 服务器需 fallback 到 index.html |
| Hash | `createWebHashHistory()` | `/#/about` | 无需服务端配置 |
| Memory | `createMemoryHistory()` | 内存路径 | SSR / 测试环境 |

```ts
// 生产环境 History 模式 nginx 示例
// try_files $uri $uri/ /index.html;
```

Hash 模式兼容性好但 URL 带 `#`；History 模式更美观，是现代项目的默认选择。

---

## Router 3 vs Router 4 核心差异

Vue 2 使用 `new VueRouter({ mode: 'history', routes })`；Vue 3 改为工厂函数，且与 Composition API 深度集成。

| 能力 | Vue Router 3（Vue 2） | Vue Router 4（Vue 3） |
|------|----------------------|----------------------|
| 创建 | `new VueRouter()` | `createRouter()` |
| 模式 | `mode: 'history'` | `history: createWebHistory()` |
| 挂载 | `new Vue({ router })` | `app.use(router)` |
| 导航组件 | `<router-link>` | `<RouterLink>`（推荐 PascalCase） |
| 出口 | `<router-view>` | `<RouterView>` |
| 组合式 API | 无原生 | `useRoute`、`useRouter` |
| 动态添加 | `router.addRoutes()`（已废弃） | `router.addRoute()` |
| TypeScript | 较弱 | `RouteRecordRaw`、路由 meta 泛型 |
| `<router-view>` key | 手动 | 支持 `v-slot="{ Component }"` + `<Transition>` |

```js
// Router 3（Vue 2）
import VueRouter from 'vue-router';
const router = new VueRouter({ mode: 'history', routes });
```

```ts
// Router 4（Vue 3）
import { createRouter, createWebHistory } from 'vue-router';
const router = createRouter({ history: createWebHistory(), routes });
```

---

## 编程式导航与组合式 API

```vue
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();   // 当前路由（响应式）
const router = useRouter(); // 路由实例

function goUser(id: number) {
  router.push({ name: 'UserDetail', params: { id: String(id) } });
}

function goBack() {
  router.back();
}
</script>

<template>
  <p>当前路径：{{ route.path }}</p>
  <p>用户 ID：{{ route.params.id }}</p>
  <button @click="goUser(42)">查看用户 42</button>
</template>
```

| 方法 | 说明 |
|------|------|
| `router.push(location)` | 追加历史记录 |
| `router.replace(location)` | 替换当前记录 |
| `router.go(n)` | 前进/后退 n 步 |
| `route.params` | 动态段参数 |
| `route.query` | 查询字符串 |
| `route.meta` | 路由元信息（权限等） |

---

## 命名路由与 active 样式

```ts
{ path: '/about', name: 'About', component: About }
```

```vue
<RouterLink :to="{ name: 'About' }" active-class="is-active">
  关于
</RouterLink>
```

`RouterLink` 默认给匹配项加 `router-link-active`；精确匹配可加 `exact-active-class` 或使用 `custom` + `v-slot` 完全自定义。

---

## 从 Router 3 迁移要点

| 步骤 | 操作 |
|------|------|
| 1 | 升级 `vue-router` 至 4.x |
| 2 | `new VueRouter` → `createRouter` + `createWebHistory` |
| 3 | 全局替换 `router.addRoutes` → 循环 `addRoute` |
| 4 | 移除 `*` 通配，改用 `/:pathMatch(.*)*` |
| 5 | 组件内 `this.$route` → `useRoute()` |
| 6 | 通配符路由 catch-all 放 routes 数组末尾 |

```ts
// Router 4 的 404 写法
{ path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
```

---

## 常见坑

| 现象 | 原因 | 处理 |
|------|------|------|
| 刷新 404 | History 模式无 fallback | 配置服务器 rewrite |
| `params` 丢失 | 使用 `name` 跳转时未传参 | `push({ name, params })` |
| 重复导航报错 | 跳转同一路由 | Router 4 已静默；或 catch |
| BASE_URL 错误 | 部署子路径 | `createWebHistory('/app/')` |

---

## 小结

**Vue Router** 把 URL 映射到组件，是 SPA 页面切换、分享、后退和权限拦截的基础。Router 4 入口为 `createRouter` + `createWebHistory`；模板用 `RouterLink` / `RouterView`。

**History 模式**：`createWebHistory` 生成美观 URL，生产需服务端 fallback 到 `index.html`；Hash 模式免配置但 URL 带 `#`；Memory 用于 SSR/测试。

**组合式 API**：`useRoute` 读当前路由（path、params、query、meta）；`useRouter` 做 `push` / `replace` / `back`。命名路由跳转时务必带上 `params`，否则动态段会丢。

**相对 Router 3**：工厂函数替代 `new VueRouter`；`addRoute` 替代 `addRoutes`；404 用 `/:pathMatch(.*)*` 且放 routes 末尾；TypeScript 用 `RouteRecordRaw` 和 meta 泛型扩展。

**部署**：子路径部署时 `createWebHistory(import.meta.env.BASE_URL)` 与构建 `base` 一致；刷新 404 是 History 模式最常见线上问题。

核对：History fallback 配了吗？`name` 跳转传 params 了吗？catch-all 是否在 routes 最后？
