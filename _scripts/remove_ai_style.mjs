#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TARGET_DIRS = [
  path.join(ROOT, "前端基础体系"),
  path.join(ROOT, "前端工程化体系"),
  path.join(ROOT, "前端框架篇", "React"),
  path.join(ROOT, "前端框架篇", "Vue"),
];
const EXCLUDE = new Set(["React编码规范.md", "Vue编码规范.md"]);
const CN_NUM = "一二三四五六七八九十";

function splitCodeBlocks(text) {
  const parts = [];
  const re = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push([text.slice(last, m.index), false]);
    parts.push([m[0], true]);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push([text.slice(last), false]);
  return parts;
}

function stripBold(s) {
  return s.replace(/\*\*([^*]+)\*\*/g, "$1");
}

function softenDashes(s) {
  return s.replace(/——+/g, "，").replace(/(?<![\-`])--(?![\-`])/g, "，");
}

function convertRememberBlockquote(text) {
  return text.replace(
    /^> \*\*先记住\*\*[：:]\s*(.+?)\n\n(?:---\n\n)?/ms,
    (_, body) => {
      let line = stripBold(body.trim());
      line = softenDashes(line);
      line = line.replace(/\s+/g, " ");
      if (line && !/[。！？]$/.test(line)) line += "。";
      return line + "\n\n";
    }
  );
}

function fixOpeningThisArticle(text) {
  const lines = text.split("\n");
  if (!lines[0]?.startsWith("# ")) return text;
  let idx = 1;
  while (idx < lines.length && lines[idx].trim() === "") idx++;
  if (idx >= lines.length) return text;
  let line = lines[idx];
  if (!line.includes("这篇")) return text;
  line = line
    .replace(/^这篇回答两件事[：:]/, "两点：")
    .replace(/^这篇梳理/, "")
    .replace(/^这篇说明/, "")
    .replace(/^这篇介绍/, "")
    .replace(/^这篇汇总/, "")
    .replace(/^这篇按/, "按")
    .replace(/。这篇说明([^。]+)。/g, "；$1。")
    .replace(/。这篇汇总([^。]+)。/g, "；$1。")
    .replace(/。这篇按/g, "；按")
    .replace(/^这篇/, "");
  line = softenDashes(line.trim());
  if (line && !/[。！？]$/.test(line)) line += "。";
  lines[idx] = line;
  return lines.join("\n");
}

function fixTemplateLabels(s) {
  return s
    .replace(/\*\*排错时可问\*\*[：:]/g, "常见错因：")
    .replace(/\*\*日常自检\*\*[：:]/g, "核对：")
    .replace(/\*\*自检\*\*[：:]/g, "核对：")
    .replace(/^> 这篇目录按/gm, "> 目录按")
    .replace(/。这篇区分/g, "；下面区分")
    .replace(/。这篇用/g, "；下面按")
    .replace(/排错时可问[：:]/g, "常见错因：")
    .replace(
      /^## 一句话：管 state，React 管 DOM$/m,
      "## 管 state，React 管 DOM"
    )
    .replace(/\*\*要点\*\*[：:]\s*\n/g, "\n")
    .replace(/\*\*要点\*\*[：:]/g, "")
}

