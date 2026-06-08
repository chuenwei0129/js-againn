---
title: 从多态到运行时协议：为什么 JavaScript 必须发明 Symbol
created: "2023-02-13"
updated: "2026-05-25"
tags:
  - JavaScript
  - Symbol
description: "Symbol 的真正意义，不是生成不会重复的 key，而是 JavaScript 提供一套稳定的运行时协议机制。"
status: evergreen
---

很多人第一次接触 `Symbol`，记住的通常是一堆零散事实：

- `Symbol() !== Symbol()`
- 它可以作为对象 key
- `Object.keys()` 拿不到它
- 有 `Symbol.iterator`、`Symbol.toPrimitive`、`Symbol.asyncIterator`
- 好像可以“防止属性冲突”

这些都没错。

但如果只停留在这些层面，`Symbol` 会显得非常奇怪：

1. 它不像数组、Promise 那样直接解决业务问题；  
2. 也不像 class、模块化那样立刻改变代码组织方式。

于是很多人学完以后，会有一种感觉：

> “知道它是什么，但不知道它为什么存在。”

真正理解 `Symbol`，关键不是把它当成“特殊 key”。

而是理解：

> JavaScript 到底如何判断“一个对象有没有某种能力”？

而这件事，会一路牵扯到：

- OOP
- 多态
- duck typing
- JavaScript 的对象模型
- 运行时协议（runtime protocol）

---

## 一切要从“多态”开始

在 OOP 流行之前，大型软件靠全局变量加散落的函数组织。项目一大，改一处崩一片。

OOP 用三个承诺终结了这种混乱：

1. **封装**——数据和方法打包在一起，外部不能随意修改内部状态，解决了“改一处崩一片”。
2. **继承**——共性提到父类，子类自动复用，解决了“同样逻辑写 N 遍”。
3. **多态**——调用方只依赖行为接口，不依赖具体类型，解决了“每加一种实现就得改调用方”。

前两个承诺处理的是**代码组织**问题。第三个承诺处理的是**依赖方向**问题。

很多人以为 OOP 的核心是 class。其实不是。真正的核心一直都是：

> 在不知道具体实现的情况下调用行为。

也就是**多态（polymorphism）**。

例如，调用方写下：

```java
animal.move();
```

它并不需要知道 `animal` 到底是 Cat 还是 Bird——只要它能响应 `move()` 即可。

传统 OOP 靠**类型系统 + 继承体系**来实现这一点。你必须先声明关系，编译器才放行：

```java
interface Animal {
    void move();
}

class Cat implements Animal {
    public void move() { System.out.println("猫在跑"); }
}

class Bird implements Animal {
    public void move() { System.out.println("鸟在飞"); }
}

Animal animal = new Bird();
// 调用方只依赖 Animal，不关心具体是谁
animal.move();  // "鸟在飞"
```

`Cat` 和 `Bird` 都声明了“我是 `Animal`”，所以编译器允许它们出现在 `animal.move()` 的位置。运行时的判断逻辑是：**先确认“你是不是这个类型”，再决定“你能不能参与某种行为”。**

这叫 **nominal typing（名义类型）**——“你是谁”决定“你能做什么”。（TypeScript 也有 interface，但机制不同，见附录。）

---

## JavaScript 选择了另一条路

JavaScript 从一开始就不是 class-first language。

它更接近 **behavior-oriented language**，或者 **object capability model**。

它并不特别关心**你是谁**，**你继承自谁**，它更关心**你有没有这个能力**。

于是 JavaScript 大量采用 **duck typing**：

也就是：

> “如果它走起来像鸭子，叫起来像鸭子，那它就是鸭子。”

同样是 `animal.move()`，JavaScript 根本不需要 `interface Animal`：

```javascript
function letItMove(animal) {
  animal.move();
}

letItMove({ move() { console.log('猫在跑'); } });
letItMove({ move() { console.log('鱼在游'); } });
letItMove({ move() { console.log('鸟在飞'); } });
```

这里根本不关心：

- 它有没有 `implements Animal`
- 它有没有继承某个父类
- 它是不是某个 class 的实例

