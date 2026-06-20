---
title: JavaScript null 的本质 —— "有意的空"如何成为语言基石
created: 2022-12-11
updated: 2026-06-21
tags:
  - JavaScript
  - "null"
description: 深入探讨 null 与 undefined 的语义分工，从 ECMAScript 规范的抽象操作到现代 Web 生态的工程实践，揭示"有意的空"如何成为语言设计基石
status: evergreen
---

JavaScript 有两个用来表示“没有值”的特殊值：`null` 和 `undefined`。

很多教程把它们简单概括成“同一种空的两种写法”，再配上一张对比表，似乎问题就解决了。

但如果继续深挖，会发现一些颇为反直觉的现象：

* `typeof null` 返回 `'object'`
* `Number(null)` 的结果是 `0`
* `null == undefined` 为 `true`，却不等于 `0`、`false` 或空字符串
* 原型链以 `null` 作为终点
* JSON 认可 `null`，却完全忽略 `undefined`
* `??` 和 `?.` 把 `null` 与 `undefined` 单独归为一类

这些行为散落在语言的不同角落，表面上彼此毫无关系。但如果把它们放在一起观察，会发现它们实际上指向同一种语义：

> `undefined` 更像是运行时发现的缺失，而 `null` 更像是程序员主动声明的空值。

这种理解未必是 ECMAScript 规范明文宣称的设计哲学，但它能够解释语言中绝大多数与 `null` 有关的行为，也能解释为什么 JavaScript 明明已经有了 `undefined`，仍然需要保留 `null`。

---

## 为什么 JavaScript 需要两种“空”？

可以把它想象成一个快递柜。

静态类型语言更像管理严格的智能柜。在办理租用手续时，也就是编译阶段，你就必须登记：“3 号柜只能存放食品。”等到真正打开柜门时，系统已经知道柜子里应该放什么，也知道当前是否有内容。因此，运行时无需再去判断“这里原本该不该有东西”。

动态类型语言则恰好相反。

租柜时什么都不用登记，所有检查都推迟到运行时。当程序第一次打开柜门，发现里面是空的，它必须进一步判断：这种空究竟意味着什么？

一种可能是：柜子从来没人使用过。系统无法得知这里本来应该存放什么，只能回答：”目前没有值。”这对应 `undefined`。

另一种可能是：有人已经检查过柜子，并明确贴上一张标签——“确认为空”。这对应 `null`。

```js
let x;
```

这里程序员什么都没做，JavaScript 引擎自动赋予变量 `undefined`。

```js
let user = null;
```

这里则是程序员主动写下一个空值，用来表达：”这里本来应该有值，但我明确确认它目前为空。”

动态语言缺少静态类型系统提前消除歧义的能力，于是只能保留两种不同的”空”，以便在运行时区分：

* `undefined` —— 系统发现的缺失
* `null` —— 人为声明的空值

如果继续深入 ECMAScript 规范，会发现这种区分并不是某几个 API 的偶然行为，而是贯穿整个抽象操作体系的一种模式。

---

## null 在算术运算中的身份：一个“可计算的空”

来看一组容易令人困惑的代码：

```js
1 + null;      // 1
null <= 0;     // true

1 + undefined; // NaN
undefined < 0; // false
```

规范层面很好解释。`ToNumber` 的规则规定：`null → 0`，`undefined → NaN`。

真正值得讨论的问题是：为什么会这样设计？

严格来说，`null → 0` 并不一定源自某种完整的数学哲学。

它更像是早期 JavaScript 在设计宽松类型转换体系时做出的历史选择，受到 C 系语言空指针数值化传统的影响，也符合当时“缺失值在数值上下文中退化为零”的习惯。

这种规则未必优雅，但它客观上形成了一种稳定语义：`null` 进入数值世界后，会被视为一个可以参与运算的空值。

```js
1 + null; // 1
5 * null; // 0
```

它相当于一个不会破坏计算过程的占位符。而 `undefined` 则完全不同。

```js
1 + undefined; // NaN
```

它不会尝试融入数值系统，而是直接产生 `NaN`。原因其实很直观：如果连程序员自己都不知道这里原本应该是什么，那么把它拿来参与计算，本身就是没有意义的。

