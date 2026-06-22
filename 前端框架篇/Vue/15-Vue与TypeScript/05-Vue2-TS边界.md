# Vue 2 TypeScript 边界

Vue 2 的 TypeScript 以 **Vue.extend + PropType** 或 **class component** 为主，体验弱于 Vue 3 script setup。维护遗留项目需读懂这些写法；新代码应规划 **Vue 3 + vue-tsc + defineProps** 迁移路径。

---

## Vue 2 TS 生态概览

```mermaid
flowchart TB
  Vue2[Vue 2.x]
  Vue2 --> OTS[Options API + PropType]
  Vue2 --> Class[vue-class-component]
  Vue2 --> Dec[vue-property-decorator]
  Vue2 --> Compat[@vue/composition-api 插件]
```

| 方案 | 状态 | 说明 |
|------|------|------|
| Options + PropType | 仍常见 | 官方支持，啰嗦 |
| Class Component | 维护模式 | 不推荐新项目 |
| Composition API 插件 | Vue 2.7 内置 | 向 Vue 3 过渡 |
| Vue 3 script setup | 迁移目标 | 完整宏与 vue-tsc |

---

## Options API + PropType

```vue
<script lang="ts">
import Vue, { PropType } from 'vue';

interface User {
  id: number;
  name: string;
}

export default Vue.extend({
  props: {
    user: {
      type: Object as PropType<User>,
      required: true,
    },
    tags: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  data() {
    return { count: 0 };
  },
  computed: {
    double(): number {
      return this.count * 2;
    },
  },
});
</script>
```

| 要点 | 说明 |
|------|------|
| `Vue.extend` | 推断 this 类型 |
| `PropType<T>` | 复杂 prop 类型 |
| data 需函数 | 返回类型推断 |

---

## vue-class-component

```vue
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class UserCard extends Vue {
  @Prop({ required: true }) user!: User;
  count = 0;

  get double() {
    return this.count * 2;
  }

  mounted() {
    console.log(this.user.name);
  }
}
</script>
```

| 优点 | 缺点 |
|------|------|
| 类语法熟悉 | 装饰器配置复杂 |
| 装饰器 Prop | 与 Vue 3 不一致 |
| — | 社区转向 Composition API |

**Vue 3 新项目勿再采用。**

---

## Vue 2.7 的 Composition API

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const count = ref(0);
const double = computed(() => count.value * 2);
</script>
```

2.7 内置 Composition API，写法接近 Vue 3，但仍有差异：

| 项 | Vue 2.7 | Vue 3 |
|----|---------|-------|
| 构建 | Vue CLI / webpack 多 | Vite 为主 |
| script setup | 支持 | 完整宏 |
| Teleport | 支持 | 同 |
| 多个 v-model | 有限 | 完整 |

---

## this 类型与 $refs

```ts
export default Vue.extend({
  methods: {
    focusInput() {
      (this.$refs.input as HTMLInputElement).focus();
    },
  },
});
```

无 defineExpose；子组件 ref 类型常弱化为 `Vue`。

---

## Vuex 2 + TS

```ts
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const UserModule = namespace('user');

@Component
export default class Profile extends Vue {
  @UserModule.State token!: string;
  @UserModule.Action login!: (p: Credentials) => Promise<void>;
}
```

或 `useStore` + 手写 RootState（Vuex 4）。迁移时改 Pinia + `useUserStore()`。

---

## shims-vue.d.ts（Vue 2 CLI）

```ts
declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}
```

Vue 3 改为 `DefineComponent` 泛型声明。

---

## 迁移到 Vue 3 TS 的路径

| 步骤 | 动作 |
|------|------|
| 1 | 升 Vue 2.7，局部 Composition API |
| 2 | vue-compat 跑 Vue 3 构建 |
| 3 | Class → script setup |
| 4 | PropType → defineProps&lt;T&gt; |
| 5 | vue-tsc 严格检查 |

---

## 何时仍维护 Vue 2 TS

- 短期无法升级的企业遗留
- 第三方插件仅支持 Vue 2
- 已 EOL，应制定退出计划

Vue 2 已于 2023-12-31 停止维护（除商业延长支持）。

---

## 对照速查

| 能力 | Vue 2 TS | Vue 3 TS |
|------|----------|----------|
| Props | PropType | defineProps |
| Emits | 无原生类型 | defineEmits |
| Ref | $refs 断言 | ref + 泛型 |
| 组件实例 | Vue.extend | InstanceType |
| 泛型组件 | 几乎不支持 | generic SFC |

---

## 小结

**Vue 2 主流写法**：`Vue.extend` + `PropType` 给复杂 props 类型；class component 用装饰器，配置重且与 Vue 3 不一致。

**Vue 2.7 过渡**：内置 Composition API 和 script setup，写法接近 Vue 3，但构建链、多 v-model 等仍有差距。

**$refs**：Options API 里 `(this.$refs.x as HTMLInputElement)`；子组件 ref 常弱化为 `Vue`，无 defineExpose。

**Vuex + TS**：vuex-class 装饰器或手写 RootState；迁移 Pinia 后类型体验更好。

**shims**：Vue 2 CLI 的 `*.vue` 声明 export default Vue；Vue 3 用 DefineComponent 泛型。

**迁移路径**：2.7 局部 Composition → vue-compat → script setup + defineProps + vue-tsc strict。

**维护策略**：遗留项目读懂 PropType/class 即可；新代码勿再加 Vue 2 模式；制定 EOL 退出计划。

核对：还在加 class component 吗？PropType 数组 default 用工厂函数了吗？迁移有没有 vue-compat 阶段？
