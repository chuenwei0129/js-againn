---
title: 为什么 JavaScript 会有 undefined
created: 2022-12-11
updated: 2026-05-28
tags:
  - JavaScript
  - undefined
description: 从规范视角解析 undefined——ECMAScript 用它统一编码运行时缺席，覆盖 Binding、Reference、Completion 三套系统。
status: evergreen
---

事情是这样的。

我这两年一直在干一件事，复习 JavaScript。

不是那种翻翻书假装自己复习过了，是真的把核心知识点一个一个捡起来重新啃。我甚至专门建了个仓库叫 js-againn，名字里的 n 就是复习次数的变量，n 等于 1、2、3，一直递增下去。

为啥要这么干呢，因为我发现一个事，写 JS 写了这么多年，真到讲不清楚的地方，全是那些最基础的东西。

比如 undefined。

坦率的讲，我以前一直觉得自己是懂 undefined 的。不就是变量声明了没赋值嘛，这有啥难的。每次面试别人也这么问，每次被面试也这么答，答了这么多年，从来没翻过车。

直到这次我又把 undefined 捡起来重新啃，啃到一半我愣住了。。。

我发现我一直答的那个答案，它只覆盖了 undefined 的一小部分。

就像你跟人说我懂北京，结果人家一问，你只去过天安门。

---

真的，你先看四段代码。

```js
var x;
x;
// undefined

({}).foo;
// undefined

function f(){}
f();
// undefined

typeof a;   // a 从未声明
// undefined
```

你盯着看一会儿。

这四段代码的语法特征毫无共同之处。`var x;` 是变量声明，`obj.foo` 是属性访问，`f()` 是函数调用，`typeof a` 是类型运算。

四套完全不同的语言机制。

结果全部收敛成同一个值，undefined。

为啥。

为啥四个八竿子打不着的机制，最后吐出来的都是 undefined。这件事我以前从来没认真想过，每次遇到 undefined 就条件反射地套「声明了没赋值」那套，从来没意识到这套答案根本解释不了剩下三种情况。

我寻思了一下，没寻思明白。

然后就去翻 ECMAScript 规范。

翻完我才意识到，我这些年一直答错了一个更根本的问题。

undefined 这玩意，根本不是某种具体的空值。

> 它是 ECMAScript 对运行时「缺席」，absence，的统一编码。

这句话我先撂这儿，你先记着。后面我一层一层给你剥开，你就知道这个抽象有多漂亮。

回到开头那四段代码。

它们其实分别对应了 ECMAScript 里三种完全不同的缺席。**值还没来，值找不到，值没产生。** 这三种缺席来自三套彼此独立的系统，本来完全可以各自有一个专属的值。

那为啥最后都变成了 undefined 呢。

这是整件事最关键的一步，也是我这次复习最爽的一个发现。

你想想看，ECMAScript 完全可以为不同的缺席设计不同的结果。比如值还没到，就给个 Uninitialized。属性不存在，给个 MissingProperty。执行没产生结果，给个 NoCompletion。

听着是不是更精确，更优雅，更像一个设计良好的语言该有的样子。

但你顺着往下想一步，代价立刻就出来了。

程序员写判断的时候，必须为每一种缺席单独处理。判断值还没到，写 `if (x === Uninitialized)`。判断属性缺失，写 `if (x === MissingProperty)`。判断没有返回值，写 `if (x === NoCompletion)`。

每一个语言机制，默认参数、可选链 `?.`、空值合并 `??`、解构默认值、JSON 序列化，都得为「这几种缺席分别怎么回退」各写一套规则。

状态空间爆炸，语言复杂度爆炸。

你写一行代码要在脑子里过一遍这是哪种缺席，该走哪条回退路径，特么的累不累。

ECMAScript 选了完全相反的方向。

absence，直接映射到 primitive undefined。

> 一种缺席，一个值，一条判断路径。

代价当然有，你没法从 undefined 本身看出它到底来自哪个系统。但这恰恰就是设计意图。绝大多数时候你根本不需要分辨，你只需要知道，这里本应有结果，但缺席了。

理解了这个选择，再看 ECMAScript 的三套缺席系统，就不再是一堆零散的规则了。

