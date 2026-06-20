---
title: JavaScript 对象模型（二）：属性描述符与对象冻结机制
created: 2023-06-05
updated: 2026-06-15
tags:
  - JavaScript
  - Object
description: 从 Writable、Enumerable、Configurable 三类规则，到数据属性与存取器属性、自身属性与继承属性、对象冻结机制——理解 JavaScript 对象如何保存「数据 + 规则」。
status: evergreen
series:
  - name: JavaScript Object Model
    index: 2
---

[[JavaScript/js-object-model-01|上一篇]]我们搞懂了共享行为是怎么来的——Prototype 并不会把方法复制给每个对象，而是在对象之间建立一条**委托关系（Delegation）**。

但还有一个更基本的问题没回答：**不管是自身属性，还是从原型链上继承的属性，它们在对象内部到底是怎么存、怎么管的？**

我们先从对象**自身的属性**看起。多数人第一反应是「属性就是键值对」：

```js
const user = {
  name: 'Tom',
  age: 20,
};
```

于是很自然地以为这个对象内部就是：

```text
Object
 ├── name → "Tom"
 └── age  → 20
```

也就是**键 + 值**。但如果是这样，下面这些现象就说不通了。

---

## 一个反直觉的现象

看一个对象，三个属性：

```js
const obj = {};
Object.defineProperties(obj, {
  id:  { value: 1, configurable: false },
  age: { value: 20, enumerable: false },
  key: { value: 'x', writable: false },
});

delete obj.id;       // ❌ 失败
Object.keys(obj);    // → ['id', 'key']，age 消失
obj.key = 'y';       // 静默失败，obj.key 仍为 'x'
```

删不掉。遍历不到。改不动。三种完全不同的异常表现，却都来自同一套机制。

这套机制就叫 **属性描述符（Property Descriptor）**。

它不关心「属性里到底存了什么」，只关心一件事——

> **这个属性应该如何工作。**

---

## 属性描述符

在 ECMAScript 规范里，一个属性远不止一个值。每个属性内部其实有四个字段：

```text
Property
├── [[Value]]         ← 值
├── [[Writable]]      ← 能不能改
├── [[Enumerable]]    ← 要不要露面
└── [[Configurable]]  ← 结构还能不能动
```

> **注意：这里的 `[[...]]` 和 Internal Slot、Internal Method 长得很像，但它们不是一类东西。**
>
> 一个映像记清三者：
>
> - **Internal Slot** — 藏在对象里的「储物格」，持久存状态，比如 `[[Prototype]]`、`[[Extensible]]`。
> - **Internal Method** — 引擎内置的「操作程序」，管行为，比如 `[[Get]]`、`[[Set]]`。
> - **属性描述符里的 `[[Value]]`、`[[Writable]]` 等** — 只是临时填写的「配置单」，描述某个属性的特性，用完即弃。
>
> 一句话口诀：**Slot 存状态，Method 管行为，Descriptor 做记录。**（完整解析见[[js-object-model-03|第三篇]]。）

来看一个具体例子。写下 `obj.name = 'Tom'` 时，你以为只是存了一个字符串：

```js
const obj = { name: 'Tom' };
```

但对象内部实际保存的是一个完整的描述符：

```js
{
  value: 'Tom',
  writable: true,
  enumerable: true,
  configurable: true
}
```

所以：

> **对象不仅保存数据，还保存：这个数据允许被怎样使用。**

---

## 如何查看与定义描述符

既然属性背后是描述符，自然就有查看和定义它的 API。

查看单个属性的描述符：

```js
const obj = { name: 'Tom' };
Object.getOwnPropertyDescriptor(obj, 'name');
// { value: 'Tom', writable: true, enumerable: true, configurable: true }
```

`Object.getOwnPropertyDescriptor` 只返回对象**自身属性**的描述符。如果要查看继承属性的描述符，需要沿着原型链用 `Object.getPrototypeOf` 逐层查找。（关于自身属性与继承属性的完整行为对照，见附录 B。）

如果想一次性拿到对象上所有自身属性的描述符，可以用 `Object.getOwnPropertyDescriptors`：

```js
Object.getOwnPropertyDescriptors(obj);
```

