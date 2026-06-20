---
title: 对象不是属性的清单，而是活生生的个体——从三要素到 Proxy，彻底理解 JavaScript 对象
created: 2023-01-15
updated: 2026-06-09
tags:
  - JavaScript
  - Object
description: 从"身份—状态—行为"三要素出发，逐层深入原型链、属性描述符、对象操作、遍历机制与 Proxy 元编程，建立对 JavaScript 对象的完整认知。
status: evergreen
---

## 一、对象是什么

### 1.1 对象的认知起源

一个小孩蹲在水盆边，里面有三条一模一样的金鱼。他指着左边那条说"这条游得慢"，指着右边那条说"这条尾巴在甩"，然后手指停在中间那条上面——"这条刚才在看我。"

一模一样的鱼，他嘴里说出的是三个不同的东西。你甚至能感觉到，如果其中一条鱼受伤了，另外两条还是好好的，跟那条受伤的鱼没有半点关系。

为什么三个长得一样的东西，我们能立刻认定它们是三个，而不是一个东西复制了三份？答案藏在我们的脑子里——人天生就懂得给每个东西贴上一张看不见的标签。这张标签不贴在身上，不写名字，也不会掉色，但它让"这个苹果"和"那个苹果"永远是两回事。程序员管这张标签叫"身份"，管一个带身份的东西叫"对象"。

一个东西光有身份还不够。你能认出那条鱼，是因为它有尾巴、会游、停在某个角落——这些特点，程序员叫"状态"。但状态不会自己变，代码里的东西得有办法改变自己的状态，比如一条鱼可以"掉尾巴"——这种能改变状态的动作，叫"行为"。

身份让它永远是它自己；状态让人知道它怎么了；行为让它能动起来。这就是对象的三要素。

想象一个三角形，三个角上分别写着身份、状态、行为。东西就站在中间。

用代码写出来，大概长这样：一个鱼物件，有自己的编号，有尾巴，还能掉尾巴。另一个鱼物件，编号不同，也有尾巴，但没掉。你问电脑"这两个物件是同一个吗？"电脑说不是。就算它们此刻的状态一模一样，编号对不上，就绝不是同一个。就像那个小孩，永远不会把左边那条鱼当成中间那条。

这个想法简单到孩子都懂，可它撑起了今天几乎所有软件的骨架。你用的每一个 App，背后都有成千上万个这样的小物件，各自带着编号、状态和行为，互相叫来叫去，像水盆里的鱼群。

回到开始的水盆。三条鱼，三条命，三个独立的身份。哪怕上帝又造了第四条，和前三条分毫不差，它也还是个新东西，有自己的那张看不见的标签。这就是"对象"这个词真正想说的——世界不是一堆属性的清单，而是一个个完整的、活生生的个体。

### 1.2 对象三要素

一个对象由三大核心要素组成：

1. **唯一标识（Identity）**——用来区分不同对象的身份，如内存引用 ID。
2. **状态（State）**——对象的属性集合，描述其当前状况。
3. **行为（Behavior）**——改变对象状态的方法。

```
┌─────────────────────────┐
│        对象 (Object)     │
├─────────────────────────┤
│ 唯一标识 (Identity)      │
│ 状态 (State)             │
│ 行为 (Behavior)          │
└─────────────────────────┘
  ↑ 行为改变状态，状态属于对象
```

### 1.3 JS 为什么需要对象

JavaScript 的一切几乎都是对象——数组是对象，函数是对象，正则是对象，甚至 `null` 和 `undefined` 之外的原始类型也有对应的包装对象。但 JS 的对象系统跟 Java 或 C++ 有一个根本区别：它是基于原型的，不是基于类的。

这意味着什么？在 Java 里，你要先画图纸（类），再按图纸造房子（实例）。图纸定义了房子的结构，所有按同一张图纸造的房子长得一模一样。而在 JS 里，你可以直接造一栋房子，然后让另一栋房子"照着它建"——原型链就是这座"参照物"之间的关系。

ES6 的 `class` 语法让 JS 看起来像有了图纸，但别被骗了——那只是语法糖，底下还是原型在干活。

---

## 二、JavaScript 中的对象

### 2.1 对象字面量

创建对象最直接的方式：

```js
const obj = { name: 'Alice', age: 25 };
```

