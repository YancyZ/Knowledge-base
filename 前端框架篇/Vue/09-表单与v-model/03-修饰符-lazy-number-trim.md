# 修饰符：lazy、number、trim

**lazy / number / trim** 调整 v-model 时机与值变换，自定义组件通过 **modelModifiers** 或 **defineModel** 的 set 实现同名修饰符。别和 v-on 事件修饰符（`.prevent` 等）混用。

---

## 原生修饰符一览

```vue
<input v-model.lazy="msg" />
<input v-model.number="age" type="number" />
<input v-model.trim="name" />
```

| 修饰符 | 行为 |
|--------|------|
| `.lazy` | 用 `change` 而非 `input` 更新 |
| `.number` | 输入值经 `parseFloat` 转 number |
| `.trim` | 字符串 trim 后写入 |

可组合：`v-model.trim.lazy`（较少用）。

---

## lazy：减少输入过程更新

```vue
<script setup>
import { ref, watch } from 'vue'

const query = ref('')

watch(query, q => {
  // lazy 下仅在 blur/change 时触发
  fetchSearch(q)
})
</script>

<template>
  <input v-model.lazy="query" />
</template>
```

适合**搜索防抖前**仍希望少 render，或 IME 长文编辑。

---

## number

```vue
<script setup>
const count = ref(0)
</script>

<template>
  <input v-model.number="count" type="number" />
</template>
```

| 输入 | 结果 |
|------|------|
| `42` | number 42 |
| `42abc` | 若 parse 失败可能仍为 string |

对 **type="number"** 仍建议 `.number`；普通 text 输入数字也需手动校验。

---

## trim

```vue
<input v-model.trim="username" />
```

在 **input** 事件路径上对 string trim；配合 required 校验避免纯空格通过。

---

## 组件上的 v-model 修饰符

父：

```vue
<CustomInput v-model.trim.capitalize="title" />
```

子接收 **modelModifiers**：

```vue
<script setup>
const props = defineProps({
  modelValue: String,
  modelModifiers: { default: () => ({}) }
})
const emit = defineEmits(['update:modelValue'])

function emitValue(raw) {
  let v = raw
  if (props.modelModifiers.trim) v = v.trim()
  if (props.modelModifiers.capitalize) {
    v = v.charAt(0).toUpperCase() + v.slice(1)
  }
  emit('update:modelValue', v)
}
</script>
```

`defineModel` 同样可访问 modifiers（编译注入）。

---

## defineModel 与 modifiers

```vue
<script setup>
const [model, modifiers] = defineModel({
  set(value) {
    if (modifiers.trim && typeof value === 'string') {
      return value.trim()
    }
    return value
  }
})
</script>
```

Vue 3.4+ 支持在 **set** 中读取 modifiers 做变换。

---

## 与 vee-validate 等库

库内 Field 常封装 `v-model`；修饰符写在 Field 上透传到内部 input：

```vue
<Field name="email" v-model.trim="email" />
```

具体看库文档是否转发 **modelModifiers**。

---

## 事件修饰符区别

勿混淆 **v-model.lazy** 与 **@input.lazy**（后者不存在）：

| 写法 | 含义 |
|------|------|
| `v-model.lazy` | 模型更新 lazy |
| `@click.prevent` | 事件修饰符，与 v-model 无关 |

---

## 实践建议

| 场景 | 推荐 |
|------|------|
| 实时搜索 | debounce composable，未必 lazy |
| 数字表单 | `.number` + schema 校验 |
| 用户名 | `.trim` |
| 大段文本 autosave | `.lazy` 或 blur 保存 |

---

## 小结

**lazy**：改用 change 事件更新 model，减少输入过程 render；适合长文编辑或 blur 才搜的场景。

**number**：parseFloat 转 number；type="number" 仍建议加；parse 失败可能仍是 string，需 schema 兜底。

**trim**：写入前去首尾空白；用户名等字段常用。

**自定义组件**：读 modelModifiers 或在 defineModel set 中处理；可扩展 capitalize 等自定义修饰符。

**defineModel 3.4+**：set 回调读 modifiers，比手写 props+emit 简洁。

**勿混淆**：v-model 修饰符 vs v-on 事件修饰符（`.prevent` 等）是两套机制。

**复杂格式化**放 composable 或 schema 层；修饰符只做轻量变换。实时搜索更常用 debounce 而非 lazy。
