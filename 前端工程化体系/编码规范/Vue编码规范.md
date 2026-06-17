# Vue 前端编码规范

> 本文档为**通用 Vue 编码标准**，适用于 Vue 3、Composition API、TypeScript、Vite 技术栈。

---

## 一、总则

### 1.1 核心原则

1. **可读性优先**：模板、脚本、样式各司其职，逻辑清晰
2. **命名见名知意**：禁止拼音首字母缩写、无意义变量名
3. **禁止硬编码**：常量、配置、错误码统一管理
4. **禁止提交垃圾代码**：`console.log`、`debugger`、本地配置不得入库
5. **统一格式化与 Lint**：全项目 ESLint + Prettier 一致
6. **保护主分支**：禁止直接向 `main` / `master` / `production` 推送

### 1.2 技术选型约定

| 类别 | 推荐方案 | 说明 |
|------|----------|------|
| 框架 | Vue 3 | 禁止新项目使用 Vue 2 Options API 为主 |
| 写法 | Composition API + `<script setup>` | 逻辑复用更清晰 |
| 语言 | TypeScript | 业务代码禁止纯 JavaScript |
| 构建 | Vite | 遵循官方最佳实践 |
| 包管理 | pnpm | 须提交 lock 文件 |
| 路由 | Vue Router 4+ | 页面懒加载 |
| 状态 | Pinia | 替代 Vuex |
| 请求 | axios + 可选 vue-query | 服务端状态缓存 |

### 1.3 强制红线

- 禁止滥用 `any`、无说明的 `@ts-ignore`
- 禁止直接修改 props
- 禁止在模板中写复杂表达式
- 禁止 `v-for` 使用不稳定 key（可重排列表禁止用 index）
- 禁止未处理的 Promise rejection
- 禁止硬编码密钥、Token

---

## 二、工程与目录规范

### 2.1 推荐目录结构

```plaintext
src/
├── api/                # 请求封装、接口定义
│   ├── request.ts
│   └── modules/
├── assets/             # 静态资源、全局样式
├── components/         # 公共组件
│   ├── base/           # 基础组件
│   └── business/       # 业务组件
├── composables/        # 组合式函数（等同 React Hooks）
├── config/             # 全局配置
├── layouts/            # 布局组件
├── router/             # 路由配置
├── stores/             # Pinia 状态
│   ├── modules/
│   └── index.ts
├── types/              # 全局类型
├── utils/              # 工具函数
├── views/              # 页面组件
├── App.vue
└── main.ts
```

### 2.2 编码格式

| 规则 | 值 |
|------|-----|
| 缩进 | 2 空格 |
| 引号 | 单引号（JS/TS），双引号（模板属性） |
| 行宽 | 100–120 字符 |
| 分号 | 与 Prettier 配置一致 |
| 文件编码 | UTF-8 |

### 2.3 SFC 块顺序

```vue
<script setup lang="ts">
<!-- 逻辑 -->
</script>

<template>
  <!-- 模板 -->
</template>

<style scoped lang="scss">
<!-- 样式 -->
</style>
```

---

## 三、命名规范

### 3.1 文件命名

| 类型 | 规则 | 示例 |
|------|------|------|
| 单文件组件 | PascalCase | `UserProfile.vue` |
| 组合式函数 | `use` + camelCase | `useUserQuery.ts` |
| 工具 / 接口 | camelCase | `request.ts`、`userApi.ts` |
| 样式 | 组件内 scoped 或 `.module.scss` | — |

### 3.2 组件命名

- **多词组件名**：`UserCard` 而非 `Card`（避免与 HTML 元素冲突）
- **基础组件**加前缀：`BaseButton`、`BaseInput`
- **路由组件**与路由 path 对应：`UserProfile.vue` → `/user/profile`

### 3.3 变量与常量

```typescript
const userList = ref<UserItem[]>([]);
const isLoading = ref(false);
const MAX_PAGE_SIZE = 100;
```

### 3.4 事件命名

- 组件 emit 使用 **kebab-case**：`update:modelValue`、`item-click`
- 处理函数使用 `handle` 前缀：`handleSubmit`、`handleItemClick`

---

