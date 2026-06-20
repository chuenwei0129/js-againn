# JavaScript 对象模型（四）：对象能力的开放边界——Behavior、Semantics 与 State

从开放边界的视角重新理解 ECMAScript 对象模型：Behavior 高度开放，Semantics 部分开放，State 基本封闭。理解 ECMAScript 如何在可编程性、安全性与性能之间维持平衡。

---

## 一、三层能力，一道屏障

在上一篇，我们拆解了 ECMAScript 对象模型的三层结构——**Internal Method（行为）**、**Property Descriptor（语义）** 和 **Internal Slot（状态）**，这回答了一个静态问题：

> ECMAScript 如何组织一个对象？

但理解对象如何组织，只完成了一半。真正有意思的问题是：

> **ECMAScript 愿意把多少对象能力交给开发者？**
>
> 更进一步：
>
> **为什么开放到这里就停止了？**

答案并不是平均分配的。三层能力的开放程度存在明显差异。

| 层次        | 开放程度  | 主要入口                   |
| --------- | ----- | ---------------------- |
| Behavior  | ★★★★★ | Proxy / Reflect        |
| Semantics | ★★★☆☆ | Descriptor / Symbol 协议 |
| State     | ★☆☆☆☆ | 基本封闭，仅开放少数结构状态         |

如果把对象理解成一个系统，那么 ECMAScript 的设计目标并不是：

> 让开发者拥有对象的一切能力。

而是：

> **把可以伪造、可以组合、可以编排的部分开放出来；**
>
> **把定义对象身份、维护不变量和保证内存安全的部分保留给引擎。**

于是，对象能力天然分成了三层，并被一道明确的屏障隔开：

```
┌────────────────────────────┐
│        Behavior            │
│    Internal Methods        │
│                            │
│       Proxy                │
│       Reflect              │
│       Accessor             │
│                            │
│        ★★★★★              │
└────────────┬───────────────┘
             │
             ▼

════════ Invariant Barrier ════════

             ▲
             │

┌────────────────────────────┐
│        Semantics           │
│                            │
│ Property Descriptor        │
│ Symbol Protocol            │
│                            │
│         ★★★☆☆             │
└────────────┬───────────────┘
             │
             ▼


┌────────────────────────────┐
│          State             │
│                            │
│ Internal Slots             │
│ Brand                      │
│ Realm                      │
│ GC Cooperation             │
│                            │
│          ★☆☆☆☆            │
└────────────────────────────┘
```

Behavior 可以重新实现，Semantics 可以声明和配置，而 State，则构成了对象真正的身份边界。理解这条边界，比理解 Proxy 如何工作更重要。

---

## 二、Behavior：为什么行为天然适合开放？

第一章我们画出了一条线：Behavior 高度开放，Semantics 部分开放，State 基本封闭。本章就从上往下，进入最开放的那一层——Behavior。为什么它是开放的？开放到了什么程度？

### 2.1 三种对象，同一套行为接口

Behavior 层对应规范中的 Internal Method（如 `[[Get]]`、`[[Set]]`、`[[Delete]]`）。ECMAScript 规范将对象分为三种形态，它们共享这一套行为接口，区别只在于**这些接口由谁来实现**。

| 类型              | 行为实现来源           |
| --------------- | ---------------------- |
| Ordinary Object | 规范定义的默认算法     |
| Exotic Object   | 至少改写一个内部方法   |
| Proxy Object    | 全部委托给用户代码     |

这个分类揭示了一个根本原则：引擎并不关心 `obj.name` 具体返回什么，它只关心当属性读取发生时，对象必须能够响应一次 `[[Get]]`。至于这次 `[[Get]]` 的实现是默认算法、引擎特殊逻辑还是用户代码，对引擎来说都一样。行为只是对象与外界交互的方式，并不定义对象自身的身份。

### 2.2 ECMAScript Object Internal Methods：开放的完整清单

那么，三种对象共享的这套行为接口到底有哪些？规范在“Object Internal Methods and Internal Slots”这一节给出了定义，其中最常见、最基础的一组被称为 Essential Internal Methods。下表列出的是 Proxy 可以拦截的 ECMAScript Object Internal Methods，以及它们对应的 Proxy trap 和 Reflect 方法。

| Internal Method       | Proxy trap              | Reflect 方法                     |
| --------------------- | ----------------------- | -------------------------------- |
| [[Get]]               | get                     | Reflect.get                      |
| [[Set]]               | set                     | Reflect.set                      |
| [[Delete]]            | deleteProperty          | Reflect.deleteProperty           |
| [[HasProperty]]       | has                     | Reflect.has                      |
| [[GetOwnProperty]]    | getOwnPropertyDescriptor | Reflect.getOwnPropertyDescriptor |
| [[DefineOwnProperty]] | defineProperty          | Reflect.defineProperty           |
| [[OwnPropertyKeys]]   | ownKeys                 | Reflect.ownKeys                  |
| [[GetPrototypeOf]]    | getPrototypeOf          | Reflect.getPrototypeOf           |
| [[SetPrototypeOf]]    | setPrototypeOf          | Reflect.setPrototypeOf           |
| [[PreventExtensions]] | preventExtensions       | Reflect.preventExtensions        |
| [[IsExtensible]]      | isExtensible            | Reflect.isExtensible             |
| [[Call]]              | apply                   | Reflect.apply                    |
| [[Construct]]         | construct               | Reflect.construct                |

这就是 ECMAScript 开放给开发者的完整行为面，没有遗漏，也没有额外入口。不过有一处微妙约束：`[[Call]]` 和 `[[Construct]]` 的**存在与否**由目标对象自身决定——普通函数两者皆有，箭头函数只有 `[[Call]]`。Proxy 可以拦截它们（前提是目标对象已具备），却不能凭空创造。这个约束的根源要在后面 State 层才会彻底显形。

浏览完这张表，一个直观印象是：数量不多，而且似乎是固定的。另外别忘了，2.1 说过 Proxy Object 把这些接口的实现全部交给了用户代码——也就是说，它们是**可以被替换**的。

### 2.3 行为接口是闭合的

固定，并且可替换。这自然引出下一个问题：那能不能新增？比如为对象发明一个 `[[Clone]]`、`[[Serialize]]` 或者 `[[Log]]`？

答案是不能。对象能够响应哪些操作，本身就是语言设计的一部分。ECMAScript 精确定义了上面这组 Object Internal Methods，这组接口是**闭合的**。Proxy 能做的是替换已有接口，而不能发明新的接口。

