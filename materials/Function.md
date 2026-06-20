---
title: typeof 为什么分不清函数？——从 [[Call]] 揭开 JavaScript 函数的本质
created: 2023-01-15
updated: 2026-06-09
tags:
  - JavaScript
  - Function
description: 从 typeof 的"反直觉"行为出发，深入 ECMAScript 规范的 [[Call]] / [[Construct]] 内部槽位，揭示 JavaScript 函数的本质——它是特殊对象，不同写法改变的是内部行为，而非仅仅是语法糖。
status: evergreen
---

你写过多少种函数？

```js
function foo() {}           // 函数声明
const bar = function() {}  // 函数表达式
const baz = () => {}       // 箭头函数
async function qux() {}    // 异步函数
function* corge() {}       // 生成器函数
// 异步生成器函数
class Grault {}            // 类

```

它们的写法完全不同，能力也天差地别——有的不能 `new`，有的不能 `this`，有的不能 `super`。但如果你问 `typeof`：

```js
typeof foo  // 'function'
```

全是 `'function'`。

一个箭头函数、一个类、一个生成器函数——行为截然不同，`typeof` 却告诉你它们是同一种东西。

为什么？答案藏在 ECMAScript 规范的一个内部槽位里。

---

## 一、函数的本质：[[Call]]

ECMAScript 规范对"函数"的定义非常精确：

> 一个函数对象，就是内部存在 `[[Call]]` 方法的对象。

仅此而已。`typeof` 的规范逻辑就是检测对象有没有 `[[Call]]`——有，返回 `'function'`；没有，返回 `'object'`。

所以上面那些看起来完全不同的东西，之所以 `typeof` 全是 `'function'`，正是因为它们全都有 `[[Call]]`。它们都是"可调用的对象"。

但"可调用"和"可构造"不是一回事。规范还定义了另一个内部槽位 `[[Construct]]`——只有同时拥有 `[[Call]]` 和 `[[Construct]]` 的函数，才能用 `new` 调用。

这造成了一个关键的分裂：**同样是函数，有的能 `new`，有的不能。**

```js
new function() {}  // ✅ 普通函数，可以
new (() => {})     // ❌ TypeError: (...) is not a constructor
new class {}       // ✅ 类，可以（但类必须用 new 调用）
```

所以函数不是一个均匀的类别。它是"可调用对象"这个大伞下，内部行为各异的多个物种。

---

## 二、全貌：一张对比表看尽函数差异

在逐个展开之前，先看全貌。不同类型的函数，在规范层的行为差异远不止"能不能 `new`"这一条：

| 内部行为 | 普通函数 | 箭头函数 | 异步函数 | 生成器函数 | 异步生成器函数 | 类 |
|---|---|---|---|---|---|---|
| `[[Call]]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `[[Construct]]` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅（必须 new） |
| 自己的 `this` | ✅ | ❌（词法 this） | ✅ | ✅ | ✅ | ✅（必须 new） |
| `arguments` | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `super` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `prototype` | ✅ | ❌ | ❌ | ✅ | ❌ | ✅（不可写） |
| `[[HomeObject]]` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

这张表说明了一件事：**当你选择不同的函数写法，你不只是在选语法，你在选一整套内部行为。**

接下来我们逐个维度看，为什么这些差异存在，以及它们在运行时会产生什么后果。

---

## 三、写法不同，连解析阶段的行为都不同

在进入内部槽位之前，还有一个更"浅层"但同样容易被忽视的差异：**函数声明和函数表达式的提升行为不同。**

```js
console.log(foo); // [Function: foo] — 整个函数体都被提升了
foo();            // 可以正常调用

function foo() {
  return '函数声明';
}
```

```js
console.log(bar); // undefined — 变量声明提升了，但赋值没有
// bar();         // TypeError: bar is not a function

var bar = function() {
  return '函数表达式';
};
```

```js
// console.log(baz); // ReferenceError: Cannot access 'baz' before initialization

