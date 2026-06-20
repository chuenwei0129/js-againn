---
title: JavaScript 对象模型（一）：从字面量到原型链
created: 2023-06-05
updated: 2026-06-15
tags:
  - JavaScript
  - Object
  - Prototype
description: 从对象字面量、工厂函数、构造函数，到原型链与委托机制的诞生——理解 JavaScript 对象模型的核心思想。
status: evergreen
series:
  - name: JavaScript Object Model
    index: 1
---

## 对象字面量

最简单的创建方式，就是对象字面量。

```js
const config = {
  debug: false,
  port: 3000,
};
```

写下一个 `{}`，对象就诞生了。

没有类（Class）。没有构造器（Constructor）。甚至没有 `new`。

这种“写出来就是对象”的体验，与 Java、C++ 等传统面向对象语言截然不同，也体现了 JavaScript 的一个核心思想：

> **对象本身就是一等公民（First-class Object）。**

它不需要依附于某个类才能存在。对象就是对象。

对象字面量最大的优点，就是**简单**。最典型的用途是**单例对象**——全局配置、模块状态、命名空间：

```js
const config = { api: '/api', timeout: 3000 };  // 全局唯一配置
const cache = {};                                // 全局唯一缓存
const utils = {};                                // 全局唯一工具集
```

因为这些场景下，**整个程序只需要这么一个对象**，对象字面量直截了当，再适合不过。

ES6 之后，对象字面量还增加了两种简写。当属性名与变量名相同时，可以只写属性名；方法也可以直接省略 `: function`：

```js
const name = 'Alice';
const score = 98;

const student = {
  name,                 // 等价于 name: name
  score,                // 等价于 score: score
  printScore() {        // 等价于 printScore: function () { ... }
    console.log(this.name, this.score);
  },
};
```

这种简写不改变对象模型，只是语法层面的便利。但它在提示一件事：

> **语法的形式可以变，但对象的本质没有变。**

后面讲到 `class` 时，你还会看到这个规律。

但是，它也有一个天然的限制。它只能描述：

> **这一个对象。**

例如：

```js
const alice = { name: 'Alice', score: 98 };
const bob   = { name: 'Bob',   score: 81 };
const charlie = { name: 'Charlie', score: 72 };
```

你会发现自己一直在复制同样的结构。一旦需要**一批结构相同、行为共享的对象**，对象字面量就不够用了。

对象字面量能够回答：
> **如何创建一个对象？**

却回答不了：
> **如何创建一批结构相同的对象？**

于是，下一种方案出现了。

## 工厂函数

既然对象字面量只能创建一个对象，那么最自然的想法就是：

> 把创建对象的过程放进一个函数里。

```js
function createStudent(name, score) {
  return {
    name,
    score,
    printScore() {
      console.log(this.name, this.score);
    },
  };
}
```

现在：

```js
const alice = createStudent('Alice', 98);
const bob   = createStudent('Bob', 81);
```

每次调用函数，都能得到一个新的学生对象。这就是**工厂函数（Factory Function）**。

相比对象字面量，它解决了**批量创建**的问题。

然而，很快新的问题又出现了。看这段代码：

```js
alice.printScore === bob.printScore; // false
```

为什么？因为每调用一次工厂函数，`printScore` 都会被重新创建一次——都是一模一样的函数，但每次都是新的对象。一万个学生，就会有一万个完全一样的 `printScore`。

虽然现代引擎已经足够快，这通常不会成为性能瓶颈，但从对象模型来看，这里存在一个明显的问题：

> **行为没有共享（Shared Behavior）。**

每个对象都携带着自己的一份方法，这显然不是一个理想的设计。

那下一个方案能解决这个问题吗？**不能，但它会为真正的解决铺路。**

## 构造函数

接下来我们换一种创建对象的方式。先看代码：

```js
// 这就是一个普通函数，大写开头只是约定——它打算被 new 调用
function Student(name, score) {
  this.name = name;
  this.score = score;

  this.printScore = function () {
    console.log(this.name, this.score);
  };
}
```