这意味着 `new Proxy(obj, { get() { ... } })` 可以重新实现属性访问，但无法让引擎自动支持 `obj.clone()`、`obj.serialize()`、`obj.audit()`，因为这些行为根本不属于 ECMAScript 的对象契约。

这正是第一章所述设计原则的直接体现：引擎交出的，是“可以伪造、可以组合、可以编排的部分”。行为接口的闭合性，从一开始就划定了开发者的权限边界。

### 2.4 Proxy：在行为接口与默认实现之间插入代码

答案就是 Proxy。

先看一个具体的例子：

```js
const target = { name: "张三" };

const proxy = new Proxy(target, {
    get(target, key) {
        console.log(`读取属性: ${key}`);
        return target[key];
    }
});

proxy.name;   // 输出 "读取属性: name"，返回 "张三"
```

`new Proxy(target, handler)` 创建了一个代理对象 `proxy`。第二个参数 `handler` 是一个对象，上面定义的 `get`、`set` 等函数称为 **trap**（拦截函数）。每个 trap 对应一个 Internal Method——这里的 `get` 对应 `[[Get]]`，后面还会见到 `set` 对应 `[[Set]]`，以此类推。完整的对应关系已经列在 2.2 节的表格中。

当通过 `proxy` 访问属性时，引擎**不再直接调用 target 的 Internal Method**，而是转而调用 handler 上对应的 trap。以 `proxy.name` 为例：

```text
引擎调用:   proxy.[[Get]]("name", proxy)
                ↓
用户代码接管:  handler.get(target, "name", receiver)
                ↓
用户代码内部:  return target[key]   （这里可以写任何逻辑）
```

Proxy 所做的事情，就是在这条调用链上**插入了一段用户代码**。引擎照常调用 `[[Get]]`，只是这个调用被代理截获，先交给你处理。你处理完之后想干什么、想返回什么，完全由你的 trap 决定——可以做日志、可以修改返回值、可以根据条件拒绝访问，这些都属于你插入的逻辑。

不过，上面例子里 `return target[key]` 这行代码有一个潜在问题：它直接在 target 上做了一次普通的属性读取。有时候，你并不想完全绕开默认行为，而是想在默认行为的前后做一点额外的事。那该怎么回到“原本该走的那条路”？这就要用到 2.2 表格第三列那些方法了——Reflect。

### 2.5 Reflect：回到“原本该走的那条路”

2.4 节的例子里，`handler.get` 内部写的是 `return target[key]`。这行代码能工作，但它做的事情是：**在 target 上发起一次新的属性读取**。这和引擎最初调用 `proxy.[[Get]]` 走的是两条不同的路径——一条是被 Proxy 截获过的，一条是直接对 target 发起的。

大多数时候，你并不想另辟蹊径，而是想在默认行为的前后加一点逻辑，然后**回到原本该走的那条路上**。比如：日志记录完，属性读取照旧；校验通过后，属性写入照旧。

问题来了：那些“默认行为”原本是引擎内部调用的，在 JavaScript 里怎么手动走一遍？

答案就是 Reflect。回到 2.2 节的表格，第三列的每一个方法，都是对应 Internal Method 在语言层的直接入口。`Reflect.get` 就是 `[[Get]]` 的手动调用版，`Reflect.set` 就是 `[[Set]]` 的手动调用版，以此类推。

用 Reflect 重写 2.4 的例子：

```js
const target = { name: "张三" };

const proxy = new Proxy(target, {
    get(target, key, receiver) {
        console.log(`读取属性: ${key}`);
        return Reflect.get(target, key, receiver);   // 回到默认行为
    }
});

proxy.name;   // 输出 "读取属性: name"，返回 "张三"
```

和 `return target[key]` 相比，`Reflect.get(target, key, receiver)` 走的是引擎原本为 `[[Get]]` 定义的那套完整逻辑——包括沿原型链查找、调用 getter、绑定正确的 `this`。你只是在调用前后加了一行 `console.log`，其余部分完全交给默认实现。

这就是 Reflect 的核心定位：**它不是用来做新事情的，它是用来回到默认行为的**。如果你把 Proxy 理解为“在引擎和对象之间插入自己的代码”，那 Reflect 就是“从自己的代码里，重新调用引擎原本的逻辑”。

Reflect 有三个重要的价值。

#### 2.5.1 统一的返回值

`obj.x = 1` 在严格模式下赋值失败会抛错，在非严格模式下可能静默失败。而 `Reflect.set(obj, "x", 1)` 无论严格模式还是非严格模式，都返回 `true` 或 `false`。控制流问题被转换成了数据问题：

```js
obj.x = 1;                  // 可能抛错，也可能静默失败
Reflect.set(obj, "x", 1);   // 始终返回 true / false
```

对于 Proxy trap 来说这一点至关重要——trap 的返回值同样被用来判断操作是否成功，用 Reflect 可以确保语义一致。

#### 2.5.2 保留 Receiver

2.4 节展示的调用链里有一个 `receiver` 参数，当时没有展开。现在可以解释了：`receiver` 是**最初发起操作的那个对象**。在 Proxy trap 中，它通常是 proxy 自身。如果把它丢掉了，getter 里的 `this` 就会绑错。例如：

```js
// 错误写法
get(target, key) {
    return target[key];   // receiver 丢失
}

// 正确写法
get(target, key, receiver) {
    return Reflect.get(target, key, receiver);   // receiver 完整传递
}
```

具体的原因涉及原型链上的 this 绑定，将在 2.6 节展开。这里只需记住结论：**trap 中使用 Reflect 并传递 receiver，是保持语义正确的关键**。

#### 2.5.3 完整的默认行为

`Reflect` 提供的方法覆盖了 2.2 节表格列出的全部 Internal Method。原型链查找、getter 调用、setter 绑定、属性描述符的读写、原型操作、扩展性检查——所有这些行为的默认逻辑都封装在 Reflect 中。你可以在任何一个 trap 内部，方便地调用对应的 Reflect 方法，回到“本该如此”的那条路。

把 2.4 和 2.5 放在一起，Proxy 和 Reflect 的分工就很清楚了：

- **Proxy** 让你截获 Internal Method 的调用，插入自己的代码。
- **Reflect** 让你在自己的代码里，手动调用 Internal Method 的默认实现。

一个负责“接入”，一个负责“回落”。两者配合，让 Behavior 层既可以被完全重写，又不会丢掉引擎已经定义好的全部语义。

### 2.6 Receiver：共享行为，独立状态

2.5.2 节留了一个问题：为什么 Proxy trap 里必须传递 `receiver`，否则 getter 里的 `this` 会绑错？现在来解开它。

先看不涉及 Proxy 的原始场景：