const baz = function() {
  return 'const 函数表达式';
};
```

三种写法，三种提升行为：

| 写法 | 变量提升 | 值提升 | 访问时机 |
|---|---|---|---|
| 函数声明 | ✅ | ✅ 整个函数体 | 声明前可用 |
| `var` 函数表达式 | ✅ | ❌ | 声明前为 `undefined` |
| `let/const` 函数表达式 | ✅（TDZ）| ❌ | 声明前报 ReferenceError |

同样是"定义一个函数"，写在声明位置之前能不能用，取决于你是怎么写的。

但提升的差异只在解析阶段。函数真正的"物种差异"，藏在运行时的内部槽位里。

---

## 四、[[Construct]]：为什么有的函数不能 new

`[[Construct]]` 决定了函数能不能用 `new` 调用。普通函数同时拥有 `[[Call]]` 和 `[[Construct]]`，所以两种调用方式都支持：

```js
function Person(name) {
  this.name = name;
}

Person('Alice');     // 作为函数调用，this 指向全局
new Person('Alice'); // 作为构造函数调用，this 指向新创建的对象
```

但箭头函数只有 `[[Call]]`，没有 `[[Construct]]`：

```js
const Foo = () => {};
new Foo(); // ❌ TypeError: Foo is not a constructor
```

为什么？因为箭头函数没有自己的 `this`。而 `new` 的规范流程是：

1. 创建一个新对象
2. 将这个新对象绑定为函数的 `this`
3. 执行函数体
4. 返回这个新对象

第 2 步需要一个可以被绑定的 `this`，但箭头函数的 `this` 在定义时就已固定（词法 `this`），无法被 `new` 绑定。所以规范直接规定箭头函数没有 `[[Construct]]`，从源头上禁止了这个行为。

同样的逻辑适用于异步函数和生成器函数——它们的返回值（Promise / 迭代器）与 `new` 的语义（返回 `this` 绑定的新对象）根本冲突：

```js
async function foo() {
  return 1;
}

foo(); // Promise {<resolved>: 1}
// new foo() 的语义是"返回 this"，但 async 已经决定了返回 Promise，两者矛盾

function* bar() {
  yield 1;
}

bar(); // Generator {<suspended>}
// 生成器函数返回迭代器，不是 this 绑定的新对象
```

所以异步函数、生成器函数、异步生成器函数都没有 `[[Construct]]`。理解了这个矛盾，就不用死记"哪些函数不能 new"——**返回值语义与 `new` 冲突的，都不能 `new`。**

类的情况稍有不同。类有 `[[Construct]]`，但它**必须**用 `new` 调用：

```js
class Foo {}
Foo(); // ❌ TypeError: Class constructor Foo cannot be invoked without 'new'
```

这是规范对类的特殊约束：类的 `[[Call]]` 会直接抛出 TypeError。

---

## 五、arguments：箭头函数为什么没有

普通函数在运行时会自动创建一个 `arguments` 对象：

```js
function foo(a, b) {
  console.log(arguments); // [Arguments] { '0': 1, '1': 2 }
}

foo(1, 2);
```

但箭头函数没有：

```js
const bar = () => {
  console.log(arguments); // ❌ ReferenceError: arguments is not defined
};

bar(1, 2);
```

原因要回到规范中的 `Function Environment Record`。普通函数在调用时会创建一个新的环境记录，其中包含 `this` 绑定和 `arguments` 对象。但箭头函数创建的环境记录中，`HasThisBinding()` 返回 **false**，`HasArgumentsBinding()` 也返回 **false**——它不创建自己的 `arguments`，也不创建自己的 `this`。

如果你在箭头函数里写了 `arguments`，它不会在自身作用域找到，而是顺着作用域链往外找，直到找到外层普通函数的 `arguments`，或者最终报 ReferenceError。

异步函数、生成器函数有自己的 `arguments`，因为它们创建的是完整的 `Function Environment Record`。

不过，ES6 引入剩余参数之后，`arguments` 已经不推荐使用了：

```js
// 旧写法
function sum() {
  return Array.from(arguments).reduce((a, b) => a + b, 0);
}