通过 `new` 调用：

```js
const alice = new Student('Alice', 98);
```

JavaScript 会自动完成一系列工作，可以简单理解为：

1. 创建一个新的空对象。
2. 将这个对象的 `[[Prototype]]` 连接到 `Student.prototype`。（这一步是什么意思？后面马上展开。）
3. 用这个对象作为 `this` 执行函数体。
4. 返回这个对象（除非显式返回了另一个对象）。

因此，`new Student('Alice', 98)` 本质上并不是“调用一种特殊的函数”，而是“用一种特殊的方式调用**普通函数**”。JavaScript 中并不存在一种叫“构造函数”的函数类型。所谓构造函数，仅仅意味着：**这个函数被 `new` 调用了**。它不是一个身份，而是一种调用方式。

那么，构造函数解决了共享问题吗？

```js
const a = new Student('Alice', 98);
const b = new Student('Bob', 81);

a.printScore === b.printScore; // false
```

方法仍然被重复创建。`new` 解决的是对象创建规范化的问题，并没有解决行为共享的问题。

**那共享到底靠什么？注意上面第二步。真正的答案藏在那里。**

## Prototype：共享行为的关键

重新回顾 `new` 的第二步：

> 将这个对象的 `[[Prototype]]` 连接到 `Student.prototype`。

这里出现了两个关键名词，拆开看：

- `[[Prototype]]`：每个对象都有的**Internal Slot**（内部槽位），指向另一个对象，用来实现委托。
- `prototype`：**只有函数才有的属性**，是一个普通对象。当函数被 `new` 调用时，新对象的 `[[Prototype]]` 就会被设置为这个 `prototype` 对象。

`[[Prototype]]` 是引擎内部使用的名字，两个中括号表示它是一个内部槽位（internal slot），普通代码无法直接读写。在 JS 中，我们通过下面方式操作：

```js
const obj = {};

// 读
Object.getPrototypeOf(obj);   // 标准 API，推荐
obj.__proto__;                // 存取器属性，不推荐生产环境使用

// 写
Object.setPrototypeOf(obj, p);   // 标准 API，推荐
obj.__proto__ = p;               // 存取器属性，不推荐生产环境使用
```

简单说：`[[Prototype]]` 是保险柜里的东西，`Object.getPrototypeOf` 和 `__proto__` 是两把钥匙——开的同一个保险柜。`__proto__` 在 ES2015 被标准化为浏览器兼容特性（Annex B），但因操作原型会带来性能和维护问题，**不推荐使用**。后文为书写直观，偶尔会用 `__proto__` 表示链接关系，但请记住它只是一个访问器。

所以第二步做的事很简单：**把新对象的 `[[Prototype]]` 指向 `Student.prototype` 这个普通对象**。

那么，这个 `prototype` 对象长什么样？在定义函数 Student 的那一刻，JavaScript 就自动创建了 `Student.prototype` 对象，且它一开始只有一个自有属性——指向函数自身的 `constructor`。

```js
function Student(name, score) {
  this.name = name;
  this.score = score;
  // 注意：这里不再定义 printScore，方法将放到原型上共享
}

console.log(Student.prototype); // { constructor: Student }
```

这个对象一直存在，只是之前我们没用上它。现在，把共享的方法挂到它上面：

```js
Student.prototype.printScore = function () {
  console.log(this.name, this.score);
};
```

此时再创建对象：

```js
const alice = new Student('Alice', 98);
const bob   = new Student('Bob', 81);

alice.printScore === bob.printScore; // true
```

无论创建多少学生对象，它们都会共享同一个 `printScore`。行为共享的问题，终于被解决了。

这相当于回答了一开始对象字面量留下的那个问题——“如何创建一批结构相同、行为共享的对象”。答案不在 `new`，也不在工厂函数，而在 **Prototype**。

## Prototype 为什么会存在？

理解 Prototype，先别看 JavaScript。先看看一种更熟悉的对象模型，比如 Java：

```java
class Student {
    String name;
    void printScore() { }
}

Student alice = new Student();
Student bob   = new Student();
```