```js
const parent = {
    get name() { return this._name; }
};
const child = Object.create(parent);
child._name = "child";
console.log(child.name);   // "child"
```

`child` 本身没有 `name` 属性，于是沿原型链向上查找。但规范始终保留最初发起属性访问的那个对象——Receiver。`child.[[Get]]("name", child)` 最终变成 `parent.[[Get]]("name", child)`，getter 执行时 `this` 指向 `child`。行为（getter 函数体）复用了 `parent` 的定义，但状态（`_name`）依然留在 `child` 上。

现在把 Proxy 加进来：

```js
const parent = {
    get name() { return this._name; }
};
const child = Object.create(parent);
child._name = "child";

const proxy = new Proxy(child, {
    get(target, key, receiver) {
        console.log(`读取: ${key}`);
        return Reflect.get(target, key, receiver);   // receiver 是 proxy
    }
});

console.log(proxy.name);   // "child"
```

`proxy.name` 触发了 `handler.get`，`receiver` 就是 `proxy` 自身。当 `Reflect.get(target, key, receiver)` 沿原型链找到 `parent` 上的 getter 时，`this` 被正确绑定为 `proxy`。但如果写成 `return target[key]`，`receiver` 就丢了——这次读取变成了对 `child` 的直接访问，`this` 绑定为 `child`，而非 `proxy`。在有 Proxy 包装的场景里，这可能导致行为偏离预期。

Receiver 的意义正在于此：**共享的是行为，实现的是多态；隔离的是状态，维持的是身份**。这也解释了为什么 Proxy trap 里几乎总是写成 `Reflect.get(target, key, receiver)` 而不是 `target[key]`——因为后者会破坏对象模型最核心的一条规则：行为可以复用，但身份不能串门。

归根结底，**Receiver 的存在，本质上是在共享行为和隔离状态之间建立了一座桥梁**。

---

### 2.7 预告：Semantics 与 State

Behavior 层的高度开放，很容易让人产生一种错觉：既然所有 Internal Method 都可以被 Proxy 拦截，那岂不是任何行为都能随心定义？

但 Proxy 教程里总有一些“奇怪”的限制。它们并不属于同一类，却共同暗示着 Behavior 之下还有两层结构在起作用。

**第一类限制**：你可以在 `ownKeys` trap 里返回空数组，但引擎随后会检查——如果目标对象有一个 `configurable: false` 的自身属性，它必须出现在结果中，否则抛错。这意味着，**行为的输出不是最终结果，还有一层规则在做最后的合法性校验。** 这类规则——属性可写还是只读、可删除还是不可删除、可枚举还是不可见——来自下一章要讨论的 Semantics 层。

**第二类限制**：你无法给一个普通对象加上 `[[Call]]`，即使你在 handler 里定义了 `apply` trap。引擎在走进你的 trap 之前就拒绝了——因为目标对象根本不具备“可被调用”的身份。这意味着，**对象“能不能做某件事”，不由 Behavior 层决定，而由一个更深层的身份系统控制。** 这个身份系统，就是第四章要讨论的 State 层。

换句话说，Behavior 的开放是把“如何执行”的自由交给你。但“执行时能走多远”，由 Semantics 层的描述符规则来限定；而“对象有没有资格执行某个操作”，由 State 层的内部槽说了算。接下来的两章，就从这两个方向分别展开，揭示 Behavior 之下那道逐渐收缩的开放边界。

---

## 三、Semantics：为什么协议可以开放？

Behavior 层的高度开放，本身也留下了一个问题：**当行为可以被完全替换时，对象的一致性靠什么来维持？**

Proxy 可以重新实现 `[[Get]]`，但 `[[Get]]` 执行时仍然需要知道——这个属性可读吗？它是个数据属性还是访问器？它的值应该从原型链的哪一层开始查找？这些问题的答案，并不由 Behavior 自身决定，而是由另一层结构来定义。这一层，就是 Semantics。

如果把 Behavior 理解为“对象如何响应外部操作”，那么 Semantics 回答的是一个更前置的问题：**对象希望以什么规则参与这些操作？** 它不接管行为的执行，却决定了行为执行时必须遵循的约束。

这也是 ECMAScript 开放程度最微妙的一层。它既不像 Behavior 那样允许彻底接管，也不像 State 那样严格封闭，而是采取了一种折中策略：**开放协议的实现权，但不开放协议的设计权**。开发者可以声明对象遵循哪些既定规则，但不能创造新的语言规则。

### 3.1 Property Descriptor：属性的语义说明书

Behavior 描述的是对象如何响应外界操作，而 Descriptor 描述的是属性本身的规则。它要回答的问题更具体：**这个属性，究竟意味着什么？**

```js
Object.defineProperty(obj, "name", {
    value: "Tom",
    writable: false,
    enumerable: false,
    configurable: false
});
```

这段代码并没有改变对象的行为接口——对象仍然响应 `[[Get]]`、`[[Set]]`、`[[Delete]]` 这些标准行为。改变的是这些行为在面对 `"name"` 属性时，必须遵守的约束。`obj.name = "Jerry"` 最终仍然走 `[[Set]]` 这条路径，但由于属性描述符中 `writable` 为 `false`，赋值操作被规则拒绝。Descriptor 影响的是**行为如何执行**，而不是**对象是否具备某种能力**。

开发者可以直接构造这些规则，入口是一系列围绕属性描述符的 API：`Object.defineProperty`、`Object.defineProperties`、`Object.getOwnPropertyDescriptor`，以及 `Object.freeze`、`Object.seal`、`Object.preventExtensions` 这些批量操作描述符的高阶工具。`Object.freeze(obj)` 做的事情大致是：所有属性的 `writable` 和 `configurable` 置为 `false`，对象的 `[[Extensible]]` 置为 `false`——它改变的仍然是约束规则，只不过以批量的方式。

语言为属性语义定义了一套固定的协议——描述符的六个字段：`value`、`writable`、`enumerable`、`configurable`、`get`、`set`。开发者拥有的自由，是在这六个字段的框架内为每一个属性赋予具体规则。让一个属性只读，是配置了 `writable` 维度；让一个属性不可删除，是配置了 `configurable` 维度；让一个属性变成访问器，是用 `get` 和 `set` 替换掉 `value` 和 `writable`。

但不能发明第七个字段。不能声明一个属性是 `hidden` 的，不能定义一个属性是 `volatile` 的，也不能标记一个属性为 `protected` 的。属性的“意义”被严格限定在这六个维度内，组合的词汇表永远只有六个词。这正是“开放协议的实现权，不开放协议的设计权”在属性层面的精确体现：**协议的种类由语言设计，协议的值由开发者填写。**

