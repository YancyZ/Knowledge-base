# data 与 methods

Options API 用 **`data()`** 定义响应式状态、**`methods`** 定义函数，Vue 3 仍支持，读 Vue 2 与遗留代码必备；新代码优先 script setup。

---

## Options API 组件结构

```vue
<script>
export default {
  name: 'OrderForm',
  props: {
    orderId: { type: String, required: true }
  },
  data() {
    return {
      quantity: 1,
      remark: '',
      submitting: false
    }
  },
  methods: {
    async submit() {
      this.submitting = true
      try {
        await api.save({ id: this.orderId, quantity: this.quantity })
      } finally {
        this.submitting = false
      }
    },
    reset() {
      this.quantity = 1
      this.remark = ''
    }
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model.number="quantity" type="number" />
    <textarea v-model="remark" />
    <button :disabled="submitting">保存</button>
    <button type="button" @click="reset">重置</button>
  </form>
</template>
```

模板中 **data 与 methods 挂载到同一实例**，直接 `quantity`、`submit()`，无需 `this.` 前缀（编译器注入）。

---

## data 必须是函数

```javascript
// ✅ 每个实例独立副本
data() {
  return { count: 0 }
}

// ❌ 对象字面量会被所有实例共享
data: { count: 0 }
```

根组件 `new Vue({ data: { ... } })`（Vue 2）曾允许对象；**组件** 必须函数形式。Vue 3 `createApp` 根组件同样推荐 `data()`。

| 规则 | 原因 |
|------|------|
| 返回新对象 | 避免多实例共享引用 |
| 不在 data 放 Vue 实例 | 不在 data 里放 `$、_ 开头或与 reserved 冲突 |

---

## methods 特性

```javascript
methods: {
  increment() {
    this.count++
  },
  // 箭头函数会丢失 this，勿在 methods 里用箭头定义方法
  broken: () => {
    // this 不是组件实例
  }
}
```

| 要点 | 说明 |
|------|------|
| `this` | 指向组件代理，访问 data、computed、其他 methods |
| 模板绑定 | `@click="increment"` 或 `@click="increment()"` |
| 与 computed | methods **无缓存**，每次渲染重新调用；昂贵计算放 computed |

```vue
<!-- 每次渲染都会执行 formatNow() -->
<p>{{ formatNow() }}</p>

<!-- computed 有缓存 -->
<p>{{ formattedNow }}</p>
```

---

## data 与 props 的边界

```javascript
export default {
  props: ['initialCount'],
  data() {
    return {
      count: this.initialCount // 用 prop 初始化本地 state
    }
  }
}
```

| 场景 | 做法 |
|------|------|
| 纯展示 | 直接用 prop |
| 可编辑副本 | prop → data 初值，之后本地改 |
| prop 变化需同步 | watch prop 再赋 data，或改用 computed |

**子不应修改 prop**；需回传父级用 `$emit`。

---

## 访问其他选项

```javascript
export default {
  data() {
    return { n: 1 }
  },
  computed: {
    double() { return this.n * 2 }
  },
  methods: {
    logDouble() {
      console.log(this.double)
    }
  },
  mounted() {
    this.logDouble()
  }
}
```

生命周期钩子里 `this` 已就绪；**`data` 函数内不能访问 `this` 上的其他选项**（尚未初始化），仅可处理 props 参数。

---

## Vue 2 响应式注意

```javascript
// Vue 2：新增根级属性不是响应式
this.obj.newKey = 1 // 不触发更新
this.$set(this.obj, 'newKey', 1)

// 数组索引赋值
this.list[0] = x // Vue 2 不触发
this.$set(this.list, 0, x)
// 或 splice
```

**Vue 3** Proxy 下多数直接赋值可追踪；维护 Vue 2 时上述 `$set` 仍常见。

---

## 与 Composition API 对照

| Options | Composition (script setup) |
|---------|----------------------------|
| `data()` | `ref` / `reactive` |
| `methods` | 普通函数 |
| `this.count` | `count.value` |
| 逻辑分散在选项 | 按功能聚合在同一 setup |

Vue 3 可在同一组件混用 `setup()` + Options（`setup` 优先访问冲突），新代码不建议混写。

---

## 组织 methods

大型组件应将 API、校验、映射抽到 **外部模块** 或 **composables**，避免 methods 上百行。

---

## 常见坑

| 坑 | 处理 |
|----|------|
| 解构 data 失响应 | 不要 `const { count } = this` 后期望响应 |
| methods 里 async 未 catch | 统一错误处理 |
| 在 data 用 Date.now 初始化 | 每实例一次 OK；需 tick 更新用 mounted |
| 同名 data / prop | 避免；prop 优先 |

---

## 小结

要点：Options API 把组件逻辑拆进 data/methods/computed 等选项，通过 `this` 访问同一实例上的状态与方法；data 必须返回函数以保证每实例独立状态。


- `data()` 必须返回函数，保证每实例独立状态；模板通过标识符访问（编译器注入 this）。
- `methods` 无缓存，每次调用重新执行；勿用箭头函数（丢失 this）。
- 边界：props 只读，本地状态放 data；Vue 2 增删属性需 `$set`。
- 迁移：新代码用 script setup；读旧代码时对照 Composition API。

**易混点**：
- methods 里箭头函数丢失 this。
- data 函数内不能访问 this 上的其他选项。
- 模板里调 methods 每次渲染都执行，昂贵计算应放 computed。

核对：methods 里有没有箭头函数？data 是否返回函数？有没有直接改 prop？