// 新写法
const sum = (...nums) => nums.reduce((a, b) => a + b, 0);
```

剩余参数是真正的数组，没有 `arguments` 的类数组问题。箭头函数不能用 `arguments`，反而逼着你用更好的替代方案。

---

## 六、prototype：什么地方有，什么地方没有

普通函数在定义时，规范会自动给它创建一个 `prototype` 属性：

```js
function Foo() {}

console.log(Foo.prototype); // { constructor: Foo }
```

这个 `prototype` 对象上默认有一个 `constructor` 属性指回函数本身，并且它是不可枚举的：

```js
Object.getOwnPropertyDescriptor(Foo.prototype, 'constructor');
// {
//   value: Foo,
//   writable: true,
//   enumerable: false,
//   configurable: true
// }
```

这意味着 `for...in` 遍历实例时不会遍历到 `constructor`，但你可以通过 `instance.constructor` 访问到它。

当你用 `new Foo()` 创建实例时，实例的 `[[Prototype]]` 会指向 `Foo.prototype`：

```js
function Foo() {}
const foo = new Foo();

Object.getPrototypeOf(foo) === Foo.prototype; // true
foo instanceof Foo; // true
```

这就是 JavaScript 原型链的基础——所有由同一个构造函数创建的实例，都共享 `Foo.prototype` 上的属性和方法。

```js
function Foo(name) {
  this.name = name;
}

Foo.prototype.sayHi = function() {
  return `Hi, I'm ${this.name}`;
};

const a = new Foo('Alice');
const b = new Foo('Bob');

a.sayHi(); // "Hi, I'm Alice"
b.sayHi(); // "Hi, I'm Bob"

a.sayHi === b.sayHi; // true — 同一个方法，内存里只有一份
```

但不是所有函数都有 `prototype`：

| 函数类型 | `prototype` | 原因 |
|---|---|---|
| 普通函数 | ✅ | 可作为构造函数 |
| 箭头函数 | ❌ | 不能当构造函数，没有 `new`，不需要 |
| 异步函数 | ❌ | 返回 Promise，不是 `this` 绑定的新对象 |
| 生成器函数 | ✅ | `GeneratorFunction.prototype`，但不是用于 `new` |
| 类 | ✅ | 不可写、不可删除 |

```js
function normal() {}
console.log(normal.prototype); // { constructor: normal }

const arrow = () => {};
console.log(arrow.prototype); // undefined

async function asyncFn() {}
console.log(asyncFn.prototype); // undefined

class MyClass {}
console.log(MyClass.prototype); // { constructor: class MyClass }
Object.getOwnPropertyDescriptor(MyClass, 'prototype').writable; // false
```

注意生成器函数是个特殊case——它有 `prototype`，但这个 `prototype` 不是用于 `new` 的：

```js
function* gen() {}
console.log(gen.prototype); // gen {} — 存在，但它是 GeneratorFunction 的 prototype

// 实际上，生成器函数的 prototype 和普通函数的不同：
Object.getPrototypeOf(gen.prototype) !== Object.prototype;
// 生成器函数的 prototype 继承自 GeneratorFunction.prototype
```

类的 `prototype` 还有一个特殊之处：它是不可写的。你不能像普通函数那样随意替换类的 prototype：

```js
function Foo() {}
Foo.prototype = { custom: true }; // ✅ 可以替换

class Bar {}
Bar.prototype = { custom: true }; // ❌ 静默失败，prototype 不会被替换
```

到这里，prototype 只是"构造函数创建实例时的原型对象"，更深入的原型链机制——`[[Prototype]]`、属性查找链、`Object.create()` 等——不在本篇展开。

> 💡 `prototype` 属性和 `[[Prototype]]` 是两个东西。`prototype` 是函数上的属性，`[[Prototype]]` 是对象上的内部槽位，指向它的原型。`Object.getPrototypeOf(obj)` 访问的是后者。为什么类必须用 `new` 调用？为什么替换 prototype 静默失败？这些在后续的 class 篇会深入。

---

## 七、this 和 super：点到即止

`this` 和 `super` 的行为差异是函数类型差异中最常被讨论的部分，但本篇只点到为止——因为 `this` 会单独写一篇深入展开。

这里只说清楚一件事：**每种函数类型的 `this` 绑定规则不同。**

```js
const obj = {
  name: 'Alice',

  regular: function() { return this.name; },
  arrow: () => { return this?.name; },
  async: async function() { return this.name; },
  generator: function*() { return this.name; },
  method() { return this.name; },
};