### 3.2 Symbol 协议：对象维度的行为契约

如果说 Property Descriptor 开放的是**属性维度的语义配置**，那么 Symbol 协议开放的则是**对象维度的行为契约**。它要回答的问题是：**这个对象，愿意以什么身份参与语言的既定规则？**

以迭代为例。当一个对象被 `[...obj]` 展开时，引擎并没有为此发明一个 `[[Iterate]]` 内部方法。真正发生的是：

```text
引擎调用:   obj.[[Get]](Symbol.iterator, obj)
              ↓
获得一个函数:  iteratorFn
              ↓
按约定调用:    iteratorFn.call(obj)  → 返回迭代器
```

整个过程只依赖一个早已存在的 Internal Method——`[[Get]]`。语言没有新增任何行为接口，只是约定了一件事：**如果你的对象在 `Symbol.iterator` 这个键上提供了一个符合迭代协议的函数，你就可以参与迭代。** 类似地，`Symbol.toPrimitive` 影响类型转换，`Symbol.hasInstance` 控制 `instanceof` 行为，`Symbol.toStringTag` 决定 `Object.prototype.toString` 的返回值。协议全部由规范预先定义，开发者决定的是**是否实现**以及**如何实现**。

但你不能发明新的协议。语言不认识 `Symbol.observe`，`for...of` 只找 `Symbol.iterator`，加法运算符只问 `Symbol.toPrimitive`。Well-Known Symbol 的集合是封闭的，每一种符号都对应着一个由规范定义好的协议。你可以决定是否入局，但不能改写规则手册。

现在，Descriptor 与 Symbol 可以放在一起看。它们共同划出了 Semantics 层的开放边界：

| 维度 | 开放了什么 | 保留了什么 |
|------|-----------|-----------|
| Property Descriptor | 在六个字段内自由配置属性的语义规则 | 描述符字段不可扩展，规则种类由语言定义 |
| Well-Known Symbol | 实现语言预定义的协议 | 不能创造新协议，Well-Known Symbol 集合封闭 |

两者遵循的是同一条原则：**开放协议的实现权，不开放协议的设计权。** 但在这两条平行的开放路径之间，还存在一个非常特殊的交叉点。在那里，语义不再只是静态的规则描述，而是直接携带了可执行的行为。

### 3.3 访问器属性：当语义直接携带行为

在属性描述符的六个字段中，`get` 和 `set` 是唯一的一对例外。其他四个字段——`value`、`writable`、`enumerable`、`configurable`——都是纯粹的声明：它们描述规则，但不包含逻辑。而 `get` 和 `set` 是函数。

```js
const obj = { _name: "Tom" };

Object.defineProperty(obj, "name", {
    get() {
        console.log("读取 name");
        return this._name;
    },
    set(value) {
        console.log(`设置 name 为 ${value}`);
        this._name = value;
    },
    enumerable: true,
    configurable: true
});

obj.name;           // 输出 "读取 name"，返回 "Tom"
obj.name = "Jerry"; // 输出 "设置 name 为 Jerry"
```

当一个属性使用访问器描述符时，它不再存储 `[[Value]]`，而是存储 `[[Get]]` 和 `[[Set]]` 这两个函数。属性的语义规则变成了一段**用户自定义的代码**，每当 `[[Get]]` 或 `[[Set]]` 操作触及这个属性时，引擎会转而调用对应的函数。

这是 Behavior 层与 Semantics 层唯一直接交汇的地方：

- 从 **Semantics 的视角**看，`get`/`set` 仍然只是描述符字段，属于语义配置。开发者没有创造新的描述符字段，也没有修改属性访问的内部方法名称——他们只是在语言预设的“访问器属性”这个类别里，填入两个函数。
- 从 **Behavior 的视角**看，这两个函数实际接管了 `[[Get]]` 和 `[[Set]]` 在该属性上的执行。用户的代码进入了原本只有引擎默认算法运行的地方。

因此，访问器属性并没有打破三层架构的边界，但它让 Semantics 层的开放产生了一个特殊效果：**语义配置可以直接触发用户行为，而不是仅仅影响引擎行为。** 这是“部分开放”中一个非常精巧的设计——它在不动摇 State 层的前提下，最大化了 Behavior 层的可编程性。

这也帮助我们更精确地理解“协议实现权”。对于数据属性，实现协议意味着设置 `writable`、`enumerable` 等字段的值；对于访问器属性，实现协议意味着提供符合签名的函数。两者的共同点在于：**协议的入口（六个字段）和出口（`[[Get]]`/`[[Set]]` 的调用时机）都由语言固定，开发者填写中间逻辑。** 你不能修改协议本身，但你可以通过函数注入，让同一个协议产生完全不同的行为后果。

这正是 Semantics 层开放边界的终极形态：**填表权是给你的，表格是引擎的；但引擎为表格中的某几格留了插槽，你可以把代码插进去。** 插进去的代码仍然运行在 Behavior 层的约束之下，仍然必须通过 Invariant Barrier 的校验，仍然无权触碰 State 层的内部槽——但它在语义框架内赢得了最大的表达自由。

---

### 3.4 关联已现：Semantics 的枢纽位置

进入 Semantics 层之后，先前 Behavior 层留下的那些“奇怪限制”开始有了清晰的来源。

回顾第二章，我们曾困惑：为什么 Proxy 的 `ownKeys` trap 可以返回空数组，但如果目标对象有 `configurable: false` 的自身属性，引擎会强制要求该属性必须出现在结果中，否则抛错？现在答案明确了——`configurable: false` 是属性描述符的一部分，属于 Semantics 层的定义。Behavior 负责执行 `ownKeys` 的拦截、生成列表，但引擎随后会根据描述符规则校验这份列表。如果规则说不可配置属性必须存在，即使 trap 刻意遗漏，引擎也会在最终校验时拒绝并抛错。**Behavior 只管“如何生成列表”，Semantics 决定了“列表必须包含什么”。**

这种关联在访问器属性上体现得尤为紧凑。`get` 和 `set` 函数本身是 Semantics 层的配置，但它们会在 `[[Get]]` 和 `[[Set]]` 执行时直接被调用——用户代码由此进入了 Behavior 的执行路径。这是两个层次唯一直接交汇的地方，也最清楚地展示出二者的分工：Semantics 提供“在什么时机触发什么逻辑”的声明，Behavior 负责实际调用那段逻辑并遵循调用约定（如绑定 `this`）。谁也没有越界，但配合得天衣无缝。

