# Web Vitals 与体验指标

> **Core Web Vitals** 是 Google 定义的页面体验核心指标。React 优化最终要落到 **LCP、INP、CLS** 等可测量数字上，而不只是「感觉快了」。

---

## 一、Core Web Vitals  trio

```mermaid
flowchart LR
  LCP[LCP 最大内容绘制]
  INP[INP 交互延迟]
  CLS[CLS 布局偏移]
```

| 指标 | 衡量什么 | 良好阈值（约） |
|------|----------|----------------|
| **LCP** | 主内容出现速度 | ≤ 2.5s |
| **INP** | 点击到响应（取代 FID） | ≤ 200ms |
| **CLS** | 视觉稳定性 | ≤ 0.1 |

---

## 二、LCP 与 React

LCP 元素常见：大图片、标题块、首屏 hero。

| 优化 | React 侧 |
|------|----------|
| 减小 JS | 路由 lazy、tree-shaking |
| 优先关键内容 | 勿阻塞首屏的 heavy 组件 |
| 图片 | `loading="lazy"` 勿用于 LCP 图；用 `fetchpriority="high"` |
| SSR / SSG | Next.js 首屏 HTML |

```tsx
// LCP 图：优先加载
<img src={hero} fetchPriority="high" alt="" />
```

---

## 三、INP 与 React

INP 关注**整页**交互延迟（多次交互最差分位）。

| 原因 | 处理 |
|------|------|
| 主线程长任务 | 减 render、虚拟列表 |
| 大 sync setState | `startTransition` |
| 第三方脚本 | 延迟加载 analytics |

```tsx
import { startTransition } from 'react';

function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Item[]>([]);

  function onChange(value: string) {
    setQ(value);  // 高优先级：输入即时
    startTransition(() => {
      setResults(filterHugeList(value));  // 低优先级
    });
  }
}
```

见 [12-useTransition](../12-并发与Suspense/02-useTransition与useDeferredValue.md)。

---

## 四、CLS 与 React

布局偏移：图片无尺寸、字体 swap、动态插入 banner。

| 做法 | |
|------|--|
| 图片 width/height 或 aspect-ratio | |
| 骨架屏占位 | Suspense fallback 固定高 |
| 勿顶部突然插入通知条 | 预留空间或 fixed |

```tsx
<Suspense fallback={<div style={{ height: 320 }}><Skeleton /></div>}>
  <AsyncChart />
</Suspense>
```

---

## 五、其他常用指标

| 指标 | 含义 |
|------|------|
| **FCP** | 首次任意内容绘制 |
| **TTFB** | 首字节（偏后端/CDN） |
| **TTI** | 可交互（旧，参考用） |

---

## 六、测量方式

```tsx
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(metric => reportToAnalytics(metric));
onINP(metric => reportToAnalytics(metric));
onCLS(metric => reportToAnalytics(metric));
```

| 工具 | 用途 |
|------|------|
| Lighthouse | 实验室单次 |
| Chrome UX Report | 真实用户场数据 |
| web-vitals 库 | 生产 RUM 上报 |

与 [前端工程化 · 性能优化与监控](../../前端工程化体系/06-性能优化与监控.md) 衔接。

---

## 七、React 专项 Checklist

| LCP | INP | CLS |
|-----|-----|-----|
| 路由拆包 | memo / transition | 骨架固定高 |
| SSR 首屏 | 虚拟列表 | 图片尺寸 |
| 少 blocking JS | 避免 effect 里 sync 重活 | 字体 preload |

---

## 八、小结

| 记住 | |
|------|--|
| 优化要对指标 | |
| LCP 首屏、INP 交互、CLS 稳定 | |
| Profiler + web-vitals 结合 | |

**上一篇**：[04-虚拟列表与大数据渲染](./04-虚拟列表与大数据渲染.md)  
**下一篇**：[06-性能优化Checklist](./06-性能优化Checklist.md)
