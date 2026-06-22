# mixins 迁移到 Composables

**Composables** 用函数 + 响应式 API 替代 mixins，来源显式、TS 友好。迁移时把 mixin 的 data/methods/hooks 拆成 ref + 函数 + onMounted。

---

## mixins 的问题

```js
// mixinA.js
export default {
  data: () => ({ count: 0 }),
  methods: { inc() { this.count++ } }
}

// mixinB.js
export default {
  methods: { inc() { /* 冲突 */ } }
}
```

| 痛点 | 说明 |
|------|------|
| 命名冲突 | data/methods/hooks 合并策略隐式 |
| 来源不明 | 多个 mixin 时难以定位 this.x |
| TS 弱 | 推断困难 |
| 生命周期 | 多个 mixin 顺序难控 |

---

## Composable 基本形态

```js
// useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)
  const double = computed(() => count.value * 2)

  function inc() {
    count.value++
  }

  return { count, double, inc }
}
```

```vue
<script setup>
import { useCounter } from './useCounter'

const { count, inc } = useCounter(10)
</script>
```

**来源显式**：一眼看出 `count` 来自 `useCounter`。

---

## 迁移对照表

| Options + mixin | Composition |
|-----------------|-------------|
| `data` | `ref` / `reactive` |
| `computed` | `computed()` |
| `methods` | 普通函数 |
| `watch` | `watch` / `watchEffect` |
| `mounted` | `onMounted` |
| `this.$router` | `useRouter()` |

```js
// 原 mixin: useFetchMixin
export default {
  data: () => ({ loading: false, data: null }),
  methods: {
    async fetchUrl(url) {
      this.loading = true
      this.data = await fetch(url).then(r => r.json())
      this.loading = false
    }
  }
}

// → composable
export function useFetch(urlRef) {
  const loading = ref(false)
  const data = ref(null)

  async function execute() {
    loading.value = true
    try {
      data.value = await fetch(urlRef.value).then(r => r.json())
    } finally {
      loading.value = false
    }
  }

  watch(urlRef, execute, { immediate: true })
  return { loading, data, execute }
}
```

---

## 生命周期合并

多个 composable 各自注册钩子，**按 setup 调用顺序**执行：

```js
export function useA() {
  onMounted(() => console.log('A'))
}

export function useB() {
  onMounted(() => console.log('B'))
}

// setup 中 useA(); useB(); → A 然后 B
```

比 mixin 的 merge 策略更可预测。

---

## 共享状态：模块级 vs provide

```js
// 单例 composable（慎用）
const globalCount = ref(0)
export function useGlobalCount() {
  return { globalCount }
}
```

| 模式 | 适用 |
|------|------|
| 每次调用独立 state | 大多数 UI 逻辑 |
| 模块级 ref | 极轻量跨组件计数 |
| provide/inject | 子树共享 |
| Pinia | 应用级业务 state |

---

## TypeScript 与返回值

```ts
export function useUser(id: Ref<number>) {
  const user = ref<User | null>(null)
  watch(id, async (v) => {
    user.value = await fetchUser(v)
  }, { immediate: true })
  return { user }
}
```

可导出 **ReturnType** 供测试 mock。

---

## 测试 Composables

```js
import { ref } from 'vue'
import { useCounter } from './useCounter'

test('inc', () => {
  const { count, inc } = useCounter(0)
  inc()
  expect(count.value).toBe(1)
})
```

纯逻辑直接调 composable；组件集成用 @vue/test-utils 或 @testing-library/vue。

---

## Vue 2 项目渐进迁移

`@vue/composition-api` 插件或 **vue-compat** 下可先写 composable，Options 组件中 **setup()** 引入：

```js
export default {
  setup() {
    const { count, inc } = useCounter()
    return { count, inc }
  }
}
```

再逐步改 `<script setup>`。

---

## 小结

**mixins 痛点**：命名冲突、来源不透明、TS 弱、生命周期 merge 难控，Composables 用显式 import 解决。

**useXxx 形态**：ref/reactive + computed + 函数 + 生命周期钩子，return 暴露 API；setup 中调用，来源一目了然。

**迁移映射**：data→ref/reactive、methods→函数、mounted→onMounted、$router→useRouter() 等。

**生命周期**：多个 composable 的 onMounted 按 setup 调用顺序执行，比 mixin merge 可预测。

**共享 state**：大多数每次调用独立；应用级用 Pinia；模块级单例 composable 慎用。

**TS**：泛型参数 + 导出 ReturnType 便于 mock 和测试。

**Vue 2 渐进**：composition-api 或 vue-compat 下 setup() 引入 composable，再迁 script setup。

**规范**：职责单一，命名 `useXxx`，便于搜索与单测。