然而，Semantics 自身也不是终点。属性描述符的 `configurable` 一旦设为 `false`，就意味着这条规则本身也被锁定。这种“规则的不可变性”由谁来保证？如果 Proxy 试图在 `defineProperty` 中篡改一个不可配置属性的描述符，引擎凭什么拒绝？这已经超出了 Semantics 层自身的能力，因为它涉及一个更根本的问题——**对象的基础事实究竟存储在哪里，由谁守护。**

这就是下一章的主题。在 Behavior 和 Semantics 之下，还有一层保持绝对封闭的 State。它不参与日常操作，是“对象是什么”这一问题的终极答案。

---

## 四、State：为什么身份必须封闭？

Behavior 描述对象如何响应操作，Semantics 描述对象以什么规则参与语言运行，而 State 则回答最后一个问题：**对象究竟是什么？** 对于 ECMAScript 来说，这是最敏感、也是开放程度最低的一层。因为一旦允许开发者任意读写 Internal Slot，语言将失去三个最重要的保证：不变量（Invariant）、品牌身份（Brand）和内存安全（Memory Safety）。State 的封闭，本质上是在守护这三件事情。

### 4.1 不变量：为什么 State 不能开放？

在 Behavior 层，Proxy 可以重新实现几乎任何操作。你能拦截 `[[Get]]`，就能让 `obj.x` 返回任何东西。你能拦截 `[[OwnPropertyKeys]]`，就能决定一个对象“看起来”有哪些属性。

这就引出一个根本问题：**有没有一些事，是无论怎么重写 Behavior 都不能改变的？**

答案是有。这些事，就是 ECMAScript 的**不变量（Invariant）**。

#### 4.1.1 不变量是什么？

不变量不是“建议”，也不是“约定”。它是在任何情况下都必须成立的事实。语言规范使用“must”和“invariant”这类表述来标定它们——一旦被打破，整个对象模型的一致性就会崩溃，后续的所有推理都会失效。

在 ECMAScript 中，不变量通常附着在对象的**内部状态**上。也就是说，不是 Behavior 保证了不变量的成立，而是 State 层为它们提供了最终裁决权。

#### 4.1.2 两个核心案例

**Promise 的状态不可逆**

Promise 内部维护着一个 `[[PromiseState]]` 槽，取值只能是 pending、fulfilled、rejected 三者之一。规范明确规定：状态转换只能发生一次，从 pending 到 fulfilled 或 rejected，之后永远不可回退。

```js
const p = new Promise(resolve => {
    resolve(1);
    resolve(2);   // 第二次调用无效果
});
```

第二次 `resolve(2)` 被引擎直接忽略。这不是因为 JavaScript 代码做不到，而是因为引擎在调用 `resolve` 时，会检查 `[[PromiseState]]`——如果已经不是 pending，就什么都不做。这个检查依赖的是 State 层的真实值，不能被任何用户代码绕过。

如果 `[[PromiseState]]` 可以被修改，你就可以在 Promise 已经 fulfilled 之后，把它改回 pending，再把结果从 1 改成 2。到那时，`async/await`、Promise 链式调用、甚至整个异步模型的基础假设都会瓦解。

**Array 的 length 约束**

数组是另一种具有强不变量的对象。当 `arr = [1, 2, 3]`，并且索引 `2` 被设为不可配置之后：

```js
Object.defineProperty(arr, "2", { configurable: false });
arr.length = 1;          // 尝试收缩数组
console.log(arr.length); // 3，而不是 1
console.log(2 in arr);   // true
```

`length = 1` 看起来应该删除索引 2，但由于索引 2 不可配置，删除失败。引擎执行 `[[DefineOwnProperty]]` 时，走的不是普通对象的路径，而是 `ArraySetLength`——数组专用的内部算法。这个算法会检查每个待删除索引的 `[[Configurable]]` 状态，遇到不可删除的就拒绝操作，并修正 `length`。

Proxy 无法真正复现这种行为。你可以在 `set` trap 中拦截 `length` 的修改，对外表现出类似的结果；但你没有权限访问引擎底层的数组索引存储结构和 `ArraySetLength` 算法所依赖的真实 `[[Configurable]]` 状态——这些东西都是 State 层的专属领地。

#### 4.1.3 为什么 Proxy 不能突破不变量？

2.7 节和 3.4 节已经先后预告过两类限制。现在，在 State 层，可以看清它们共同指向的同一道屏障——Invariant Barrier。两类限制分别发生在这道屏障与 State、与 Semantics 的边界上，层次不同，但原理一致。

**第一类限制**：Behavior 与 State 之间的不变量。

2.7 节预告过：你无法给一个普通对象加上 `[[Call]]`。这是 State 层身份系统最直接的体现。

```js
const obj = {};
const proxy = new Proxy(obj, {
    apply() { return "called"; }
});
proxy(); // TypeError: proxy is not a function
```

尽管我们定义了 `apply` trap，引擎在触发 `[[Call]]` 之前会检查目标对象是否拥有这个内部方法。普通对象没有 `[[Call]]`，所以直接抛出 TypeError，根本不会进入 trap。Proxy 可以替换已有行为，但无法凭空创造能力——**对象"能不能做某件事"，不由 Behavior 层决定，而由 State 层的身份系统控制。**

**第二类限制**：Behavior 与 Semantics 之间的不变量。

3.4 节末尾提出了一个尖锐的问题：属性描述符的 `configurable` 一旦设为 `false`，这条规则本身也被锁定。如果 Proxy 试图在 `defineProperty` 中篡改一个不可配置属性的描述符，引擎凭什么拒绝？

```js
const obj = {};
Object.defineProperty(obj, "x", { value: 1, configurable: false });
const proxy = new Proxy(obj, {
    defineProperty(target, key, descriptor) {
        // 试图把不可配置的属性改成可配置
        console.log("trap 被触发了");
        return Reflect.defineProperty(target, key, descriptor);
    }
});
Object.defineProperty(proxy, "x", { configurable: true }); // TypeError
```

Proxy 的 `defineProperty` trap 确实被触发了——`console.log` 会输出。但即使我们调用 `Reflect.defineProperty` 试图执行这个修改，引擎依然抛出 TypeError。因为不变量规定：**不可配置的属性，其 `configurable` 永远不能被改为 `true`。** 这不再仅仅是 Semantics 层自己能决定的——Semantics 层声明了 `configurable: false`，但守护这条规则不被篡改的力量，来自更深层的 State。正如 3.4 节所追问的："这种'规则的不可变性'由谁来保证？"——答案就在这里。Semantics 定义了规则，State 守护了规则的边界。

这两个例子共同勾勒出 Invariant Barrier 的运行机制：**Behavior 可以重新编排逻辑，但 State 层的身份和 Semantics 层的规则边界始终掌握着最终的真相。** 你可以伪造过程，但不能伪造结论，也不能赋予对象它本不具备的本质。