定义描述符则使用 `Object.defineProperty`：

```js
const obj = {};
Object.defineProperty(obj, 'id', {
  value: 1,
  writable: false,
  enumerable: true,
  configurable: true,
});
```

如果像开头例子那样需要批量定义多个属性，可以用 `Object.defineProperties`：

```js
const obj = {};
Object.defineProperties(obj, {
  id:  { value: 1, configurable: false },
  age: { value: 20, enumerable: false },
  key: { value: 'x', writable: false },
});
```

这里有一个**很容易被忽视的坑**：用 `Object.defineProperty` 定义**新属性**时，如果省略 `writable`、`enumerable`、`configurable`，它们的默认值不是 `true`，而是 **`false`**。

```js
const obj = {};
Object.defineProperty(obj, 'x', { value: 1 });

Object.getOwnPropertyDescriptor(obj, 'x');
// { value: 1, writable: false, enumerable: false, configurable: false }
```

这和直接赋值截然不同：

```js
const obj = {};
obj.x = 1;

Object.getOwnPropertyDescriptor(obj, 'x');
// { value: 1, writable: true, enumerable: true, configurable: true }
```

也就是说，`Object.defineProperty` 在「新增属性」时是「显式配置」，未指定的字段会被保守地设为 `false`；而 `obj.x = 1` 是「宽松赋值」，未指定的字段会被设为 `true`。

如果是**修改已有属性**，`Object.defineProperty` 未指定的字段会保持原值不变：

```js
const obj = {};
obj.x = 1; // 默认 writable: true, enumerable: true, configurable: true

Object.defineProperty(obj, 'x', { writable: false });
Object.getOwnPropertyDescriptor(obj, 'x');
// { value: 1, writable: false, enumerable: true, configurable: true }
```

> 到这里可以先停一下：我们已经从“属性 = 值”的观念，转到了“属性 = 规则容器”。这种视角切换是理解后续一切行为的关键。

---

## 属性描述符的规则

### Writable，值能不能改

Writable 控制**赋值操作**是否生效。

```js
const obj = {};
Object.defineProperty(obj, 'id', {
  value: 1,
  writable: false,
});

obj.id = 100;
console.log(obj.id);  // 1
```

在非严格模式下，赋值没有报错，但被静默拒绝。属性还在，只是**不可变**。在严格模式（`'use strict'`）下，对不可写属性赋值会直接抛出 `TypeError`。

这不是为了增加限制，而是为了表达：

> **这个值就是不应该被改变的。**

JavaScript 自身大量使用 `writable: false` 来保护内建属性，比如 `Math.PI`。你不希望 `Math.PI = 100` 真的成功。

### Enumerable，属性要不要露面

Enumerable 决定**属性是否参与枚举**。

`for...in`、`Object.keys()`、`JSON.stringify()` 遍历的不是对象的所有属性，而是**可枚举属性（Enumerable Property）**。

```js
const obj = { name: 'Tom' };
Object.defineProperty(obj, 'age', {
  value: 20,
  enumerable: false,
});

console.log(Object.keys(obj));  // ['name']
```

`age` 明明存在，但从枚举结果里消失了，因为 `enumerable: false`。

这也是为什么内建方法（如 `Array.prototype.push`、`Object.prototype.toString`）不会出现在 `for...in` 里——它们默认都是不可枚举的。否则遍历一个数组，会带出几十个方法。

### Configurable，属性结构还能不能改

Configurable 控制的是**属性本身的配置能否继续调整**，包括：

- 能否删除这个属性
- 能否改变 `enumerable` 或 `configurable` 本身
- 能否在数据属性与存取器属性之间切换

注意，它**不**控制值的修改——那是 Writable 的职责。

```js
const obj = {};
Object.defineProperty(obj, 'id', {
  value: 1,
  configurable: false,
});

delete obj.id;                  // ❌ 失败
Object.defineProperty(obj, 'id', {
  enumerable: true,             // ❌ 失败
});
```

一旦 `configurable` 设为 `false`，属性的结构就锁死了。用一张表来记二者的分工：

| 你想做这个 | 谁说了算 |
|-----------|---------|
| 修改属性的值 | `Writable` |
| 删除属性 | `Configurable` |
| 改变 `enumerable` / `configurable` | `Configurable` |
| 数据属性 ↔ 存取器属性互转 | `Configurable` |