大括号里写什么，对象就有什么。没有任何构造函数的仪式，没有 `new` 关键字的前奏。对象字面量是 JS 最常用的对象创建方式，也是最高频的语法之一。

ES6 给对象字面量加了几把刷子：

```js
// 属性简写——变量名和属性名一致时，写一次就行
const name = 'Alice';
const user = { name }; // 等同于 { name: name }

// 方法简写——省略 function 关键字
const calc = {
  add(a, b) { return a + b; },
};

// 属性名表达式——用方括号动态计算属性名
const key = 'age';
const person = { [key]: 25 };
```

### 2.2 属性与方法

对象的属性就是它的状态，方法就是它的行为。

```js
const fish = {
  // 状态：属性
  tail: true,
  speed: 5,

  // 行为：方法
  loseTail() {
    this.tail = false;   // 行为改变自身状态
  },
};
```

一个关键原则：**对象的行为必须用来改变对象自身的状态**。

错误示范：

```js
class Dog {
  bite(human) {
    // ❌ 这个行为改变的是 Human 的状态，不是 Dog 自己的
  }
}
```

正确做法：

```js
class Human {
  hurt(damage) {
    this.health -= damage;
  }
}

class Dog {
  bark() {
    console.log('Woof!');
  }
}
```

不让一个对象直接修改另一个对象的内部状态——这就是内聚性的含义。

### 2.3 对象创建方式

JS 提供了五种创建对象的方式，每一种都有其适用场景：

```js
// 1. 对象字面量（最常用）
const obj1 = { name: 'Alice' };

// 2. new Object()
const obj2 = new Object();
obj2.name = 'Bob';

// 3. Object.create()——指定原型
const proto = { type: 'person' };
const obj3 = Object.create(proto);

// 4. 构造函数
function Person(name) {
  this.name = name;
}
const obj4 = new Person('Charlie');

// 5. class（ES6 语法糖）
class Animal {
  constructor(name) {
    this.name = name;
  }
}
const obj5 = new Animal('Dog');
```

后面三种方式都涉及原型链，我们下一章再说。

### 2.4 对象之间的关系

JS 中对象的关系有三种描述方式：

**分类（Class-based）**——类似生物学"界–门–纲–目–科–属–种"的层级。从"动物"到"鱼"再到"金鱼"，一层层细化：

```js
class Animal {
  constructor(name) { this.name = name; }
  breathe() { console.log(`${this.name} is breathing`); }
}

class Fish extends Animal {
  constructor(name) { super(name); this.canSwim = true; }
  swim() { console.log(`${this.name} is swimming`); }
}

class Goldfish extends Fish {
  constructor(name) { super(name); this.color = 'orange'; }
}
```

**归类（Generalization）**——提取多个对象的共性形成更抽象的类。JS 不直接支持多继承，但可以通过 mixin 实现多能力组合：

```js
const swimmable = { swim() { console.log(`${this.name} is swimming`); } };
const flyable = { fly() { console.log(`${this.name} is flying`); } };

class Animal {
  constructor(name) { this.name = name; }
}

Object.assign(Animal.prototype, swimmable, flyable);
const duck = new Animal('Duck');
duck.swim(); // Duck is swimming
duck.fly();  // Duck is flying
```

**原型（Prototype-based）**——JS 的对象系统本质。新对象"照猫画虎"，拷贝已有对象再修改：

```
catfish (实例)
    ↑ __proto__
Catfish.prototype
    ↑ __proto__
Fish.prototype
    ↑ __proto__
Animal.prototype
    ↑ __proto__
Object.prototype
    ↑ __proto__
    null
```

---

## 三、原型与继承

### 3.1 prototype

每个函数在创建时，JS 引擎会自动给它加上一个 `prototype` 属性，值是一个对象。这个对象就是"原型"——所有通过该函数 `new` 出来的实例，都能访问到这个原型上的属性和方法。

```js
function Person(name) {
  this.name = name;
}

Person.prototype.sayHello = function () {
  console.log(`Hello, I'm ${this.name}`);
};