它们是同一个设计哲学的三次落地。

---

我一层一层给你讲。

## 第一套：Binding System，值还没来

每个变量声明，其实都在创建一个 binding，一个名字到槽位的映射。引擎真正操作的不是变量名，是这个 binding。

`var x = 1;` 在规范里经历两个阶段。第一步创建 binding，`x` 指向一个空槽位。第二步把值放进去，`x` 指向 1。

问题来了。binding 已经创建了，但程序员还没给值，这个槽位里该放什么。

ECMAScript 的答案是 undefined。

```js
console.log(x);   // undefined
var x = 1;
```

这件事我以前一直归因到「声明提升」，觉得是 hoisting 的副作用。翻完规范才知道，hoisting 只是表象，底下更根本的事实是，binding 已存在，值尚未到达，规范用 undefined 填充这个窗口期。

binding 已创建，用 undefined 初始化，赋值发生，binding 存入真实值。这条链条走的就是 undefined。

函数参数也是同一个机制。调用者没传参，但参数 binding 已经创建，引擎自动填 undefined。

ES6 之后这里有个很妙的细节，我想单独说一下。

引入 `let`/`const` 之后，binding 的生命周期被拆成了两段，exists，initialized，readable。

```js
console.log(a);   // ReferenceError
let a = 1;
```

binding 已经存在，但还没初始化，引擎拒绝读取，这就是 TDZ，Temporal Dead Zone。

注意啊，这并不是对 undefined 的否定。因为 `let a; console.log(a);` 出来依然是 undefined。ES6 真正改变的不是 undefined 本身，而是这句话：**binding exists ≠ binding is readable**。

只有初始化之后，缺席才重新被编码成 undefined。

这是第一套系统，值还没来。

## 第二套：Reference System，值找不到

Binding 处理的是值还没到。Reference 处理的是另一种缺席，引用的语法已经写出来了，但引擎找不到它指向的目标。

```js
const obj = {};
obj.foo;          // undefined，属性不存在

typeof a;         // 'undefined'，a 从未声明

[1,,3][1];        // undefined，数组空洞
```

一个是属性，一个是变量名，一个是索引。背后却是同一个问题，引用解析失败时怎么办。

先说属性缺失。

```js
const obj = {};
obj.foo;          // undefined
'foo' in obj;     // false
```

对象里压根没有 foo 这个属性。执行 `obj.foo` 会触发对象内部方法 `[[Get]]`，查找 foo，命中就返回值，没命中就返回 undefined。

这里的 undefined 不是对象存进去的，是查找失败之后引擎给的结果。

这里有个很自然的疑问，我以前也卡过。为啥 `obj.foo` 安全，`obj.foo.bar` 却抛 TypeError。

因为第一步 `obj.foo` 已经结束了，结果是 undefined。第二步变成了 `undefined.bar`，你对一个 primitive 取属性，当然抛异常。

ES2020 的可选链 `obj.foo?.bar`，干的就是承认 property miss 会产生 undefined 这件事，然后允许这种缺席安全地往后传播。它不创造 undefined，它只是让 undefined 流动。

接着说数组空洞，这个我特别喜欢。

```js
[1,,3]                     // 索引 1 是空洞
1 in [1,,3];               // false，连属性都没有
1 in [1, undefined, 3];    // true
```

你看，`[1,,3]` 的索引 1 是空洞，`1 in` 返回 false，说明这个位置连属性都没有。而 `[1, undefined, 3]` 的索引 1 是真的有个值为 undefined 的属性，`1 in` 返回 true。

但两者访问结果都是 undefined。

因为数组读取其实也是属性读取，走的是同一条路径，HasProperty 为 false，返回 undefined。又统一上了。

最后说 typeof，这个最骚。

```js
typeof a;         // 'undefined'，a 从未声明
a;                // ReferenceError
```

绝大多数表达式都要求把引用解析成实际值，解析失败就抛 ReferenceError。ResolveBinding 成功就拿到值，失败就 ReferenceError。

但 typeof 有一条规范级特权，拿到一个 unresolvable Reference 的时候，不抛异常，直接返回 "undefined"。