两个对象共享同一个 `printScore()`。为什么？因为**它们来自同一个 Class**。Class 是模板，对象是模板制造出来的产品。共享的方法放在模板里，每个对象只是引用它。这就是传统 OOP 的思想：

> **先有 Class，再有 Object。**

整个对象模型都围绕 Class 建立。

JavaScript 没有选择这条路。它提出了一个完全不同的问题：

> **如果世界上根本没有 Class，还能不能共享行为？**

答案是可以。但它换了一套完全不同的思路。

## 从分类，到委托

我们打个比方。假设已经有一只猫：🐱，现在需要一只老虎。

传统 OOP 的做法是：先有 Animal 模板 → 派生 Cat → 再派生 Tiger。自顶向下，逐级细分。

JavaScript 不这么做。它的做法是：

```
先有一只猫。
  ↓
照着猫画。
  ↓
耳朵改大一点。
  ↓
身体改大一点。
  ↓
得到老虎。
```

没有模板，没有分类。只有：**参考已有对象，再修改。** 这就是 Prototype 最初的思想。注意，这里面没有“属于某一类”，只有“像某个对象”。

这种思维方式，在设计模式里有一个名字：**委托（Delegation）**。不是“我是 Student”，而是“我不会，你帮我做”。Prototype 本质上就是对象之间互相委托，而不是对象继承某个 Class。这是理解 JavaScript 对象模型最重要的一步。

> **延伸阅读：归类与划分**

如果你对 OOP 的设计思想有兴趣，可以了解一下分类思维的两种方向：

- **归类**——从具体对象中提取共性，自底向上。比如“麻雀会飞、鸽子会飞、老鹰会飞 → 它们都有羽毛、都会飞 → 归入‘鸟’”。先有对象，再归纳出类别，天然支持多继承。Python 的多重继承、Ruby 的 mixin、Scala 的 trait，都属于归类的思路。
- **划分**——从根基类逐级细分，自顶向下。比如“Object → Animal → Bird → Sparrow”。先有概念，再放入个体，通常采用单继承结构。Java 的 `extends`、C# 的继承体系，都属于划分的思路。

而 JavaScript 的 Prototype 走的是第三条路：不分类，只委托。它关心的不是“你是什么”，而是“你能不能帮我做”。

## JavaScript 如何做到这一点？

来看照猫画虎的例子：

```js
const cat = {
  species: 'cat',
  sound: 'meow',
  makeSound() {
    console.log(this.sound);
  }
};

const tiger = Object.create(cat);
tiger.sound = 'roar';    // 耳朵改大一点——其实是声音变凶猛了
tiger.size = 'large';    // 身体变大一点
```

很多人以为 `cat` 被复制了一份。实际上并没有。在代码中，`Object.create(cat)` 就是在说：“以 `cat` 为蓝本创建一个新对象，遇到自己没定义的方法时，委托给 `cat` 去做。” `tiger` 自己只有 `sound` 和 `size`：

```js
Object.keys(tiger); // ['sound', 'size']
```

（`Object.keys` 只返回对象自身的属性，不包括委托出去的。）

`Object.create()` 还可以接收第二个参数，让你在创建对象的同时定义自身属性：

```js
const tiger2 = Object.create(cat, {
  name: { value: 'tiger', writable: true, enumerable: true }
});
tiger2.name;      // 'tiger' — 自身属性
tiger2.species;   // 'cat'   — 委托给 cat
tiger2.makeSound(); // 'meow' — 方法来自 cat，但 this 指向 tiger2（还没有覆盖 sound）
```

这里出现的 `writable`、`enumerable` 等是**属性描述符**，下一篇会详细展开。

真正发生的是：`tiger` 内部有一个隐藏链接，指向 `cat`。调用 `tiger.makeSound()` 时，引擎开始查找：

1. `tiger` 自身 → 没有 `makeSound`
2. 沿着隐藏链接找到 `cat` → 有 `makeSound`
3. 执行

这里根本没有复制，没有继承。只有：**找不到，就委托别人。** 这就是 Delegation。

