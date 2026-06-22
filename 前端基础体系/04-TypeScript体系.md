# 04 · TypeScript 体系

TypeScript 为 JavaScript 加上编译期类型系统，合法 JS 即合法 TS。类型在构建后擦除，运行时行为与 JS 完全一致，API 边界仍需运行时校验补齐。

## TypeScript 是什么：特性与发展

TypeScript 是 JavaScript 的**超集**：合法 JS 即合法 TS，在此基础上增加**静态类型系统**与**编译期检查**。编译（或 IDE 语言服务）完成后，类型信息全部擦除，产物仍是普通 JavaScript。

| 时间    | 里程碑                   |
| ----- | --------------------- |
| 2012  | 微软发布，补 JS 大型项目工具链     |
| 2016+ | 与 Angular 深度结合        |
| 2020+ | 前端事实标准之一              |
| 持续    | 随 ECMAScript 演进扩展类型能力 |

**核心特性**：

| 能力      | 说明                         |
| ------- | -------------------------- |
| 静态检查    | 编译期发现类型错误，减少运行时崩溃          |
| IDE 体验  | 跳转、补全、重构、内联文档              |
| `.d.ts` | 为已有 JS 库描述类型，无需改源码         |
| 渐进式     | 可从 `.js` 逐步迁移，允许 `allowJs` |

**TypeScript 不是**：运行时校验器、新运行时、性能优化器，类型在编译后**不存在**。

```typescript
const greet = (name: string): string => `Hello, ${name}`;
// 编译后 → const greet = (name) => `Hello, ${name}`;
```

TypeScript 管类型，ESLint 管代码质量，CI 把 `typecheck` 与 `lint` 一并门禁，三者分工互补，不宜混为一谈。

---

## 基础类型

TypeScript 类型从**基础形态**起步：原始值、集合（数组/元组）、命名常量（enum）与边界类型（any/never）。

### 2.1 原始数据类型

TypeScript 的原始类型与 JavaScript 运行时一一对应，通过**类型注解**在编译期约束值的形状。

#### 2.1.1 七种原始类型 + object

| TS 类型       | JS 对应       | 示例                    | 注意                  |
| ----------- | ----------- | --------------------- | ------------------- |
| `number`    | number      | `42`、`NaN`、`Infinity` | 双精度浮点，同 JS 精度问题     |
| `string`    | string      | `'hi'`、``tpl``        | UTF-16              |
| `boolean`   | boolean     | `true` / `false`      |                     |
| `undefined` | undefined   | 未赋值、无返回值              | 可选属性缺失时为 undefined  |
| `null`      | null        | 空值占位                  | 严格模式下与 undefined 区分 |
| `bigint`    | bigint      | `100n`                | 不能与 number 直接运算     |
| `symbol`    | symbol      | `Symbol('id')`        | 常用作对象唯一键            |
| `object`    | object（非原始） | `{}`、函数、数组等           | 仅表示「非原始」，不描述具体字段    |

```typescript
let n: number = 42;
let s: string = 'hi';
let b: boolean = true;
let u: undefined = undefined;
let nu: null = null;
let bi: bigint = 100n;
let sym: symbol = Symbol('id');
let obj: object = { x: 1 };  // 不能写 obj.x，object 无具体字段
```

#### 2.1.2 字面量类型

**字面量类型**是原始类型的子集，值被固定为某一个具体常量：

```typescript
type Direction = 'up' | 'down' | 'left' | 'right';
type One = 1;
type True = true;

let d: Direction = 'up';
// d = 'forward';  // 错误
```

`as const` 断言可将对象/数组整体收窄为只读字面量：

```typescript
const config = { mode: 'strict', n: 3 } as const;
// 推断为 { readonly mode: 'strict'; readonly n: 3 }

type Mode = typeof config.mode;  // 'strict'，不是 string
type N = typeof config.n;        // 3，不是 number
```

#### 2.1.3 严格 null 检查

`strictNullChecks: true`（`strict` 子项）下，`null` 与 `undefined` 不能赋给普通类型：

```typescript
let name: string = null;       // 错误
let name2: string | null = null;  // 正确：显式联合
```

---

### 2.2 数组

数组类型描述**同构元素**的有序集合，两种等价写法：

```typescript
const nums: number[] = [1, 2, 3];
const names: Array<string> = ['a', 'b'];

// 多维
const matrix: number[][] = [[1, 2], [3, 4]];
```

| 修饰                 | 含义                  | 示例                      |
| ------------------ | ------------------- | ----------------------- |
| `T[]`              | 可变数组                | `number[]`              |
| `readonly T[]`     | 只读数组，不可 push/splice | `readonly string[]`     |
| `ReadonlyArray<T>` | 同上，泛型写法             | `ReadonlyArray<number>` |