obj.regular();   // 'Alice' — this 指向调用对象
obj.arrow();     // undefined — this 指向外层作用域（全局/模块）
obj.async();     // 'Alice' — this 指向调用对象
obj.generator(); // 返回迭代器，迭代器中的 this 指向调用对象
obj.method();    // 'Alice' — this 指向调用对象
```

箭头函数的 `this` 是**词法绑定**——它不创建自己的 `this`，而是沿作用域链向外查找最近的 `this`。这意味着 `call`、`apply`、`bind` 对箭头函数的 `this` 无效：

```js
const arrow = () => { return this; };

arrow.call({ name: 'Bob' });  // window / globalThis
arrow.bind({ name: 'Bob' })(); // window / globalThis
```

这不是"箭头函数忽略了 `call`"，而是箭头函数根本**没有**自己的 `this` 可以被绑定。`call` 和 `bind` 传入的 `thisArg` 被规范直接忽略了。

`super` 的情况更严格——它不是"沿作用域链查"那么简单，它要求函数必须有 `[[HomeObject]]` 才能使用。这就是下一节的内容。

---

## 八、[[HomeObject]]：函数和方法的真正区别

在大多数 JavaScript 开发者的认知里，"函数"和"方法"只是同一个东西在不同语境下的叫法。挂在对象上的叫方法，独立存在的叫函数。

但从 ES6 开始，规范层面有一个重要的区分：**MethodDefinition 定义的方法有 `[[HomeObject]]` 内部槽位，函数表达式没有。**

```js
const obj = {
  // 这是 MethodDefinition，有 [[HomeObject]]
  foo() { return super.toString(); }, // ✅ 可以用 super

  // 这是函数表达式，没有 [[HomeObject]]
  bar: function() { return super.toString(); }, // ❌ SyntaxError
};
```

这两种写法看起来几乎一样——都是给对象挂一个函数属性——但在规范层面，`foo` 用的是 MethodDefinition 语法（`foo() {}`），`bar` 用的是函数表达式赋值语法。只有 MethodDefinition 创建的函数才会有 `[[HomeObject]]`，指向它所属的对象。

`[[HomeObject]]` 只做一件事：**为 `super` 提供查找起点**。当你在方法内写 `super.toString()`，引擎的查找路径是：

```txt
[[HomeObject]] → 找到对象 → 通过 [[Prototype]] 找到父对象 → 在父对象上查找 toString
```

没有 `[[HomeObject]]`，`super` 就没有查找起点，所以规范直接在语法层面禁止了函数表达式使用 `super`。

这解释了一个容易让人困惑的现象：

```js
const parent = {
  greet() { return 'Hello'; },
};

const child = {
  __proto__: parent,

  // ✅ MethodDefinition — 有 [[HomeObject]]，super 有起点
  greet() {
    return super.greet() + ', World!';
  },
};

child.greet(); // 'Hello, World!'
```

```js
const parent = {
  greet() { return 'Hello'; },
};