只关心一件事：**它有没有 `move()`。**

于是 JavaScript 的行为判断逻辑开始变成：

> **“你能做什么”决定 runtime 怎么对待你**，而不是“你是谁”决定 runtime 怎么对待你。

这也是为什么：

很多 JavaScript API 本质上都在做：

```javascript
if (typeof obj.xxx === 'function')
```

这样的能力检查。

这个思路看起来完美——直到 runtime 自己也需要检测对象的能力。

## 这时候问题出现了

duck typing 看起来一切美好：用户代码直接调 `animal.move()`，不关心类型，简洁又灵活。

但 JavaScript 不只是用户代码在做这件事——**runtime 自己也要检测能力**。

来看一个经典例子：


```javascript
for (const x of obj) {
  console.log(x);
}
```

这里有个非常关键的问题：

> JavaScript 怎么知道 `obj` 能不能被 `for...of`？

很多人会下意识回答：

> “因为它是数组。”

但其实不是。

下面这个对象，同样可以：

```javascript
const obj = {
  *[Symbol.iterator]() {
    yield 1;
    yield 2;
  }
};

console.log([...obj]); // [1, 2]
```

它既不是数组：

```javascript
Array.isArray(obj); // false
```

也没有继承 Array。

但 runtime 依然允许它参与：

- `for...of`
- 展开运算符 `...`
- `yield*`
- `Array.from()`


为什么？

因为 JavaScript 根本不关心是 Array、Set、Map、Generator 还是自定义 class。它只关心一件事：**你能不能迭代。**

对于：

```javascript
for (const x of obj) {}
```

runtime 必须判断：

> “这个对象能不能被迭代？”

于是它会去检查：

```javascript
obj[Symbol.iterator]
```

如果这个属性存在，并且是函数：

```javascript
typeof obj[Symbol.iterator] === 'function'
```

那么对象就会被视为：

> iterable。

这里发生了一件非常重要的事：

> duck typing 被正式推进成了“语言级协议系统”。

---

## 为什么这会变成大问题？

很多人第一次看到这里，会觉得：

> “那直接用字符串不就行了？”

例如：

```javascript
obj.iterator()
```

或者：

```javascript
typeof obj.iterator === 'function'
```

看起来似乎已经够了。

但问题在于：

> JavaScript 的对象模型是开放的。

---

## 什么叫“开放对象模型”？

在 JavaScript 里：

```javascript
obj.anything = 123;
```

永远成立。

对象：

- 没有固定结构
- 可以随时动态扩展
- 所有属性共享同一个字符串命名空间


例如：

```javascript
const user = {};
user.name = 'seven';
user.age = 18;
user.fetch = fn;
user.iterator = xxx;
```

这意味着：

> JavaScript 需要让“用户属性”和“语言协议”共享同一个对象空间。

而这会产生一个根本矛盾。

---

## JavaScript 的核心矛盾

JavaScript 想同时保留两件事：

### 1. 开放对象模型

任何对象都能动态扩展（`obj.anything = 123`）。

### 2. 可扩展的语言协议

用户自己定义的对象，  
也能参与：

- `for...of`
- `+obj`
- `instanceof`
- `match`
- `await`

这些 runtime 行为。

问题在于：

> runtime 必须稳定识别：
> 
> “这个对象有没有实现某种能力”。

但：

> runtime protocol
> 
> 和
> 
> 业务字段
> 
> 又共享同一个字符串空间。

冲突迟早会发生。

---

## 如果 runtime protocol 使用字符串，会怎样？

假设 JavaScript 规定：

```javascript
obj.iterator()
```

就是 iterable protocol。

那么业务代码完全可能这样写：

```javascript
obj.iterator = fetchNextPage;
```

现在问题来了。

runtime 已经无法分辨：

这个 `iterator` 到底是语言协议入口，还是普通业务字段。

这不是代码风格问题。

而是 JavaScript 对象模型里的结构性问题。

---

## 更严重的问题：语言会失去扩展能力

真正危险的地方还不只是：

> “字段撞名”。

而是：