## 四、组件编写规范

### 4.1 基本规则

1. 优先使用 `<script setup lang="ts">`
2. Props 必须定义类型，`withDefaults` 设置默认值
3. Emits 必须显式声明
4. 模板中禁止复杂逻辑，用计算属性或方法替代
5. 单文件组件不超过 300 行，超出则拆分

### 4.2 标准组件模板

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { UserItem } from '@/types/user';
import { getUserById } from '@/api/modules/user';

interface Props {
  userId: string;
  showAvatar?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
});

const emit = defineEmits<{
  edit: [id: string];
}>();

const user = ref<UserItem | null>(null);
const loading = ref(false);

const displayName = computed(() => user.value?.name ?? '未知用户');

async function fetchUser() {
  loading.value = true;
  try {
    user.value = await getUserById(props.userId);
  } finally {
    loading.value = false;
  }
}

function handleEdit() {
  if (user.value) emit('edit', user.value.id);
}

onMounted(fetchUser);
</script>

<template>
  <div v-if="loading" class="loading">加载中...</div>
  <div v-else-if="user" class="user-card">
    <img v-if="showAvatar" :src="user.avatar" :alt="displayName" />
    <h3>{{ displayName }}</h3>
    <button type="button" @click="handleEdit">编辑</button>
  </div>
</template>

<style scoped lang="scss">
.user-card {
  padding: var(--spacing-md);
}
</style>
```

### 4.3 列表渲染

```vue
<!-- ✅ 正确 -->
<li v-for="item in visibleList" :key="item.id">
  {{ item.name }}
</li>

<!-- ❌ 错误：index 作为 key -->
<li v-for="(item, index) in list" :key="index">
  {{ item.name }}
</li>
```

```typescript
// 先 filter 再渲染
const visibleList = computed(() => list.value.filter((item) => item.visible));
```

---

## 五、Composition API 与 Composables

### 5.1 基本规则

- 组合式函数以 `use` 开头，放 `composables/` 目录
- 可在 composable 内使用生命周期、响应式 API
- 返回响应式状态和方法，命名清晰

### 5.2 Composable 示例

```typescript
// composables/useUserQuery.ts
import { ref, watch } from 'vue';
import { getUserById } from '@/api/modules/user';
import type { UserItem } from '@/types/user';