#### 4.1.4 不变量的意义

不变量对于 JavaScript 的作用，可以从三个角度来理解：

**1. 它们是对象模型的基石。** 如果没有不变量，每个对象的行为就可以被任意扭曲，而语言规范对开发者来说就不再是可靠的承诺，只是“大概会这样”。不变量让“对象”这个概念有了稳定的含义。

**2. 它们是安全边界。** 很多安全机制都依赖不变量的成立。如果不可配置的属性可以被隐藏，封装就失去了意义；如果 Promise 状态可以被回退，异步流程控制就失去了确定性。State 层的封闭，本质上是为语言的安全边界提供了最低限度的保证。

**3. 它们是优化前提。** 引擎在 JIT 编译时，会假设某些不变量的成立——比如类型不改变、原型链不改变、属性描述符不改变——然后基于这些假设生成高效代码。如果 State 可以被随意修改，这些优化就失去了根基，整个语言的性能模型都会改变。

#### 4.1.5 回到设计原则

第一章提出的那条原则，在不变量的语境下得到了最强的印证：

> 把可以伪造、可以组合、可以编排的部分开放出来；
>
> 把定义对象身份、维护不变量和保证内存安全的部分保留给引擎。

Behavior 开放，是因为“如何做”可以千变万化。State 封闭，是因为“是什么”不容妥协。不变量不是限制灵活性的枷锁，而是让灵活性得以存在的前提——因为只有在地基稳固的时候，才允许上层建筑自由伸展。

### 4.2 品牌身份：为什么对象不可伪装？

如果 Behavior 可以被完全重写，Semantics 可以被精心配置，那么一个尖锐的问题自然浮现：**究竟是什么，让一个对象成为“它自己”？**

是它拥有的方法吗？把 `Map` 的所有方法拷贝到一个普通对象上，这个对象就能当 `Map` 用了吗？

是它的原型链吗？`instanceof` 告诉我们“是”，但这是否足够可靠？

答案都在 State 层。因为只有 Internal Slot 能提供不可伪造的身份——我们称之为**品牌（Brand）**。

#### 4.2.1 弱身份：原型链可以撒谎

`instanceof` 是 JavaScript 中最常见的身份检查。它的逻辑很简单：沿着右操作数的 `prototype`，在左操作数的原型链上查找。

```js
const fake = {
    get() {},
    set() {},
    has() {}
};

Object.setPrototypeOf(fake, Map.prototype);
console.log(fake instanceof Map); // true
```

`fake` 通过了 `instanceof` 检查。它拥有了 `Map` 的方法吗？没有。它只是一个贴着 `Map` 标签的普通对象，内在没有任何 `Map` 该有的结构。这种依赖原型链的身份，我们称为**弱身份（Weak Identity）**——它可以被任意伪造。

真正的 `Map` 并不依赖原型链来证明自己。引擎对 `Map` 的认知来自内部。

#### 4.2.2 强身份：Internal Slot 才是真相

当你调用 `Map.prototype.set.call(fake, 'key', 'value')` 时，引擎执行的不是简单的函数调用，而是先通过规范中的 `RequireInternalSlot` 抽象操作做一次品牌检查。规范中的表述类似这样：

> 如果 `this` 不具有 `[[MapData]]` 内部槽，则抛出 TypeError。

`[[MapData]]` 是只有真正的 `Map` 实例才拥有的内部槽。它不由原型链决定，不由方法拷贝决定，不由任何 JavaScript 层面的操作决定。它由引擎在 `new Map()` 时分配，并永远附着在该对象上。

因此，无论 `fake` 的原型链被如何篡改，无论它表面上看起来多么像一个 `Map`，`Map.prototype.set.call(fake)` 都会失败。因为它在 State 层缺乏那个唯一的、不可伪造的身份标记。

这就是**强身份（Strong Identity）**。它不回答“对象像什么”，它回答“对象是什么”。

#### 4.2.3 私有字段：用户代码的品牌能力

ES2022 的私有字段（`#field`）将这种品牌能力首次开放给了开发者。每个类通过 `#field` 声明，实际上在引擎内部创建了一个 `[[PrivateBrand]]`。使用 `#field` 时，引擎会执行品牌检查：`this` 必须持有与该 `#field` 关联的 `[[PrivateBrand]]`。

```js
class Wallet {
    #balance = 0;
    deposit(amount) { this.#balance += amount; }
}

const w = new Wallet();
const proxy = new Proxy(w, {});

w.deposit(100);              // 正常
proxy.deposit(100);          // TypeError！因为方法调用把 receiver 绑定为 proxy
proxy.deposit.call(w, 100);  // 正常，因为显式把 receiver 指定回 w
```

`proxy.deposit()` 失败，不是因为 `deposit` 方法被拦截了，而是因为方法调用语法把 `this` 绑定为 `proxy`，`deposit` 内部的 `this.#balance` 触发了品牌检查。而 `proxy` 并不持有 `Wallet` 的 `[[PrivateBrand]]`，即便它代理了 `w`。如果我们通过 `.call(w)` 显式把 receiver 指回原始实例，品牌检查就能通过。

这个设计揭示了一条重要原则：**品牌检查不认代理，只认原始身份。** Proxy 可以在 Behavior 层完美模仿任何对象的行为，但它在 State 层永远无法冒充另一个对象。这正是 ECMAScript 将品牌能力开放给开发者时，同时坚持品牌本身不可伪造的原因。

#### 4.2.4 品牌比原型更可靠：跨 Realm 的启示

品牌身份的力量，在跨 Realm（如 iframe）场景下尤其明显。每个 Realm 拥有独立的全局对象和内置原型，因此 `instanceof` 在跨 Realm 时经常失效：

```js
// <iframe> 中传入的数组
const iframeArray = iframe.contentWindow.Array;
const arr = new iframeArray(1, 2, 3);

console.log(arr instanceof Array); // false
```

`arr` 明明是数组，但 `instanceof` 返回 `false`，因为它的原型链上找不到当前 Realm 的 `Array.prototype`。然而：

```js
console.log(Array.isArray(arr)); // true
```

`Array.isArray()` 正确识别了它。因为它检查的不是原型链，而是调用规范中的 `IsArray` 抽象操作——一个 State 层的品牌检查。规范中明确定义：Array Exotic Object 必须具有 `[[IsArray]]` 内部槽，`IsArray` 正是通过检查这个内部标记来判断的。这个标记不随 Realm 迁移，不因原型链而变，它是数组真正的“身份证”。

#### 4.2.5 品牌封闭的意义