const NEGATION_RULES = [
  [
    /「渐进式」不是功能少，而是\*\*默认不强迫一次 adopt 全部约定\*\*/g,
    "「渐进式」指默认不强迫一次 adopt 全部约定",
  ],
  [
    /渐进式强调的是\*\*可选模块的厚度\*\*，不是否认框架属性/g,
    "渐进式说的是可选模块的厚度，框架属性照样成立",
  ],
  [
    /JSX 不是 HTML 字符串，而是写在 JS\/TS 里的\*\*语法糖\*\*/g,
    "JSX 是写在 JS/TS 里的语法糖，不是 HTML 字符串",
  ],
  [
    /Virtual DOM 的目标不是「永远比手写 DOM 快」，而是让声明式 UI 的更新\*\*可预测、可批量\*\*/g,
    "Virtual DOM 让声明式 UI 的更新可预测、可批量，目标不是永远比手写 DOM 快",
  ],
  [
    /多数性能问题不是 React 本身慢，而是\*\*不必要的渲染\*\*或\*\*单次渲染太重\*\*/g,
    "多数性能问题来自不必要的渲染，或单次渲染太重，而不是 React 本身慢",
  ],
  [
    /RSC 不是「在服务器跑的 useEffect」，而是\*\*另一种组件类型\*\*/g,
    "RSC 是另一种组件类型，不是「在服务器跑的 useEffect」",
  ],
  [
    /\*\*shadcn\/ui\*\* 不是 npm 大包，而是把组件\*\*复制进项目\*\*/g,
    "shadcn/ui 把组件复制进项目，不是 npm 里一个大包",
  ],
  [
    /并发不是 Web Worker 多线程，而是在单线程内通过 Fiber 实现可中断的优先级调度/g,
    "并发在单线程内通过 Fiber 做可中断的优先级调度，不是 Web Worker 多线程",
  ],
  [
    /多字段表单的核心是\*\*受控数据流\*\*/g,
    "多字段表单宜走受控数据流",
  ],
  [
    /CSS 体系的核心是\*\*知道改哪条属性会付出什么渲染代价\*\*/g,
    "CSS 体系里要先弄清：改哪条属性会付出什么渲染代价",
  ],
    [/React 核心是组件树和局部 state/g, "React 自带的是组件树和局部 state"],
    [/Hooks 的核心变化是，/g, "Hooks 的变化在于，"],
  [
    /模板或 `computed` 里用到 `state\.count`，本质上是在\*\*读取\*\*响应式数据/g,
    "模板或 `computed` 里读到 `state.count`，就是在访问响应式数据",
  ],
  [/\*\*本质\*\*[：:]/g, "要点："],
];

function fixNegationAffirmation(s) {
  for (const [re, rep] of NEGATION_RULES) s = s.replace(re, rep);
  return s;
}

function fixCorePatterns(s) {
  return s
    .replace(/([^\n]{0,40})核心是/g, "$1在于")
    .replace(/([^\n]{0,40})核心思想是/g, "$1思路是")
    .replace(/([^\n]{0,40})核心优势是/g, "$1优势在于")
    .replace(/([^\n]{0,40})核心问题/g, "$1关键问题")
    .replace(/本质上在干什么/g, "在干什么")
    .replace(/本质上是在/g, "是在")
    .replace(/本质上/g, "")
    .replace(/关键在于/g, "在于");
}

function fixSuperlativePatterns(s) {
  return s
    .replace(/更要命的是[，,]/g, "")
    .replace(/最(?:糟糕|厉害|重要)的是[，,]/g, "")
    .replace(/更常见的是在/g, "常见做法是");
}

function fixClichePhrases(s) {
  const cliches = [
    "值得注意的是，",
    "值得注意的是",
    "综上所述，",
    "综上所述",
    "由此可见，",
    "由此可见",
    "简而言之，",
    "换句话说，",
    "值得一提的是，",
    "毋庸置疑，",
    "一目了然，",
  ];
  for (const c of cliches) s = s.split(c).join("");
  return s;
}

function renumberHeadings(s) {
  return s.replace(
    new RegExp(`^## ([${CN_NUM}]+)、(.+)$`, "gm"),
    (full, _num, title) => {
      const t = title.trim();
      if (t === "小结" || t === "阅读地图") return full;
      return `## ${t}`;
    }
  );
}

function processProse(segment) {
  let s = segment;
  s = convertRememberBlockquote(s);
  s = fixNegationAffirmation(s);
  s = fixCorePatterns(s);
  s = fixSuperlativePatterns(s);
  s = fixClichePhrases(s);
  s = fixTemplateLabels(s);
  s = renumberHeadings(s);
  s = softenDashes(s);
  return s;
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, "utf8");
  let text = fixOpeningThisArticle(fixTemplateLabels(original));
  const parts = splitCodeBlocks(text);
  const updated = parts
    .map(([seg, isCode]) => (isCode ? seg : processProse(seg)))
    .join("")
    .replace(/\n{4,}/g, "\n\n\n");
  if (updated !== original) {
    fs.writeFileSync(filePath, updated, "utf8");
    return true;
  }
  return false;
}

function iterFiles() {
  const seen = new Set();
  const files = [];
  for (const dir of TARGET_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of walk(dir)) {
      if (!name.endsWith(".md") || EXCLUDE.has(path.basename(name))) continue;
      const resolved = path.resolve(name);
      if (seen.has(resolved)) continue;
      seen.add(resolved);
      files.push(name);
    }
  }
  return files.sort();
}

function* walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const files = iterFiles();
let changed = 0;
for (const f of files) {
  if (processFile(f)) {
    changed++;
    console.log("updated:", path.relative(ROOT, f));
  }
}
console.log(`done. changed ${changed} / ${files.length} files`);