const alice = new Person('Alice');
alice.sayHello(); // Hello, I'm Alice
```

`alice` 本身没有 `sayHello`，但 `alice.__proto__` 指向 `Person.prototype`，而 `Person.prototype` 上有 `sayHello`。这就是原型链查找的基本逻辑。

### 3.2 \_\_proto\_\_

`__proto__` 是每个对象都有的属性，指向创建该对象的构造函数的 `prototype`。但 `__proto__` 是非标准属性，在生产环境中应该用 `Object.getPrototypeOf()` 和 `Object.setPrototypeOf()` 来操作原型。

`prototype` 和 `__proto__` 的区别：

| | `prototype` | `__proto__` |
|---|---|---|
| 谁有 | 只有函数 | 每个对象 |
| 指向 | 函数的原型对象 | 创建该对象的构造函数的 `prototype` |
| 作用 | 实现实例继承 | 访问原型链 |

### 3.3 原型链

当访问对象的属性时，JS 按照以下顺序查找：

1. 在对象自身查找
2. 在对象的原型（`__proto__`）中查找
3. 在原型的原型中查找
4. 一直查找到 `Object.prototype`
5. 如果还没找到，返回 `undefined`

这个链条的终点是 `Object.prototype.__proto__`，也就是 `null`。

验证原型关系：

```js
function A() {}

// 1. A 是通过 Function 构造函数生成的
A.__proto__ === Function.prototype; // true

// 2. A.prototype 是 Object 构造函数的实例
A.prototype.__proto__ === Object.prototype; // true

// 3. 原型链顶端
Object.prototype.__proto__ === null; // true

// 4. Function.prototype 继承自 Object.prototype
Function.prototype.__proto__ === Object.prototype; // true

// 5. Object 是 Function 的实例
Object.__proto__ === Function.prototype; // true

// 6. Function 是它自己的实例（特殊情况）
Function.__proto__ === Function.prototype; // true
```

还有几个特殊的原型关系值得注意：

- `Function.prototype` 是一个函数（为了保持类型一致性：`Array.prototype` 是 Array，`Function.prototype` 自然也应该是 Function），但它没有 `prototype` 属性。
- 实例通过原型链访问 `constructor`：`a.constructor === A`，但 `a` 本身并没有 `constructor`，它是沿原型链从 `A.prototype` 上找到的。

### 3.4 new 到底干了什么

`new` 关键字背后的四步操作：

```js
function myNew(Constructor, ...args) {
  // 1. 创建一个新对象，原型指向构造函数的 prototype
  const obj = Object.create(Constructor.prototype);

  // 2. 执行构造函数，绑定 this 为新对象
  const result = Constructor.apply(obj, args);

  // 3. 如果构造函数返回了一个对象，就使用该对象；否则返回新对象
  return result instanceof Object ? result : obj;
}
```

这四步揭示了一个事实：`new` 并不是什么魔法，它只是在做原型链接 + `this` 绑定 + 返回值处理。理解了这一点，你就知道为什么箭头函数不能用作构造函数——它连自己的 `this` 都没有，`new` 的第二步根本无法执行。

### 3.5 class 只是语法糖

ES6 的 `class` 语法让原型继承看起来更像传统的类继承：

```js
class Animal {
  constructor(name) { this.name = name; }
  breathe() { console.log(`${this.name} is breathing`); }
}

class Fish extends Animal {
  constructor(name) { super(name); this.canSwim = true; }
  swim() { console.log(`${this.name} is swimming`); }
}
```

但本质上它等价于：

```js
function Animal(name) { this.name = name; }
Animal.prototype.breathe = function () { console.log(`${this.name} is breathing`); };

