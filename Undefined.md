---
title: '为什么 JavaScript 会有 undefined'
created: 2022-12-11
updated: 2026-05-28
tags:
  - JavaScript
  - undefined
description: '为什么 JavaScript 会把 binding 缺失、引用失败、completion 缺失等完全不同场景全部收敛到同一个值？本文从 Binding System、Reference System、Completion System 三个底层系统拆解 undefined 的本质——它不是空值，而是 ECMAScript 对"缺席结果"的统一编码。涵盖：undefined 非保留字的设计逻辑、void 的历史、binding 生命周期（var 提升 / TDZ / 函数参数）、引用失败的处理（property miss / typeof / 数组空洞）、Completion Record 的 universal fallback。'
status: evergreen
---

JavaScript 的类型系统里有两个"空"——`null` 和 `undefined`。[[JavaScript/Null|上一篇]]我们聊了 `null`，它的核心身份是"程序员的有意声明"。

那 `undefined` 呢？大多数教程给它的定义是"变量已声明但未赋值"。这个定义没错，但太浅了——它只描述了 `undefined` 出现的场景之一。

来看一组代码：

```js
var x;
x;                // undefined —— 声明了但没赋值

({}).foo;         // undefined —— 属性不存在

function f() {}
f();              // undefined —— 函数没有 return

typeof notExist;  // 'undefined' —— 变量根本没声明
```

这四个场景涉及的语言机制完全不同——binding 初始化、属性查找、函数调用、Reference Record——但引擎的回退结果一样：`undefined`。

**为什么 JavaScript 会把如此不同的失败场景，全部收敛到同一个值？**

这才是全文真正要回答的问题。

答案是：**`undefined` 不是"空值"，而是 ECMAScript 对"缺席结果"的统一表示。**

为了把这个论点讲透，我们需要拆开语言的三个底层系统——Binding System、Reference System、Completion System——看 `undefined` 在每个系统中扮演的角色。最后你会发现，这三个系统共享同一个回退出口。

但在进入这三个系统之前，先回答一个最反直觉的问题：`undefined` 为什么不是保留字？

---

## undefined 为什么不是保留字

要理解 `undefined` 的本质，最反直觉的起点是：**它不是保留字。**

### 字面量 vs 标识符

字面量（literal）是源代码中表示某个**固定值**的符号。`100` 是字面量，`"hello"` 是字面量，`true` 和 `false` 也是字面量。`null` 是字面量，也是保留字——你在代码里写 `null`，引擎百分之百知道你在说什么。在 AST 层面，`null` 是一个 `Literal` 节点，和 `100`、`"hello"` 是同一类东西。

但 `undefined` 不是。它是一个 `Identifier` 节点——和变量名 `foo` 是同一类东西：