回到第一章的设计问题：**ECMAScript 愿意把多少对象能力交给开发者？**

Behavior 可以开放，因为“如何做”可以自由编排。Semantics 可以部分开放，因为“规则”可以在既定协议内配置。但 Brand——对象“是谁”——必须封闭。因为一旦品牌可以被伪造，一切基于“对象类别”的安全保证都会瓦解：

- 私有字段将不再真正私有。
- 内置方法可以在假对象上执行，访问引擎内部数据结构，导致不可预测的行为甚至内存破坏。
- 跨 Realm 的类型检查将完全不可靠。

State 层的封闭，让品牌成为 ECMAScript 对象模型中最坚固的锚点。它确保：**无论行为如何表演，对象永远只能是自己。**

### 4.3 内存安全：WeakMap 与 GC 的不可见协作

State 层的封闭还有一个非常现实的技术原因：有些内部状态必须直接与垃圾回收器（GC）协作，而 GC 是 JavaScript 完全无法观察和控制的。如果这类内部状态被暴露给开发者，要么会泄露 GC 的实现细节，要么会破坏弱引用的语义。

WeakMap 就是最典型的例子。它的 `[[WeakMapData]]` 槽存储着对键对象的弱引用。当键对象在其他地方不再被引用时，垃圾回收器可以自动清除对应的条目。整个过程对 JavaScript 完全透明——你无法观测 GC 何时运行，也无法干预 GC 的决策。

```js
const wm = new WeakMap();
{
    const key = {};
    wm.set(key, "secret");
}
// key 已不可达，对应条目可能已被回收
```

如果 `[[WeakMapData]]` 是一个可以随意访问的普通槽，开发者就可以在 JavaScript 中模拟 WeakMap。但你做不到——因为维持弱引用语义需要与 GC 的协作，而 GC 是引擎的私有实现。这正是 State 层封闭的另一个维度：**有些东西不可开放，不是因为吝啬，而是因为技术上根本不可能。**

### 4.4 三层归位：对象模型的完整图景

State 层的封闭，为整个对象模型画上了最内圈的句号。至此，Behavior、Semantics、State 三层不再只是分类标签，而是一幅完整的关系图谱。

Behavior 是对象的“面具”，它可以任意更换。一个普通对象、一个数组、一个 Proxy，只要对 `[[Get]]` 的响应方式相同，外界就感知不到差异。这一层的完全开放，赋予了 JavaScript 极高的元编程能力——从不可变数据草稿（Immer）到能力安全沙箱（SES），都建立在这种可替换性之上。

Semantics 是对象的“规则手册”。它不直接行动，却为行为划定边界：可读、可写、可配置、可枚举，以及对象是否参与迭代、如何转换为原始类型。这些规则的声明权交给了开发者，但规则的种类由语言固定。这种“部分开放”的设计，在灵活性与一致性之间找到了一个精确的平衡点。

State 是对象的“身份证”。它保存着那些在任何情况下都不能被否定的基本事实：`[[PromiseState]]` 是否已落定，`[[IsArray]]` 是否为真，`[[PrivateBrand]]` 是否匹配。Behavior 可以表演，Semantics 可以声明，但 State 拥有最终裁判权。Invariant Barrier 的本质，就是 State 对 Behavior 和 Semantics 输出结果的底线校验——你可以编排过程，但不能谎报事实。

三层之间并非简单的上下堆叠，而是在每一次操作中交替作用。一次 `proxy.name = value` 调用链上，Behavior 层的 Proxy trap 先接管控制，接着 Semantics 层的描述符规则介入判断，最终 State 层的不变量检查决定操作是否合法。它们像一套三联锁扣：上层提供灵活性，中层提供结构性，底层提供可靠性。

回看第一章提出的问题——ECMAScript 愿意把多少对象能力交给开发者？答案是：**交给你一切可以被安全地组合、编排、重写的东西，而保留那些一旦开放就会瓦解语言根基的东西。** Behavior 可以自由，因为 State 封闭；Semantics 可以配置，因为不变量不容配置。这条边界不是限制，而是让所有开放得以成立的前提。

这也正是“理解对象模型”真正的终点：不是记住 Proxy 有多少个 trap，不是背下描述符的六个字段，而是理解**自由与边界是一体两面**。在 JavaScript 里，最强大的能力不是改写一切，而是在那道边界之内，用三层各自的能力，设计出既灵活又可靠的对象系统。

---

## 五、工程实践：理论如何落到现实？

三层模型并不是规范分析的纸上谈兵，它早已深刻影响了现代 JavaScript 的工程实践。本章以两个代表性项目——Immer 和 SES——展示 Behavior 层的开放如何在现实世界中转化为截然不同的工程能力。

### 5.1 Immer：行为虚拟化与不可变数据

Immer 是 React 生态中广泛使用的不可变数据工具。它的核心 API 极为简洁：

```js
import { produce } from "immer";

const base = { name: "张三", age: 30 };
const next = produce(base, draft => {
    draft.name = "李四";
    draft.age = 31;
});
```

`produce` 接受一个原始对象 `base` 和一个“修改函数”。在修改函数内部，你可以像操作普通对象一样直接对 `draft` 赋值——`draft.name = "李四"`。但 `base` 不会被改变，`next` 是一个全新的对象。

这看起来很魔法。但在三层模型的视角下，Immer 的魔法本质上就是 **Behavior 层的虚拟化**。

#### 5.1.1 draft 的真实面目

`draft` 并不是 `base` 的浅拷贝，也不是深拷贝。它是一个 Proxy。大致结构如下：

```text
draft: Proxy(base, {
    get(target, key, receiver) {
        // 读取时，记录依赖
        // 如果该属性已被修改，返回修改后的值
        // 否则，递归创建子 draft 或直接返回 target[key]
    },
    set(target, key, value) {
        // 不修改 target
        // 而是把修改记录到内部 patch 表中
        // 标记当前 draft 为已修改
    }
})
```

当你在 `produce` 回调里写下 `draft.name = "李四"` 时，并没有真正执行 `base.[[Set]]("name", "李四")`。引擎确实调用了 `[[Set]]`，但那个 `[[Set]]` 已经被 Proxy 接管。Immer 的 trap 做的事是：**把这次修改记录下来，而不是执行它**。

这正是 2.4 节所描述的 Proxy 工作机制的直接应用：引擎照常调用 Internal Method，但调用被 Proxy 截获，用户代码接管了控制权。

#### 5.1.2 行为重写，状态分离

在三层模型框架下，Immer 的设计可以用一句话概括：

> **Behavior 层被完全重写，State 层保持原始不变。**