function Fish(name) { Animal.call(this, name); this.canSwim = true; }
Fish.prototype = Object.create(Animal.prototype);
Fish.prototype.constructor = Fish;
Fish.prototype.swim = function () { console.log(`${this.name} is swimming`); };
```

`class` 有几个额外的约束（比如必须用 `new` 调用、方法不可枚举等），但原型链的工作方式没有变。

---

## 四、属性系统

属性不是简单的一个 key 和一个 value。因为属性本身还有属性——是否只读、是否可删除、是否可遍历？这些"属性的属性"，叫属性描述符（Property Descriptor）。

### 4.1 Descriptor

ES5 重新定义了属性的结构。一个属性可能是两种格式之一：

**数据属性**：

| 内部槽位 | 含义 | 默认值 |
|----------|------|--------|
| `[[Value]]` | 属性的值 | `undefined` |
| `[[Writable]]` | 是否可修改 | `true` |
| `[[Enumerable]]` | 是否可枚举 | `true` |
| `[[Configurable]]` | 是否可配置 | `true` |

**存取器属性**：

| 内部槽位 | 含义 | 默认值 |
|----------|------|--------|
| `[[Get]]` | 取值函数 | `undefined` |
| `[[Set]]` | 存值函数 | `undefined` |
| `[[Enumerable]]` | 是否可枚举 | `true` |
| `[[Configurable]]` | 是否可配置 | `true` |

两对互斥：`[[Value]]`+`[[Writable]]` 与 `[[Get]]`+`[[Set]]` 不能同时存在。从功能上讲，存取器属性是数据属性的超集——不定义 `[[Set]]` 就等于 `[[Writable]]` 为 false。

TypeScript 的 `PropertyDescriptor` 接口把它们混在了一起，但实际上 value/writable 与 get/set 不能共存：

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

获取属性描述符：

```js
Object.getOwnPropertyDescriptor({ name: 'js' }, 'name');
// { value: 'js', writable: true, enumerable: true, configurable: true }
```

定义存取器属性：

```js
const obj = {};
let _name = null;