一句话：

> **Writable 管值，Configurable 管这个属性「长什么样」。**

#### 不可逆转："锁死"意味着什么

但 `configurable: false` 还有一个更深层的事实：它是**不可逆转的**。你甚至不能把 `configurable` 本身改回 `true` 来"解锁"。根据 ECMAScript 规范，一旦属性的 `configurable` 为 `false`：

1. **禁止删除**该属性。
2. **禁止修改 `configurable` 和 `enumerable`**（只能维持原样）。
3. **禁止在数据属性和存取器属性之间切换**——不能把 `value`/`writable` 改成 `get`/`set`，反之亦然。
4. 数据属性的话，`writable` 只能从 `true` 改为 `false`（允许"收紧"，不允许"放松"），而 `value` 能否修改取决于 `writable` 当前的值。

所以，试图把 `configurable` 改回 `true` 这种"开锁"动作，本身就是被锁死的：

```js
const obj = {};
Object.defineProperty(obj, 'id', {
  value: 1,
  configurable: false,
});

Object.defineProperty(obj, 'id', {
  configurable: true,           // ❌ TypeError: Cannot redefine property
});
```

#### 案例：数组的 `length`

这一规则最典型的应用是数组的 `length`。引擎在创建数组时，`length` 的初始描述符就是：

```js
{
  value: 0,
  writable: true,
  enumerable: false,
  configurable: false           // 硬编码为 false
}
```

这是 JavaScript 设计的一部分——确保数组的 `length` 始终作为一个"内部维护的长度数据"存在。如果允许外部把 `length` 改成 getter/setter，数组的自动更新 `length`、截断多余元素等内部机制都会紊乱。

```js
const arr = [1, 2, 3];

Object.defineProperty(arr, 'length', {
  configurable: true             // ❌ TypeError: Cannot redefine property
});
```

引擎直接抛出类型错误，完全不可能成功。

这也揭示了一个实践上的结论：正因为 `configurable: false` 不可逆转，`Object.defineProperty` 从根本上无法劫持数组的 `length`。要想拦截 `length` 的变化，必须用 `Proxy`——Proxy 是在对象外部做代理，不需要修改原始属性的描述符。

> 最后，第 4 条规则中 `writable` 只能 `true → false` 这个"单向收紧"看起来像例外，但本质一致：把可写变成只读，属性仍然是数据属性，结构没有变——加固约束是安全的；反向则是放松约束，会打破既有的结构稳定性。（这一行为的深度解释见附录 A。）

#### Configurable 与原型链

`configurable: false` 的约束会**沿原型链产生连锁反应**。如果一个属性定义在原型上且 `configurable: false`，子对象就无法通过 `Object.defineProperty` 直接创建同名自有属性——这是为了防止"遮蔽（shadow）"不可配置的原型属性，破坏对象的行为一致性。

```js
const proto = {};
Object.defineProperty(proto, 'id', {
  value: 1,
  configurable: false,
});

const child = Object.create(proto);

Object.defineProperty(child, 'id', {
  value: 2,                    // ❌ TypeError
});
```

但这里有一个微妙的区别：`defineProperty` 被拒绝，不等于赋值操作也会失败。

```js
child.id = 2;                  // ✅ 成功，在 child 上创建自有属性
```

为什么？因为赋值走的是 `[[Set]]` 内部方法——它发现原型上的 `id` 是数据属性且 `writable: true`，就会在子对象上创建自有属性，而不是去修改原型。`defineProperty` 则更"底层"，它检测到同名不可配置属性存在于原型链上，直接拒绝。

如果把原型的 `writable` 也设为 `false`：

```js
Object.defineProperty(proto, 'id', {
  value: 1,
  writable: false,
  configurable: false,
});

child.id = 2;                  // ❌ 静默失败（严格模式报 TypeError）
```

赋值被彻底堵死——`writable: false` 阻止了值的覆盖路径。

总结这条规则的直觉模型：

> 原型上的 `configurable: false` 属性像一个"锚"——它禁止后代通过 `defineProperty` 重新定义同名属性（防止结构性的遮蔽），但如果锚本身允许写入（`writable: true`），赋值操作仍然可以自然地"盖一层"自有属性上去。