`draft` 的行为（`[[Get]]`、`[[Set]]`）被 Immer 完全接管，对外表现为一个“可读写的普通对象”。但它所代理的 `base` 始终没有被触碰——`base` 的 Internal Slot（`[[Extensible]]`、每个属性的 `[[Value]]` 和 `[[Writable]]` 等）维持在原始状态。最终，Immer 根据修改记录，构造一个全新的对象作为 `next`。

这恰好验证了第一章的设计原则：Behavior 可以重新实现，State 构成对象的真实身份。Immer 利用了 Behavior 层的完全开放，同时尊重了 State 层的不可篡改性——它从未尝试修改 `base` 的内部状态，而是用“记录修改 + 生成新对象”的方式维持了不可变语义。

#### 5.1.3 Immer 为什么不直接深拷贝？

一个自然的疑问是：为什么 Immer 不直接在 `produce` 开始时做一次深拷贝，然后在拷贝上让你随便改？答案在于性能。

深拷贝一个大型嵌套对象代价高昂。Immer 的策略是**写时复制（Copy-on-Write）**：只有被你实际修改的属性，才会被浅拷贝。其余未触碰的部分，`base` 和 `next` 共享引用。

```js
const base = { user: { name: "张三", age: 30 }, config: { theme: "dark" } };
const next = produce(base, draft => {
    draft.user.name = "李四";
});

// base.config === next.config  →  true（未被修改，共享引用）
// base.user !== next.user      →  true（被修改，生成了新对象）
```

这种行为依赖于 Proxy 的 `get` trap 能够精确追踪哪些属性被读取、哪些被写入——这正是 Behavior 层高度开放所赋予的能力。如果 `[[Get]]` 不能被拦截，Immer 就无从知道哪些部分需要拷贝。

### 5.2 SES：对象能力安全

Behavior 层的开放还有另一条路线——**能力安全（Capability Security）**，代表项目是 Agoric 维护的 SES（Secure ECMAScript）。

#### 5.2.1 核心思想

SES 解决的问题是：**如何让第三方代码在共享环境中安全运行？**

传统方案是 iframe 沙箱，但通信成本高、跨 Realm 数据共享受限。SES 的思路相反：**不隔离代码，而是限制能力。**

它创建一个 `Compartment`，里面只有被显式授予的全局对象。`document`、`eval`、`Function` 等未授权 API 根本不在全局作用域里：

```js
const c = new Compartment({
    // 只暴露最小必要 API
    console: harden(console),
    fetch: harden(fetch),
    Math: harden(Math),
});

c.evaluate(`
    console.log(Math.sqrt(16));  // 4 — 正常
    document.cookie;             // ReferenceError — document 不存在
    eval("console.log(1)");      // ReferenceError — eval 不存在
`);
```

在这个 `Compartment` 里，`document` 和 `eval` 不可访问，不是因为 iframe 隔离，而是因为它们**从未出现在全局作用域中**。

#### 5.2.2 如何利用 Behavior 层的开放

如果说 Immer 用 Proxy 证明“普通对象能做的，我也能做”，那 SES 就是在证明“语言允许对象做的，我可以不让你全做”。

它的手段分两层：一是冻结内置对象和原型，切断从实例回溯构造器的路径；二是把暴露给 `Compartment` 的全局对象通过 `harden()` 递归冻结，只保留最小必要 API。安全不来自物理隔离，而来自对对象能力的精确剪裁。

用三层模型来看，Immer 和 SES 分别代表了 Behavior 层开放的两种极端方向：

| 维度 | Immer | SES |
|------|-------|-----|
| 开放策略 | 重写行为以增加能力 | 重写行为以限制能力 |
| 核心机制 | Proxy trap 记录修改 | Proxy/冻结构造最小全局 |
| 利用的三层特性 | Behavior 完全接管，State 保持不动 | Behavior 选择性遮蔽，State 锁定 |

两者都建立在 Behavior 层高度开放这一前提之上。没有 Proxy，Immer 无法拦截属性读写来实现写时复制，SES 也无法构造受控全局。

#### 5.2.3 Proxy 的代价

Behavior 层的完全开放带来灵活性的同时，也带来一些代价：

**性能开销**
Proxy 的 trap 每次操作都会触发函数调用，与引擎直接执行 Internal Method 相比有额外开销。Immer 只在 `produce` 回调期间使用 Proxy，结束后返回普通对象，就是对这一点的折中。

**透明性边界**
Proxy 能逼真模拟普通对象，但终究不是普通对象。例如对函数 `[[Call]]` 的内部检查（如 `IsCallable`）在某些路径上会暴露代理与真实函数的差异。

**调试与序列化困境**
`console.log(proxy)` 不易直观反映目标对象状态，`structuredClone`、`JSON.stringify` 等也不天然理解 Proxy。SES 中用 `harden()` 层层冻结，部分原因也是为了避免这类意外。

这些代价不意味着要避免 Proxy，而是提醒你在 Behavior 层重写前做权衡。

### 5.3 使用场景决策

三层模型不仅是理论框架，也可以作为实践中的决策工具。当你面临一个对象设计问题时，可以沿着下面的思路判断哪一层应该承担主要职责：

- **需要改变对象如何响应操作？** → Behavior 层。用 Proxy 和 Reflect 重写 Internal Method。典型场景：日志、校验、虚拟属性、不可变数据草稿。
- **需要声明对象的规则？** → Semantics 层。用 `Object.defineProperty` 配置描述符，或用 Symbol 协议实现迭代、类型转换等语言内置行为。
- **需要定义对象的真实身份？** → State 层。用类定义 + 私有字段确保品牌不可伪造，或者用 `Array.isArray` 等内置方法做可靠的类型检查。

三个场景分别对应三个层次的核心问题——如何做、以什么规则做、是什么——也分别对应三种不同程度的开放与约束。

---

## 六、结语：对象是什么？

第三篇回答“ECMAScript 如何组织对象”，第四篇回答“ECMAScript 为什么只开放一部分对象能力”。
答案可以归结为一句话：Behavior 可以开放，Semantics 可以开放，但 State 必须封闭。

从 ES5 的 Descriptor，到 ES6 的 Proxy、Reflect 与 Symbol，再到 ES2022 的私有字段，ECMAScript 一直在扩大开发者的操控面，却始终没有跨过这道边界。因为 State 承载着不变量、品牌身份、内存安全与引擎优化的所有基石。

这就是 ECMAScript 的设计哲学：给开发者巨大的表达自由，但从不交出定义“真实”的权力。语言的一切灵活性，都建立在“什么是不可改变的事实”这一共识之上。理解这个共识，才是真正理解 JavaScript 对象模型的开始。