所以 typeof 真正特殊的地方，不是它认识 undefined，而是它是 ECMAScript 里**唯一允许 unresolvable Reference 安静失败的运算符**。

这背后不是什么语言哲学，是 Web 兼容。海量代码依赖 `if (typeof Promise !== 'undefined')` 做特性检测，要是这里抛异常，整个 Web 平台都得跟着抖三抖。

讲到这里我必须停下来插一句，这块最能体现前面那个「统一编码」的设计有多值。

你看默认值机制。

```js
const {a = 1} = {};          // a === 1，{}.a 是 undefined，启动默认值
const {a = 1} = {a: null};   // a === null，null 不触发回退
```

函数默认参数、解构默认值、空值合并 `??`，判断的都不是假值，是缺席。拿到的是 undefined 就启动默认值，不是就用原值。

你想想看，如果前面 ECMAScript 真的给每种缺席各发一个值，那这些默认机制就得为 Uninitialized、MissingProperty、NoCompletion 各写一套回退规则。

正因为所有缺席都被统一编码成 undefined，这些机制只需要一条规则就能覆盖所有场景。

这就是统一编码的回报。我读到这儿的时候是真的拍了一下大腿，前面那个看似偷懒的设计，在这儿等着收利息呢。

第二套系统讲完了，值找不到。

## 第三套：Completion System，值没产生

这一种缺席最隐蔽，执行结束了，但什么结果都没产生。

```js
function f(){}
f();              // undefined

eval("var x = 1;");
// undefined
```

答案藏在 ECMAScript 最容易被忽略的一套机制里，Completion Record。

这一节我要先打个预防针。前两套系统你都能在代码里直接对应，`var x;` 就是 binding，`obj.foo` 就是引用解析。但 Completion Record 不一样，它是规范**内部**的记账机制，你在 JS 代码里根本摸不到它，平时全藏在引擎里，只在 `eval()` 这种极少数地方会漏出来一点。所以读这节先别急着在脑子里找代码对应，跟着下面这个比喻走。

你平时理解的执行，是「执行这行代码」。

但规范不这么说。

规范说的是，对每一个语法结构求值，表达式也好，语句也好，声明也好，函数体也好，每一个都返回一个 Completion Record。

你就把它想成一个**信封**。引擎每对一段代码求值，就给你一个信封，里面装三格。[[Type]] 记录这段代码是 normal（正常结束），还是 return 了，还是 throw 了，还是 break/continue。[[Value]] 是求出来的结果。[[Target]] 是 break/continue 要跳到哪个标签。

绝大多数信封的 [[Type]] 都是 normal，[[Value]] 就是表达式的结果。比如 `1 + 2` 这个信封，类型 normal，值 3，规范写作 `NormalCompletion(3)`。

记一件事就够了，每段代码的执行结果不是一个光秃秃的值，是一个装着「类型 + 值 + 目标」的信封。

还有一层你读规范时大概率会卡的地方。信封不是一个函数只产出一个，是**逐语法结构、逐层向上**生成的。一个函数体里有好几条语句，每条都各自产出一个信封，块语句把它们收成一个，函数调用再把函数体的信封作为最终结果。所以 `f()` 你拿到的那个 undefined，不是凭空冒出来的，是函数体里最后那个「求值了但没结果」的信封一路收上来，最后暴露给你的。

关键在 [[Value]] 这一格。

有些语句根本不为产生值。比如 `var x = 1;`，它的职责是创建变量、把值塞进去，它本身不计算出一个值。那这个信封的 [[Value]] 该填什么。

规范给它填了个占位符，叫 empty。

`var x = 1;` 在规范层面更接近 `信封 { [[Type]]: normal, [[Value]]: empty }`，不是 `NormalCompletion(undefined)`。

> **empty 不是 undefined。**

这句话是整节最关键的一行，读慢一点。

empty 的意思是，求值结束了，但这段代码本来就没打算产出值，所以值那一格空着，填个占位符。它是规范内部的记账符号，你看不到。

undefined 是一个真实的值，会出现在程序里，你拿得到。

两个完全不同的东西。一个在规范内部，一个在你能碰到的运行时。

那程序员最后看到的为啥是 undefined 呢。

