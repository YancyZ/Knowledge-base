# vue-i18n 组合式用法

vue-i18n v9+ 开 `legacy: false`，在组件里用 `useI18n` 的 `t` / `locale`。大项目懒加载语言包、key 语义化；Nuxt 优先 `@nuxtjs/i18n`。

## 安装与基础配置

```bash
pnpm add vue-i18n@9
```

```ts
// i18n/index.ts
import { createI18n } from 'vue-i18n';
import zh from './locales/zh-CN.json';
import en from './locales/en.json';

export const i18n = createI18n({
  legacy: false, // 启用 Composition API 模式
  locale: 'zh-CN',
  fallbackLocale: 'en',
  messages: { 'zh-CN': zh, en },
});
```

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { i18n } from './i18n';

createApp(App).use(i18n).mount('#app');
```

| 选项 | 说明 |
|------|------|
| `legacy: false` | 使用 `useI18n` 而非 Options API |
| `fallbackLocale` | 缺省 key 时回退语言 |
| `globalInjection` | 是否全局 `$t`（可选） |

---

## useI18n 在组件中

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t, locale, availableLocales } = useI18n();

function switchLang(lang: string) {
  locale.value = lang;
  document.documentElement.lang = lang;
}
</script>

<template>
  <h1>{{ t('welcome.title') }}</h1>
  <p>{{ t('welcome.users', { count: 3 }) }}</p>
  <button @click="switchLang('en')">English</button>
</template>
```

```json
// locales/zh-CN.json
{
  "welcome": {
    "title": "欢迎",
    "users": "暂无用户 | 1 位用户 | {count} 位用户"
  }
}
```

---

## 复数与命名

vue-i18n 使用 **管道符** 分隔复数形式（中文常简化为单复数两段）：

```json
{
  "item": "no items | one item | {count} items"
}
```

```vue
{{ t('item', 0) }}
{{ t('item', 1) }}
{{ t('item', 5, { count: 5 }) }}
```

命名建议：`模块.页面.元素`，如 `checkout.summary.total`。

---

## 懒加载语言包

```ts
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {},
});

export async function loadLocale(lang: string) {
  const messages = await import(`./locales/${lang}.json`);
  i18n.global.setLocaleMessage(lang, messages.default);
  i18n.global.locale.value = lang;
}
```

```vue
<script setup>
import { loadLocale } from '@/i18n';
await loadLocale('en'); // 路由级或用户切换时
</script>
```

减少首包体积，按语言拆分 chunk。

---

## 日期与数字

```ts
const { d, n } = useI18n();

d(new Date(), 'long');
n(1234.5, 'currency');
```

```ts
// i18n 配置
datetimeFormats: {
  'zh-CN': { long: { year: 'numeric', month: 'long', day: 'numeric' } },
},
numberFormats: {
  'zh-CN': { currency: { style: 'currency', currency: 'CNY' } },
},
```

---

## 组件内 `<i18n-t>` 与插值 HTML

```vue
<i18n-t keypath="term.agree" tag="p">
  <template #link>
    <a href="/terms">{{ t('term.link') }}</a>
  </template>
</i18n-t>
```

```json
{
  "term": {
    "agree": "我已阅读并同意 {link}",
    "link": "用户协议"
  }
}
```

复杂句式保持语序由翻译人员控制，避免字符串拼接。

---

## TypeScript 类型安全

```ts
// 使用 @intlify/unplugin-vue-i18n 或手动类型
type MessageSchema = typeof import('./locales/zh-CN.json');

const i18n = createI18n<[MessageSchema], 'zh-CN' | 'en'>({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': zh },
});
```

错误 key 在编译期报错，减少线上漏翻。

---

## 与 Pinia / 路由协作

```ts
// stores/locale.ts
export const useLocaleStore = defineStore('locale', () => {
  const { locale } = useI18n();
  const setLocale = async (lang: string) => {
    await loadLocale(lang);
    locale.value = lang;
    localStorage.setItem('locale', lang);
  };
  return { setLocale };
});
```

路由 `meta.title` 可用 `t(meta.titleKey)` 在守卫里设置 `document.title`。

---

## Nuxt @nuxtjs/i18n

```bash
pnpm add @nuxtjs/i18n
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [{ code: 'zh', file: 'zh.json' }, { code: 'en', file: 'en.json' }],
    lazy: true,
    langDir: 'locales',
    defaultLocale: 'zh',
    strategy: 'prefix_except_default',
  },
});
```

提供 `useI18n`、`localePath`、`switchLocalePath` 与 SEO `hreflang`。

---

## 测试中的 i18n

```ts
import { createI18n } from 'vue-i18n';

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: { 'zh-CN': { hello: '你好' } },
});

mount(Component, { global: { plugins: [i18n] } });
```

---

## 小结

vue-i18n v9+ 应开启 `legacy: false`，在组件中用 `useI18n()` 的 `t` 和 `locale`。文案 key 建议语义化命名如 `module.section.key`；大项目懒加载 JSON 语言包减少首包。复杂插值用 `<i18n-t>` 保持语序由翻译人员控制。Nuxt 项目优先 `@nuxtjs/i18n`，统一路由前缀与 SEO hreflang。测试中可 `createI18n` 后通过 `global.plugins` 注入。