---

## 存取器属性：当属性背后是逻辑

上面说的都是**数据属性（Data Property）**，它有 `[[Value]]` 和 `[[Writable]]`。

ES5 还引入了另一种属性——**存取器属性（Accessor Property）**，用 `[[Get]]` 和 `[[Set]]` 代替了 `[[Value]]` 和 `[[Writable]]`，用来拦截属性的读写操作。

| 类型    | 结构                                                             |
| ----- | -------------------------------------------------------------- |
| 数据属性  | `[[Value]]` `[[Writable]]` `[[Enumerable]]` `[[Configurable]]` |
| 存取器属性 | `[[Get]]` `[[Set]]` `[[Enumerable]]` `[[Configurable]]`        |

两对互斥：一个属性要么是数据属性，要么是存取器属性，不能同时拥有。如果你试图混用，会直接报错：

```js
// ❌ TypeError: Invalid property descriptor.
Object.defineProperty(obj, 'x', {
  value: 1,
  get() { return 2; },
});
```

定义存取器属性：

```js
const obj = {};
Object.defineProperty(obj, 'name', {
  get() { return this._name; },
  set(val) { this._name = val; },
  enumerable: true,
  configurable: true,
});
```

`get` 和 `set` 可以不成对出现。缺 `set` 就是只读，缺 `get` 就是只写。Vue 2 的响应式系统就是利用这一特性来追踪数据变化的。

---

## 统一心智模型：Key → Descriptor → 行为

在进入对象级规则之前，先停下来做一个认知压缩。

前面的所有内容，都可以收敛到一个极简模型：

```text
对象不是一个简单的存储结构，而是一个"Key → 行为规则 → 值"的映射系统。

Object
 ├── Key
 │    └── Descriptor
 │           ├── Value / Get / Set
 │           ├── Flags (Writable, Enumerable, Configurable)
 │           └── Behavior Rules (读 / 写 / 删 / 枚举 / 结构变更)
 └── Prototype Chain (fallback lookup)
```

当你再看到 `obj.x = 1` 时，脑子里浮现的不再是"存个值"，而是"为键 `'x'` 创建一个附带默认规则的数据描述符"。

---

## 对象冻结：对象规则与属性规则

Descriptor 管的是单个属性的行为。但对象本身也有一套规则，这里我们要介绍的一个对象级状态是：

```text
Object
├─ [[Extensible]]
└─ Properties
      ↓
   Descriptor
```

- `[[Extensible]]`：还能不能在这个对象上添加新属性。
- `Properties`：每个属性的 Descriptor。

`Object.isExtensible(obj)` 检查的就是 `[[Extensible]]`，而不是属性：

```js
const obj = {};
Object.isExtensible(obj); // true
Object.preventExtensions(obj);
Object.isExtensible(obj); // false
```

`preventExtensions`、`seal`、`freeze` 其实是先修改对象级规则，再批量调整属性描述符：

| 方法 | 对象级 | 属性级 |
|------|--------|--------|
| `preventExtensions` | `[[Extensible]] → false` | 无 |
| `seal` | `[[Extensible]] → false` | 所有属性 `configurable: false` |
| `freeze` | `[[Extensible]] → false` | 所有属性 `configurable: false`，数据属性 `writable: false` |

三者都是**浅层**操作，只冻结对象自身的属性，不会递归冻结属性值指向的对象。

这样就看清楚了：冻结不是单纯的属性操作，而是**对象级规则 + 属性级规则**的组合。

这里有一个反直觉的事实：`Object.freeze()` 冻结对象时，会把数据属性的 `writable` 设为 `false`，也会把存取器属性的 `configurable` 设为 `false`；但它**不会删除已有的 getter / setter**。因此，即使对象被冻结，setter 内部仍然可能修改外部状态。我们来验证一下：

```js
const obj = {};
let val = 1;
Object.defineProperty(obj, 'x', {
  get() { return val; },
  set(v) { val = v; },
});
Object.freeze(obj);

console.log(Object.getOwnPropertyDescriptor(obj, 'x'));
// { get: [Function: get], set: [Function: set], enumerable: false, configurable: false }

obj.x = 2;           // setter 仍然被调用，没有报错
console.log(obj.x);  // 2，因为 setter 修改了外部变量 val
console.log(val);    // 2
```

