---
title: JavaScript null 的本质 —— "有意的空"如何成为语言基石
created: 2022-12-11
updated: 2026-05-27
tags:
  - JavaScript
  - "null"
description: 深入剖析 JavaScript 中 null 的设计哲学——从 typeof null 的历史 Bug、null 与 undefined 的本质分野，到原型链终点、类型转换的双重人格、?? 的语义革命，以及 TypeScript 如何用类型系统把 null 的"有意缺失"从约定变成契约。
status: evergreen
---

JavaScript 的类型系统里有两个"空"——`null` 和 `undefined`。大多数教程把它们当作"同一种空的两种写法"，列一张对比表就完事了。

但如果继续深挖，会发现一件非常反直觉的事：

> `null` 被 `typeof` 判定为对象，`Number()` 把它变成 0，`==` 对它网开一面不做类型转换，原型链拿它做终点，JSON 只认它不认 `undefined`。这些看似毫无关联的行为，客观上指向一种一致的语义模式。

要理解这个模式，得先回答一个被忽略的根本问题：JavaScript 已经有了 `undefined`，为什么还需要 `null`？

---

## 一个语言为什么需要两种"空"？

想象你有一个快递柜。

**静态类型语言**就像管理严格的智能柜。在你办租用手续的那一刻——也就是**编译时**——你就必须登记：“3号柜只放食品”。系统把这条规则刻进表格里。等到**运行时**，无论你是从没打开过柜子，还是特意放入一个空盒子，管理员在开柜门前就能查到：这个柜子的类型已知，有无内容已知。它不需要在开门后再去猜“里面到底有没有东西”。所以，对你来说，只有一种“空”需要表达——那就是你明确放进去的“空”。静态语言在编译阶段就消灭了“未定义”这种模糊状态，运行时当然无需区分两种空。

**动态类型语言**的柜子刚好相反。租用时你不做任何登记，柜子什么都能装，**所有检查都被推迟到运行时**。问题随之而来——当你打开柜门时，系统才第一次面对这个柜子。它发现里面是空的，但立刻陷入困惑：这个“空”到底是什么意思？

- 是**从来没人碰过这个柜子**，系统只能说“我不知道这里有什么”——这是 `undefined`，一种**系统发现的缺失**。
- 还是**你检查过柜子，亲手贴上一张纸条：“确认此柜为空”**——这是 `null`，一种**你主动声明的空**。

`let x;` ——你什么都没做，运行时系统帮你填了 `undefined`，它在表达“尚未存在”。  
`let user = null;` ——你亲手写下空值，它在宣告“有意留白”。

因为动态语言没有编译期的登记表，它只能在运行时通过 `undefined` 和 `null` 这两种不同的面孔，去分辨“未曾存在”和“故意为空”。静态语言把歧义杀死在编译时，运行时早就知道答案；动态语言把一切交给运行时，于是必须保留双重“空”，让程序能在运行中辨认意图。

往 ECMAScript 规范的底层走，你会发现 `null` 和 `undefined` 在每一个抽象操作中的行为都仔细地区分开来——这无数微小的差异，最终汇成一种可辨识的模式：**既给系统留一个表示“缺失”的默认信号，也给程序员留一个表达“空”的明确工具。**

---

## null 在算术和关系运算中：0——一个"可以计算的空"

先看一个令人困惑的现象：

```js
1 + null;      // 1
null <= 0;     // true

1 + undefined; // NaN
undefined < 0; // false
```

