# KeepAlive

**KeepAlive** 缓存动态/路由组件实例，切换时保留 state，用 **include/exclude/max** 控制范围；**activated/deactivated** 管理轮询与数据刷新，敏感页和 Modal 要记得清理。

---

## 基本用法

```vue
<script setup>
import { ref } from 'vue'
import TabA from './TabA.vue'
import TabB from './TabB.vue'

const tab = ref('A')
const tabs = { A: TabA, B: TabB }
</script>

<template>
  <button @click="tab = 'A'">A</button>
  <button @click="tab = 'B'">B</button>

  <KeepAlive>
    <component :is="tabs[tab]" />
  </KeepAlive>
</template>
```

无 KeepAlive 时切换会 **destroy** 子组件，输入框内容丢失。

---

## include / exclude / max

```vue
<KeepAlive include="TabA,TabB" :max="10">
  <component :is="current" />
</KeepAlive>
```

| prop | 说明 |
|------|------|
| `include` | 匹配 **name** 的缓存 |
| `exclude` | 匹配 name 的不缓存 |
| `max` | LRU 上限，超出销毁最久未访问 |

组件需 **`defineOptions({ name: 'TabA' })`** 或 export name 供匹配。

---

## 路由级 KeepAlive

```vue
<!-- App.vue -->
<router-view v-slot="{ Component }">
  <KeepAlive :include="cachedNames">
    <component :is="Component" :key="$route.fullPath" />
  </KeepAlive>
</router-view>
```

```ts
// 路由 meta
{ path: '/list', component: List, meta: { keepAlive: true } }
```

根据 **meta.keepAlive** 动态算 `include` 数组。

---

## activated / deactivated

```vue
<script setup>
import { onActivated, onDeactivated, onMounted } from 'vue'

onMounted(() => console.log('mount'))
onActivated(() => {
  console.log('再次可见，可刷新数据')
})
onDeactivated(() => {
  console.log('被缓存隐藏，可暂停轮询')
})
</script>
```

| 钩子 | 时机 |
|------|------|
| mounted | 首次进入 |
| activated | 每次从缓存恢复 |
| deactivated | 切走但仍缓存 |

**首次** activated 在 mounted 之后也会触发。

---

## 缓存与 key

错误 **key** 会导致同一组件多实例无法区分：

```vue
<KeepAlive>
  <Detail :key="route.params.id" />
</KeepAlive>
```

不同 id 应对应不同 cache entry（Vue 内部按组件 type + key）。

---

## 与数据新鲜度

缓存页面返回时数据可能过期：

```js
onActivated(async () => {
  if (shouldRefresh()) {
    await loadData()
  }
})
```

或使用 **Pinia** 统一失效策略。

---

## 内存与 max

长列表 drill-down 开 **`max`** 防内存涨；离开敏感页（支付）**exclude** 不缓存。

---

## Teleport / Modal 注意

Modal 若 Teleport 到 body，KeepAlive 缓存的是**页面组件**；Modal 应在 deactivated 时关闭，避免 ghost 遮罩：

```js
onDeactivated(() => {
  modalOpen.value = false
})
```

---

## 调试

Vue DevTools 显示 **KeepAlive** 下活跃与缓存实例数量。

---

## 小结

**KeepAlive** 缓存组件实例，切换 Tab/路由时保留 state（输入框内容等），而非 destroy 重建。

**include/exclude/max**：按组件 name 匹配；max 为 LRU 上限，防内存无限涨。组件须 defineOptions name。

**路由级**：router-view + KeepAlive + meta.keepAlive 动态 include；详情页用 **key**（如 route.params.id）区分实体。

**activated/deactivated**：每次从缓存恢复/隐藏时触发；管理轮询、数据刷新、Modal 关闭。首次 activated 在 mounted 后也触发。

**数据新鲜度**：onActivated 里按需 reload；或 Pinia 统一失效策略。

**敏感页** exclude 不缓存；**Modal/Teleport** 在 deactivated 时关闭，防 ghost 遮罩。

**DevTools** 可查看缓存实例数量。