## Prototype Lookup 与原型链

当读取属性 `tiger.species` 时，JavaScript 并不会立即返回 `undefined`。它执行的是一个查找过程：

```
自身 → [[Prototype]] → [[Prototype]] 的 [[Prototype]] → …… → Object.prototype → null
```

一直找到链的尽头。这个过程叫做 **Prototype Lookup（原型查找）**。注意，这里发生的是**查找**，不是复制，也不是继承。

因为每个对象都可以继续委托另一个对象，自然形成一条链：

```
tiger → cat → Object.prototype → null
```

这就是**原型链（Prototype Chain）**。它只是 Prototype Lookup 的路径。一句话概括：

> **原型链，就是对象查找属性时不断向上委托形成的路径。**

## 属性遮蔽（Property Shadowing）

理解了查找方向，就会自然产生一个问题：**写属性的时候呢？**

```js
tiger.canFly = false;
```

（假设 cat 有一个 canFly 属性）这行代码会去修改 `cat` 吗？不会。**赋值永远只发生在对象自身上**，即使原型链上存在同名属性，对象也会在自己身上创建新的，原型的属性毫发无伤。后续读取 `tiger.canFly` 时，会先命中自身属性，原型上的同名属性就被“遮蔽”了。

重要结论：**原型链只决定“去哪读”，不决定“往哪写”。**

不过，遮蔽不是永久的。**赋值会在自身创建属性，`delete` 则会把它从自己身上移除。**一旦删除了自身的遮蔽属性，读取时就会再次回到原型链上查找：

```js
tiger.canFly = false;     // 在 tiger 自身创建 canFly，遮蔽原型上的 true
tiger.canFly;             // false（读取自身）

delete tiger.canFly;      // 删除自身属性
tiger.canFly;             // true —— 重新沿原型链找到 cat.canFly
```

所以判断一个属性是否「真的属于对象自身」，不能只看当前读取值，还要用 `hasOwnProperty` 检查。这一点在遍历对象时尤为重要。

## 原型查找与 this 绑定是两回事

还有一个极易混淆的点：

```js
const parent = {
  name: 'parent',
  say() { console.log(this.name); },
};

const child = Object.create(parent);
child.name = 'child';

child.say(); // "child"
```

很多人会误以为方法来自 `parent`，所以 `this` 一定指向 `parent`。其实不是。这里发生了两件独立的事：

1. **找方法**：沿原型链找到 `say`——这是 Prototype 的工作。
2. **执行方法**：`this` 指向调用者 `child`——这由调用方式决定，跟原型链无关。

**谁调用，`this` 就是谁；方法在链上哪里找到，不影响 `this`。**

## 无原型对象

所有普通对象最终都连接到 `Object.prototype`，从而继承了 `toString`、`hasOwnProperty`、`valueOf` 等方法。但你并非总是需要它们。

当你把对象当作纯粹的字典或映射时，这些继承来的属性反而会碍事：

```js
const dict = {};
dict['toString']; // function — 继承来的，不是我们存的
```

`Object.create(null)` 可以创建一个**没有原型**的对象：

```js
const dict = Object.create(null);
dict.__proto__;  // undefined
dict.toString;   // undefined — 没有任何继承属性
```

它的原型链直接终止于 `null`：

```
dict → null
```

这种“白纸”对象非常适合用作字典、配置对象、缓存映射——不用担心键名与 `Object.prototype` 上的属性冲突，也不需要 `hasOwnProperty` 之类的防御性检查。

## 为什么 `class` 只是语法糖？

现在再看 ES6 的 `class`：

```js
class Student {
  constructor(name) { this.name = name; }
  print() {}
}
```

很多人觉得 JavaScript 终于有 Class 了。其实没有。它只是把 `function Student() {}` 和 `Student.prototype.print = ...` 换成了更易读的写法。底层 `print()` 依然变成 `Student.prototype.print = function () {}`。

因此，**`class` 改变的是语法，不是对象模型。** 从 ES1 到今天，JavaScript 的对象模型一直都是 Prototype。

