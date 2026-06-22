# defineProps 与 defineEmits 类型

script setup 里 props 和 emits 的类型标准写法是 **defineProps&lt;T&gt;() + withDefaults**；**defineEmits** 用「事件名 → 参数元组」映射；Vue 3.4+ **defineModel** 简化 v-model，少写样板。

---

## 两种声明方式

| 方式 | 语法 | 运行时校验 |
|------|------|------------|
| 运行时 | `defineProps({ id: Number })` | 开发环境可选 |
| 类型 | `defineProps<{ id: number }>()` | 编译期 only |

推荐 **TypeScript 项目用类型声明**，配合 interface 复用。

---

## 类型声明 defineProps

```vue
<script setup lang="ts">
interface Props {
  id: number;
  title?: string;
  items: string[];
}

const props = defineProps<Props>();
</script>
```

访问 `props.id` 有完整推断；模板中同样类型安全。

---

## 带默认值：withDefaults

```vue
<script setup lang="ts">
interface Props {
  title?: string;
  pageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: '默认标题',
  pageSize: 20,
});
</script>
```

| 注意 | 说明 |
|------|------|
| 仅可选 prop 可默认 | 必填项无 default |
| 引用类型 default | 用工厂函数 `() => []` |

```ts
withDefaults(defineProps<Props>(), {
  tags: () => [],
});
```

---

## Vue 3.5+ props 解构（响应式）

```vue
<script setup lang="ts">
const { title = '默认', pageSize = 20 } = defineProps<{
  title?: string;
  pageSize?: number;
}>();
</script>
```

编译器注入响应式解构，**无需** `toRefs(props)`（3.5 前解构会丢响应式）。

---

## 运行时 + TS 混合（PropType）

```vue
<script lang="ts">
import type { PropType } from 'vue';

export default defineComponent({
  props: {
    user: { type: Object as PropType<User>, required: true },
    status: {
      type: String as PropType<'draft' | 'published'>,
      default: 'draft',
    },
  },
});
</script>
```

Options API 遗留或需运行时 validator 时使用。

---

## defineEmits 类型

```vue
<script setup lang="ts">
const emit = defineEmits<{
  submit: [payload: FormData];
  'update:modelValue': [value: string];
  cancel: [];
}>();

function onSubmit(data: FormData) {
  emit('submit', data);
}
</script>
```

| 格式 | 含义 |
|------|------|
| `event: [arg1, arg2]` | 元组定义参数 |
| `cancel: []` | 无参事件 |

---

## 运行时 emits 选项

```ts
const emit = defineEmits({
  submit: (payload: FormData) => payload instanceof FormData,
});
```

校验仅在 dev；TS 项目优先元组形式。

---

## v-model 类型

```vue
<script setup lang="ts">
const model = defineModel<string>({ default: '' });

// 多个 v-model
const visible = defineModel<boolean>('visible', { default: false });
</script>
```

`defineModel`（3.4+）简化 `modelValue` + `update:modelValue` 样板。

---

## 提取 Props 类型供外部使用

```ts
// components/UserCard.vue
export interface UserCardProps {
  user: User;
  compact?: boolean;
}

// 组件内
defineProps<UserCardProps>();

// 外部
import type { UserCardProps } from './UserCard.vue';
```

---

## 常见错误

| 错误 | 修复 |
|------|------|
| `defineProps is not defined` | 宏无需 import |
| 默认值不生效 | 用 withDefaults |
| emit 名拼写 | vue-tsc 模板检查 |
| 可选 prop + undefined | 显式 `?` 或 `\| undefined` |

---

## 小结

**defineProps**：`defineProps<Props>()` 编译期类型；可选 prop 默认值用 `withDefaults`；数组/对象 default 用工厂函数 `() => []`。

**Vue 3.5 解构**：`const { title = 'x' } = defineProps<...>()` 编译器保响应式；3.5 前勿直接解构 props。

**defineEmits**：`defineEmits<{ change: [id: number] }>()` 元组映射参数；无参写 `cancel: []`。

**defineModel**（3.4+）：替代 props + emit 的 v-model 样板；多 v-model 用 `defineModel('visible')`。

**PropType**：Options API 或需运行时校验时用 `Object as PropType<User>`。

**导出类型**：SFC 里 `export interface XxxProps` 供外部和组件库消费。

核对：默认值走 withDefaults 了吗？emit 名模板和 script 一致吗？3.5 前有没有误解构 props？