const child2 = {
  __proto__: parent,

  // ❌ 函数表达式 — 没有 [[HomeObject]]
  greet: function() {
    return super.greet(); // SyntaxError: 'super' keyword unexpected here
  },
};
```

`super` 能不能用，不取决于函数是不是挂在对象上，而取决于函数是用什么语法创建的。

| 语法 | `[[HomeObject]]` | 能否用 `super` |
|---|---|---|
| `obj.foo() {}`（MethodDefinition）| ✅ 指向 `obj` | ✅ |
| `obj.foo = function() {}`（函数表达式）| ❌ | ❌ |
| `obj.foo = () => {}`（箭头函数）| ❌ | ❌ |
| 类中的方法 | ✅ 指向类原型或类本身 | ✅ |

所以"函数"和"方法"不仅仅是叫法不同——**方法比函数多了一个 `[[HomeObject]]`，这个槽位决定了 `super` 能不能用。**

> 💡 类中的方法（包括 `constructor`）都是用 MethodDefinition 语法定义的，所以类的方法天然有 `[[HomeObject]]`，天然能用 `super`。这也是为什么类继承中的 `super` 总是自然地工作。

---

## 九、new Function：同样创建函数，作用域却完全不同

到目前为止，我们看到的函数类型差异都是语法层面的——`function`、`=>`、`async`、`*` 选择了不同的内部行为。但还有一种创建函数的方式，它的差异不在内部槽位，而在**词法作用域**：

```js
const fn = new Function('x', 'y', 'return x + y');

fn(1, 2); // 3
```

看起来没什么特别的。但当它遇到闭包时，行为就截然不同了：

```js
let x = 10;

function createNormal() {
  let x = 20;
  const normal = function() { return x; };
  return normal;
}

function createDynamic() {
  let x = 20;
  const dynamic = new Function('return x');
  return dynamic;
}

createNormal()();  // 20 — 访问外层函数的 x
createDynamic()(); // 10 — 访问全局的 x
```

原因在规范中：普通函数的 `[[Environment]]` 创建时就绑定为**外层词法环境**（即 `createNormal` 的局部作用域），而 `new Function` 创建的函数，其 `[[Environment]]` 绑定为**全局词法环境**。

这意味着 `new Function` 创建的函数永远无法访问创建它的函数的局部变量——它只能访问全局作用域。这跟 `eval` 的行为不同（`eval` 可以访问外层作用域），也是 `new Function` 比 `eval` 更安全的原因之一。

这一差异再次印证了本篇的核心论点：**同样是"创建一个函数"，写法不同，内部行为可以完全不同。** 普通函数和 `new Function` 的差异甚至不在你看得到的地方——而是在看不见的作用域链里。

---

## 十、连外在属性都因创建方式不同而不同

函数作为对象，有两个固定的数据属性：`name` 和 `length`。它们是只读的（更准确地说，`configurable: true` 但 `writable: false`），你不能直接赋值修改：

```js
function foo() {}
foo.name = 'bar';
foo.name; // 'foo' — 赋值静默失败
```

但它们的值取决于函数的**创建方式**，而不是你后来做了什么。

### name：函数的自我认知

```js
// 匿名函数 — name 为空串
(function() {}).name;    // ""
(() => {}).name;         // ""
(async () => {}).name;   // ""
(function*() {}).name;   // ""

// 函数表达式 — name 为赋值变量名
const foo = function() {};
foo.name; // 'foo'

const bar = () => {};
bar.name; // 'bar'

// Function 构造函数 — name 为 'anonymous'
new Function().name; // 'anonymous'

// 绑定函数 — name 加前缀 'bound'
function original() {}
original.bind(null).name; // 'bound original'
(() => {}).bind(null).name; // 'bound' — 原名是空串，所以只有 'bound'

// 对象方法 — name 为属性键
const obj = {
  foo() {},
  [Symbol.for('bar')]() {},
  get baz() {},
  set baz(v) {},
};

obj.foo.name;                          // 'foo'
obj[Symbol.for('bar')].name;           // '[bar]'
Object.getOwnPropertyDescriptor(obj, 'baz').get.name; // 'get baz'
Object.getOwnPropertyDescriptor(obj, 'baz').set.name; // 'set baz'