你可以用几个简单的判断验证这一点：

```js
class Student {
  constructor(name) { this.name = name; }
  print() { console.log(this.name); }
}

console.log(typeof Student);                    // 'function' —— class 本质还是函数
console.log(Student.prototype.print);           // [Function: print] —— 方法仍在 prototype 上
const s = new Student('Alice');
console.log(Object.getPrototypeOf(s) === Student.prototype); // true —— 原型链关系一致
```

也就是说，阅读 `class` 代码时，你完全可以把它在脑内「反编译」成 `function + prototype` 的形式。这也是理解 JavaScript 对象模型的关键：**不要被语法带走注意力，底层始终是 Prototype。**

## 组合与委托：另一种共享思路

Prototype 解决的是「行为共享」，但还有一种常见需求是把多个对象的属性合并到一起。ES6 提供了 `Object.assign()`：

```js
const canPrint = { print() { console.log(this.name); } };
const canScore = { score: 0 };

const student = Object.assign({}, canScore, canPrint);
student.name = 'Alice';
student.print(); // 'Alice'
```

乍一看，这和 Prototype 都能实现「让一个对象拥有另一个对象的能力」，但本质不同：

- **Prototype**：对象之间是**委托关系**——`print` 方法只有一份，多个实例通过原型链共享。
- **`Object.assign`**：对象之间是**复制关系**——属性条目被拷贝到目标对象自身；但当属性值是对象时，拷贝的是引用。

```js
const a = Object.assign({}, canPrint);
const b = Object.assign({}, canPrint);

a.print === b.print; // true —— 复制的是同一个函数引用
```

注意：这里虽然**函数对象本身被共享**，但 `print` 这个属性已经落到 `a` 和 `b` 自身，读取时不再通过原型链委托查找。所以「共享函数对象」和「不共享对象结构」是两件事，`Object.assign` 的本质仍然是复制属性条目。

因此，`Object.assign` 更适合做**一次性组合**或**浅拷贝配置对象**；如果需要批量创建共享行为的实例，Prototype 仍然是更合适的选择。这常被概括为：

> **委托（Delegation）对应“共享”，组合（Composition）对应“复制”。**

React 早期的高阶组件、Redux 的 reducer 组合、Vue 的 mixin，底层思想都偏向组合；而 JavaScript 的实例方法共享，底层思想则是委托。理解这两种思路的区别，你就不会被「到底该用 class 还是工厂函数」这种问题困住——它们只是写法，真正要回答的是：

> **这个场景需要共享行为，还是复制行为？**

## 回顾与小结

现在我们可以把两条线索串起来。

为方便对比，下面把本篇出现的几种创建对象方式列成一张表：

| 方式 | 批量创建 | 行为共享 | 典型场景 |
|---|---|---|---|
| 对象字面量 `{}` | ❌ | ❌ | 单例：配置、缓存、命名空间 |
| 工厂函数 | ✅ | ❌ | 简单批量创建实例 |
| 构造函数 + `new` | ✅ | ❌ | 规范批量创建流程 |
| 构造函数 + `prototype` | ✅ | ✅ | 大规模实例共享行为 |
| `Object.create(proto)` | ✅ | ✅ | 明确指定原型、无原型字典 |
| `class` | ✅ | ✅ | 更贴近传统 OOP 语法 |
| `Object.assign` | ✅ | ❌ | 一次性组合、浅拷贝、配置合并 |

最开始，对象字面量给了我们**单例对象**的最简形态——直接、明确，一个 `{}` 就是一个独一无二的存在。当我们只需要一个对象时，这就是最好的选择。

但是，一旦需要**一批结构相同、行为共享**的对象，字面量的复制粘贴就暴露了局限。工厂函数解决了批量创建，但没有解决共享；构造函数规范了创建流程，却依然靠不住共享。真正的答案在 **Prototype**：对象之间通过 `[[Prototype]]` 建立委托关系，当对象自身没有某个属性时，引擎会沿着这条委托链向上查找——方法只需保存一份，所有实例均可共享。

所以，JavaScript 的对象模型可以浓缩为：