Object.defineProperty(obj, 'name', {
  set(n) { _name = n; },
  get() { return _name; },
  configurable: true,
  enumerable: true,
});
```

在 class 中也可以用 getter/setter：

```js
class Foo {
  #name = null;
  get name() { return this.#name; }
  set name(n) { this.#name = n; }
}
```

### 4.2 enumerable

`enumerable` 决定属性是否可枚举——也就是在 `for...in` 时能否被遍历到。

默认情况下，直接赋值定义的属性和类的非函数成员都是可枚举的，但原型上的方法、数组的 `concat`/`filter`/`map` 等、字符串的 `length` 都不是。

如果用 `Object.defineProperty()` 定义，`enumerable` 默认为 `false`：

```js
const obj = {};
Object.defineProperty(obj, 'name', { value: 'foo' });
Object.getOwnPropertyDescriptor(obj, 'name').enumerable; // false
```

哪些操作会跳过不可枚举属性：

| 操作 | 自身 | 继承 | 可枚举 | 不可枚举 | Symbol |
|------|------|------|--------|----------|--------|
| `for...in` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `Object.keys()` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `JSON.stringify()` | ✅ | ❌ | ✅ | ❌ | ❌ |
| `Object.assign()` | ✅ | ❌ | ✅ | ❌ | ✅ |
| `...` 展开运算符 | ✅ | ❌ | ✅ | ❌ | ✅ |

### 4.3 configurable

`configurable` 控制属性是否可配置。当它为 `false` 时：

- 不允许删除此属性
- 不允许在数据属性和存取器属性之间变换
- 不允许修改 `enumerable`、`set`/`get` 的值
- 不允许将 `writable` 从 `false` 改为 `true`

但有两个例外：**允许修改 `value`**，**允许将 `writable` 从 `true` 改为 `false`**。

为什么？规范没有解释。但可以这样理解：`configurable` 并不是为了完全锁定对象——它仍然允许修改 `value`，所以它保证的是对象结构和表达的稳定性。把属性从可写改为只读，不影响这种稳定性。

```js
const obj = {};

Object.defineProperties(obj, {
  name: { value: 'foo', writable: false, enumerable: true, configurable: false },
  age: { get() {}, set() {}, enumerable: true, configurable: false },
});

delete obj.name;                                                    // ❌ TypeError
Object.defineProperty(obj, 'name', { get() { return 'foo'; } });   // ❌ TypeError
Object.defineProperty(obj, 'name', { enumerable: false });          // ❌ TypeError
Object.defineProperty(obj, 'age', { set() {}, get() {} });         // ❌ TypeError
Object.defineProperty(obj, 'name', { writable: true });             // ❌ TypeError
```

注意：合并失败不会回滚。如果 `Object.assign` 或 `Object.defineProperties` 中途某个属性失败，之前已经合并的属性会保留。

### 4.4 getter/setter

存取器属性允许拦截对属性的读取和赋值操作。Vue 2 正是利用这一特性监视数据变更，驱动视图更新。

几个要点：

- `set` 和 `get` 可以不成对出现。缺失 `set` 则只读，缺失 `get` 则只写，都不存在则被当作 `value` 为 `undefined` 的数据属性。
- `set`/`get` 必须是函数类型（异步函数、生成器函数也可以），否则抛出错误。
- `Object.assign` 不会拷贝 getter/setter，它只取值：

```js
const source = { get foo() { return 1; } };
const target = {};
Object.assign(target, source); // { foo: 1 }——getter 没了
```

### 4.5 Reflect

对象的内部操作不只那些显式的 API。ECMAScript 规范定义了一组内部方法：

| 内部方法 | 含义 |
|----------|------|
| `[[GetPrototypeOf]]` | 获取原型 |
| `[[SetPrototypeOf]]` | 设置原型 |
| `[[IsExtensible]]` | 是否可扩展 |
| `[[PreventExtensions]]` | 阻止扩展 |
| `[[GetOwnProperty]]` | 获取自有属性描述符 |
| `[[DefineOwnProperty]]` | 定义/修改属性 |
| `[[HasProperty]]` | 是否有某属性 |
| `[[Get]]` | 获取属性值 |
| `[[Set]]` | 设置属性值 |
| `[[Delete]]` | 删除属性 |
| `[[OwnPropertyKeys]]` | 获取所有自有键 |

其中大部分都有对应的 `Reflect` API 或 `Object` 静态方法。比如调用 `Object.defineProperty(obj, key, desc)`，本质就是在调用对象的 `[[DefineOwnProperty]]`。

最后那个 `[[Prototype]]`——不是函数，而是一个槽位（slot）——实现原型链的根本。

---

## 五、对象操作

### 5.1 instanceof

`instanceof` 的工作原理分两步：

**第一步**：检查右操作数是否有 `Symbol.hasInstance`：

```js
class MyString {
  static [Symbol.hasInstance](instance) {
    return typeof instance === 'string';
  }
}
'abc' instanceof MyString; // true
```

**第二步**（如果没有 `Symbol.hasInstance`）：沿左操作数的原型链查找，能否找到右操作数的 `prototype`：

```
o.__proto__.__proto__...  ===  C.prototype
```

手动实现：

```js
function myInstanceof(o, C) {
  let current = o;
  while (current) {
    const proto = Object.getPrototypeOf(current);
    if (proto && proto === C.prototype) return true;
    current = proto;
  }
  return false;
}
```

边界条件：

- `C` 不是对象（`null`/`undefined`/原始类型）→ 抛异常
- `C` 没有对象类型的 `prototype` → 抛异常
- `o` 不是对象 → 返回 `false`

注意：因为原型链本身可以被操控，`instanceof` 的结果不能客观反映对象与构造函数的关系：

```js
const o = {};
function Foo() {}
Object.setPrototypeOf(o, Foo.prototype);
o instanceof Foo; // true——但我们并没有用 Foo 创建 o
```

### 5.2 assign 与 spread

`Object.assign()` 和对象展开运算符 `...` 都能合并对象，但原理完全不同：

> **`Object.assign` 以 `[[Set]]` 的方式赋值属性**——本质是 `dest[key] = src[key]`。
> **对象展开运算符以 `[[DefineOwnProperty]]` 的方式定义属性**——本质是 `Object.defineProperty(dest, key, { value, writable: true, enumerable: true, configurable: true })`。

```js
function assign(dest, src) {
  for (let key in src) {
    if (!src.hasOwnProperty(key)) continue;
    dest[key] = src[key]; // set
  }
}

function spread(dest, src) {
  for (let key in src) {
    if (!src.hasOwnProperty(key)) continue;
    Object.defineProperty(dest, key, {
      value: src[key], writable: true, enumerable: true, configurable: true,
    });
  }
}
```

这个差异带来的实际后果：

1. **`Object.assign` 可能赋值到原型上**：如果目标对象的原型上有同名存取器属性，`assign` 会调用 `set`，而不是在目标对象自身创建属性。
2. **展开运算符丢弃源属性的描述符**：无论源属性是数据属性还是存取器属性，最终都变成一个可枚举、可配置、可写的数据属性。

```js
// assign 赋值到原型
var _name = null;
var dest = Object.create({
  set name(n) { _name = n; },
  get name() { return _name; },
});
Object.assign(dest, { name: 'bar' });
Object.getOwnPropertyDescriptor(dest, 'name'); // undefined——不在自身上！

// spread 定义新属性
var source = Object.create(null, {
  name: { get() { return 'foo'; }, set(){}, enumerable: true, configurable: false },
});
const dest2 = { ...source };
Object.getOwnPropertyDescriptor(dest2, 'name');
// { value: 'foo', writable: true, enumerable: true, configurable: true }
```

报错场景也不一样：

- 目标对象现存属性是只读的 → `Object.assign` 可能失败
- 目标对象现存属性不可配置，或对象不可扩展 → 展开运算符可能失败

两者的失败都不会回滚——之前已经合并的属性会保留，可能造成对象污染。

### 5.3 freeze / seal / preventExtensions

三种对象锁定级别，从弱到强：

| 操作 | 状态判断 | 可新增属性 | 删除属性 | 修改属性值 | 修改描述符 |
|------|----------|-----------|----------|-----------|-----------|
| `preventExtensions` | `isExtensible()` | ❌ | ✅ | ✅ | ✅ |
| `seal` | `isSealed()` | ❌ | ❌ | ✅ | ❌ |
| `freeze` | `isFrozen()` | ❌ | ❌ | ❌ | ❌ |

`seal` = `preventExtensions` + 所有属性 `configurable: false`
`freeze` = `seal` + 所有数据属性 `writable: false`

**注意**：即便最严格的 `freeze`，面对存取器属性也无法让其变为只读——因为存取器属性的值由 `get` 函数决定，不是 `writable` 控制的。

**局限**：

1. **原型链漏洞**：`freeze` 只冻结对象本身，但可以通过修改原型来间接影响对象：

```js
const obj = Object.freeze({ name: 'Alice' });
Object.prototype.age = 25;
obj.age; // 25——从原型链上来的
```

2. **浅冻结**：只冻结第一层，嵌套对象不会被冻结：

```js
const obj = Object.freeze({ address: { city: 'New York' } });
obj.address.city = 'Boston'; // 可以修改！
```

深度冻结需要递归：

```js
function deepFreeze(obj) {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = obj[prop];
    if (value !== null && typeof value === 'object') deepFreeze(value);
  });
  return obj;
}
```

### 5.4 hasOwn

`Object.hasOwn()` 是 ES2022 新增的方法，替代 `obj.hasOwnProperty()`：

```js
// 旧方式的问题
const obj = Object.create(null);
obj.hasOwnProperty('prop'); // TypeError——没有继承 hasOwnProperty