为什么 `null` 在算术中变成 `0`，而 `undefined` 变成 `NaN`？表面上看是因为 [ToNumber](https://tc39.es/ecma262/#sec-tonumber) (§7.1.4) 的规则——`null → 0`，`undefined → NaN`。但规则本身不解释**为什么这样规定**。

要诚实地说：`null → 0` 未必源于某种完整的数学哲学，它更像早期 JavaScript 宽松类型转换体系中的一个历史选择——C 风格空指针数值化遗留、"absence coerces to zero" 的传统习惯。它们并不"语义优雅"。

但从结果上看，这个历史选择客观上形成了一种特殊语义：`null` 在数值上下文中被视为"空但可参与计算"——加它等于没加，乘它等于归零。而 `undefined` 则完全不同，它直接变成 `NaN`，彻底退出算术系统。它是"未初始化"——连程序员自己都不知道这里应该是什么，一个连类型都不确定的值参与算术，结果只能是"这根本不是能算的东西"。

> **ToNumber 的分叉：** `null → 0`（可计算），`undefined → NaN`（不可计算）。与其说这是规范的"深层意图"，不如说是一个历史选择客观上形成了有用的语义区分——两者的"空"不在同一个层级。

---

## typeof null：一个永远修不掉的底层 Bug

```js
typeof null; // 'object'
```

这个返回值让无数初学者困惑——`null` 明明是原始值，为什么类型是 `'object'`？

JavaScript 引擎区分类型靠的是**类型标签**——每个值在内存中有一小段编码标记"我是什么类型"。对象的类型标签恰好是 `0`。

而 `null` 的类型标签恰好也是 `0`——这是早期引擎实现中的一个编码事故（Brendan Eich 本人确认过）。于是引擎做 `typeof` 检查时，读到标签 `0`，就报告了 `'object'`。这是一个历史 Bug，不是设计意图。

> 曾有人提出修复方案让 `typeof null === 'null'`，但被拒绝了。原因很现实：数百万行代码依赖 `typeof x === 'object'` 来判断值是否为对象。修复这个 Bug，反而会制造更多 Bug。

讽刺的是：`typeof null` 返回 `'object'`，但 `null` 并不是对象——访问 `null.foo` 直接抛 TypeError。`null` 连 `valueOf` 和 `toString` 都没有。

这是类型系统唯一一次"说谎"。这个谎言没有深层含义——它就是一个历史编码事故恰好撞上了对象的类型标签，和 `null` 的语义设计无关。

---

## null 在 == 中的特权：唯一不做类型转换的原始值

这是 `null` 最不寻常的特征。ECMAScript 规范对 `==` 做了一个全局特判：若一方是 `null` 且另一方是 `undefined`，直接返回 `true`，**跳过一切类型转换**。

```js
null == undefined; // true —— 直接特判，不走任何转换
```

对比其他原始值在 `==` 中的行为，这个特权就更突出了：

```js
0 == false;        // true  —— false 转数字 0
"" == false;       // true  —— 双方都转数字 0
"1" == true;       // true  —— true 转 1，"1" 转 1
[] == false;       // true  —— [] 转 "" 转 0，false 转 0

null == false;     // false —— 拒绝转换
null == 0;         // false —— 拒绝转换
null == "";        // false —— 拒绝转换
```

`null` 和 `undefined` 是 ECMAScript 抽象相等比较（Abstract Equality Comparison）中**唯一共享专属分支的一组值**——规范为它们单独写了一条规则，跳过一切类型转换，直接判定相等。其他值（包括 `Symbol`、`BigInt`）走的都是带类型转换的通用路径。为什么规范要给 `null`/`undefined` 这个特权？

一个有说服力的解释是：如果允许 `null` 在 `==` 中被转换成 `0` 或 `""` 或 `false`，那就等于说"空和某个具体的值等价"——这会让 `null` 失去作为独立标记的意义。结果是：**`null` 只等于 `undefined`，因为两者都是"空"的表达；`null` 不等于任何其他值，因为空不等于任何东西。** 这是"有意的空"模型最有解释力的地方——即使规范没有明文这么说，这个模型也能统一解释 `==` 特判的行为。

---

## 原型链终点：null 作为"有意的断裂"

```js
Object.getPrototypeOf(Object.prototype); // null
```

原型链的终点是 `null`。为什么不是 `undefined`？

原型链的每一步都是"这个对象的父对象是什么"。当链走到尽头，答案应该是"这里不再有父对象"——这是一个**有意的终止**，不是"忘了设置"。如果用 `undefined` 做终点，语义就变成了"未初始化"，暗示引擎还没有处理到这里，这不准确。`null` 在这里扮演的角色是：**主动地说"到此为止"**。

这也解释了 `Object.create(null)` 为什么有用——它是"从一个有意截断的原型链上创建对象"，返回的对象没有任何继承属性：

```js
const dict = Object.create(null);
dict.toString;        // undefined —— 没有继承链
dict.hasOwnProperty;  // undefined

// 用途：安全的键值对，不怕原型污染
const map = Object.create(null);
map.__proto__ = '恶意数据'; // 只是一个普通属性
```

> 你可能见过"Object.create(null) 性能更好"的说法——这是个流传甚广的误解。`Object.create(null)` 真正的价值是**安全**（切断原型链，杜绝原型污染），而不是性能。现代 JS 引擎（如 V8）对普通字面量对象 `{}` 有隐藏类和 inline cache 等深度优化，属性查找反而更快；无原型对象缺少这些优化路径，往往被降级为 dictionary mode，密集读写时性能更差。选它是因为安全，不是因为快。

---

## JSON 和序列化：null 是一等公民，undefined 是隐形人

JSON 标准（[RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259)）明确定义了 `null` 作为表示"无值"的字面量，但完全没有 `undefined` 的概念。这不是 JavaScript 的选择——JSON 起源于 Crockford 对 JavaScript 字面量的子集化，但它本身是一个独立的、跨语言的数据格式，只保留具有明确跨语言语义的数据类型（字符串、数字、布尔、null、数组、对象）。它不是 JavaScript 的"完整序列化协议"，函数、Symbol、`undefined` 这些 JS 专有概念在 JSON 的数据模型中没有位置。`null` 能被保留，恰恰因为它在足够多的语言中都有对应语义——"空值"是跨语言通用概念，而"未初始化"不是。


```js
JSON.stringify(null);              // 'null'
JSON.stringify(undefined);         // undefined（不是字符串）

JSON.stringify({ a: null });       // '{"a":null}'
JSON.stringify({ a: undefined });  // '{}' —— 属性消失

JSON.stringify([1, undefined, 3]); // '[1,null,3]' —— 数组中变 null
```

`undefined` 在序列化中的三种不同行为——顶层返回原始值（连字符串都不是）、对象属性中被忽略、数组中被替换为 `null`——恰恰说明 `undefined` 不是一个值，而是一个**状态**。它是"缺失"本身，无法被序列化成数据。

> 从 JSON 的视角看，`null` 是"可传输的空"，`undefined` 是"不可传输的空"。前者可以跨网络、跨语言传递，后者只能活在 JavaScript 引擎内部。

---

## ?? 和 ?.：JavaScript 终于开始区分"两种空"

在很长一段时间里，JavaScript 的运算符并没有区分 `null`/`undefined` 和其他 falsy 值。`||` 走 ToBoolean，所有 falsy 都被一视同仁地"吃掉"：

```js
0 || 'default'     // 'default'    —— 0 是合法数字，被覆盖
'' || 'default'    // 'default'    —— 空字符串被覆盖
false || 'default' // 'default'    —— false 被覆盖
```

ES2020 引入的两个运算符，从不同角度让语言层面开始区分"空"的种类。

**`??`（空值合并）** 解决的是 `||` 的误伤问题：

```js
0 ?? 'default'     // 0          —— 0 是合法数字，保留
'' ?? 'default'    // ''         —— 空字符串是合法值，保留
false ?? 'default' // false      —— false 是合法值，保留
null ?? 'default'  // 'default'  —— 只有 null 被替换
undefined ?? 'default' // 'default' —— 只有 undefined 被替换
```

`??` 的判断条件不是 ToBoolean，而是内部的 IsNullOrUndefined 检查——它在问的不是"这个值是 truthy 还是 falsy"，而是"**这个值是否是 nullish（null 或 undefined）**"。这是一个根本性的语义升级。

**`?.`（可选链）** 解决的是另一个方向的问题——安全访问可能为 `null`/`undefined` 的深层属性：

```js
const user = null;
user?.address?.city;  // undefined —— 链路中遇到 null/undefined，短路返回
user.address.city;    // TypeError  —— 直接炸了
```

`?.` 和 `??` 是互补的：`?.` 负责**安全穿透**（遇到 nullish 就停），`??` 负责**兜底默认**（遇到 nullish 就替换）。两者配合使用，构成了 nullish 值的完整处理链路。

函数参数默认值 `function greet(name = 'Guest')` 也遵循同样的逻辑——只在实参为 `undefined` 时生效，不会误伤 `0`、`''`、`false`。

这三个特性——`??`、`?.`、参数默认值——共同构成了 JavaScript 对 nullish 值的现代处理范式。它们的出现本身就是一种承认：**`null` 和 `undefined` 确实和其他 falsy 值不同，它们值得被单独对待**。

---

## ECMAScript 如何在规范层区分两种空？

前面几节分别看了 `null` 在算术、`typeof`、`==`、原型链、JSON 中的行为。如果你觉得这些只是"不同 API 各自有不同的怪癖"，那就低估了 ECMAScript 规范的系统性。

JavaScript 并不是通过"文档约定"区分 `null` 和 `undefined`。规范的**抽象操作**（abstract operations）——那些定义语言行为的底层算法——在系统性地区分它们：

| 抽象操作 | `null` | `undefined` |
|---|---|---|
| [ToNumber](https://tc39.es/ecma262/#sec-tonumber) (§7.1.4) | `0` | `NaN` |
| [ToBoolean](https://tc39.es/ecma262/#sec-toboolean) (§7.1.2) | `false` | `false` |
| [ToObject](https://tc39.es/ecma262/#sec-toobject) (§7.1.16) | `TypeError` | `TypeError` |
| [Abstract Equality](https://tc39.es/ecma262/#sec-abstract-equality-comparison) (§7.2.16) | 专属分支：只与 `undefined` 相等 | 专属分支：只与 `null` 相等 |
| JSON Serialization | 保留为 `null` | 丢弃 / 替换 |
| [IsNullOrUndefined](https://tc39.es/ecma262/#sec-isnullorundefined) (§7.2.3) | `true` | `true` |

注意这张表里的分裂和统一：

- **ToNumber 分裂**：一个变成合法数字 `0`，一个变成 `NaN`——这是它们在算术世界里被区别对待的根源
- **ToBoolean 统一**：都是 `false`——`||` 无法区分它们，这正是 `??` 存在的理由
- **ToObject 统一**：都抛 `TypeError`——两者都不能当对象用，没有例外
- **Abstract Equality 分裂+统一**：共享一个专属分支，只互相相等，不与任何其他值转换比较——整个算法里唯一一对享此待遇的值
- **IsNullOrUndefined 统一**：`??` 和 `?.` 内部调用的检查，把两者归为同一类 "nullish"——这是 ES2020 对"两种空"的最终态度：该区别时区别，该合一时合一

`null` 和 `undefined` 的差异，并不是某个 API 的偶然行为，而是贯穿整个 ECMAScript 抽象操作系统的一致性设计。前面看到的每一个"奇怪行为"——`1 + null === 1`、`null == undefined`、`JSON.stringify(undefined)` 消失——都是这张表的一个投影。

> 从这个角度看，整篇文章前面讨论的所有行为，都可以从这张表推导出来。这就是为什么 `null` 不是"另一种空的写法"——它在整个规范的底层算法中就和 `undefined` 走着不同的路径。

---

## 什么时候该用 null，什么时候该用 undefined？

核心原则只有一条：

> **`null` 是程序员说的"没有"，`undefined` 是引擎说的"没有"。**

具体来说：

| 场景 | 用什么 | 为什么 |
|---|---|---|
| API 返回"查无此记录" | `null` | 你查过了，确认没有——有意的空 |
| DOM 查找失败 | `null`（原生 API 就这么设计的） | `getElementById` 返回 null |
| 变量声明了但还没赋值 | `undefined`（`let x;`） | 引擎自动填入 |
| 函数参数没传 | `undefined` | 引擎自动填入 |
| 对象属性不存在 | `undefined` | 引擎自动返回 |
| JSON 中表示空字段 | `null` | JSON 规范只认 null |
| TypeScript 中可能为空的返回值 | `string \| null` | `strictNullChecks` 下语义最精确 |

这条原则贯穿一切：当你**主动检查后确认没有值**时，用 `null`；当系统**自动表示某种缺失**时，是 `undefined`。

---

## TypeScript：现代 JavaScript 对 null 语义的重新确认

你可能会想：前面讲的这些会不会只是事后脑补？`null` 真的有"有意为空"的语义，还是只是我强行赋予的叙事？

TypeScript 是最好的试金石——因为整个现代 JavaScript 类型生态，实际上都在默认接受 `null`/`undefined` 的语义分工。

```ts
type User = {
  name: string | null;   // 名字存在，但可能明确为空
  email?: string;         // 这个字段可能根本不存在
}
```

在 TypeScript 里：

- `string | null` 表达的是："这里本应是 `string`，但允许**明确为空**。"
- `name?: string` 表达的是："这个字段**可能根本不存在**。"

这恰好对应了 JavaScript 运行时的语义分工：

| | TypeScript 类型 | JavaScript 运行时 |
|---|---|---|
| 明确为空 | `T \| null` | `null` |
| 可能缺席 | `T \| undefined`（`?`） | `undefined` |

TypeScript 做的事情，本质上是把 JavaScript 运行时里隐含的语义分工，提升成了类型系统里的**显式契约**。而 `strictNullChecks` 就是这个契约的开关——打开它，编译器会强制你区分"明确为空"和"可能缺席"，不再让两种缺失混为一谈。

这不是 TypeScript 团队的发明——是 Zod、Prisma、GraphQL Code Generator、React Hooks 的类型定义……整个现代生态**重新确认**了同一个结论：

> `null` = 这里有值，但它是空的。
> `undefined` = 这里可能没有值。

---

## JavaScript 的 null，本质到底是什么？

JavaScript 最大的争议之一，是它同时拥有 `null` 和 `undefined` 两种"空"。大多数教程把它们的差异归结为"历史包袱"——仿佛是 Brendan Eich 在十天内赶工的语言设计事故，后人只好将错就错。

但如果把 ECMAScript 三十年的演化放在一起看，会发现它们从来不是重复设计。

`undefined` 描述的是运行时状态——"这里还没有值。"变量声明了没赋值、函数参数没传、对象属性不存在——引擎在告诉你：**我不知道这里应该有什么。**

`null` 描述的是程序员意图——"这里本应有值，但现在明确为空。"查询返回空结果、DOM 节点不存在、API 响应中的空字段——你在告诉引擎：**我知道这里应该有值，检查过了，确认它是空的。**

一个来自引擎，一个来自人。

于是整篇文章里那些看似混乱的行为——

`typeof null === 'object'` 的历史 Bug、`null == undefined` 的专属特判、JSON 保留 `null` 而丢弃 `undefined`、`??` 和 `?.` 的诞生、TypeScript 的 `strictNullChecks`——

开始第一次呈现出统一逻辑：

JavaScript 真正想表达的，从来不是"两种空值"。

而是：

> **"未知的缺失"与"确认的缺失"。**

前者是系统的、被动的、不可传输的——它属于运行时，活在引擎内部。

后者是人为的、主动的、可跨语言传递的——它属于应用逻辑，活在数据层、API 边界、类型契约里。

这两种"缺失"的区分，不是语言层面的冗余，而是整个 Web 平台从 1995 年至今三十年演化的底层共识。DOM 用 `null` 表示"查无此节点"，JSON 用 `null` 表示"空字段"，GraphQL 用 `null` 表示"nullable 字段无值"，TypeScript 用 `null` 表示"有意为空的类型分支"——这些不是巧合，是同一种语义在不同层级的投射。

`undefined` 从未被赋予这个角色，因为它从一开始就是引擎的内部状态——它不属于数据，不属于协议，不属于程序员。

这就是 JavaScript 的两种"空"最深的真相：它们不是语言设计的败笔，而是一种被低估的类型区分——在动态类型系统中，手动区分了**"我不知道"和"我知道没有"**。

---

## 为什么 JavaScript 不直接废弃 null？

读到这里，一个自然的问题浮现：如果 `null` 和 `undefined` 如此相似，为什么不直接废弃其中一个？

因为已经不可能了。`null` 的语义早已溢出语言本身，嵌入了整个 Web 平台：

- **DOM**：`document.getElementById('不存在')` 返回 `null`，不是 `undefined`——这是 1995 年的设计，改了就炸掉所有 DOM 操作代码
- **JSON**：RFC 8259 只认 `null`，不认 `undefined`——这是跨语言数据交换的协议层约定
- **Web API**：Fetch、IndexedDB、Intersection Observer……返回"无值"时用的都是 `null`
- **GraphQL**：schema 中的 nullable 字段在响应中就是 `null`——这是整个查询语言的类型系统基础
- **TypeScript**：`strictNullChecks` 区分 `string | null` 和 `string | undefined`，两者在类型层面有不同语义
- **React**：`useState(null)` 表示"有意设为空"，组件返回 `null` 表示"不渲染"——框架层面对两种空有不同约定
- **数据库驱动**：PostgreSQL/MySQL 查询结果中的空字段映射为 `null`，ORM 层再传递下去

2015 年有人提议让 `typeof null === 'null'`，被拒绝了。原因不是"这不优雅"，而是**数百万行代码依赖当前行为**。废弃 `null` 的破坏面比这大几个数量级——它不是语言层面的清理，而是整个 Web 平台的协议层迁移。

现代 JavaScript 已经不只是一个语言了，它是 Web 平台的编程接口。`null` 在这个接口中扮演的角色，早已从"语言的一个值"变成了"平台协议的一部分"。废弃它，等于废弃整个 Web 数据层的空值约定。

这也是为什么 TypeScript 选择的路线不是"消灭 null"，而是**约束 null**——用类型系统让你显式处理它。`strictNullChecks` 的潜台词是：null 不会消失，但你可以让它的每一次出现都在掌控之中。