> JavaScript runtime 将无法继续安全扩展。

因为以后每新增一个协议：

- `iterator`
- `matcher`
- `primitiveConverter`
- `dispose`
- `observable`

都有可能撞业务字段。

这意味着：

> runtime 和业务代码，  
> 永远在争抢同一个字符串空间。

语言演化会越来越脆弱。

---

## 为什么别的方案不行？

### 方案一：改成 class/interface

像 Java 那样：

```java
implements Iterable
```

问题在于：

JavaScript 本身不是 nominal typing。

它不想要求“你必须属于某个类型”。它想表达的是：**只要你实现了这个行为，你就能参与这个协议。** 这正是 duck typing 的核心。

因此：**interface 路线不符合 JavaScript 的语言哲学。**

---

### 方案二：把协议入口藏进引擎内部

那能不能用引擎内部的私有 slot 来做协议入口呢？

不能。引擎内部确实有 internal slot（比如 `[[Prototype]]`、`[[DateValue]]`），你可以把它理解成“出厂焊死的存储格”——只能由引擎在 C++ 层读写，JS 代码碰不到。

如果协议入口放在 slot 里，比如 `[[Iterator]]`，那用户就没法在 JS 层面自行实现了。

你不能：

```javascript
obj.[[Iterator]]
```

而 JavaScript 的核心要求恰恰是：**协议必须对用户开放**。你自己的对象也要能参与 `for...of`。

所以协议入口必须同时满足三个条件：

1. runtime 能稳定识别
2. 用户可以自行实现
3. 不会与普通字段冲突

**这时候 Symbol 才真正变得必要。**

---

## Symbol 真正改变了什么？

> Symbol 创造了一个独立于字符串之外的属性标识空间。

对象 key 从 `string` 变成了 `string | symbol`。

于是 runtime 终于可以安全地在对象上挂协议入口 `obj[Symbol.iterator]`：

- 普通字符串字段不会撞名
- runtime 可以稳定检查
- 用户可以自己实现协议
- 第三方库不容易互相污染

**duck typing 第一次真正变成语言级协议系统。**

---

## for...of 到底发生了什么？

很多人知道：

```javascript
for (const x of obj)
```

会调用 iterator。

但 runtime 实际过程通常没有真正展开。

大致流程是：

```text
for...of
  ↓
读取 obj[Symbol.iterator]
  ↓
拿到 iterator 函数
  ↓
调用该函数（如 obj[Symbol.iterator]()），得到 iterator 对象
  ↓
循环调用 next()
  ↓
读取 { value, done }
```

关键点在于：**runtime 根本不关心 obj 的具体类型。** 它只检查 `obj[Symbol.iterator]`。

这就是语言级 duck typing。

---

## 一个最小实验

```javascript
const obj = {
  *[Symbol.iterator]() {
    yield 1;
    yield 2;
  }
};

console.log([...obj]);
```

输出：

```text
[1, 2]
```

很多人第一次会觉得“只有数组才能展开”。但展开运算符真正检查的并不是 `Array` 类型，而是 `obj[Symbol.iterator]`。

也就是说：

> **行为不是由类型决定的，行为是由协议决定的。**

这是 JavaScript 非常核心的设计思想。

---

## 为什么 Symbol 必须“唯一”？

很多人以为**唯一 = 防止重复**。其实更深层的意义是：**Symbol 的身份不能被字符串伪造。**

例如 `Symbol('id') !== Symbol('id')`，说明**描述文字不是身份**。真正的身份来自那次创建动作本身。

runtime 可以稳定依赖：**这个 Symbol 就代表这个协议**，而不是依赖某段可能撞名的字符串。

---

## Symbol 为什么默认不参与普通枚举？

很多人会误以为 **Symbol = 私有属性**。其实并不是——`Object.getOwnPropertySymbols(obj)` 依然能把它取出来。

所以：

> Symbol 的核心价值是：
> 
> “防冲突”
> 
> 而不是：
> 
> “安全隔离”。

真正的私有字段，  
是后来加入的：

```javascript
#privateField
```

Symbol 更准确的定位是：