![AST](https://raw.githubusercontent.com/chuenwei0129/my-picgo-repo/master/js/SCR-20220509-g29.png)

这意味着 `undefined` 在语法层面不是"一个固定值的符号"，而是一个**全局变量的引用**——JavaScript 引擎内置了这个全局变量，它的值恰好是 `undefined`。`NaN` 和 `Infinity` 也同理。

### 历史根源：从 Java 抄来的保留字列表

Brendan Eich 亲自解释过这件事：最初 JavaScript（当时还叫 LiveScript）根本没有 `undefined` 这个**变量名**——只有 `undefined` 这个**值**，用 `void` 运算符获取（对表达式求值、丢弃结果、返回 undefined——下文会详细讲）。

JS 1.0 的"未来保留字"列表是从 Java 抄来的，里面有 `enum`（至今没用上）、`goto`（永远不会用），但没有 `undefined`——因为 Java 里没有这个概念。等到 ES3 时代想加，已经来不及了——程序员已经在用 `var undefined = void 0` 这样的代码，改成保留字会直接破坏线上页面。

最终方案是：把 `undefined`、`NaN`、`Infinity` 做成全局对象的只读属性。ES5 进一步把它们设为 `writable: false, configurable: false`——不可写、不可删，行为上已经很接近保留字了。实际上类似的"伪关键字"还不止这三个——`eval`、`await`、`let`、`yield`、`static` 在一定条件下也都能做变量名，都是历史兼容性导致的。

### 遮蔽：生产中的静默 Bug

这不只是理论问题。`undefined` 在全局作用域里你改不动它——ES5 已经锁死了：

```js
var undefined = 1;
console.log(undefined); // undefined —— 全局的没被覆盖
```

但**局部作用域可以遮蔽它**——用 `const` 或 `let` 声明一个名为 `undefined` 的局部变量（当然你永远不该这么做，这里只是演示机制），这个作用域里所有的 `undefined` 就不再是引擎的那个值了：

```js
{
  const undefined = 123;         // ⚠️ 永远不要这样写
  console.log(undefined);        // 123
  console.log(typeof undefined); // "number"
}
```

任何依赖 `undefined` 做判断的代码——`=== undefined`、`typeof x === 'undefined'`——全都会出问题。而且这种 bug 是静默的，没有报错，只是行为悄悄变了。

### 但这恰恰印证了 undefined 的本质

`undefined` 不是保留字这件事，表面上是历史包袱，但它指向一个更深的逻辑：**`undefined` 在规范层面当然是一个 primitive value（属于 Undefined Type）；但在语言设计层面，它承担的是"运行时缺席状态"的统一表示。**

`null` 是程序员主动写的——"我声明这里为空"，所以它需要字面量。但 `undefined` 描述的是引擎自动产生的运行时状态——"取值失败后的回退"。ECMAScript 的设计重心并不在让开发者主动制造 `undefined`——它更偏向"语言默认产生"，而非"程序员主动表达"。既然如此，给它配一个字面量也就不是语言的设计优先级了。

JavaScript 的选择是：让 `undefined` 成为一个全局属性，而不是字面量。这个决定带来了副作用——`undefined` 可以被遮蔽——但它在概念上是自洽的。

### void：undefined 的影子保留字

`void` 运算符对任何表达式求值，然后丢弃结果，返回 `undefined`：

```js
void 0;        // undefined
void 1;        // undefined
void 'hello';  // undefined
void (1 + 2);  // undefined
```

大多数教程把 `void 0` 说成"获取 undefined 的可靠方式"。这话没错，但没有解释一个关键问题：**`void` 运算符到底是为谁而存在的？**

答案是 `javascript:` 协议的链接。

在早期的 Web 中，还没有 `onclick` 事件。想要网页产生变化，要么打开一个 HTTP 新页面，要么用 `javascript:` 协议的链接，靠表达式返回的新 HTML 修改当前页面：

```html
<a href="javascript:someExpression">点击我</a>
```

问题来了：如果 `someExpression` 的求值结果不是 `undefined`，浏览器会用这个值**覆盖整个页面的 `innerHTML`**。你写了一个计算逻辑，结果把整个页面清空了。

`void` 运算符就是为了解决这个问题——它让你可以执行任意表达式，但确保返回值是 `undefined`，不会覆盖页面内容：

```html
<a href="javascript:void doSomething()">安全的链接按钮</a>
```

后来有了事件监听（`onclick`），`javascript:` 协议链接逐渐退出主流，但 `void` 留了下来。它的语义从"防止覆盖页面"泛化为更通用的含义：**"执行这个表达式，但刻意丢弃结果，返回 undefined"**。

```js
// IIFE 中避免返回值干扰外部表达式
void function() {
  console.log('我执行了，但不影响外层表达式的值');
}();

// 箭头函数的隐式返回被 void 吃掉
const handler = () => void doSomething(); // 永远返回 undefined
```

而因为 `undefined` 不是保留字——它是一个可以被遮蔽的全局属性——`void` 恰好承担了另一个角色：**在 `undefined` 被遮蔽时，它是获取真正 undefined 值的唯一可靠方式**。

```js
{
  const undefined = 123;
  console.log(undefined === 123);    // true —— 被遮蔽了
  console.log(void 0 === undefined); // false —— void 0 返回引擎内部的 undefined 值，而标识符 `undefined` 现在指向 123
}
```

> `void` 最初为 `javascript:` 协议链接而生，后来成了 `undefined` 的"影子保留字"——它让 `undefined` 虽然不是保留字，却有了一个可靠的、不会被遮蔽的表达方式。这也是为什么压缩工具会把 `undefined` 替换成 `void 0`——三个字符 vs 九个字符，而且绝对可靠。

以上解释了 `undefined` 为什么不是保留字——它的设计重心不在"主动表达"，而在"引擎自动产生"。

那引擎到底在哪些系统中自动产生 `undefined`？我们需要从三个层面拆开来看。第一个：Binding System。

---

## Binding System：undefined 是 binding 生命周期的默认值

理解 `undefined` 最好的切入点不是类型表，而是 **binding 的生命周期**。

ECMAScript 中每个变量声明都会在作用域中创建一个 binding——一个"名字到值的映射"。关键在于：**binding 的创建和初始化之间，存在一个时间窗口。** 不同的声明方式对这个窗口的处理不同，但它们最终都指向 `undefined`。

### var：创建即初始化为 undefined

```js
console.log(x); // undefined  ← 这里发生了什么？
var x = 1;
console.log(x); // 1
```

大多数教程说"声明提升了，值没有"。但这句话没有解释一个关键问题：**提升之后、赋值之前，那个绑定（binding）里到底装的是什么？**

答案是 `undefined`。

JavaScript 引擎在执行代码之前会先做一遍"编译"（准确说是解析+编译）。遇到 `var x`，引擎做了两件事：

1. **在当前作用域中创建一个绑定（binding）**——给 `x` 分配一个名字
2. **把这个绑定初始化为 `undefined`**

然后才开始逐行执行。执行到 `console.log(x)` 时，binding 已经存在，里面的值是 `undefined`。执行到 `var x = 1` 时，才把 `1` 赋进去。

> **`undefined` 是引擎在 binding 创建和赋值之间的默认值。** 它标记的是"binding 已存在，但程序员还没给值"这个中间状态。

这也是为什么 `undefined` 不需要字面量——这个中间状态主要是引擎自动产生的，语言的设计重心并不在主动表达它。你当然可以写 `return undefined` 来显式返回，但大多数情况下，`undefined` 是引擎给你的，不是你找引擎要的。

### 函数参数：同样的 binding 机制

函数参数也是 binding：

```js
function greet(name) {
  console.log(name); // 传了就是实参，没传就是 undefined
}

greet('Alice'); // 'Alice'
greet();        // undefined
```

当你调用 `greet()` 时，引擎创建了参数 binding `name`，但调用者没有提供值。这个 binding 被初始化为 `undefined`——和 `var` 提升一模一样。

> 不管是 `var` 提升还是缺省参数，`undefined` 出现的时机都是同一个：**binding 被创建了，但还没有被填入程序员提供的值。**

### let/const：binding 存在 ≠ binding 可读

如果 `var` 提升是 `undefined` 的主场——"binding 一创建就初始化为 undefined"——那 ES6 引入的 `let`/`const` 就是对这个机制的一次拆分。

```js
// var：先给 undefined，再赋值
console.log(a); // undefined
var a = 1;

// let：直接拒绝你
console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 1;
```

`let` 和 `const` 同样有提升——引擎在编译阶段就知道 `b` 存在。但 `let`/`const` **并不是否定 `undefined` 本身**。它们真正否定的是：

> "binding 一创建就立刻可读"

ES6 把 binding 的生命周期拆成了两个阶段：

```text
binding exists（编译阶段，名字进入作用域）
      ↓
binding initialized（执行阶段，声明语句运行时）
```

从作用域开始到声明语句之间的这段"窗口期"，就是 **Temporal Dead Zone（暂时性死区）**。在这段时间里，binding 存在但未初始化——引擎调用 `GetBindingValue` 时会直接 throw，而不是返回 `undefined`。

这和 `var` 的区别是 spec 层面的：

| | `var` | `let`/`const` |
|---|---|---|
| 编译阶段 | 创建 binding，初始化为 `undefined` | 创建 binding，标记为 uninitialized |
| 执行到声明语句 | 赋值（覆盖之前的 `undefined`） | 初始化（标记为 initialized） |
| 声明前读取 | 返回 `undefined` | `GetBindingValue` 抛 ReferenceError |

注意，`let` 最终还是会走到 `undefined`：

```js
let x;
console.log(x); // undefined —— 声明语句执行后，未显式赋值的 let 也是 undefined
```

所以 TDZ 的重点不是"undefined 不好用"，而是**禁止访问 uninitialized binding**。`undefined` 本身没问题，问题是你不能在 binding 还没初始化的时候就去读它。

> **`var` 说："binding 创建即初始化为 undefined。"**
> **`let` 说："binding 存在和 binding 可读是两件事。"**

两种设计，背后都是对 binding 生命周期的不同切分。

### 小结：Binding System 中的 undefined

在 Binding System 中，`undefined` 出现在两种情形：

| 情形 | 机制 | 结果 |
|---|---|---|
| binding 已创建但未赋值 | `var` 提升、函数缺省参数、`let` 声明后未赋值 | → `undefined` |
| binding 不存在 | 未声明的变量（`typeof` 之外的访问） | → ReferenceError |

第二种情形——"binding 不存在"——属于下一个系统：Reference System。

---

## Reference System：ECMAScript 如何处理"引用失败"

当你写 `obj.foo` 或 `x`（一个变量名）时，引擎需要做一次"引用解析"——找到这个名字对应的实际值。如果找不到，会发生什么？

### 属性查找失败：property miss

```js
const obj = {};
obj.foo; // undefined
```

`obj.foo` 触发的是 `[[Get]]` 操作。引擎在 `obj` 上找不到 `foo` 属性——不是"找到了但值是 undefined"，而是**属性根本不存在**（`[[HasProperty]]` 返回 `false`）。但 `[[Get]]` 不会抛错，而是安静地返回 `undefined`。

这是 ECMAScript 最早的"引用失败 → undefined"约定。

### 可选链：让 property miss 不会级联爆炸

属性不存在时返回 `undefined`，本身没问题。但当你链式访问时，问题就来了：

```js
const obj = {};
obj.foo.bar; // TypeError: Cannot read property 'bar' of undefined
```

`obj.foo` 返回 `undefined`，然后尝试访问 `undefined.bar`——炸了。可选链 `?.` 就是为了解决这个问题——它在每一层遇到 `undefined`（或 `null`）时提前短路，不再继续往下取值：

```js
obj.foo?.bar; // undefined —— foo 不存在，短路，直接返回 undefined
```

可选链的本质是：**承认 property miss 会产生 undefined，并且让这个 undefined 可以安全地传播而不抛错。**

### 解构赋值：只有 undefined 能触发默认值

解构中的默认值和函数参数默认值共享同一个规则：**只有 `undefined` 能触发 `=` 后面的默认值**。

```js
const { a = 1 } = {};           // a = 1 —— 属性不存在，值为 undefined
const { a = 1 } = { a: null };  // a = null —— null 不触发
const { a = 1 } = { a: 0 };     // a = 0 —— 0 不触发
```

这再次印证了 `undefined` 的特殊身份：它是唯一一个被语言识别为"缺席"的值——`null` 是"有意为空"，`0` 和 `""` 是合法值，只有 `undefined` 触发回退。

解构有一个更微妙的点——你可以"穿透" `undefined`：

```js
const { a: { b } } = { a: undefined };
// a 是 undefined，然后尝试解构 undefined.b
// TypeError: Cannot destructure property 'b' of undefined
```

这和 `?.` 可选链处理的是同一个问题——解构没有"可选解构"语法，所以你必须确保路径上的每个值都不是 `undefined` 或 `null`（详见 [[JavaScript/Null|null 的本质]]）。

### typeof：唯一不需要 resolve Reference 的运算符

```js
typeof notDeclared; // 'undefined' —— 不会报错！
notDeclared;        // ReferenceError —— 直接炸了
```

`typeof` 对未声明变量返回 `'undefined'` 而不是抛错——**在所有 JavaScript 运算符中，这是独一无二的行为**。没有任何其他运算符有这个特权。

为什么？spec 层面的原因很精确：大多数运算符在操作一个变量时，会先 ResolveBinding——尝试找到这个 binding 对应的值。如果 binding 不存在，直接抛 ReferenceError。但 `typeof` 是唯一一个**允许 Reference Record 不 resolve 就直接返回**的运算符。它不试图取值，只问"这个东西的类型标签是什么"——binding 不存在？那类型就是 `'undefined'`。

这个设计不是为了 `undefined` 的哲学，而是**web 兼容性的刚需**。历史上大量代码用 `typeof x !== 'undefined'` 做 feature detection：

```js
if (typeof IntersectionObserver !== 'undefined') {
  // 浏览器支持这个 API
}
```

如果 `typeof` 对未声明变量也会抛 ReferenceError，这种检测模式就不可能存在。`typeof` 的"安全网"特权，本质上是 web 平台演化中沉淀下来的兼容性约定。

> 💡 **历史彩蛋**：`typeof document.all` 返回 `'undefined'`，尽管它是一个对象。这是 HTML 规范故意为之，让老代码的 `if (document.all)` 检测失效——它是整个语言中唯一一个 `typeof` 的规范级例外。这个案例说明 `typeof x === 'undefined'` 的语义比"类型标签"更广——它在问"这个东西对你的代码是否可见"。

### Reference System 的深层逻辑

`typeof` 的特殊性揭示了一个更深的事实：

```js
typeof notDeclared; // 'undefined'
```

这里的 `notDeclared` **连 binding 都不存在**——它不是"声明了但没赋值"，而是根本不在任何作用域里。但语言依然把它映射到了 `'undefined'`。

这说明一件事：**`undefined` 的语义边界，大于 Undefined Type 本身。**

Undefined Type 只有一个成员——primitive value `undefined`。但在 ECMAScript 的实际运行中，`undefined` 承担的语义覆盖面远超这个值。在 Reference System 中：

- **属性不存在**（`obj.missing`）：`[[Get]]` 找不到属性 → `undefined`
- **未声明变量**（`typeof x`）：binding 不存在 → `'undefined'`
- **数组空洞**（`[1, , 3][1]`）：连 property slot 都没有（`[[HasProperty]]` = `false`）→ `undefined`

数组空洞值得单独说一句。[[JavaScript/Array|聊数组]]时我们说过，空洞（hole）和 `undefined` 不是一回事。[[JavaScript/Array|Array 笔记]]里有个类比：`undefined` 是"柜子存在，但里面空的"；hole 是"柜子压根没装"。

但这两个柜子，打开门看到的都是空的——访问结果都是 `undefined`：

```js
const filled = [1, undefined, 3]; // ⚠️ 演示用——实际应该用 null
const holey = [1, , 3];           // 索引 1 是空洞

console.log(filled[1]); // undefined
console.log(holey[1]);  // undefined —— 看起来一样
```

区别藏在背后。用 `in` 操作符一测：

```js
1 in filled; // true  —— 属性存在，值是 undefined
1 in holey;  // false —— 属性根本不存在
```

`forEach` 也证实了——空洞会被跳过：

```js
filled.forEach(v => console.log(v)); // 1, undefined, 3
holey.forEach(v => console.log(v));  // 1, 3
```

但有趣的是，现代 API 不再区分两者——`for...of`、展开运算符、`Array.from`、`includes` 统一把空洞当作 `undefined`：

```js
[...holey];                         // [1, undefined, 3]
for (const x of holey) console.log(x); // 1, undefined, 3
holey.includes(undefined);          // true
```

这恰恰印证了本文的论点：空洞的访问结果**就是** `undefined`——因为"取值失败后回退到 undefined"是引擎的统一语义。老 API 在 `in` 的层面处理"属性不存在"，现代 API 直接使用引擎的回退结果。两条路线，同一个机制。

**在 Reference System 中，`undefined` 是所有"引用失败"的统一回退——不管失败发生在属性层、变量层还是数组层。**

Binding System 处理"值还没给"，Reference System 处理"引用找不到"。但还有第三种缺席——语句执行完了，却没产出任何结果。这就是最后一个系统：Completion System。

---

## Completion System：undefined 是 ECMAScript 的 universal fallback completion

这是全文最重要的部分。

### Completion Record：每条语句的隐藏产出

ECMAScript 里**每一条语句**执行后都会产生一个 Completion Record，包含三个字段：

| 字段 | 含义 |
|---|---|
| `[[Type]]` | 完成类型：`normal`、`return`、`throw`、`break`、`continue` |
| `[[Value]]` | 完成值——这条语句产生的结果 |
| `[[Target]]` | break/continue 的跳转标签 |

大多数时候你看不到 Completion Record，引擎只把函数体的最终 `[[Value]]` 作为返回值暴露出来。但 `eval` 可以直接暴露语句的完成值，让你"看见"这个隐藏机制：

```js
eval("1 + 2")                // 3  —— 表达式的完成值就是它的值
eval("if (true) 1;")         // 1  —— if 语句的完成值是被选中分支的值
eval("if (false) 1;")        // undefined —— 没有执行分支，完成值 undefined
eval("{ 1; 2; 3; }")         // 3  —— 块语句的完成值是最后一条语句的值
eval("var x = 1;")           // undefined —— VariableStatement 的完成值是 undefined
```

### 为什么语句必须有完成值？

但这里有一个更深的问题：**为什么 JavaScript 的语句必须有完成值？**

因为 JavaScript 不是纯表达式语言。在 Haskell 或 Erlang 中，`if` 是表达式——`if x then 1 else 2` 一定会产出一个值。但在 JavaScript 中，`if`、`while`、`for`、`block` 都是 **statement**——它们的首要目的是控制流，而非产生值。然而 ECMAScript 又规定每条语句都必须产出 Completion Record，包括 `[[Value]]` 字段。

这就产生了一个结构性矛盾：

> 语句的本职工作不是产生值，但规范要求它必须有完成值。

一旦语言允许"语句执行完成但没有值"，它就必须存在一个默认完成值来填充这个空缺。`undefined` 承担的正是这个角色——**ECMAScript 的 universal fallback completion**。

这也解释了为什么 `if (false) 1;` 的完成值是 `undefined`（没有分支被执行）、`var x = 1;` 的完成值是 `undefined`（声明语句不产出值）、`{ 1; 2; 3; }` 返回 `3`（块的完成值是最后一条语句的值）——每条规则背后都是 Completion Record 的填充逻辑在运作。

### return; vs 没有 return

这就解释了一个常见困惑——**`return;` 和"没有 return 语句"是同一回事吗？**

运行结果一样，都返回 `undefined`。但规范层面，两者的 Completion Record 不同：

- `return;` → `{ [[Type]]: "return", [[Value]]: undefined }`——函数主动说"我要退出"
- 函数走到末尾 → `{ [[Type]]: "normal", [[Value]]: undefined }`——自然结束，没有产出值

`[[Type]]` 不同，但 `[[Value]]` 相同——都是 `undefined`。所以：

```js
function noop() {}
```

本质上不是"函数返回了 undefined"，而是——

> "整个函数执行过程没有产生有意义的 completion value，于是规范回退到默认完成值 undefined。"

同理：

```js
const a = console.log('hello'); // a 是 undefined
```

`console.log()` 执行了操作（打印），但刻意不产出结果。`undefined` 在这里是"操作完成但无产出"的信号。

### void：人为制造一个"无完成值"

`void` 运算符的语义放在 Completion System 中看就非常清晰了：它对表达式求值，**丢弃其完成值**，强制返回 `undefined`。

```js
void 0;          // undefined
void (1 + 2);    // undefined
void doSomething(); // undefined —— 执行了，但完成值被丢弃
```

`void` 本质上是一个 completion filter——你给它任何表达式，它都把完成值替换成 `undefined`。这和 `javascript:` 协议的需求完全一致：执行逻辑，但确保不产生会影响页面的返回值。

---

## 终章：三个系统，一个出口

现在我们可以回答开篇的问题了。

ECMAScript 在三个不同的系统中都需要处理"缺席"：

| 系统 | 缺席情形 | 回退 |
|---|---|---|
| **Binding System** | binding 已创建但未赋值（`var` 提升、函数缺省参数、`let` 未赋值） | → `undefined` |
| **Reference System** | 属性不存在（`obj.missing`）、binding 不存在（`typeof x`）、property slot 缺失（数组空洞） | → `undefined` |
| **Completion System** | 语句没有产出完成值（`if (false)`、`var` 声明、函数无 return） | → `undefined` |

三种完全不同的语言机制——binding 初始化、引用解析、语句执行——全部收敛到同一个终点。

这不是巧合，而是设计。

`undefined` 之所以不是保留字，是因为它不是程序员主动使用的值——它是引擎在各个系统中自动产生的回退信号。

`undefined` 的语义边界之所以大于 Undefined Type 本身，是因为它覆盖的不只是"一个值为空"，而是所有"本该有结果但没拿到"的运行时缺席。

JavaScript 用同一个 primitive value——`undefined`——把这些缺席统一了。

> **`undefined` 不是某一种缺席，它是缺席本身在语言层面的统一编码。**

---

## 什么时候该用 undefined，什么时候该用 null？

核心原则在 [[JavaScript/Null|null 的本质]] 中已经说过了：

> **`null` 是程序员说的"没有"，`undefined` 是引擎说的"没有"。**

Brendan Eich 自己也建议：**不要把 `undefined` 作为自定义的变量名**——把它当作保留字来对待就行了。

`undefined` 的领地——全是引擎自动产生的：

| 场景 | 理由 |
|---|---|
| 变量声明了但还没赋值 | 引擎自动填入——binding 存在但你还没决定放什么 |
| 函数参数没传 | 引擎自动填入——调用者没有提供这个值 |
| 对象属性不存在 | 引擎自动返回——lookup 失败 |
| 函数没有返回值 | 引擎自动返回——操作完成了但没有产出 |
| 数组空洞 | 引擎自动返回——这个位置没有值 |
| 解构赋值的缺失值 | 引擎自动填入——解构目标没有对应的源 |

共同特征：**所有这些场景中，`undefined` 都不是你写的，是引擎给的。**

那什么时候该主动用 `null`？当你**检查过了、确认没有值**的时候——API 返回空结果、DOM 查找失败、JSON 中表示空字段。详见 [[JavaScript/Null|null 的本质#什么时候该用 null，什么时候该用 undefined？]]。

所以实际操作很简单：

```js
// ❌ 声明时不需要写——引擎会自动填 undefined
let foo = undefined;

// ✅ 让引擎来填
let foo;

// ✅ 需要表达"有意为空"时，用 null
let user = null;
```

---

## undefined vs null：完整对比

两者的行为差异贯穿了整个类型系统：

| 维度 | `undefined` | `null` |
|---|---|---|
| **本质** | 取值失败的缺席结果 | 程序员的空声明 |
| **是否保留字** | 否（全局属性，历史兼容） | 是（字面量） |
| **AST 节点** | `Identifier`（和变量名同类） | `Literal`（和 `100`、`"hello"` 同类） |
| **var 提升** | binding 初始化为 undefined | 不适用 |
| **TDZ** | binding 未初始化时抛错 | 不适用 |
| **typeof** | `'undefined'`（Reference Record 不 resolve） | `'object'`（历史 Bug） |
| **void** | 为它量身定制 | 无关 |
| **函数无返回** | Completion Record 默认值 | 不适用 |
| **解构默认值** | 触发默认值 | 不触发 |
| **算术运算** | NaN（不可计算） | 转 0（可计算） |
| **== 特判** | 与 null 互认 | 与 undefined 互认 |
| **JSON** | 丢弃 / 替换为 null | 可传输 |
| **?? / ?.** | nullish，被 ?? 吃掉 | nullish，被 ?? 吃掉 |

所以 `undefined` 从来不是一个普通值。它是 ECMAScript 整个运行时系统的默认回退语义——当语言无法产生有效结果时，它统一落回这里。