于是：`null` 是一种可以计算的空，`undefined` 是一种无法计算的未知。

规范未必赋予它们如此明确的哲学定位，但长期演化的结果，确实形成了这样的语义分工。

---

## `typeof null`：一个永远修不掉的历史 Bug

JavaScript 最著名的怪异行为之一，大概就是这个：

```js
typeof null;
// 'object'
```

问题在于，`null` 明明不是对象。

```js
null.foo; // TypeError
```

它没有属性，没有方法，也没有原型。为什么 `typeof` 会把它识别成对象？

答案其实非常朴素。

早期 JavaScript 引擎使用类型标签区分不同值。对象使用的内部标签恰好是 `0`，而 `null` 的编码表示也恰好占用了同一个标签位模式。于是 `typeof` 在检查类型时，只看到一个值的标签是 `0`，便返回了 `'object'`。

这是一个实现层面的历史事故，而不是语言设计者有意赋予 `null` 的语义。

后来曾有人提议修改：

```js
typeof null === 'null'
```

但最终被拒绝。原因也很现实：过去二十多年里，已经有海量代码依赖于 `typeof value === 'object'`，贸然修复这个问题，带来的兼容性风险远大于收益。

---

不过，要真正理解为什么这是一个 Bug，还需要区分 ECMAScript 中两个不同层级的概念。

规范内部有一个抽象操作 `Type(x)`，它负责定义值在语言层面的真实类型。`Type(null)` 得到的结果是 `Null`，它与 `Object`、`Number`、`String` 等类型处于同一层级。换句话说，在 ECMAScript 的类型体系里，`null` 从来都不是对象。

而 `typeof` 是暴露给程序员的运行时运算符，它返回的是字符串标签 `typeof null // "object"`。

因此：

> `Type(null)` 告诉我们规范的真实分类。
>
> `typeof null` 只是早期实现遗留下来的兼容性产物。

前者属于语言语义，后者属于历史包袱。两者并不矛盾，只是位于 ECMAScript 的不同抽象层级。

## `null` 在 `==` 中的特权：唯一拥有专属分支的值

如果说 `typeof null` 是历史遗留问题，那么 `null == undefined` 则更像是一种刻意设计。

先看结果：

```js
null == undefined; // true

null === undefined; // false
```

严格相等运算符 `===` 很容易理解——类型不同，自然不相等。

奇怪的是，宽松相等 `==` 明明以各种隐式转换闻名，却偏偏只让 `null` 和 `undefined` 彼此相等，而拒绝和任何其他值发生关联：

```js
null == 0;       // false
null == false;   // false
null == '';      // false

undefined == 0;      // false
undefined == false;  // false
undefined == '';     // false
```

对比其他原始值在 `==` 中的表现，这种特殊待遇会更加明显：

```js
0 == false;   // true
'' == false;  // true
'1' == true;  // true

[] == false;  // true
```

这些值都会沿着隐式转换链一路折腾，最终得到相同的结果。

唯独 `null` 和 `undefined` 不参与这套规则。

原因来自 ECMAScript 的 **Abstract Equality Comparison** 算法。

规范在算法最开始就写下了两个特殊分支：如果一方是 `null`，另一方是 `undefined`，直接返回 `true`；如果一方是 `undefined`，另一方是 `null`，直接返回 `true`。

算法在这里就结束了，后面的类型转换逻辑根本不会执行。

换句话说，`null` 和 `undefined` 是整个 `==` 算法中唯一共享专属通道的一组值。

这件事值得玩味。如果规范允许 `null == 0` 成立，那么 `null` 就会退化成某种特殊数字。如果允许 `null == false` 成立，那么空值又会退化成布尔意义上的假。一旦如此，`null` 就失去了作为独立标记的价值。

因此，ECMAScript 采取了一个相当克制的策略：`null` 可以和另一种”空”相等，但它不等于任何具体值。

这种行为并不能证明规范设计者当初一定在思考”有意的空”。但反过来说，如果把 `null` 理解成一种明确声明的空值，那么 `==` 的专属分支恰恰变得十分自然：空可以和另一种空互相兼容，但空永远不应该和数字、字符串或布尔值混为一谈。

---

## 原型链终点：`null` 代表主动终止

JavaScript 的原型链最终会停在哪里？