const obj2 = { hasOwnProperty: 'not a method' };
obj2.hasOwnProperty('hasOwnProperty'); // TypeError

// 新方式
Object.hasOwn(obj, 'prop');  // true
Object.hasOwn(obj2, 'hasOwnProperty'); // true
```

### 5.5 Object.is

`Object.is()` 与 `===` 的区别在于两个特殊值：

```js
+0 === -0;    // true
NaN === NaN;  // false

Object.is(+0, -0);  // false
Object.is(NaN, NaN); // true
```

### 5.6 super 关键字

`super` 指向当前对象的原型对象，但只能在对象的方法中使用：

```js
const proto = {
  greet() { return 'Hello from prototype'; },
};

const obj = {
  greet() { return super.greet() + ', extended'; },
};

Object.setPrototypeOf(obj, proto);
obj.greet(); // "Hello from prototype, extended"
```

内部机制：`super.foo()` 等同于 `Object.getPrototypeOf(this).foo.call(this)`。

**`super` 只能用在对象的方法中**——用在属性、箭头函数或普通函数中都会报错。

---

## 六、对象遍历与元编程

### 6.1 keys / values / entries

`Object.keys`、`Object.values`、`Object.entries` 都只返回对象**自身的、可枚举的、字符串键**属性：

```js
const obj = Object.create({ age: 12 }, {
  name: { value: 'foo', enumerable: true },
});
Object.keys(obj); // ["name"]——原型链上的 age 不出现
```

加上 Symbol 键：

```js
const obj = { name: 'foo', [Symbol('age')]: 16 };
Object.keys(obj); // ["name"]——Symbol 键不出现
```

三个条件缺一不可：自身、可枚举、字符串键。

### 6.2 getOwnPropertyNames / getOwnPropertySymbols / Reflect.ownKeys

要突破可枚举或 Symbol 的限制：

- `Object.getOwnPropertyNames()`：自身所有字符串键（含不可枚举）
- `Object.getOwnPropertySymbols()`：自身所有 Symbol 键（含不可枚举）
- `Reflect.ownKeys()`：自身所有键（字符串 + Symbol，含不可枚举）

```js
const obj = Object.create(null, {
  [Symbol('b')]: { value: 'b', enumerable: true, configurable: true },
  a: { value: 'a', enumerable: true, writable: true, configurable: true },
});