> **Class 的核心思想是分类（Classification）。**
> **Prototype 的核心思想是委托（Delegation）。**

字面量是单例的原型，委托链是共享的基石。理解了这两点，你就抓住了 JavaScript 对象模型的灵魂。

## 附录

### `constructor`——只是原型上的一个普通属性

正文里提到，`new` 创建的实例可以通过原型链找到 `constructor`：

```js
function A() {}
const a = new A();

a.constructor === A;  // true
```

查找路径是：

```
a 自身 → 没有 constructor
  ↓
A.prototype → 找到 constructor，值为 A
```

`constructor` 看起来很特殊——每个构造函数的 `prototype` 上默认有一个指向自身的 `constructor` 属性。但它**并不特殊**，只是函数创建 `prototype` 对象时自动添加的一个普通数据属性：

```js
Object.getOwnPropertyDescriptor(A.prototype, 'constructor');
// { value: A, writable: true, enumerable: false, configurable: true }
```

它 `writable: true`，`configurable: true`——完全可以被改写甚至删除：

```js
A.prototype.constructor = null;
A.prototype.constructor;  // null

const a = new A();
a instanceof A;  // true — instanceof 不看 constructor
```

**常见误用**：试图通过 `obj.constructor` 判断对象类型。这不可靠——`constructor` 可以被修改，也可以在原型链上被遮蔽。判断类型的正确方式是 `instanceof`（检查原型链）或 `Object.prototype.toString.call()`（检查内部标签）。

### `hasOwnProperty` 与 `in`——检测属性的来源

这是原型链最直接的实践应用，和正文中「属性遮蔽」那节天然关联。

```js
const obj = Object.create({ inherited: 1 });
obj.own = 2;

obj.own;           // 2
obj.inherited;     // 1

// 检测属性来自自身还是原型链
obj.hasOwnProperty('own');        // true  — 自身属性
obj.hasOwnProperty('inherited');  // false — 来自原型链

// in 操作符检查整个原型链
'own' in obj;           // true
'inherited' in obj;     // true
'toString' in obj;      // true — 来自 Object.prototype
```

`hasOwnProperty` 只检查**自身属性**，不关心原型链；`in` 检查**整条原型链**。这在遍历对象时需要特别留意。

**容易踩的坑**：`hasOwnProperty` 本身是继承来的方法，所以无原型对象（`Object.create(null)`）上没有它：

```js
const dict = Object.create(null);
dict.key = 1;
dict.hasOwnProperty('key'); // TypeError: dict.hasOwnProperty is not a function

// 正确做法
Object.prototype.hasOwnProperty.call(dict, 'key'); // true
```

### `for...in` 为什么能遍历到原型上的属性？

很多初学者以为 `for...in` 只遍历自身属性，实际它也会遍历原型链上**可枚举**的属性。

```js
const parent = { inherited: 1 };
const child = Object.create(parent);
child.own = 2;

for (const key in child) {
  console.log(key); // 'own'，然后是 'inherited'
}
```

这也是为什么老一辈 JavaScript 程序员总是习惯加一层过滤：

```js
for (const key in obj) {
  if (obj.hasOwnProperty(key)) {
    // 只处理自身属性
  }
}
```

而现代的 `Object.keys()`、`Object.values()`、`Object.entries()` 只返回**自身可枚举**属性，天然避开了这个问题。

### `instanceof`——原型链的实际应用

`instanceof` 是原型链最经典的应用场景之一：

```js
a instanceof A
```

这句话的本质是：**`A.prototype` 是否出现在 `a` 的原型链上？**

```js
function A() {}
function B() {}

// 把 A 的原型替换成 B 的
A.prototype = Object.create(B.prototype);

const a = new A();
a instanceof A;  // true — A.prototype 在 a 的原型链上
a instanceof B;  // true — B.prototype 也在 a 的原型链上
```

`instanceof` 检查的是原型链关系，不是构造函数身份。此外，`Symbol.hasInstance` 可以自定义 `instanceof` 的判断逻辑，`bind` 后的函数也有特殊处理——这些属于更进阶的话题，这里不展开。