答案是：

```js
Object.getPrototypeOf(Object.prototype);

// null
```

为什么不是 `undefined`？

因为原型链讨论的问题是：

> “当前对象的父对象是谁？”

当遍历到最顶层时，引擎需要给出一个明确答案：

> 没有了。

这里表达的不是”不知道”，也不是”还没初始化”，而是——到此为止。这是一个主动终止，而不是一种未知状态。

因此，`null` 比 `undefined` 更符合这里的语义。

它像是在原型链末尾插上一块牌子：Stop. No more prototypes.

这也是 `Object.create(null)` 存在的意义。

```js
const dict = Object.create(null);

dict.toString;       // undefined
dict.hasOwnProperty; // undefined
```

这个对象没有继承任何原型方法，它从诞生开始，就被放置在一条被人为截断的原型链上。这种对象最典型的用途是充当纯字典：

```js
const map = Object.create(null);

map.__proto__ = 'evil';
```

这里的 `__proto__` 只是普通属性，不会修改对象原型。因此，它天然能够避免原型污染问题。

值得补充的是，很多文章会声称 `Object.create(null)` 性能更高。这并不准确。现代 JavaScript 引擎对普通对象做了大量优化，例如隐藏类（Hidden Class）和内联缓存（Inline Cache）。无原型对象真正的价值主要是安全性，而不是性能。

选择它，通常意味着"我需要一个不会受到原型链影响的数据容器"，而不是"我想获得更快的对象访问速度"。

---

## JSON 为什么只认 `null`？

JSON 中有一个字面量：

```json
null
```

但没有：

```json
undefined
```

原因并不复杂。

JSON 虽然最初受到 JavaScript 对象字面量启发，但它早已成为一种独立的数据交换协议。

它需要跨语言工作。

于是只能保留那些所有语言都容易理解的数据类型：

* 字符串
* 数字
* 布尔值
* 数组
* 对象
* `null`

而 `undefined` 并不具备跨语言语义。它描述的是 JavaScript 引擎内部的一种状态：”这里还没有值。”很多语言甚至根本不存在这种概念。

于是：

```js
JSON.stringify(null);      // "null"
JSON.stringify(undefined); // undefined（注意：返回值甚至不是字符串）
```

对象中的 `undefined` 会被忽略：`JSON.stringify({ a: undefined })` → `"{}"`

数组中的 `undefined` 又会被替换：`JSON.stringify([1, undefined, 3])` → `"[1,null,3]"`

这三种行为看似奇怪，实际上表达的是同一个意思：`undefined` 不是数据，它只是状态。JSON 无法传输一种状态，它只能传输值。

而 `null` 恰恰符合这个要求。它是一种可以序列化、可以跨网络传递、可以被其他语言理解的空值。

因此，从 JSON 的视角来看：`null` 是可传输的空，`undefined` 是引擎内部的空。

这种区别，也解释了为什么 `null` 会广泛出现在 API 响应、数据库结果以及各种跨语言协议中，而 `undefined` 基本只停留在 JavaScript 运行时内部。

## `??` 和 `?.`：JavaScript 开始认真对待“两种空”

在很长一段时间里，JavaScript 并没有真正区分“空值”和其他 falsy 值。

最典型的例子就是 `||`。

```js
0 || 'default';      // 'default'
'' || 'default';     // 'default'
false || 'default';  // 'default'
```

`||` 的内部逻辑基于 `ToBoolean`。只要左侧是 falsy，右侧就会被返回。

问题在于，`0`、空字符串和 `false` 往往是合法业务值，它们只是恰好在布尔上下文中被视为假值，并不意味着“缺失”。

于是，开发者不得不写出这样的代码：

```js
if (value === null || value === undefined) {
  value = defaultValue;
}
```

ES2020 引入的 `??`，本质上就是把这种模式提升成语言特性。

```js
0 ?? 'default';        // 0
'' ?? 'default';       // ''
false ?? 'default';    // false

null ?? 'default';     // 'default'
undefined ?? 'default' // 'default'
```

它问的问题不再是”这个值是真是假？”，而是”这个值是否不存在？”

规范内部甚至专门定义了一个抽象操作 `IsNullOrUndefined(x)`，只有当值是 `null` 或 `undefined` 时，才会返回 `true`。换句话说，`??` 第一次把”空值”从”假值”中独立出来。