因为规范有个辅助操作叫 UpdateEmpty，规则极简。拿到一个信封，[[Value]] 是 empty 就换成 undefined，不是 empty 就不动。

于是 `信封 { 值: empty }` 经 UpdateEmpty 变成了 `信封 { 值: undefined }`，也就是 `NormalCompletion(empty)` 变成了 `NormalCompletion(undefined)`。

到这一步你才看到 undefined。

所以 undefined 并不是 Completion 天生携带的默认值，它是 Empty Completion 暴露给用户代码时的统一编码。和 Binding、Reference 走的是同一条哲学，先有一个内部的缺席状态，最后统一编码成 undefined 给你。

这里还有个细节我觉得特别精巧，`return;` 和「没有 return」。

```js
function f(){}
// 和
function f(){ return; }
```

结果一样，都是 undefined。但信封不一样。

没有 return，函数跑到底自然结束，信封是 `{ [[Type]]: normal, [[Value]]: empty }`，再经 UpdateEmpty 把 empty 换成 undefined。这个 undefined 是 UpdateEmpty **补**出来的。

而 `return;`，是你主动写了 return，引擎直接造一个 `{ [[Type]]: "return", [[Value]]: undefined }` 的信封。这里的 undefined 是**直接写进去**的，不经过 UpdateEmpty。

> 注意 [[Type]] 都不一样了，一个 normal 一个 return。只是 [[Value]] 恰好都是 undefined，所以你从外面看结果一样。表现一致，Completion Type 并不相同。

还有 void。

```js
void (1 + 2)   // undefined
```

`1 + 2` 本来信封值是 3。void 干的事，就是把这个 3 扔掉，硬把信封值改成 undefined。所以 void 不是「获取 undefined」，它是说，我知道这里有结果，但我要把它重新编码成缺席。

undefined 负责表示缺席，void 负责制造缺席。两者互补，严丝合缝。

讲到这儿，三种缺席全部收束到同一个值了。

Binding 是值还没来，Reference 是值找不到，Completion 是值没产生，全部汇入 primitive undefined。

---

但我还想再聊一点，这也是我这次复习里另一个「原来如此」的时刻。

undefined 是引擎说的没有。那程序员自己想表达没有，用啥。

答案是 null。

```js
let user;          // user === undefined，引擎填的
let user = null;   // 程序员明确说「这里应该有值，但现在为空」
```

undefined 是运行时缺席的被动产物，null 是程序员写出来的主动语义。

一个函数查不到用户，更合理的是 `return null;`，意思是「我找过了，没有」。而 `return undefined;` 更像「我忘了返回」。DOM API 体现了这种区分，`document.querySelector(".item")` 找不到返回 null，因为查找已完成，结果为空。而 `obj.foo` 返回 undefined，因为根本没找到这个属性。

> undefined 是引擎说的没有，null 是程序员说的没有。

默认值机制正好沿用了这条线，null 不触发回退，因为「我拿到了，只是空的」应被尊重。undefined 触发回退，因为「我没拿到」可以补救。JSON 也一样，undefined 是运行时缺席，JSON 无法表达就省略。null 是显式数据，保留。

你看，连 null 和 undefined 的分工，都是顺着 absence 这条主线长出来的。

---

好了，可以收了。

回到开头那个问题，为啥 JavaScript 会有 undefined。

因为 ECMAScript 在运行时会不断遇到缺席。值还没到，值找不到，值没产生。这些缺席来自三套彼此独立的系统，本可以各自有一个专属的值。

但 ECMAScript 没这么做。它把所有运行时缺席统一编码成 undefined，换取了语言复杂度的塌缩。默认值、可选链、空值合并只需要一条规则，程序员只需要判断一种缺席。代价是 undefined 本身不再携带「来自哪个系统」的信息，但那正是设计意图。

整个模型可以概括成一张图，运行时缺席分三路：

- **Binding** → 值还没来
- **Reference** → 值找不到
- **Completion** → 值没产生

三路全部汇入 primitive undefined。而程序员主动表达缺席，走 null。

这就是 ECMAScript 的缺席语义模型，Absence Semantics。

> undefined 不是某一种空，也不是某一种失败。它是 ECMAScript 在运行时反复使用的一个统一信号。