### `new.target`——函数如何知道自己被 `new` 调用？

正文提到：构造函数不是一种函数类型，而是函数被 `new` 调用时的一种调用语义。ES6 提供了一个内置机制来佐证这一点：`new.target`。

```js
function Student(name) {
  if (!new.target) {
    throw new Error('Please use new.');
  }
  this.name = name;
}
```

普通调用会抛出异常：

```js
Student('Alice'); // Error: Please use new.
```

而 `new` 调用正常执行：

```js
new Student('Alice'); // 正常
```

当函数被 `new` 调用时，`new.target` 指向该函数本身；当函数被普通调用时，`new.target` 为 `undefined`。这个机制进一步说明：

> **所谓构造函数，只是普通函数的一种调用方式。函数本身并不自带“构造”身份。**

在实际开发中，`new.target` 很少直接使用——大多数场景下，`class` 已经帮我们处理好了调用检测（`class` 构造函数如果不用 `new` 调用会直接抛错）。但理解它的存在，能帮助你彻底消除「构造函数是一种特殊函数」的误解。

### `Object.create(null)` 的实际应用场景

正文讲了无原型对象是什么，这里展开它为什么有用：

**场景一：纯字典 / 映射**

不用担心键名与继承属性冲突：

```js
const dict = {};
dict['toString']; // function — 继承来的，不是我们存的

// ❌ 常见误区：意外覆盖了原型方法
const badDict = {};
badDict.toString = 'abc';
badDict.toString; // 'abc' — 不再是方法，依赖 toString 的代码会出错

// ✅ 无原型对象没有这个问题
const safe = Object.create(null);
safe.toString = 'abc';
safe.toString; // 'abc' — 干净纯粹
```

**场景二：性能敏感的查找**

免去原型链遍历的开销。虽然现代引擎优化很好，但在高频查找场景下仍有一定意义。

**`Object.create(null)` vs `Map`**：

| | `Object.create(null)` | `Map` |
|---|---|---|
| 键类型 | 只能是字符串或 Symbol | 任意类型（对象、函数等） |
| API 风格 | 点语法 / 方括号 | 专门的 `get` / `set` / `has` 方法 |
| 适合场景 | 静态配置、JSON 交互 | 动态增删、非字符串键 |
| 迭代 | 需用 `Object.keys` 等 | 内置迭代器，有序 |

选择建议：如果键都是字符串且结构相对固定，`Object.create(null)` 更轻量；如果需要频繁增删键值对或键的类型不限于字符串，用 `Map` 更合适。

### `Object.assign()` 不复制继承属性

`Object.assign(target, source)` 会把 `source` 的**自身可枚举属性**复制到 `target`，但它不会复制原型链上的属性：

```js
const proto = { inherited: 1 };
const obj = Object.create(proto);
obj.own = 2;

const copy = Object.assign({}, obj);
copy.own;        // 2 —— 自身属性被复制
copy.inherited;  // undefined —— 继承属性不会被复制
```

如果你确实需要保留原型关系，应该使用 `Object.create(Object.getPrototypeOf(obj), ...)`，而不是 `Object.assign`。

### 原型污染（Prototype Pollution）小例子

动态修改内置 `prototype` 是一件危险的事：

```js
Object.prototype.polluted = 'danger';
const obj = {};
obj.polluted; // 'danger' —— 凭空多出来的属性
```

这在处理不可信 JSON 或递归合并对象时尤其危险，攻击者可能通过 `__proto__` 键污染所有对象。防御手段包括：
- 使用 `Object.create(null)` 作为字典，避免继承链；
- 合并对象时过滤 `__proto__`、`constructor`、`prototype` 等风险键；
- 不轻易扩展 `Object.prototype`。

### 原型链查找的性能考量（小提醒）

Prototype Lookup 向上查找的过程有开销——引擎需要逐级检查直到找到目标属性或抵达 `null`。现代引擎通过**内联缓存（Inline Caching）**大幅优化了这一过程，因此大多数情况下你不需要主动缩短原型链。