> “不属于普通业务字段空间的属性。”

例如：

```javascript
Object.keys()
for...in
JSON.stringify()
```

这些 API 面向的是**业务数据**，而 Symbol 很多时候承载的是协议入口、runtime hooks、元信息、内部行为。因此默认跳过它们，可以避免污染普通数据遍历。

---

## Symbol 真正厉害的地方：runtime hooks

理解 `Symbol.iterator` 以后，会突然发现一件很震撼的事：

> JavaScript runtime 正在把“语言内部行为”开放给用户对象。

例如：

### 对象为什么能参与 `+obj`

```javascript
const obj = {
  [Symbol.toPrimitive]() {
    return 123;
  }
};

console.log(+obj); // 123
```

runtime 会检查：

```javascript
obj[Symbol.toPrimitive]
```

（实际上 `toPrimitive` 方法还会接收一个 hint 参数，用来区分期望的转换类型，但这里核心仍是协议入口。）

---

### `instanceof` 为什么能被改写

```javascript
class MyArray {
  static [Symbol.hasInstance](value) {
    return Array.isArray(value);
  }
}

[] instanceof MyArray; // true
```

runtime 在检查：

```javascript
Ctor[Symbol.hasInstance]
```

---

### 正则匹配也能被 hook

```javascript
const matcher = {
  [Symbol.match](str) {
    return ['custom'];
  }
};

console.log('hello'.match(matcher));
```

---

你会发现：

> Symbol 真正提供的，
> 
> 不是“特殊属性”。

而是：

> runtime extensibility。

也就是：

> JavaScript 把语言内部行为，  
> 变成了用户对象可参与的协议。

---

## ES6 以后，JavaScript 的扩展方式变了

这是 Symbol 一个非常深远的历史意义。

在 ES6 之前：

新增语言能力，  
通常意味着新增 syntax。

但 Symbol 出现以后：

runtime 可以通过：

```javascript
obj[WellKnownSymbol]
```

向用户对象开放协议入口。

例如：

- iterable
- async iterable
- primitive conversion
- regex hooks
- instanceof hooks

全部都开始变成：

> 用户可参与的 runtime behavior。

这是 JavaScript runtime extensibility 的一次巨大升级。

---

## 从更大的历史视角看 Symbol

可以把 Symbol 看成：

```text
duck typing
    ↓
runtime capability checking
    ↓
runtime protocol
    ↓
runtime hooks
```

这条演化路线里的关键一步。

在它之前：

JavaScript 的 duck typing 更像一种：

> “约定”。

在它之后：

开始变成：

> runtime 可识别的语言协议。

后面的：

- iterator protocol
- async iterator
- primitive conversion
- pattern matching hooks

全部建立在这套机制上。

---

## 一个值得长期思考的问题

如果 JavaScript 从一开始就是**强 nominal type system**，它还会需要 Symbol 吗？

或者说：

> Symbol 会不会本质上是动态语言为了“开放协议扩展”而付出的复杂度？

这个问题，其实会一路通向：

- TypeScript 为什么存在
- Rust trait 和 interface 的区别
- protocol-oriented programming
- 动态语言与静态语言的边界
- runtime polymorphism 的设计代价

而 Symbol，只是这条演化路线中的一个关键节点。


## 附录：Symbol 基础 API

> 理解了 Symbol 为什么存在，接下来看看怎么用它。这部分是速查，可以跳过。

创建 Symbol 主要靠两个大哥：`Symbol()` 和 `Symbol.for()`。

`Symbol()` 一调用，就给你一个**全新值**。  
哪怕描述一模一样，也是两个不同的值。

```javascript
const a = Symbol("foo")
const b = Symbol("foo")
console.log(a === b) // false
```

描述只是为了调试方便：

```javascript
console.log(a.description) // "foo"
console.log(String(a))     // "Symbol(foo)"
```

记住两件事：

- 描述相同 ≠ 值相同
- `Symbol` 不是构造函数，**不能 `new`**


```javascript
new Symbol("foo") // ❌ TypeError
```

如果你希望“同一个 key 总是取回同一个 symbol”，可以使用 `Symbol.for(key)`。