```typescript
const ro: readonly number[] = [1, 2];
// ro.push(3);  // 错误

function sum(arr: readonly number[]) {
  return arr.reduce((a, b) => a + b, 0);
}
```

**元组与数组的边界**：`[string, number]` 是元组；`string[]` 是任意长度字符串数组。`(string | number)[]` 表示每个元素可以是 string 或 number。

---

### 2.3 元组

**元组（Tuple）** 是长度与位置类型固定的数组，用于表达「第 0 项是 A、第 1 项是 B」这类结构化数据。

```typescript
const pair: [string, number] = ['age', 30];
const rgb: [number, number, number] = [255, 128, 0];

// 访问
const key = pair[0];   // string
const val = pair[1];   // number
```

#### 2.3.1 可选元素与 rest 元素

```typescript
// 第 2 项可选
type Range = [start: number, end?: number];

// rest 元组：首项固定，后续同类型
type Scores = [subject: string, ...number[]];
const s: Scores = ['math', 90, 85, 88];

// 只读元组
type Point = readonly [number, number];
```

#### 2.3.2 标签元组（Labelled Tuple）

TS 4.0+ 支持为每个位置命名，仅影响可读性，不改变类型：

```typescript
type HttpResult = [status: number, body: string, headers: Record<string, string>];
```

#### 2.3.3 常见用途

| 场景                  | 示例                                         |
| ------------------- | ------------------------------------------ |
| 键值对                 | `[K, V]`                                   |
| React `useState`    | `[State, Dispatch<SetStateAction<State>>]` |
| 函数返回多值              | `return [data, error] as const`            |
| `Object.entries` 近似 | `[string, T][]`                            |

---

### 2.4 枚举 enum

**枚举**为一组命名常量提供类型与（可选）运行时代码。

```typescript
enum Status {
  Pending,   // 0
  Done,      // 1
  Failed,    // 2
}

enum Direction {
  Up = 'UP',
  Down = 'DOWN',
}
```

| 种类                  | 编译产物             | Tree-shaking | 适用       |
| ------------------- | ---------------- | ------------ | -------- |
| 数字 enum             | 可能生成 IIFE 反向映射对象 | 差            | 遗留代码     |
| 字符串 enum            | 较简单对象            | 一般           | 需要运行时常量表 |
| `const enum`        | 编译期内联，无运行时代码     | 好            | 纯类型场景    |
| `**as const` + 联合** | 无额外代码            | 最好           | **现代推荐** |

```typescript
// 推荐替代方案
const Status = {
  Pending: 'pending',
  Done: 'done',
  Failed: 'failed',
} as const;

type Status = (typeof Status)[keyof typeof Status];
// 'pending' | 'done' | 'failed'

function isDone(s: Status): boolean {
  return s === Status.Done;
}
```

**何时仍用 enum**：与已有 C#/Java 风格 API 对接、需要 `enum` 作为类型与值双重导出时。新项目优先 `as const`。

---

### 2.5 any、never 与特殊类型

除原始类型外，TS 还有几个描述「边界情况」的特殊类型。

| 类型        | 含义                | 使用建议          |
| --------- | ----------------- | ------------- |
| `void`    | 函数无返回值或 `return;` | 回调、副作用函数      |
| `never`   | 永不产生的值；不可达分支      | 穷尽检查、抛错函数     |
| `unknown` | 未知类型，使用前必须收窄      | 替代 any 接收外部数据 |
| `any`     | 关闭类型检查            | 迁移遗留代码时临时使用   |

```typescript
// void
function log(msg: string): void {
  console.log(msg);
}

// never — 永不返回
function fail(msg: string): never {
  throw new Error(msg);
}

function assertNever(x: never): never {
  throw new Error('未处理分支: ' + x);
}

// unknown — 安全版 any
function parse(input: unknown): string {
  if (typeof input === 'string') return input;
  return String(input);
}

// any — 尽量避免
let data: any = fetchSomething();
data.foo.bar;  // 编译通过，运行可能崩溃
```

#### 2.5.1 never 与穷尽检查

在 `switch` 或 `if-else` 链末尾用 `never` 确保所有联合成员都被处理：

```typescript
type Shape = { kind: 'circle'; r: number } | { kind: 'rect'; w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2;
    case 'rect': return s.w * s.h;
    default: return assertNever(s);
  }
}
```

若新增 `{ kind: 'triangle'; ... }` 而未处理，`default` 处 `s` 不再 assignable to `never`，编译报错。

---

## 函数与对象建模

用类型描述**行为（函数）与结构（对象、interface、class）**。

### 3.1 函数类型

函数在 TS 中既是值也是类型。描述函数形状的核心要素：**参数类型**、**返回值类型**、**this 类型**（可选）、**重载签名**。

#### 3.1.1 函数声明与表达式

```typescript
function add(a: number, b: number): number {
  return a + b;
}

const multiply: (a: number, b: number) => number = (a, b) => a * b;

type Handler = (event: MouseEvent) => void;
type AsyncFn = (id: string) => Promise<User>;
```