Reflect.ownKeys(obj); // ["a", Symbol(b)]
```

`Reflect.ownKeys` 返回的是 `[[OwnPropertyKeys]]` 的完整内容。至于为什么字符串和 Symbol 要分开——那是历史遗留问题。ES5 没有 Symbol，所以 `getOwnPropertyNames` 只返回字符串数组；ES6 加了 Symbol 后为了向后兼容，只好另起 `getOwnPropertySymbols`，再补一个 `Reflect.ownKeys` 一并返回。

### 6.3 for...in

唯一能遍历原型链的方法，但只遍历可枚举的字符串键：

```js
const obj = Object.create(
  Object.create(null, { d: { value: 'd', enumerable: true, configurable: true } }),
  {
    [Symbol('b')]: { value: 'b', enumerable: true, configurable: true },
    a: { value: 'a', enumerable: true, writable: true, configurable: true },
    c: { value: 'c', enumerable: false, configurable: true },
  }
);

for (let key in obj) {
  console.log(key); // a, d——Symbol 和不可枚举属性都不出现
}
```

### 6.4 for...of 与迭代器

前面所有遍历方法都基于对象的属性。`for...of` 打破了这个限制——它可以遍历任何实现了 `[Symbol.iterator]` 的对象，数据来源完全自定义。

三种定义迭代器的方式：

```js
// 1. 生成器函数
function* range(start, end) {
  for (let i = start; i <= end; ++i) yield i;
}
for (const i of range(3, 6)) console.log(i); // 3 4 5 6

// 2. 对象上的 Symbol.iterator 生成器
class Range {
  constructor(start, end) { this.start = start; this.end = end; }
  *[Symbol.iterator]() {
    for (let i = this.start; i <= this.end; ++i) yield i;
  }
}
for (const i of new Range(3, 6)) console.log(i); // 3 4 5 6

// 3. 手动迭代器模拟
function createRanger(start, end) {
  let current = start;
  return {
    next() {
      const nextValue = current++;
      return { value: nextValue, done: nextValue > end };
    },
    [Symbol.iterator]() { return this; },
  };
}
for (const i of createRanger(3, 6)) console.log(i); // 3 4 5 6
```

迭代器的核心就是一个 `next()` 函数，返回 `{ value, done }` 结构。

### 6.5 异步迭代器

同步迭代的本质：立即输出数据。但如果数据源是异步的呢？

**误解**：在 `for` 循环中用 `await` 不是异步遍历——那是同步迭代、异步消费。

**异步遍历**指的是从数据集合中取出的过程本身就是异步的。

`for await...of` 是 `for...of` 的超集，把同步改成异步只需要两处变化：`Symbol.iterator` → `Symbol.asyncIterator`，`function*` → `async function*`：

```js
// 异步生成器函数
async function* asyncRange(start, end) {
  for (let i = start; i <= end; ++i) yield i;
}

// 对象上的 Symbol.asyncIterator
const producer = {
  current: 5,
  async *[Symbol.asyncIterator]() {
    for (let i = this.current; i > 0; i--) {
      yield await Promise.resolve(i);
    }
  },
};

(async () => {
  for await (const num of producer) {
    console.log(num); // 5 4 3 2 1
  }
})();
```

一句话：**异步迭代 = 同步迭代 + Promise**。

### 6.6 遍历方法总览

| 方法 | 自身 String | 自身 Symbol | 原型链 | 不可枚举 |
|------|:-:|:-:|:-:|:-:|
| `for...in` | ✅ | ❌ | ✅ | ❌ |
| `Object.keys/values/entries` | ✅ | ❌ | ❌ | ❌ |
| `Object.getOwnPropertyNames` | ✅ | ❌ | ❌ | ✅ |
| `Object.getOwnPropertySymbols` | ❌ | ✅ | ❌ | ✅ |
| `Object.getOwnPropertyDescriptors` | ✅ | ✅ | ❌ | ✅ |
| `Reflect.ownKeys` | ✅ | ✅ | ❌ | ✅ |
| `for...of` | — | — | — | — |

两条关键特征：

1. 只有 `for...in` 能遍历原型链
2. 带 `own` 字样的都不关心是否可枚举

属性遍历的次序规则（所有方法一致）：

1. 数值键，按数值升序
2. 字符串键，按加入时间升序
3. Symbol 键，按加入时间升序

### 6.7 Proxy

前面所有操作都是在"使用"对象——读取属性、设置属性、遍历属性。Proxy 让你能"拦截"这些操作，在任何操作发生之前或之后做你想做的事。

Proxy 是对象的元编程基础。它接收两个参数：目标对象和处理器对象。处理器对象中可以定义 13 种拦截操作：

```js
const target = { name: 'Alice', age: 25 };

