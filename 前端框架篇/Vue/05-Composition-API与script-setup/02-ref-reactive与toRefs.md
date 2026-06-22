# ref、reactive 与 toRefs

**ref** 包装任意值（`.value` 访问），**reactive** 代理对象，标量用 ref，对象聚合用 reactive；解构 reactive 用 **toRefs** 保响应式。

---

## ref

```javascript
import { ref } from 'vue'

const count = ref(0)
const title = ref('hello')

count.value++        // script 中读写用 .value
console.log(count.value)
```

```vue
<template>
  <!-- 模板自动解包，无需 .value -->
  <p>{{ count }}</p>
</template>
```

| 适用 | 说明 |
|------|------|
| 基本类型 | number、string、boolean |
| 单一引用 | 可能整体替换的对象 |
| 模板 ref | `const el = ref(null)` 绑 DOM |

**ref 包对象**：

```javascript
const user = ref({ name: 'Lin' })
user.value.name = 'Li' // 深层响应式
user.value = { name: 'Wang' } // 整体替换也触发更新
```

---

## reactive

```javascript
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  user: { name: 'Lin' }
})

state.count++
state.user.name = 'Li'
```

| 特性 | 说明 |
|------|------|
| 仅对象类型 | 数组、Map、Set 均可 |
| 不能替换整个引用 | `state = {}` 会丢响应式 |
| 深层响应 | 默认递归 Proxy |

```javascript
// ❌ 丢失响应式
let state = reactive({ n: 1 })
state = reactive({ n: 2 })

// ✅ 改属性或 Object.assign
Object.assign(state, { n: 2, extra: true })
```

---

## ref vs reactive 选型

| 场景 | 推荐 |
|------|------|
| 标量、开关、ID | ref |
| 表单对象、多字段 state | reactive |
| 可能整表替换的列表 | ref([]) |
| 需要解构传给函数 | ref 或 toRefs |

```javascript
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref(null)
```

---

## toRefs 与 toRef

**解构 reactive**：

```javascript
import { reactive, toRefs } from 'vue'

const state = reactive({ x: 1, y: 2 })

// ❌ 丢失响应式
const { x, y } = state

// ✅
const { x, y } = toRefs(state)
x.value++ // 等价 state.x++
```

**toRef 单字段**：

```javascript
import { toRef } from 'vue'

const state = reactive({ foo: 1 })
const fooRef = toRef(state, 'foo')
const titleRef = toRef(props, 'title')
```

**在 composable 返回**：

```javascript
export function useMouse() {
  const state = reactive({ x: 0, y: 0 })
  return toRefs(state) // 调用方解构仍响应
}
```

---

## 模板中的 ref 解包

| 位置 | 行为 |
|------|------|
| 模板 `{{ count }}` | 自动解包 |
| 顶层 ref | 解包 |
| reactive 内的 ref | 访问时自动解包 |
| 数组 / Map 中的 ref | **不**自动解包，需 `.value` |

---

## readonly 与 shallowRef

```javascript
import { readonly, shallowRef } from 'vue'

const original = reactive({ count: 0 })
const copy = readonly(original)
// copy.count++ // 警告

const big = shallowRef({ nested: { data: [] } })
// 仅 .value 替换触发更新；深层改 nested 不触发
```

---

## Vue 2 差异

| Vue 2 | Vue 3 |
|-------|-------|
| data 返回对象 | ref / reactive |
| `this.x` | `x.value` 或 reactive 属性 |
| `$set` 增删键 | reactive 直接增删 |
| Vue 2.7 ref/reactive | API 类似，实现不同 |

---

## 常见坑

| 坑 | 处理 |
|----|------|
| 忘记 `.value` | script 里 ref 必写 |
| reactive 整体赋值 | assign 或改字段 |
| 解构 props | `toRef(props, 'x')` 或 `props.x` |
| 把 reactive 传出去又被替换 | 文档约定只改内部 |

Vue 3.4+ **props 解构** 在编译期保留响应式，团队统一一种写法。

---

## 小结

要点：ref 用 .value 包装任意值，reactive 用 Proxy 代理对象；二者是 Composition API 的响应式基础，模板对顶层 ref 自动解包。


- ref：脚本 `.value` 读写，模板自动解包；可包基本类型或对象引用。
- reactive：对象 Proxy；勿整体替换，改属性即可。
- toRefs/toRef：解构 reactive 或 props 时保持响应式。
- 选型：标量/需替换整体 → ref；固定结构对象 → reactive。

**易混点**：
- script 里 ref 必须 `.value`，模板里自动解包。
- reactive 整体赋值会丢响应式。
- 解构 reactive 或 props 会丢响应式，需 toRefs/toRef。

核对：script 里 ref 有没有忘 .value？reactive 有没有整体替换？解构 props 是否保持了响应式？