// 类私有方法
class Cls {
  #say() {}
  bark() { return this.#say.name; }
}
new Cls().bark(); // '#say'

// ESM default export
// lib.js
// export default function() {};
// import('./lib.js').then(m => m.default.name); // 'default'
```

看起来场景很多，但有规律可循：

| 创建方式 | name 值 | 规则 |
|---|---|---|
| 匿名函数 | `""` | 没有名字就是空串 |
| 函数表达式赋值给变量 | 变量名 | 名字来自赋值目标 |
| `new Function` | `"anonymous"` | 规范规定的特殊值 |
| `bind` 后 | `"bound " + 原名` | 前缀 `bound` |
| 对象方法 | 属性键的字符串表达 | 包括 getter/setter 前缀 |
| `export default` 匿名函数 | `"default"` | 来自导出语义 |

`name` 是函数的自我认知，但它反映的是**创建时的身份**，不是运行时的状态。你可以在规范允许的条件下通过 `Object.defineProperty` 改它：

```js
function foo() {}

Object.defineProperty(foo, 'name', {
  value: 'bar',
  writable: false,
  configurable: true,
});

foo.name; // 'bar'
```

但实际开发中，`name` 主要用于调试和日志——不要在逻辑中依赖它做判断。

### length：函数期望多少参数

`length` 是函数**声明时**期望接收的参数个数，不是运行时传入的参数个数：

```js
function add(a, b) {}
add.length; // 2

function noArgs() {}
noArgs.length; // 0
```

ES6 引入默认参数和剩余参数后，`length` 的计算规则变得更有意思：

```js
// 默认参数之后的参数不计入
function f1(a, b = 1) {}
f1.length; // 1 — 只有 a 被计入

function f2(a = 1, b, c) {}
f2.length; // 0 — a 有默认值，它后面的参数都不计入

// 剩余参数不计入
function f3(a, ...rest) {}
f3.length; // 1 — 只有 a 被计入

function f4(...args) {}
f4.length; // 0

// 解构参数计为 1 个
function f5({ a, b }) {}
f5.length; // 1
```

规则总结：**只计算第一个默认参数之前的参数，剩余参数不参与计数。**

这个属性的实际用途比想象中大——很多库用 `fn.length` 来实现函数重载或参数校验：

```js
// 一个简单的函数重载工具
function overload(...fns) {
  const map = new Map();
  for (const fn of fns) {
    map.set(fn.length, fn);
  }
  return function(...args) {
    const fn = map.get(args.length);
    if (fn) return fn.apply(this, args);
    throw new TypeError(`No overload for ${args.length} arguments`);
  };
}

const add = overload(
  (a) => a,                // 1 个参数
  (a, b) => a + b,         // 2 个参数
  (a, b, c) => a + b + c,  // 3 个参数
);

add(1);    // 1
add(1, 2); // 3
add(1, 2, 3); // 6
```

一些内置函数的 `length` 也值得关注：

```js
Function.length;                 // 1
Function.prototype.call.length;  // 1
Function.prototype.apply.length; // 2
Array.prototype.splice.length;   // 2
parseInt.length;                  // 2
JSON.stringify.length;           // 3
```

---

## 尾声

回到开头的那张 `typeof` 表：

```js
typeof function() {}  // 'function'
typeof (() => {})     // 'function'
typeof async function() {} // 'function'
typeof function*() {} // 'function'
typeof class {}       // 'function'
```

现在你知道了——`typeof` 只看到了 `[[Call]]`，而 `[[Call]]` 只是函数本质的冰山一角。水面下还有 `[[Construct]]`、`arguments`、`prototype`、`this` 绑定、`super`、`[[HomeObject]]`、`[[Environment]]`……每一个维度，不同类型的函数都有不同的行为。

选择不同的函数写法，不是在选语法糖——你是在选一整套内部行为。

函数是 JavaScript 中最重要的抽象，也是被误解最多的。理解函数的"物种差异"——为什么箭头函数不能 `new`、为什么方法能用 `super` 而函数表达式不行、为什么 `new Function` 看不到外层作用域——这些不是需要死记的规则，而是从 `[[Call]]` 这个原点自然推导出的结果。

下一篇，我们会深入函数最强大的能力之一——闭包。如果函数的本质是"可调用的对象"，那闭包就是"函数捕获了外部变量"后的状态，它让函数不再只是过程，而是变成了一种携带上下文的数据。这又是另一个维度的"同是函数，行为不同"。