---

与 `??` 相对应，ES2020 还引入了另一个运算符：`?.`。

它解决的是另一类问题。

假设：

```js
const user = null;
```

访问深层属性时：

```js
user.address.city;
```

程序会直接抛出异常：

```text
TypeError
```

因为引擎试图把 `null` 当作对象处理。

而使用可选链：

```js
user?.address?.city;
```

结果变成 `undefined`。执行过程其实很简单：运算符沿着访问链逐层前进，一旦遇到 `null` 或 `undefined`，立即停止计算，并返回 `undefined`。

于是：

```js
const city = user?.address?.city ?? 'Unknown';
```

就形成了一套完整的处理流程：

* `?.` 负责安全穿透
* `??` 负责提供默认值

两者配合，几乎覆盖了现代 JavaScript 中所有 nullish 场景。

---

函数参数默认值也遵循类似逻辑。

```js
function greet(name = 'Guest') {
  return name;
}

greet(undefined); // 'Guest'
greet(null);      // null
```

因为默认参数只对 `undefined` 生效。这意味着：

```text
undefined = 没传
null      = 明确传了一个空值
```

`??`、`?.` 和参数默认值，看似来自不同方向，却共同体现了一种趋势：JavaScript 开始承认 `null` 和 `undefined` 确实是一类特殊值，它们不应该再和所有 falsy 值混在一起处理。

---

## ECMAScript 如何系统地区分两种空？

到目前为止，我们已经看到：

* 算术运算中的差异；
* `typeof null` 的历史 Bug；
* `==` 的特殊分支；
* 原型链的终点；
* JSON 的序列化规则；
* ES2020 引入的新运算符。

这些行为看起来像散落在语言各处的怪癖，但实际上，它们都来自 ECMAScript 的同一套底层机制。规范通过大量抽象操作，持续区分 `null` 和 `undefined`。

| 抽象操作              | `null`           | `undefined` |
| ----------------- | ---------------- | ----------- |
| ToNumber          | `0`              | `NaN`       |
| ToBoolean         | `false`          | `false`     |
| ToObject          | TypeError        | TypeError   |
| Strict Equality   | 只与自身相等           | 只与自身相等      |
| SameValue         | 只与自身相等           | 只与自身相等      |
| Abstract Equality | 与 `undefined` 相等 | 与 `null` 相等 |
| JSON              | 保留               | 丢弃 / 替换     |
| IsNullOrUndefined | true             | true        |

观察这张表，会发现规范采取的是一种相当克制的策略。

有些地方，它们被明确区分。

例如：

### ToNumber

```text
null       → 0
undefined  → NaN
```

说明两者进入数值系统后，身份完全不同。

---

有些地方，它们被视为同一类。

例如：

### ToBoolean

```text
null → false
undefined → false
```

这也是为什么 `||` 无法区分它们。

---

还有些地方，规范故意保留特权。

例如：

### Abstract Equality

只有 `null == undefined` 拥有专属分支。

---

而到了 ES2020，规范又重新把它们统一起来。

### IsNullOrUndefined

这是 `??` 和 `?.` 的基础。

它代表一种新的分类方式：这些值虽然不同，但都属于 nullish。

---

于是，前面讨论过的所有奇怪行为，其实都可以从这里推导出来：

- `1 + null` 来自 `ToNumber`
- `null == undefined` 来自 Abstract Equality
- `JSON.stringify(undefined)` 来自 JSON Serialization
- `a ?? b` 来自 IsNullOrUndefined

从这个角度看，`null` 并不是”另一种空写法”。它从 ECMAScript 最底层的抽象操作开始，就一直在走与 `undefined` 不同的路径。

---

## 什么时候该用 `null`，什么时候该用 `undefined`？

如果前面的讨论成立，那么实践中的原则其实非常简单：

> **`undefined` 是引擎说的“没有”。**
>
> **`null` 是程序员说的“没有”。**

可以概括成下面这张表：