它会去**运行时级别的全局 symbol 注册表**中查找：

- 如果这个 key 已经注册过，就直接返回原来的 symbol；
- 否则创建一个新的 symbol，并登记到注册表里。


```javascript
Symbol.for("foo") === Symbol.for("foo") // true
```

要反查注册 key，用 `Symbol.keyFor()`：

```javascript
Symbol.keyFor(Symbol.for("foo")) // "foo"
Symbol.keyFor(Symbol("foo"))     // undefined
```

所以可以这样理解：

普通 Symbol：

```javascript
Symbol('id') !== Symbol('id')
```

因为 identity 来自：

> 创建动作本身。

但：

```javascript
Symbol.for('id') === Symbol.for('id')
```

因为它会进入：

> 全局 Symbol registry。

也就是说：

identity 不再来自创建动作，  
而来自：

```text
'id'
```

这个 registry key。

因此：

`Symbol.for()` 更适合：

- framework protocol
- 跨 realm 通信
- 全局约定

而不是：

- 局部私有 symbol。

这个差异还会影响垃圾回收。  
`Symbol()` 创建的 symbol 没有在全局注册表中登记，当没有任何地方引用它时，就可以被垃圾回收。  
`Symbol.for()` 创建的 symbol 被全局注册表一直持有，只要注册表还在，它就不会被释放。  
如果你不需要跨模块共享同一个 symbol，优先使用 `Symbol()`，可以避免不必要的内存占用。

**Symbol 的另一特殊之处在于它不允许隐式转换为 String 或 Number：**

```javascript
+Symbol() // ❌ Uncaught TypeError: Cannot convert a Symbol value to a number
'' + Symbol() // ❌ Uncaught TypeError: Cannot convert a Symbol value to a string
```

这种限制是因为 Symbol 没有合理的数值语义，语言层面直接禁止了这类模糊行为。如果你还是想转成字符串的话，比如打印的场景，可以有两种办法：

```javascript
String(Symbol("foo")) // "Symbol(foo)"
Symbol("foo").toString() // "Symbol(foo)"
```

前者可能更通用一些，能兼容 null、undefined 等空值。

> 💡 Symbol 转换成 Number 是没有办法的，因此确保 Symbol 值不会进入数学计算中。


## 附录：TypeScript 的 interface 和 Java 的 interface 不是一回事

Java 的 interface 是 **nominal typing**——你必须显式声明 `implements`，编译器才认：

```java
class Cat implements Animal { ... }  // 不写这句就不算
```

TypeScript 的 interface 是 **structural typing**——不看声明，只看结构是否匹配：

```typescript
interface Animal {
  move(): void;
}

const cat: Animal = { move() { console.log('猫在跑'); } };  // ✅ 没写 implements，结构对了就算
```

本质上是把 duck typing 搬到了编译期。

但这恰恰也说明了为什么 interface 路线解决不了 JavaScript 的问题：Symbol 要解决的是 **runtime** 能力检测——代码已经跑起来了，没有编译器帮你做结构匹配。runtime 只能靠一个稳定的标识符去对象上找协议入口，这正是 Symbol 存在的理由。

打个比方：

- **TypeScript 的 interface** 就像一个门卫，在你进大楼之前先查你的身份证。只要你结构长得对，他就放你进去。但他一下班（代码编译完开始运行），就没人查了。
    
- **JavaScript 运行时** 就像是进去之后，大楼里的各种设施。比如有个“可迭代”通道，你必须刷卡才能过。但这个卡不能是一张写着你名字的普通名片（字符串），因为普通名片太容易伪造或和别人撞上。你需要一张**官方特制的、无法复制的门禁卡**。

`Symbol.iterator` 就是这张官方门禁卡。

运行时一看你掏出了这张卡，就知道：“哦，这个对象是支持迭代的，放行。”

如果没有 Symbol，只能用字符串当卡（比如 `obj.iterator`），那就会出问题：业务代码也可能给自己挂一个叫 `iterator` 的属性，和官方卡撞上。运行时根本分不清谁是官方的。