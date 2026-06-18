# 静态资源与 SVG · Icon

> 图片、字体、SVG 图标如何 **import**、如何优化、如何在组件里统一使用——避免路径混乱和打包体积失控。

---

## 一、Vite 中的静态资源

### 1.1 public/ vs src/assets/

```mermaid
flowchart TB
  subgraph public_dir [public/]
    P1[favicon.ico]
    P2[robots.txt]
    P3[/logo.png 原路径访问]
  end
  subgraph src_assets [src/assets/]
    A1[logo.svg import]
    A2[会被哈希 fingerprint]
  end
  public_dir --> Copy[构建时原样拷贝到 dist 根]
  src_assets --> Bundle[参与模块图，可 hash]
```

| 位置 | 引用方式 | 构建行为 |
|------|----------|----------|
| `public/` | `/logo.png` 绝对路径 | 不 hash，原文件名 |
| `src/assets/` | `import url from './x.png'` | hash 文件名，利于缓存 |

```tsx
// public — 适合不常变、无需 hash 的文件
<img src="/favicon.ico" alt="" />

// import — 推荐组件内图片
import hero from '@/assets/hero.webp';
<img src={hero} alt="宣传图" />
```

### 1.2 import 返回值

```tsx
import imgUrl from './photo.png';
// imgUrl: string，如 "/assets/photo-a1b2c3.png"

import imgRaw from './shader.glsl?raw';  // 字符串
import worker from './worker.ts?worker'; // Web Worker
```

| 后缀 / 查询 | 效果 |
|-------------|------|
| `.png` `.jpg` `.webp` | URL 字符串 |
| `?raw` | 文件内容字符串 |
| `?url` | 显式 URL（默认已是） |
| `?inline` | 小图 base64 内联（视配置） |

---

## 二、图片优化

### 2.1 格式选择

| 格式 | 适用 |
|------|------|
| **WebP / AVIF** | 照片、大图（更小） |
| **SVG** | 图标、简单插画、可缩放 |
| **PNG** | 透明、像素风 |
| **JPEG** | 无透明照片 |

### 2.2 响应式图片

```tsx
<img
  src={hero}
  srcSet={`${hero} 1x, ${hero2x} 2x`}
  sizes="(max-width: 768px) 100vw, 1200px"
  alt="产品展示"
  loading="lazy"
  decoding="async"
/>
```

| 属性 | 作用 |
|------|------|
| `loading="lazy"` | 视口外延迟加载 |
| `decoding="async"` | 异步解码，少卡主线程 |
| `alt` | **必填**（无障碍 + SEO） |

### 2.3 背景图 vs img

| 元素 | 适用 |
|------|------|
| `<img>` | 内容图、需 alt、SEO |
| CSS background | 装饰、已知尺寸容器 |

---

## 三、SVG 使用方式

### 3.1 四种方式对比

| 方式 | 优点 | 缺点 |
|------|------|------|
| `<img src="icon.svg">` | 简单 | 难改色、不能多色独立控制 |
| CSS `background-image` | 装饰 | 同上 |
| **内联 SVG JSX** | 完全控制 fill/stroke | JSX 体积大 |
| **SVGR（import 为组件）** | 组件化 + 改 props | 需构建配置 |

### 3.2 Vite + SVGR

```bash
pnpm add -D vite-plugin-svgr
```

```typescript
// vite.config.ts
import svgr from 'vite-plugin-svgr';
export default defineConfig({ plugins: [react(), svgr()] });
```

```tsx
import Logo from '@/assets/logo.svg?react';

function Header() {
  return <Logo className="h-8 w-auto text-brand" aria-hidden />;
}
```

### 3.3 内联 SVG 示例

```tsx
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
```

`currentColor` 继承文字颜色，配合 Tailwind `text-gray-500` 改色。

---

## 四、Icon 体系设计

### 4.1 统一 Icon 组件

```tsx
import * as Icons from './icons';

const ICON_MAP = {
  search: Icons.SearchIcon,
  close: Icons.CloseIcon,
} as const;

type IconName = keyof typeof ICON_MAP;

function Icon({ name, size = 16, className }: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const Svg = ICON_MAP[name];
  return <Svg width={size} height={size} className={className} aria-hidden />;
}
```

| 好处 | 说明 |
|------|------|
| 名称约束 | TS 防 typo |
| 尺寸统一 | 默认 16/20/24 档 |
| 替换实现 | 换库只改一处 |

### 4.2 常见 Icon 来源

| 来源 | 说明 |
|------|------|
| **lucide-react** | 树摇友好，shadcn 默认 |
| **@ant-design/icons** | Ant Design 项目 |
| **@mui/icons-material** | MUI 项目 |
| Iconfont / 雪碧图 | 遗留；新项目不优先 |

```tsx
import { Search } from 'lucide-react';
<Search size={20} strokeWidth={1.5} />
```

---

## 五、字体

### 5.1 本地字体

```css
/* assets/fonts.css */
@font-face {
  font-family: 'AppSans';
  src: url('./AppSans.woff2') format('woff2');
  font-display: swap;
}
```

```tsx
import '@/assets/fonts.css';
```

| `font-display: swap` | 先系统字体，加载后替换，减少 FOIT |
|----------------------|----------------------------------|

### 5.2 外链字体（注意隐私与性能）

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
```

生产环境更推荐 **自托管 woff2**，少第三方请求。

---

## 六、Next.js 差异（简记）

| 能力 | API |
|------|-----|
| 静态 import | 同 Vite |
| 图片优化 | `next/image` 自动尺寸、lazy、格式 |
| public | 同样在根 `public/` |

```tsx
import Image from 'next/image';
import hero from '@/assets/hero.png';

<Image src={hero} alt="..." placeholder="blur" />
```

见 [14-服务端与元框架](../14-服务端与元框架/05-Nextjs-App-Router架构.md)。

---

## 七、安全与路径

| 风险 | 防护 |
|------|------|
| 用户上传 URL 当 src | 校验域名或走 CDN |
| SVG 内嵌 script | 消毒或禁止用户 SVG 内联 |
| 绝对路径硬编码环境 | 用 import 或 env |

---

## 八、Checklist

- [ ] 内容图用 `<img>` + 有意义 `alt`
- [ ] 装饰 SVG 加 `aria-hidden`
- [ ] 图标统一尺寸与组件封装
- [ ] 大图 WebP + lazy
- [ ] 组件内资源放 `src/assets`，少滥用 `public/`
- [ ] 构建后检查 dist 体积（是否重复引入大图）

---

## 九、小结

| 类型 | 推荐 |
|------|------|
| 组件绑定图 | `import` from assets |
| 固定 favicon | `public/` |
| 图标 | lucide-react 或 SVGR 组件 |
| 字体 | 自托管 woff2 + swap |
| Next 内容图 | `next/image` |

**上一篇**：[03-样式方案与CSS-in-JS](./03-样式方案与CSS-in-JS.md)  
**下一模块**：[03-组件基础](../03-组件基础/01-函数组件与组件树.md)（P0-3 批次）