冻结没有移除 `setter`，setter 内部对外部状态的修改仍然生效。换句话说，`Object.freeze()` 把存取器属性的 `configurable` 也锁死了，所以你**不能再通过 `Object.defineProperty` 删除或替换这个 setter**。

> 一个精准的认知：冻结的是对象的**结构可变性**，不是运行时的**状态流动性**。JavaScript 冻结对象，不是停止时间，而是锁住边界。

---

## 总结：对象的结构总览

现在可以回答开头的问题了：

> **对象自身到底保存了什么？**

对象保存的不是 Key-Value 对，而是 **Key-Descriptor 对**。每个属性名指向一个描述符，描述符里包含值，以及这个值应当如何被访问、修改、删除、枚举的规则。

当你写下 `obj.name = 'Tom'` 时，JavaScript 悄悄帮你填入了一组默认规则（`writable: true, enumerable: true, configurable: true`）。而 `Object.defineProperty` 让你可以亲手定制这些规则。

所谓「对象」，本质上就是一个由规则保护的数据集合。

很多人以为：

```text
Object = Key + Value
```

实际上：

```text
Object = Key + Descriptor
```

**Value 只是 Descriptor 的一部分。**

对象的完整结构可以概括成下面这张图：

```text
Object
│
├── [[Prototype]]
│
├── [[Extensible]]
│
└── Properties
     │
     ├── Data Property
     │     ├── [[Value]]
     │     ├── [[Writable]]
     │     ├── [[Enumerable]]
     │     └── [[Configurable]]
     │
     └── Accessor Property
           ├── [[Get]]
           ├── [[Set]]
           ├── [[Enumerable]]
           └── [[Configurable]]
```

三句话总结：

> - **Prototype** 决定“去哪找属性”。
> - **Descriptor** 决定“属性如何工作”。
> - **Extensible** 决定“还能不能新增属性”。

[[JavaScript/js-object-model-01|上一篇]]讲清了 Prototype 的委托机制，本篇则补齐了属性描述符与对象级规则。把这三个维度分开理解，JavaScript 对象的很多"玄学行为"都会变得清晰可预测。

---

## 附录

### 附录 A：为什么 `configurable: false` 时 `writable` 还能单向修改？

从规范行为可以归纳出一种稳定性约束模型：`configurable` 的目的是保证对象**结构**和**表达方式**的稳定性，而不是完全锁定对象。把一个可写属性变成只读（`writable: true → false`），并不改变属性的结构——它仍然是一个数据属性，仍然有 `value` 和 `writable`，只是变得更严格了。反过来（`false → true`）则是放松约束，会打破原本的结构稳定性，因此被禁止。

### 附录 B：自身属性、继承属性与 `hasOwn`

前面用到的 `Object.defineProperty`、`Object.getOwnPropertyDescriptor` 等 API，都只作用于对象**自身**的属性。理解「自身属性」和「继承属性」的区别，几乎所有属性操作的行为边界就清楚了。

```js
const obj = Object.create({ x: 1 });  // x 在原型上
obj.y = 2;                            // y 是自身属性
```

下面这张表列出了常见操作分别对自身属性和继承属性的反应：

| 操作 | 只查自身 | 查询原型链 |
|------|---------|------------|
| `obj.prop` | ✅ | ✅ |
| `prop in obj` | ✅ | ✅ |
| `Object.keys()` | ✅ | ❌ |
| `obj.hasOwnProperty('prop')` | ✅ | ❌ |
| `Object.hasOwn(obj, 'prop')` | ✅ | ❌ |
| `Object.getOwnPropertyDescriptor()` | ✅ | ❌ |

`delete obj.x` 只删除自身属性，不会沿着原型链向上删。这里 `obj` 自身没有 `x`，所以 `delete` 什么也没发生，原型上的 `x` 不受影响。但 `'x' in obj` 仍然返回 `true`，因为 `in` 不区分自身和继承。

判断自身属性，推荐用 `Object.hasOwn(obj, 'prop')`。`hasOwnProperty` 有两个常见风险：