#### 3.1.2 可选参数、默认参数与 rest

```typescript
function greet(name: string, title?: string): string {
  return title ? `${title} ${name}` : name;
}

function createUser(name: string, role = 'user' as const) {
  return { name, role };
}

function sum(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}
```

**注意**：可选参数之后的必填参数合法，但调用时易混淆；通常把可选参数放末尾。

#### 3.1.3 函数重载

重载为**同一函数名**提供多套类型签名，实现体只有一个：

```typescript
function fmt(x: string): string;
function fmt(x: number): string;
function fmt(x: string | number): string {
  return String(x);
}

// 调用侧
fmt('hi');   // string
fmt(42);     // string
```

重载适合「参数组合不同 → 返回类型不同」的 API；简单场景用联合类型 + 条件返回即可。

#### 3.1.4 函数类型中的 this

```typescript
interface Clickable {
  label: string;
  onClick(this: Clickable, e: Event): void;
}
```

箭头函数不绑定自己的 `this`，捕获词法 `this`；类方法通常用普通函数或 TS 5.0+ 的 `#` 私有字段。

---

### 3.2 对象类型

**对象类型**描述「有哪些键、值是什么类型」。TS 不区分「类实例」与「普通对象」的形状，只看结构（见 [6.4 结构性类型兼容](#64-结构性类型兼容)）。

#### 3.2.1 内联对象类型

```typescript
let user: { id: string; name: string; age?: number } = {
  id: '1',
  name: 'Li',
};

// 索引签名：动态键
type Dict = { [key: string]: number };
type StringRecord = Record<string, string>;  // 内置工具类型
```

#### 3.2.2 属性修饰符

| 修饰                 | 含义                     |
| ------------------ | ---------------------- |
| `prop: T`          | 必填                     |
| `prop?: T`         | 可选，类型为 `T | undefined` |
| `readonly prop: T` | 只读，不可重新赋值              |

```typescript
type Config = {
  readonly apiUrl: string;
  timeout?: number;
  retries: number;
};
```

#### 3.2.3 excess property 检查

将**字面量对象**直接赋给类型时，多余属性会报错（防止拼写错误）：

```typescript
type Point = { x: number; y: number };
const p: Point = { x: 1, y: 2, z: 3 };  // 错误：z 不存在

// 绕过方式（慎用）
const p2: Point = { x: 1, y: 2, z: 3 } as Point;
const extra = { x: 1, y: 2, z: 3 };
const p3: Point = extra;  // 通过：extra 先赋给变量，不再 excess 检查
```

---

### 3.3 接口 interface

**interface** 描述对象或类的**契约**，与内联对象类型在多数场景可互换，但 interface 有独有特性。

```typescript
interface User {
  readonly id: string;
  name: string;
  email?: string;
}

interface Api {
  fetchUser(id: string): Promise<User>;
  updateUser(id: string, patch: Partial<User>): Promise<User>;
}
```

| 能力                          | 说明                                        |
| --------------------------- | ----------------------------------------- |
| `extends`                   | 继承多个接口，合并形状                               |
| `implements`                | 类必须实现接口声明的成员                              |
| 声明合并                        | 同名 interface 自动合并（见 [4.2 类型合并](#42-类型合并)） |
| 描述 callable / constructable | 见下                                        |

```typescript
interface SearchFn {
  (query: string, page?: number): Result[];
}

interface UserConstructor {
  new (name: string): User;
}
```

#### 3.3.1 interface 与 type 的选择

| 选 interface         | 选 type           |
| ------------------- | ---------------- |
| 描述对象/类契约            | 联合、交叉、元组、映射、条件类型 |
| 需要声明合并（如扩展第三方）      | 需要别名递归或复杂组合      |
| 面向 OOP `implements` | 函数类型别名更简洁        |

---

### 3.4 类 class

TS 的 `class` 在 JS class 语法上增加**访问修饰符**、**抽象类**、**类型层面的字段声明**。

```typescript
abstract class Shape {
  abstract area(): number;
}

class Circle extends Shape {
  readonly PI = 3.14;
  #radius: number;  // ES 私有字段，运行时真私有

  constructor(radius: number) {
    super();
    this.#radius = radius;
  }

  area(): number {
    return this.PI * this.#radius ** 2;
  }

  static fromDiameter(d: number) {
    return new Circle(d / 2);
  }
}
```

| 修饰符         | 可见性     | 说明            |
| ----------- | ------- | ------------- |
| `public`    | 任意处     | 默认，可省略        |
| `protected` | 类内 + 子类 | 不可被外部实例访问     |
| `private`   | 仅类内     | 编译期检查，运行时仍可访问 |
| `#field`    | 仅类内     | ES 标准私有，运行时强制 |
| `readonly`  | —       | 实例属性只赋一次      |
| `abstract`  | —       | 抽象类/方法，不可实例化  |

#### 3.4.1 类作为类型

```typescript
class User {
  constructor(public name: string) {}
}

const u = new User('Li');
type UserInstance = User;       // 实例类型
type UserCtor = typeof User;    // 构造函数类型
```

#### 3.4.2 参数属性简写

构造函数参数带修饰符时，自动声明并赋值实例属性：

```typescript
class Point {
  constructor(
    public x: number,
    public y: number,
    private label = 'point',
  ) {}
}
```

---

## 类型别名与合并

**type** 扩展表达能力；**声明合并**扩展第三方与全局类型。

### 4.1 类型别名 type

**type** 为任意类型起别名，可描述联合、交叉、元组、条件类型等 type 表达式无法单独用 interface 表达的形式。

```typescript
type ID = string | number;
type Point = [number, number];
type TreeNode = {
  value: number;
  children?: TreeNode[];  // 递归别名
};

type EventHandler<E> = (event: E) => void;
```

#### 4.1.1 递归类型

```typescript
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };
```

interface 也可递归，但联合/条件组合通常用 type 更清晰。

---

### 4.2 类型合并

TS 允许**同名声明自动合并**，常见于扩展第三方类型与全局增强。

#### 4.2.1 interface 声明合并

```typescript
interface User {
  id: string;
}

interface User {
  name: string;
}

// 等价于 interface User { id: string; name: string; }
```

#### 4.2.2 namespace 与 interface 合并

```typescript
namespace User {
  export function create(name: string): User {
    return { id: crypto.randomUUID(), name };
  }
}

interface User {
  id: string;
  name: string;
}

const u = User.create('Li');  // namespace 函数 + interface 类型
```

#### 4.2.3 模块 augmentation

为已有模块追加类型：

```typescript
// types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
export {};
```

**type 别名不能合并**，同名 type 会冲突。需要合并时用 interface 或 namespace。

---

## 泛型

**泛型**是类型的参数，让函数、类、接口在保持类型关联的前提下复用逻辑。

```typescript
interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}
```

#### 5.1 泛型约束 extends

```typescript
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

function pick<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

#### 5.2 泛型类与泛型接口

```typescript
class Stack<T> {
  private items: T[] = [];
  push(item: T) { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
}

interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}
```

#### 5.3 默认类型参数

```typescript
interface Paginated<T, M = { page: number; total: number }> {
  items: T[];
  meta: M;
}
```

#### 5.4 常见模式

| 模式       | 示例                                                  |
| -------- | --------------------------------------------------- |
| React 组件 | `List<T>` 使 `items: T[]` 与 `renderItem(item: T)` 一致 |
| 工厂函数     | `createStore<State>()`                              |
| 条件返回     | `function load<T>(url: string): Promise<T>`         |

避免无约束的 `<T>` 泛滥，约束越紧，推断越准，调用侧越安全。

---

## 推论、断言与类型安全

编译器如何**推断**类型、开发者如何**断言**与**守卫**，以及 TS 的**结构性兼容**规则。

### 6.1 类型推论

**类型推论（Type Inference）** 让编译器从上下文自动推导类型，减少冗余注解。

```typescript
let x = 3;                    // number
const arr = [1, 2];             // number[]
const tuple = [1, 'a'] as const; // readonly [1, 'a']

function id(v: string) {
  return v;  // 返回类型推断为 string
}

// 泛型推断
first([1, 2, 3]);     // T = number
pair('a', 42);        // [string, number]
```

#### 6.1.1 最佳实践

| 场景    | 建议                              |
| ----- | ------------------------------- |
| 局部变量  | 交给推断                            |
| 函数参数  | 公共 API 建议显式标注                   |
| 函数返回值 | 导出函数、复杂分支建议显式标注                 |
| 泛型调用  | 多数可推断；无法推断时显式 `fn<string>(...)` |

```typescript
// 显式返回类型避免推断过宽
function createConfig() {
  return { mode: 'strict' as const, n: 3 };
}
// 返回 { readonly mode: 'strict'; readonly n: number } 若缺 as const
```

#### 6.1.2 上下文 typing

```typescript
window.onmousedown = (e) => {
  // e 推断为 MouseEvent
  console.log(e.clientX);
};
```

---

### 6.2 类型断言

**类型断言**告诉编译器「此处类型比静态推断更窄」，**不产生运行时检查**。

```typescript
const el = document.getElementById('app') as HTMLElement;
const canvas = el as HTMLCanvasElement;

// 双重断言（极度慎用）
const x = unknownValue as unknown as SpecificType;

// 非空断言 !
const name = user!.name;  // 断言 user 非 null/undefined
```

#### 6.2.1 `as` 与 angle-bracket 语法

```typescript
const n = (<string>someValue);  // JSX 文件中不可用
const n2 = someValue as string;  // 推荐
```

#### 6.2.2 `const` 断言

```typescript
const routes = ['/', '/about'] as const;
type Route = (typeof routes)[number];  // '/' | '/about'
```

#### 6.2.3 安全替代

| 不安全                     | 更安全                                    |
| ----------------------- | -------------------------------------- |
| `JSON.parse(s) as User` | `UserSchema.parse(JSON.parse(s))`（zod） |
| `value as string`       | `typeof value === 'string'` 守卫         |
| `obj as Foo`            | 结构校验后再收窄                               |

---

### 6.3 类型保护与类型收窄

**类型收窄（Narrowing）** 指控制流分析使联合类型在分支内缩小为更具体的类型。

#### 6.3.1 内置收窄方式

```typescript
function print(id: string | number) {
  if (typeof id === 'string') {
    console.log(id.toUpperCase());  // id: string
  } else {
    console.log(id.toFixed(0));     // id: number
  }
}

function greet(name: string | null) {
  if (name === null) return;
  console.log(name.length);  // name: string
}

function handle(val: string | string[]) {
  if (Array.isArray(val)) {
    val.forEach(s => console.log(s));
  }
}
```

| 方式           | 示例                         |
| ------------ | -------------------------- |
| `typeof`     | 原始类型                       |
| `instanceof` | 类实例                        |
| `in`         | 属性存在                       |
| 相等性          | `x === null`、`x === 'ok'`  |
| 赋值           | `if (x = narrow(x))`       |
| 控制流          | `return` / `throw` 后下方类型变窄 |

#### 6.3.2 用户自定义类型守卫

```typescript
interface User {
  id: string;
  name: string;
}

function isUser(v: unknown): v is User {
  return (
    typeof v === 'object' &&
    v !== null &&
    'id' in v &&
    'name' in v &&
    typeof (v as User).id === 'string'
  );
}

function process(input: unknown) {
  if (isUser(input)) {
    console.log(input.name);  // input: User
  }
}
```

**断言函数（Assertion Functions）**：

```typescript
function assertIsUser(v: unknown): asserts v is User {
  if (!isUser(v)) throw new Error('Not a user');
}
```

---

### 6.4 结构性类型兼容

TypeScript 采用**结构性类型（Structural Typing）**：只要形状兼容即可赋值，不要求显式继承或 implements。

```typescript
interface Point {
  x: number;
  y: number;
}

interface Named {
  name: string;
}

function logPoint(p: Point) {
  console.log(p.x, p.y);
}

const obj = { x: 1, y: 2, z: 3 };
logPoint(obj);  // 合法：obj 至少包含 x、y

// 函数参数双向协变（strictFunctionTypes 下回调参数逆变）
type Handler = (p: Point) => void;
const h: Handler = (p: Named & Point) => { console.log(p.name); };
```

#### 6.4.1 兼容规则摘要

| 关系   | 规则                        |
| ---- | ------------------------- |
| 对象   | 目标类型的每个必填属性，源类型都有且类型兼容    |
| 可选属性 | 源可以有额外可选属性                |
| 函数   | 参数逆变、返回值协变（开启 strict 时更严） |
| 联合   | 源是联合 → 每个成员都要能赋给目标        |
| 枚举   | 仅同 enum 成员兼容（数字 enum 有例外） |

```typescript
type A = { a: string };
type B = { a: string; b: number };

const b: B = { a: 'x', b: 1 };
const a: A = b;  // OK：B 包含 A 的字段

// const b2: B = { a: 'x' };  // 错误：缺 b
```

---

## 类型运算

联合、交叉、索引、映射、条件等**类型层面的运算**，以及可辨识联合等建模模式。

### 7.1 联合类型

**联合类型（Union）** 表示「A 或 B 或 C 之一」。

```typescript
type ID = string | number;
type Result = Success | Failure;
type Nullable<T> = T | null | undefined;
```

#### 7.1.1 窄化后才能用成员

联合类型只能访问**所有成员共有**的属性与方法：

```typescript
type Cat = { meow(): void };
type Dog = { bark(): void };
type Pet = Cat | Dog;

function speak(p: Pet) {
  // p.meow();  // 错误
  if ('meow' in p) p.meow();
}
```

#### 7.1.2 分布式条件类型

联合作为泛型参数传入条件类型时，会**分别作用于每个成员**：

```typescript
type ToArray<T> = T extends unknown ? T[] : never;
type R = ToArray<string | number>;  // string[] | number[]
```

---

### 7.2 交叉类型

**交叉类型（Intersection）** 表示「同时具备 A 与 B 的所有成员」。

```typescript
type Admin = User & { role: 'admin'; permissions: string[] };

type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;  // { name: string; age: number }
```

#### 7.2.1 与 interface extends 对比

```typescript
interface A { x: number; }
interface B extends A { y: string; }
// 等价于 type C = A & { y: string };
```

冲突属性若类型不兼容则变为 `never`：

```typescript
type Bad = { x: string } & { x: number };  // x: never
```

---

### 7.3 索引类型

**索引类型**用于访问对象属性类型、约束键名集合。

#### 7.3.1 keyof

```typescript
interface User {
  id: string;
  name: string;
  email?: string;
}

type UserKeys = keyof User;  // 'id' | 'name' | 'email'

function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

#### 7.3.2 索引访问类型 T[K]

```typescript
type NameType = User['name'];           // string
type PartialUser = User['id' | 'name']; // string
type UserValues = User[keyof User];     // string | undefined
```

#### 7.3.3 索引签名

```typescript
type StringDict = {
  [key: string]: string;
};

type ReadonlyDict<T> = {
  readonly [K in keyof T]: T[K];
};
```

---

### 7.4 映射类型

**映射类型（Mapped Types）** 基于旧类型批量构造新类型，语法 `[P in keyof T]: ...`。

```typescript
type Flags<T> = {
  [P in keyof T]: boolean;
};

type Optional<T> = {
  [P in keyof T]?: T[P];
};

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];  // 移除 readonly
};

type RequiredKeys<T> = {
  [P in keyof T]-?: T[P];  // 移除 optional
};
```

#### 7.4.1 键重映射（Key Remapping）

TS 4.1+ 支持 `as` 重命名或过滤键：

```typescript
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type RemoveKind<T> = {
  [K in keyof T as K extends 'kind' ? never : K]: T[K];
};
```

---

### 7.5 条件类型

**条件类型**形如 `T extends U ? X : Y`，根据类型关系分支。

```typescript
type IsString<T> = T extends string ? true : false;

type Flatten<T> = T extends Array<infer U> ? U : T;
type Flattened = Flatten<string[]>;  // string
```

#### 7.5.1 infer 关键字

在条件类型真分支中**推断**类型变量：

```typescript
type ReturnType<T> = T extends (...args: unknown[]) => infer R ? R : never;

type ElementType<T> = T extends (infer E)[] ? E : never;

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
```

#### 7.5.2 实用组合

```typescript
type NonNullable<T> = T extends null | undefined ? never : T;

type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;
```

复杂业务校验优先 **zod** + `z.infer<typeof Schema>`，避免不可维护的类型体操。

---

### 7.6 This 类型

**This 类型**在类/接口方法链式调用中保持正确的 `this` 类型。

```typescript
class Calculator {
  value = 0;

  add(n: number): this {
    this.value += n;
    return this;
  }

  multiply(n: number): this {
    this.value *= n;
    return this;
  }
}

const c = new Calculator().add(1).multiply(2);
```

#### 7.6.1 ThisParameterType / OmitThisParameter

```typescript
function bindThis<T extends (...args: never[]) => unknown>(
  fn: T,
  ctx: ThisParameterType<T>,
): OmitThisParameter<T> {
  return fn.bind(ctx) as OmitThisParameter<T>;
}
```

#### 7.6.2 接口中的 this 参数

```typescript
interface Validator {
  validate(this: Validator, value: string): boolean;
}
```

---

### 7.7 字符串字面量类型

**字符串字面量类型**是 string 的子集，值固定为某个字符串常量；常与联合、模板字面量类型组合。

```typescript
type Theme = 'light' | 'dark';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type EventName = 'click' | 'scroll' | 'keydown';
```

#### 7.7.1 模板字面量类型（Template Literal Types）

```typescript
type Color = 'red' | 'blue';
type Size = 'sm' | 'lg';
type ClassName = `${Size}-${Color}`;  // 'sm-red' | 'sm-blue' | 'lg-red' | 'lg-blue'

type PropEventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = PropEventName<'click'>;  // 'onClick'
```

#### 7.7.2 内置字符串工具

| 工具                | 作用    |
| ----------------- | ----- |
| `Uppercase<S>`    | 全大写   |
| `Lowercase<S>`    | 全小写   |
| `Capitalize<S>`   | 首字母大写 |
| `Uncapitalize<S>` | 首字母小写 |

```typescript
type GetterName = `get${Capitalize<'userName'>}`;  // 'getUserName'
```

---

### 7.8 可辨识联合

**可辨识联合（Discriminated Union）** 用公共的**字面量字段**（判别式）区分联合成员，配合 `switch` 实现穷尽检查。

```typescript
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: Error };

function render(state: RequestState): string {
  switch (state.status) {
    case 'idle':
      return '点击加载';
    case 'loading':
      return '加载中…';
    case 'success':
      return state.data.map(u => u.name).join(', ');
    case 'error':
      return state.error.message;
    default:
      return assertNever(state);
  }
}
```

#### 7.8.1 设计要点

| 要点      | 说明                                 |
| ------- | ---------------------------------- |
| 判别字段    | 同名且为字面量类型，如 `status`、`kind`、`type` |
| 成员差异    | 各分支携带该状态独有字段                       |
| 穷尽      | `default` + `never` 防止漏分支          |
| 替代 enum | 比 enum 更轻、Tree-shaking 友好          |

```typescript
// API 错误建模
type ApiError =
  | { code: 'UNAUTHORIZED'; message: string }
  | { code: 'NOT_FOUND'; resource: string }
  | { code: 'VALIDATION'; fields: Record<string, string> };
```

---

## 模块与工程化

模块化、工具类型、装饰器、编译配置与**运行时边界**。

### 8.1 命名空间与模块

现代 TS 以 **ES Module** 为主；**namespace** 仍用于声明合并、全局增强与遗留代码。

#### 8.1.1 ES Module

```typescript
// types.ts
export type User = { id: string; name: string };
export interface Api { fetch(): Promise<User>; }

// app.ts
import type { User } from './types';  // 仅类型导入，编译后擦除
import { createUser } from './user';
```

| 语法                  | 说明                               |
| ------------------- | -------------------------------- |
| `export` / `import` | 标准模块                             |
| `import type`       | 仅导入类型，`verbatimModuleSyntax` 下推荐 |
| `export type`       | 仅导出类型                            |

#### 8.1.2 namespace

```typescript
namespace Utils {
  export function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
  }
  export const PI = 3.14159;
}

Utils.clamp(5, 0, 10);
```

namespace 可嵌套、可合并 interface，但**新代码优先 ES Module**。

#### 8.1.3 声明文件 .d.ts

为 JavaScript 库提供类型描述，不参与实现：

```typescript
// legacy-lib.d.ts
declare module 'legacy-lib' {
  export function doSomething(x: number): string;
}

// 资源模块
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
```

发布库时 `declaration: true` 生成 `.d.ts`；消费方通过 `types` 字段或 `@types/*` 获取类型。

---

### 8.2 工具类型

TypeScript 内置大量**工具类型**，多数由映射类型与条件类型实现。掌握它们可减少手写重复类型。

#### 8.2.1 对象变换

| 工具             | 效果      | 示例                          |
| -------------- | ------- | --------------------------- |
| `Partial<T>`   | 所有属性变可选 | `Partial<User>`             |
| `Required<T>`  | 所有属性变必填 | `Required<Config>`          |
| `Readonly<T>`  | 所有属性变只读 | `Readonly<State>`           |
| `Pick<T, K>`   | 选取部分键   | `Pick<User, 'id' | 'name'>` |
| `Omit<T, K>`   | 排除部分键   | `Omit<User, 'password'>`    |
| `Record<K, V>` | 构造键值对象  | `Record<'a' | 'b', number>` |

```typescript
type Patch = Partial<Omit<User, 'id'>>;

type PageParams = Record<'page' | 'size', number>;
```

#### 8.2.2 联合与函数拆解

| 工具                         | 效果                      |
| -------------------------- | ----------------------- |
| `Exclude<T, U>`            | 从 T 中排除可赋给 U 的成员        |
| `Extract<T, U>`            | 从 T 中提取可赋给 U 的成员        |
| `NonNullable<T>`           | 排除 `null` 和 `undefined` |
| `ReturnType<F>`            | 函数返回类型                  |
| `Parameters<F>`            | 函数参数元组                  |
| `ConstructorParameters<C>` | 构造函数参数                  |
| `InstanceType<C>`          | 构造函数实例类型                |
| `Awaited<T>`               | 解包 Promise（含嵌套）         |

```typescript
type R = Awaited<ReturnType<typeof fetchUser>>;

type Fn = (a: string, b: number) => boolean;
type Args = Parameters<Fn>;      // [string, number]
type Ret = ReturnType<Fn>;       // boolean
```

#### 8.2.3 自定义工具类型示例

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type ValueOf<T> = T[keyof T];

type Mutable<T> = { -readonly [P in keyof T]: T[P] };
```

---

### 8.3 装饰器

**装饰器（Decorator）** 是一种声明式元编程：在类、方法、属性、参数上附加额外行为。TS 5.0+ 对齐 **Stage 3 装饰器**提案（与旧版 `experimentalDecorators` 不兼容）。

#### 8.3.1 启用方式

```json
{
  "compilerOptions": {
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false,
    "target": "ES2022",
    "lib": ["ES2022", "DecoratorMetadata"]
  }
}
```

现代装饰器无需 `experimentalDecorators`；Angular 等框架若仍用旧版，须单独查文档。

#### 8.3.2 类装饰器

```typescript
function logged<T extends new (...args: unknown[]) => object>(target: T) {
  return class extends target {
    constructor(...args: unknown[]) {
      console.log(`Creating ${target.name}`);
      super(...args);
    }
  };
}

@logged
class User {
  constructor(public name: string) {}
}
```

#### 8.3.3 方法 / 访问器 / 属性 / 参数装饰器

```typescript
function readonly(target: object, context: ClassFieldDecoratorContext) {
  context.addInitializer(function () {
    Object.defineProperty(this, context.name, { writable: false });
  });
}

function measure<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  return function (this: This, ...args: Args): Return {
    const start = performance.now();
    const result = target.call(this, ...args);
    console.log(`${String(context.name)} took ${performance.now() - start}ms`);
    return result;
  };
}

class Service {
  @measure
  fetchData() {
    return fetch('/api');
  }
}
```

#### 8.3.4 典型应用场景

| 场景       | 框架/用途                           |
| -------- | ------------------------------- |
| 依赖注入     | Angular `@Injectable()`         |
| 路由元数据    | NestJS `@Controller()`、`@Get()` |
| 序列化/校验   | class-validator（旧版装饰器）          |
| 日志、权限、缓存 | AOP 横切关注点                       |

**注意**：装饰器会改变类结构，Tree-shaking 与类型推断可能受影响；仅在框架约定或横切逻辑确实需要时使用。

---

### 8.4 satisfies 与类型组合实践

`satisfies`（TS 4.9+）在**不拓宽推断类型**的前提下校验值是否符合某类型：

```typescript
const routes = {
  home: '/',
  user: '/users/:id',
} satisfies Record<string, string>;
// 类型：{ home: '/'; user: '/users/:id' }，而非 Record<string, string>

type RouteKey = keyof typeof routes;  // 'home' | 'user'
```

#### 8.4.1 与 as const / 类型注解对比

| 写法                         | 效果                 |
| -------------------------- | ------------------ |
| `: Record<string, string>` | 校验通过，但字面量类型丢失      |
| `as const`                 | 保留字面量，但不校验是否满足更宽约束 |
| `satisfies T`              | **既校验形状，又保留窄类型**   |

```typescript
const palette = {
  red: [255, 0, 0],
  green: '#00ff00',
} satisfies Record<string, string | readonly number[]>;

// palette.red 为 readonly [255, 0, 0]
// palette.green 为 '#00ff00'
```

---

### 8.5 tsconfig 要点

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "noEmit": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

| 选项                          | 作用                                            |
| --------------------------- | --------------------------------------------- |
| `strict`                    | 开启 strictNullChecks、strictFunctionTypes 等严格家族 |
| `noEmit` + Vite/esbuild     | 类型检查与打包分离，构建更快                                |
| `moduleResolution: bundler` | 适配 Vite/Webpack 解析规则                          |
| `noUncheckedIndexedAccess`  | `arr[i]`、`obj[k]` 含 undefined                 |
| `verbatimModuleSyntax`      | 类型导入须写 `import type`                          |
| `paths`                     | 路径别名，须与 bundler alias 一致                      |

Monorepo：`references` + `composite` 做项目引用与增量编译（工程化 **03 · 脚手架**）。

---

### 8.6 运行时边界

TypeScript 类型只存在于**编译期**，理解擦除边界才能避免「类型安全幻觉」。

| 编译期存在           | 运行时消失          |
| --------------- | -------------- |
| `interface`     | ✓ 擦除           |
| `type` 别名       | ✓ 擦除           |
| 泛型参数 `<T>`      | ✓ 擦除           |
| `enum`（非 const） | ✗ 可能生成对象       |
| `class`         | ✗ 保留（JS class） |
| 装饰器             | ✗ 保留变换后的代码     |

```typescript
// API 边界：JSON 无类型
const UserSchema = z.object({ id: z.string(), name: z.string() });
type User = z.infer<typeof UserSchema>;

async function loadUser(id: string): Promise<User> {
  const raw = await fetch(`/api/users/${id}`).then(r => r.json());
  return UserSchema.parse(raw);  // 运行时校验
}
```

**实践原则**：

- 外部输入（HTTP、localStorage、postMessage）默认 `unknown`，校验后再用
- 少滥用 `as`；优先类型守卫 + schema 库（zod、valibot）
- 数字 `enum` 有运行时代价；常量对象 + `as const` 更轻

---

## 小结

TypeScript 在编译期做**静态建模**，产物仍是普通 JavaScript，类型擦除后运行时无保障，API 边界须配合 zod 等运行时校验。

strict 全家桶宜默认开启；interface 描述对象形状，type 做联合/工具类型；泛型 + extends 约束复用逻辑；可辨识联合 + 守卫收窄类型；tsconfig paths 与 moduleResolution 对齐构建工具。

**易混点**：any 与 unknown；断言 vs 守卫；interface 合并 vs type 不能重复声明；enum 与 const 对象 + as const；结构兼容导致「多余属性」报错。

核对：`pnpm typecheck` 是否零错误？对外 API 是否有 Runtime schema？lib/dom 是否误用在 Node 脚本？