| 场景              | 推荐值         | 原因             |
| --------------- | ----------- | -------------- |
| API 查询不到数据      | `null`      | 明确查过，没有结果      |
| DOM 查找失败        | `null`      | Web API 的既定约定  |
| 变量声明未赋值         | `undefined` | 引擎自动填充         |
| 函数参数缺失          | `undefined` | 引擎自动填充         |
| 对象属性不存在         | `undefined` | 引擎自动返回         |
| JSON 空字段        | `null`      | 协议支持           |
| TypeScript 空返回值 | `T \| null` | 语义最明确          |
| Map.get() 未命中   | `undefined` | 需配合 `has()` 判断 |

归纳起来，其实只有一句话：

> 当你主动检查后确认没有值，用 `null`。
>
> 当系统自然暴露一种缺失状态，它通常就是 `undefined`。

## TypeScript 与 Web 生态：一种语义如何成为事实标准

前面的分析，大多来自 ECMAScript 规范本身。

但规范很少直接讨论设计哲学。它只定义规则：哪些地方做转换，哪些地方保留空值，哪些地方允许短路。

那么，把 `null` 理解为“有意的空”，会不会只是后人的解释？

现代 JavaScript 生态给出的答案是：至少在工程实践中，人们几乎都默认接受了这种区分。

TypeScript 是最明显的例子。

```ts
type User = {
  name: string | null;
  email?: string;
}
```

这两个字段表达的是两种不同的缺失：`name: string | null` 表示"这里应该有一个字符串，但允许它明确为空"；而 `email?: string` 表示"这个字段可能根本不存在"。

这种区分与 JavaScript 运行时的行为高度一致。

| 语义   | TypeScript       | JavaScript  |
| ---- | ---------------- | ----------- |
| 明确为空 | `T \| null`      | `null`      |
| 可能缺席 | `T \| undefined` | `undefined` |

类似的模式也出现在整个现代 Web 生态中。

* JSON 用 `null` 表示空字段；
* GraphQL 用 `null` 表示 nullable 字段无值；
* DOM API 查询失败返回 `null`；
* 数据库驱动通常把 SQL `NULL` 映射为 `null`；
* Zod、Prisma 等工具也会区分 nullable 和 optional。

这些技术栈彼此独立，却逐渐收敛到同一种约定：`null` 表示”值属于模型，但当前为空”；`undefined` 表示”值可能根本不属于当前模型”。

TypeScript 做的事情，本质上不是发明新的语义，而是把 JavaScript 运行时长期隐含的约定，上升成了类型系统里的显式契约。

---

## null 留给 JavaScript 的，不是一个历史包袱

JavaScript 同时拥有 `null` 和 `undefined`，一直被视为语言设计上的争议。

很多人把这种双重空值归结为历史遗留：十天设计出的语言难免留下瑕疵，后人只能为了兼容性继续背负它。

但如果把前面讨论过的行为放在一起看，会发现事情并没有那么简单。

在 ECMAScript 的抽象操作里，它们走着不同的路径：

* `ToNumber` 让 `null` 变成 `0`，让 `undefined` 变成 `NaN`；
* `==` 为 `null` 和 `undefined` 保留了唯一的专属分支；
* 原型链选择 `null` 作为终点，而不是 `undefined`；
* JSON 保留 `null`，却拒绝表示 `undefined`；
* `??`、`?.` 和 TypeScript 的 `strictNullChecks`，又重新把两者归入同一个 nullish 集合。

这些规则未必都出自统一设计——其中有历史偶然，也有兼容性妥协，还有后来不断演化补充的结果。但经过三十年的发展，它们最终汇聚出一种相当稳定的语义分工：

`undefined` 更接近一种运行时状态。变量尚未赋值、参数没有传入、属性不存在——引擎在告诉你：

> 我不知道这里应该有什么。

而 `null` 更接近一种业务语义。查询结果为空、DOM 节点不存在、API 返回空字段——程序员在告诉引擎：

> 我知道这里本来应该有值，我检查过了，结果确认没有。

ECMAScript 或许从未明确宣称这是它的设计哲学。但三十年的规范演化、Web API、JSON、GraphQL、TypeScript，以及整个现代 JavaScript 生态，都在不断强化同一个事实：

> 缺失，并不总是同一种缺失。

JavaScript 保留下来的，或许并不只是两个名字相似的空值。它保留下来的，是一种表达能力：

> **区分「我不知道」和「我知道没有」。**

---