export function useUserQuery(userId: Ref<string>) {
  const user = ref<UserItem | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function fetchUser(id: string) {
    loading.value = true;
    error.value = null;
    try {
      user.value = await getUserById(id);
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  watch(userId, (id) => {
    if (id) fetchUser(id);
  }, { immediate: true });

  return { user, loading, error, refetch: () => fetchUser(userId.value) };
}
```

### 5.3 生命周期清理

```typescript
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
```

---

## 六、Props 与 Emits

### 6.1 Props 规则

- 必须定义类型，标明必填 / 可选
- **禁止**直接修改 props
- 需要本地可变副本时用 `computed` 或 `ref` + `watch`

```typescript
// ✅ 正确：基于 props 的计算属性
const fullName = computed(() => `${props.firstName} ${props.lastName}`);

// ❌ 错误：直接改 props
props.name = 'new name';
```

### 6.2 v-model 约定

- 默认 `modelValue` + `update:modelValue`
- 多个 v-model 使用具名：`v-model:title` → `title` + `update:title`

```vue
<script setup lang="ts">
const title = defineModel<string>('title', { default: '' });
</script>

<template>
  <input v-model="title" />
</template>
```

---

## 七、TypeScript 规范

1. 禁止 `any`，边界数据用 `unknown` 收窄
2. 组件 Props / Emits 必须类型化
3. `ref` 复杂类型须泛型：`ref<UserItem | null>(null)`
4. 模板中使用的变量须可被 TS 推断
5. 公共 composable、工具函数宜写 TSDoc

```typescript
function parseId(raw: unknown): string {
  if (typeof raw !== 'string') throw new Error('Invalid id');
  return raw;
}
```

---

## 八、Pinia 状态管理

### 8.1 职责划分

| 场景 | 方案 |
|------|------|
| 组件内状态 | `ref` / `reactive` |
| 跨组件共享 | composable 或 Pinia |
| 全局客户端状态 | Pinia |
| 服务端数据 | API + 可选 vue-query |

### 8.2 Store 示例

```typescript
// stores/modules/app.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  const theme = ref<'light' | 'dark'>('light');

  function setTheme(value: 'light' | 'dark') {
    theme.value = value;
  }

  return { theme, setTheme };
}, {
  persist: true, // 若使用 pinia-plugin-persistedstate
});
```

### 8.3 使用规范

- Store 按业务模块拆分
- 命名：`useXxxStore`
- 异步 action 须处理错误
- 禁止在 Store 中直接操作 DOM

---

## 九、请求与 API 规范

```typescript
// api/request.ts
import axios from 'axios';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default request;
```

- 环境变量仅 `VITE_` 前缀
- 须提供 `.env.example`
- 接口按模块拆分，响应须定义类型

---

## 十、Vue Router 规范

1. 路由懒加载：`component: () => import('@/views/UserProfile.vue')`
2. path 使用 **kebab-case**
3. 路由守卫集中处理鉴权
4. 布局路由使用嵌套路由

```typescript
const routes = [
  {
    path: '/user',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/UserProfile.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
];
```

---

## 十一、样式规范

### 11.1 基本规则

- 组件样式默认 `scoped`
- 穿透子组件：` :deep(.child-class) { }`
- 全局变量用 CSS 自定义属性
- BEM 命名：`block__element--modifier`

### 11.2 主题示例

```scss
:root {
  --color-primary: #1677ff;
  --spacing-md: 16px;
  --font-size-base: 14px;
}

:root[data-theme='dark'] {
  --color-bg: #141414;
  --color-text: #e5e5e5;
}
```

### 11.3 样式红线

- 禁止无 scoped 的业务样式污染全局
- 禁止 ID 选择器
- 选择器嵌套不超过 3 层
- z-index 须分层管理

---

## 十二、性能与可访问性

### 12.1 性能

- 路由与重型组件懒加载
- 长列表虚拟滚动（如 `vue-virtual-scroller`）
- 合理使用 `v-once`、`v-memo`（Vue 3.2+）
- 大对象用 `shallowRef` / `shallowReactive`

### 12.2 可访问性

- 表单 `label` 与 `input` 关联
- 图标按钮加 `aria-label`
- 动态内容考虑 `aria-live`

---

## 十三、测试规范

- **Vitest** + **@vue/test-utils**
- 优先测 composables、utils、纯逻辑
- 组件测试模拟用户交互

```typescript
import { mount } from '@vue/test-utils';
import UserCard from './UserCard.vue';

test('renders user name', () => {
  const wrapper = mount(UserCard, {
    props: { user: { id: '1', name: 'Alice' } },
  });
  expect(wrapper.text()).toContain('Alice');
});
```

---

## 十四、Git 与提交规范

与 React 规范一致，采用 **Conventional Commits**：

```plaintext
type(scope): subject
```

示例：`feat(user): 添加用户资料编辑页`

分支：`feature/模块-功能`、`bugfix/模块-问题`

---

## 十五、响应式、性能与架构

### 15.1 响应式系统要点

Vue 3 用 **Proxy** 追踪 `reactive` 对象；`ref` 通过 `.value` 包装基本类型。

| API | 适用 | 陷阱 |
|-----|------|------|
| `ref` | 基本类型、需替换整个对象 | 模板自动解包，script 须 `.value` |
| `reactive` | 结构固定对象 | 不能解构（失响应式）→ `toRefs` |
| `shallowRef` | 大对象、第三方实例 | 只跟踪 `.value` 替换 |
| `shallowReactive` | 深层不需追踪 | 嵌套属性变更不触发 |
| `computed` | 派生状态 | 禁止 side effect |
| `watch` vs `watchEffect` | 显式 deps vs 自动收集 | watchEffect 立即跑一遍 |

```typescript
const state = reactive({ list: [] as Item[] });
// ❌ 解构失响应式
const { list } = state;
// ✅
const { list } = toRefs(state);
```

### 15.2 编译器优化（利用而非对抗）

- **静态提升**：纯静态 VNode 复用
- **PatchFlag**：动态节点打标，diff 跳过静态子树
- **v-once**：永不更新的子树
- **v-memo**（Vue 3.2+）：`v-memo="[deps]"` 类似 memo

```vue
<div v-for="item in list" :key="item.id" v-memo="[item.selected]">
  <!-- 仅 item.selected 变时才更新此节点 -->
</div>
```

**`:key` 必须稳定** — 与 v-memo、Transition 共用时的常见 bug 源。

### 15.3 Pinia Store 设计模式

**Setup Store**（推荐复杂逻辑）：

```typescript
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  const total = computed(() => items.value.reduce((s, i) => s + i.price, 0));

  async function checkout() {
    await api.checkout(items.value);
    items.value = [];
  }

  return { items, total, checkout };
});
```

**原则**：

- Store 放**跨路由**状态；页面私有放 composable
- 异步 action 统一 error handling，向外抛或返回 Result 型
- 大列表勿整表放 Store — 考虑 normalized map 或 Query 层

### 15.4 provide / inject 类型安全

```typescript
// keys.ts
import type { InjectionKey } from 'vue';