但有一点值得注意：**避免在热点代码中动态修改 `[[Prototype]]`**（比如在循环里反复使用 `Object.setPrototypeOf`）。这种操作会使引擎已有的优化失效，对性能产生明显影响。原型链设置好之后，保持稳定即可。

### 如何安全地查看与调试原型链

生产代码中应始终使用标准 API：

```js
Object.getPrototypeOf(obj);   // 读
Object.setPrototypeOf(obj, p); // 写（不推荐频繁使用）
Object.prototype.isPrototypeOf.call(proto, obj); // 检查原型链关系
```

浏览器控制台查看时，`obj.__proto__` 最直观，但请记住它只是访问器，不是对象内部的 `[[Prototype]]` 本身。写库或工具时，优先使用 `Object.getPrototypeOf`。

### 重要的原型关系速查

下面这些等式，可以作为日常排查原型链问题的参考：

```js
function A() {}

// 构造函数的 __proto__ 指向 Function.prototype
A.__proto__ === Function.prototype;                    // true

// 原型对象的 __proto__ 指向 Object.prototype
A.prototype.__proto__ === Object.prototype;            // true

// 原型链的终点
Object.prototype.__proto__ === null;                   // true

// Function.prototype 也最终连接到 Object.prototype
Function.prototype.__proto__ === Object.prototype;     // true

// 内置构造函数本身也是 Function 的实例
Object.__proto__ === Function.prototype;               // true
Function.__proto__ === Function.prototype;             // true

// 实例的 __proto__ 指向构造函数的 prototype
const a = new A();
a.__proto__ === A.prototype;                           // true
A.prototype.constructor === A;                         // true
```

### `Object.prototype` 上的「标准装备」

普通对象都继承了 `Object.prototype`，上面到底有什么？这里列出常用的：

| 方法 | 作用 |
|------|------|
| `toString()` | 返回 `'[object Object]'`（可被覆盖） |
| `valueOf()` | 返回对象本身（可被覆盖） |
| `hasOwnProperty(key)` | 检查是否为自身属性 |
| `isPrototypeOf(obj)` | 检查自身是否在 `obj` 的原型链上 |
| `propertyIsEnumerable(key)` | 检查自身属性是否可枚举 |

`isPrototypeOf` 和 `instanceof` 互为镜像：

```js
A.prototype.isPrototypeOf(a);  // true — 原型链检测，另一种写法
a instanceof A;                // true — 等价
```

### 特殊的 `Function.prototype`

`Function.prototype` 是规范中唯一一个同时扮演**函数对象**和**原型对象**双重身份的对象。

它本身可调用：

```js
Function.prototype();                // undefined
typeof Function.prototype === 'function';  // true
```

但其他内置类型的 prototype 不是函数：

```js
typeof Object.prototype === 'object';
typeof Array.prototype === 'object';
```

它作为函数对象，理论上可以拥有 `prototype` 属性，但规范没有为其创建该属性，因此：

```js
Function.prototype.prototype === undefined;              // true
Function.prototype.hasOwnProperty('prototype');          // false
```

它继承自 `Object.prototype`，所有函数（包括构造函数）都是 `Function` 的实例。

**为什么 `Function.prototype` 也是函数对象？**

规范要求所有函数对象都继承自它。因此 `Function.prototype` 本身也是一个函数对象，作为函数对象在原型链上的公共起点。

### 为什么 chrome 控制台打印 `console.log(Student.prototype)` 是个空对象？

在控制台打印 `Student.prototype` 时，经常看到 `{}`，点击小三角展开后才会出现 `constructor`。这是因为 `constructor` 的 `enumerable` 为 `false`，而控制台的折叠预览默认只显示可枚举属性。使用 `Object.getOwnPropertyNames()` 可以列出所有自有属性（包括不可枚举的），此时就能看到 `constructor`。

```js
function Student() {}
console.log(Student.prototype); // 折叠预览显示 {}
console.log(Object.getOwnPropertyNames(Student.prototype)); // ['constructor']
```