const handler = {
  // 拦截属性读取
  get(target, prop, receiver) {
    console.log(`读取了 ${prop}`);
    return Reflect.get(target, prop, receiver);
  },

  // 拦截属性设置
  set(target, prop, value, receiver) {
    console.log(`设置了 ${prop} = ${value}`);
    return Reflect.set(target, prop, value, receiver);
  },

  // 拦截属性删除
  deleteProperty(target, prop) {
    console.log(`删除了 ${prop}`);
    return Reflect.deleteProperty(target, prop);
  },

  // 拦截 in 操作符
  has(target, prop) {
    console.log(`检查了 ${prop}`);
    return Reflect.has(target, prop);
  },

  // 拦截 Object.keys 等
  ownKeys(target) {
    console.log('获取了所有键');
    return Reflect.ownKeys(target);
  },
};

const proxy = new Proxy(target, handler);

proxy.name;        // 读取了 name → 'Alice'
proxy.age = 26;    // 设置了 age = 26
delete proxy.age;   // 删除了 age
'name' in proxy;    // 检查了 name → true
Object.keys(proxy); // 获取了所有键 → ['name']
```

13 种拦截操作对应了对象的 13 种内部方法：

| Proxy 拦截 | 触发操作 |
|------------|----------|
| `get` | 属性读取 `proxy[prop]` |
| `set` | 属性设置 `proxy[prop] = value` |
| `has` | `prop in proxy` |
| `deleteProperty` | `delete proxy[prop]` |
| `ownKeys` | `Object.keys`、`Reflect.ownKeys` 等 |
| `getPrototypeOf` | `Object.getPrototypeOf` |
| `setPrototypeOf` | `Object.setPrototypeOf` |
| `isExtensible` | `Object.isExtensible` |
| `preventExtensions` | `Object.preventExtensions` |
| `getOwnPropertyDescriptor` | `Object.getOwnPropertyDescriptor` |
| `defineProperty` | `Object.defineProperty` |
| `apply` | 函数调用 `proxy(...args)` |
| `construct` | `new proxy(...args)` |

**实际应用**：

```js
// 1. 只读代理
function readOnly(target) {
  return new Proxy(target, {
    set() { throw new Error('只读对象不允许修改'); },
    deleteProperty() { throw new Error('只读对象不允许删除'); },
  });
}

// 2. 属性验证
function validate(obj, schema) {
  return new Proxy(obj, {
    set(target, prop, value) {
      if (schema[prop] && !schema[prop](value)) {
        throw new Error(`${prop} 验证失败`);
      }
      target[prop] = value;
      return true;
    },
  });
}

const user = validate({}, {
  age: v => typeof v === 'number' && v > 0,
  name: v => typeof v === 'string' && v.length > 0,
});

user.name = 'Alice';  // ✅
user.age = -1;        // Error: age 验证失败

// 3. 负索引数组
function negativeArray(arr) {
  return new Proxy(arr, {
    get(target, prop) {
      const index = Number(prop);
      if (Number.isInteger(index)) {
        return target[index < 0 ? target.length + index : index];
      }
      return Reflect.get(target, prop);
    },
  });
}

const arr = negativeArray(['a', 'b', 'c']);
arr[-1]; // 'c'
```

**Proxy vs Object.freeze**：`freeze` 是浅层的、静态的，而且存取器属性照样能改；Proxy 是深层的、动态的，而且可以拦截一切操作。但 Proxy 也有代价——每次属性访问都要经过代理层，性能开销比直接访问大。