这里本来应该有结果，但最终什么都没有得到，于是语言把这种缺席编码成了 undefined。

我这次复习，n 又加了一。但这一遍我跟之前所有的都不一样，之前我记住的是「声明了没赋值」，这一遍我终于看清了 absence 这层。

其实吧，写 JS 这么多年，很多我以为自己懂的东西，都只是停在第一层答案。真正往下挖一层，往往能看见一个更漂亮的设计在下面等着。

undefined 就是这样。**它不是一个值，它是一种语义。**

好了，这篇就到这。

---

如果你还觉得没看够，我再补两个彩蛋。

## 彩蛋一：undefined 为啥不是保留字

另一种空值 null 是保留字，语法树里它是个字面量 Literal，跟 42、"hello"、true 一个地位，引擎一看到就知道是那个固定值。但 undefined 不是，它在语法树里是个 Identifier，跟我们随便起的变量名 foo、bar、user 是同一类节点。

你想想这说明了啥，undefined 语法上根本不是什么特殊符号，它就是当前作用域里解析出来的一个名字。

你写 `console.log(undefined)`，底下其实更接近 `ResolveBinding("undefined")`，拿到名字，再 `GetValue`，最后才得到那个 primitive undefined。ECMAScript 只是在全局对象上放了这么个属性，`globalThis.undefined`，值是 undefined。同类的还有 NaN 和 Infinity。

那为啥不像 null 那样给它个语法地位呢。

历史原因，太晚了。

早期 JavaScript 压根没有 undefined 这个全局名字，程序员靠 `void 0` 拿这个值。后来语言想提供 undefined 当统一入口，但这时候大量网页已经存在了，甚至有人写过 `var undefined = 1;` 这种狠活。Web 平台最高的原则就是 Don't break the web，你要是突然宣布 undefined 成关键字，老网页当场就崩了。

于是 ECMAScript 选了另一条路，不改语法，只在全局对象上加属性。ES5 又进一步把它锁死，writable 设成 false，configurable 也设成 false。行为上越来越像保留字，语法上始终不是。

它甚至还能被局部遮蔽，你敢信。

```js
{
    const undefined = 123;
    console.log(undefined);          // 123
    console.log(typeof undefined);   // "number"
}
```

你看，在块作用域里重新声明一个 undefined，赋值 123，里面 typeof 出来直接是 "number"。这说明 `typeof undefined` 里的那个 undefined，照样是个普通 Identifier，先做名字解析，再做 typeof。

所以 `x === undefined` 理论上并不是绝对安全的。这也是为啥历史上很多库更爱写 `void 0`，或者 `typeof x === "undefined"`，就是怕 undefined 这个名字被人在局部搞鬼。

语言当然也留了个永远可靠的出口，还是 `void 0`。

## 彩蛋二：void 这玩意到底是为谁生的

大多数教程把 `void 0` 说成「获取 undefined 的可靠方式」。这话没毛病，但漏了最关键的一件事，void 运算符最初到底是为谁存在的。

答案是 `javascript:` 协议的链接。

早期 Web 还没有 onclick 事件。你想让网页动起来，要么打开一个 HTTP 新页面，要么用 `javascript:` 协议的链接，靠表达式返回的新 HTML 去改当前页面。

```html
<a href="javascript:someExpression">点击我</a>
```

问题来了。如果 someExpression 求值结果不是 undefined，浏览器会拿这个值直接覆盖整个页面的内容。你本来只想跑段计算逻辑，结果一回头，整个页面被清空了。

void 运算符就是为解决这个而生的。它让你能执行任意表达式，但保证返回值是 undefined，不会去覆盖页面。

```html
<a href="javascript:void doSomething()">安全的链接按钮</a>
```

后来有了事件监听 onclick，`javascript:` 协议链接慢慢退出了主流。但 void 留下来了，它的语义从「防止覆盖页面」泛化成了更通用的意思，执行这个表达式，但刻意丢弃结果，返回 undefined。

你看，兜兜转转，void 的起源还是回到了缺席这件事上。当年它是为了「别让结果毁掉页面」，现在是「我知道有结果，但我主动抹成缺席」。

> 制造缺席这件事，从浏览器时代到今天，一脉相承。
