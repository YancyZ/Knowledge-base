# script setup 宏

**`<script setup>` 编译宏**（defineProps/Emits/Expose/Model 等）在构建期处理、无需 import，它们定义组件对外 API 与 TS 类型边界。

---

## 宏一览

| 宏 | 作用 |
|----|------|
| **defineProps** | 声明 props |
| **defineEmits** | 声明 emits |
| **defineExpose** | 暴露给父组件 ref 的方法/属性 |
| **defineOptions** | 组件 name、inheritAttrs 等（3.3+） |
| **defineModel** | 简化 v-model（3.4+） |
| **defineSlots** | 插槽 TS 类型（3.3+） |

均为 **编译器内置**，写在 script setup 顶层；**不要**从 `vue` 导入。

---

## defineProps

**运行时声明**：

```vue
<script setup>
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 }
})
</script>
```

**类型声明**：

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
}

const props = defineProps<Props>()
</script>
```

**默认值 withDefaults**：

```typescript
const props = withDefaults(defineProps<{ size?: 'sm' | 'md' }>(), {
  size: 'md'
})
```

**解构 props（3.4+）**：

```typescript
const { title, count = 0 } = defineProps<{ title: string; count?: number }>()
// 编译器注入响应式解构
```

---

## defineEmits

```vue
<script setup lang="ts">
const emit = defineEmits<{
  change: [id: number]
  update: [payload: { name: string }]
}>()

function submit() {
  emit('change', 1)
}
</script>
```

运行时 + 校验：

```javascript
const emit = defineEmits({
  submit: (payload) => payload && typeof payload.id === 'string'
})
```

---

## defineExpose

```vue
<script setup>
import { ref } from 'vue'

const inputRef = ref(null)

function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <input ref="inputRef" />
</template>
```

```vue
<!-- 父 -->
<script setup>
import { ref, onMounted } from 'vue'
import MyInput from './MyInput.vue'

const child = ref(null)
onMounted(() => child.value?.focus())
</script>

<template>
  <MyInput ref="child" />
</template>
```

script setup 默认 **closed**；父 ref 拿不到内部 unless defineExpose。

---

## defineOptions

```vue
<script setup>
defineOptions({
  name: 'UserList',
  inheritAttrs: false
})
</script>
```

替代双 script 块写 `export default { name: '...' }`。

---

## defineModel（Vue 3.4+）

```vue
<script setup>
const modelValue = defineModel<string>()
const visible = defineModel<boolean>('visible', { default: false })
</script>

<template>
  <input v-model="modelValue" />
  <dialog v-model="visible">...</dialog>
</template>
```

等价于 props + emit 样板。多个 v-model：`defineModel('title')` ↔ `v-model:title`。

---

## defineSlots

```vue
<script setup lang="ts">
defineSlots<{
  default?: (props: { item: Item }) => any
  header?: () => any
}>()
</script>
```

配合 `useSlots()` 做类型安全的插槽判断。

---

## 宏的使用约束

| 规则 | 原因 |
|------|------|
| 顶层调用 | 编译器静态分析 |
| 不可传变量宏名 | 必须字面量 |
| 不可在条件/循环里 | 同上 |
| defineProps 结果勿随意改 | 单向数据流 |

```javascript
// ❌
if (x) defineProps(['a'])

// ✅
const props = defineProps(['a'])
```

---

## 与 Options 迁移

| Options | script setup 宏 |
|---------|-----------------|
| `props: {}` | defineProps |
| `emits: []` | defineEmits |
| 无 | defineExpose |
| `export default { name }` | defineOptions |
| props + emit v-model | defineModel |

`tsconfig` 需包含 **vue compiler macros** 全局类型（create-vue 模板已配）。

---

## 小结

要点：script setup 宏是编译期处理的内置函数，定义组件对外契约（props/emits/expose/model），无需 import，在构建时被展开为运行时等价代码。


- defineProps / defineEmits：组件契约；TS 泛型或运行时声明。
- defineExpose：限制父组件 ref 能访问的方法/属性。
- defineModel（3.4+）：一行替代 modelValue + emit 样板。
- defineOptions：设 name、inheritAttrs 等，替代双 script 块。

**易混点**：
- 宏不要从 `vue` 导入；须在顶层调用，不能在条件/循环里。
- script setup 默认 closed，父 ref 须 defineExpose 才能访问内部。
- Vue 3.4+ 可解构 props 且保持响应式。

核对：宏是否在顶层调用？组件 name 是否通过 defineOptions 设置？v-model 组件是否可用 defineModel 简化？