export interface ThemeContext {
  theme: Ref<'light' | 'dark'>;
  toggle: () => void;
}

export const themeKey: InjectionKey<ThemeContext> = Symbol('theme');

// provider
provide(themeKey, { theme, toggle });

// consumer
const theme = inject(themeKey);
if (!theme) throw new Error('ThemeProvider required');
```

优于字符串 key；Composition API 下替代盲目 props drilling。

### 15.5 Teleport + Suspense 异步边界

```vue
<Teleport to="body">
  <Modal v-if="open">...</Modal>
</Teleport>

<Suspense>
  <AsyncDashboard />
  <template #fallback>Loading...</template>
</Suspense>
```

Modal 挂 body 避免 z-index / overflow 陷阱；Suspense 配合 async setup 或 async component。

### 15.6 keep-alive 与缓存策略

```vue
<router-view v-slot="{ Component }">
  <keep-alive :include="['UserList']" :max="10">
    <component :is="Component" :key="route.fullPath" />
  </keep-alive>
</router-view>
```

**include** 用组件 `name`（script setup 须 `defineOptions({ name: 'UserList' })`）。  
离开页面前在 `onActivated` / `onDeactivated` 刷新或暂停轮询。

### 15.7 与 React 差异：模板 vs JSX 架构

| 关注点 | Vue 倾向 | React 倾向 |
|--------|----------|------------|
| 逻辑复用 | composable | custom hook |
| 条件渲染 | `v-if` 真卸载 | `{cond && <X/>}` 常显隐 |
| 双向绑定 | `v-model` / defineModel | 受控 + callback |
| 性能标记 | 编译器 v-memo | 手动 memo |

**v-if vs v-show**：切换频用 v-show（CSS）；少切换 / 重初始化用 v-if。

### 15.8 测试 composable 隔离

```typescript
import { ref } from 'vue';
import { useCounter } from './useCounter';

test('increments', () => {
  const count = ref(0);
  const { increment } = useCounter(count);
  increment();
  expect(count.value).toBe(1);
});
```

或用 `@vue/test-utils` 的 `withSetup` 包装生命周期相关 composable。

---

## 十六、禁止行为汇总

| 类别 | 禁止项 |
|------|--------|
| 类型 | `any`、无说明 `@ts-ignore` |
| Vue | 直接改 props、模板复杂表达式、不稳定 key |
| 安全 | 硬编码密钥、`v-html` 未消毒 |
| 调试 | 提交 `console.log`、`debugger` |
| 样式 | 无 scoped 污染、裸 z-index |
| 架构 | Store 操作 DOM、循环依赖 |

---

## 十七、小结

Vue 3 编码规范以 **Composition API + script setup + TypeScript** 为基线：响应式选型（ref/reactive/shallow）、composable 复用、Pinia 分层与 provide/inject 类型安全构成日常开发骨架。性能上理解 `v-memo`、keep-alive、异步边界；安全上严控 `v-html`。与 React 规范并列，供 Vue 技术栈团队统一 Review 标准。