1. **对象可能没有继承 `Object.prototype`**：`Object.create(null)` 创建的对象原型为 `null`，它上面没有 `hasOwnProperty` 方法，调用会直接报错。
2. **对象可能覆盖了 `hasOwnProperty` 方法**：万一有人给对象自身定义了一个叫 `hasOwnProperty` 的属性或方法，调用 `obj.hasOwnProperty()` 就会得到那个覆盖的版本，结果不可预期。

`Object.hasOwn` 是 ES2022 引入的静态方法，不依赖原型链，杜绝了上述两种风险。日常开发中建议优先使用它。

### 附录 C：属性名与遍历顺序

属性名（Property Key）有一个常被忽视的事实：规范里 Key 只有两种——String 和 Symbol。

所谓的「整数键」`obj[0]` 其实是符合整数索引格式的字符串键 `obj['0']`，`obj[2]` 和 `obj['2']` 是同一个键。只是引擎在遍历时会把符合整数索引规则的字符串键优先按数值排序处理，表现得像第三种键。一个最直接的证据：

```js
typeof Object.keys({ 1: 1 })[0];
// "string"
```

对于普通对象，整数键并不会让描述符规则失效——`writable`、`enumerable`、`configurable` 对它同样适用。Key 的类型改变的只是遍历顺序，而不是描述符语义。

遍历顺序是：整数索引键（按数值升序）→ 其他字符串键（按插入顺序）→ Symbol 键（按插入顺序）：

```js
const obj = {};
obj['b'] = 1;
obj[2] = 2;
obj[1] = 3;
obj['a'] = 4;
obj[Symbol('s')] = 5;

Object.keys(obj);        // ['1', '2', 'b', 'a']
Reflect.ownKeys(obj);    // ['1', '2', 'b', 'a', Symbol(s)]
```

### 附录 D：`Object.getOwnPropertyDescriptors` 与浅拷贝

`Object.getOwnPropertyDescriptors` 常与 `Object.create` 配合使用，实现一个比普通浅拷贝更"完整"的复制——它不只复制值，还会把描述符信息一并带过去：

```js
const original = {
  name: 'Tom',
  get upperName() { return this.name.toUpperCase(); },
};

const copy = Object.create(
  Object.getPrototypeOf(original),
  Object.getOwnPropertyDescriptors(original)
);

copy.name;       // 'Tom'
copy.upperName;  // 'TOM'
```

相比之下，`Object.assign({}, original)` 会忽略 getter，直接读取并复制 getter 的返回值：

```js
const assignCopy = Object.assign({}, original);
assignCopy.upperName; // 'TOM' — 它已经是一个普通字符串值
```

因此，当你需要保留 getter/setter 以及 `enumerable`、`configurable` 等元信息时，`Object.getOwnPropertyDescriptors` + `Object.create` 是更合适的选择。不过要注意，这也只是一个**浅拷贝**——如果属性值是对象，复制后的引用仍然指向同一个对象。

### 附录 E：TypeScript 中的属性描述符类型

在 TypeScript 中，属性描述符的类型定义如下：

```ts
interface PropertyDescriptor {
    configurable?: boolean;
    enumerable?: boolean;
    value?: any;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
}
```

需要注意：这个类型定义并未在类型层面体现 `value/writable` 与 `get/set` 的互斥关系。实际使用时，不能将两者混在同一个描述符对象中，否则运行时会报错。

### 附录 F：属性描述符的历史（ES3 → ES5）

在 ES3 时代，规范规定一个对象属性可以包含 3 个 Attribute：

1. ReadOnly
2. DontEnum
3. DontDelete

从 ES5 开始，重新设计了属性的结构，统一为 6 种属性参数：

1. `[[Value]]`
2. `[[Writable]]`
3. `[[Get]]`
4. `[[Set]]`
5. `[[Enumerable]]`
6. `[[Configurable]]`

`[[Enumerable]]` 和 `[[Configurable]]` 始终在场，而 `[[Value]]`+`[[Writable]]` 与 `[[Get]]`+`[[Set]]` 互斥，分别构成数据属性和存取器属性。这个重新设计让属性的控制更加精细和统一。