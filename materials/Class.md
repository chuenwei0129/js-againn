---
title: JavaScript Class：从旧债到新约
created: 2025-06-09
updated: 2025-06-09
tags:
  - JavaScript
  - Class
  - Prototype
description: 从"typeof class === 'function' 但你不能当函数用"出发，逐一拆解 class 引入的每一个特性到底在弥补 ES5 哪些债——[[IsClassConstructor]]、强制严格模式、TDZ、non-enumerable 方法、extends 与 [[HomeObject]] 绑定、super 的双重语义、#private、new.target、以及组合优于继承的终极选择。
status: evergreen
---

你一定听过这句话：

```js
typeof class {}; // 'function'
```

"Class 只是语法糖。"——这句话被无数人说过，也被无数人纠正过。但纠正的点往往停留在"class 和构造函数有细微差别"，听起来像是犄角旮旯的科普。

问题不在细节，而在方向。说"class 是语法糖"的人，潜台词是"class 没带来什么新东西"。但如果你倒过来看——**class 引入的每一个特性，都是在填 ES5 留下的坑**——你会发现这颗"糖"的味道远比想象中复杂：

- 构造函数可以不用 `new` 调用？class 说不允许。
- 函数默认 sloppy mode？class 说强制严格。
- 声明的函数提升后能直接用？class说你敢试试。
- 原型方法可枚举、混进 `for...in`？class 说不可枚举。
- 继承靠手写寄生组合式？class 说有 `extends`。
- `super` 不存在、手写 `Parent.prototype.method.call(this)`？class 说绑好了。
- 没有私有？靠 `_` 前缀约定？class 说有 `#private`。

> **Class 不是给构造函数穿了一件新衣服。Class 是给 JavaScript 的 OOP 偿还了一整笔旧债。**

是不是感觉突然不一样了？别急，我们一笔一笔算。

---

## 一、旧债：构造函数可以不用 new 调用

```js
function User(name) {
  this.name = name;
}

const u = User('张三'); // 忘了写 new
console.log(u);        // undefined
console.log(name);     // '张三' —— name 被挂到了全局对象上
```

这是 ES5 时代最常见的坑之一。构造函数本质上就是普通函数，`new` 只是一个调用约定。忘了写 `new`，`this` 就跑到了全局对象（非严格模式）或直接抛错（严格模式但你自己没加 `'use strict'`）。

人们是怎么防的？手动加守卫：

```js
function User(name) {
  if (!(this instanceof User)) {
    return new User(name);
  }
  this.name = name;
}
```

这种代码你一定见过。它确实能用，但它是在**用运行时检查弥补语言设计缺失的编译时约束**。每次调用都多走一个 `instanceof` 分支。

### 新约：[[IsClassConstructor]]

Class 用一个内部槽位彻底堵住了这个口子：

```js
class User {
  constructor(name) {
    this.name = name;
  }
}

User('张三');
// TypeError: Class constructor User cannot be invoked without 'new'
```

规范层面，class 声明产生的函数对象带有一个内部标记 `[[IsClassConstructor]]: true`。当引擎尝试不通过 `new` 调用它时，直接抛出 TypeError。这不是运行时检查，是语法层面的禁止。

而且这个标记还带来一个附带效果：

```js
class User {
  constructor(name) {
    this.name = name;
  }
}

console.log(User); // 不同于普通函数，class 在 tostring 时会显示 "class User ..."
// 更关键的是：如果用 User.call(obj) 或 User.apply(obj, args) 调用，同样会报错
```

**一笔旧债清了。** 构造函数不再有被误调的风险。

---

## 二、旧债：默认 sloppy mode

ES5 的函数默认运行在 sloppy mode 下。你想要严格模式？自己加 `'use strict'`：

```js
function User(name) {
  // 如果没写 'use strict'，这就是 sloppy mode
  // this 指向全局对象，变量泄漏到全局……
}
```

在构造函数里，sloppy mode 最常见的隐患：

```js
function User(name) {
  // sloppy mode：忘了写 var/let/const，变量跑全局
  age = 18; // 糟了，全局变量
  this.name = name;
}
```

你当然会反驳："加 `'use strict'` 不就行了？"没错，但这恰恰是问题——**你得记住加**。JS 的默认是宽松的，靠人记忆来补安全网，不是好设计。

### 新约：强制严格模式

Class 的整个类体（包括方法、getter/setter、静态方法）始终在严格模式下执行。不需要你加任何声明：

```js
class User {
  constructor(name) {
    age = 18; // ReferenceError: age is not defined
    this.name = name;
  }
}
```

你没法关掉它。这是语言层面帮你做了正确的事。

**又一笔旧债清了。** 不再靠人记得加 `'use strict'`。

---

## 三、旧债：声明提升，未定义就能用

```js
const u = new User('张三'); // 能用？能用。

function User(name) {
  this.name = name;
}
```

函数声明会提升（hoisting），你在声明之前就能调用它。这在大多数场景是无害的，但在构造函数的场景下，它意味着一段依赖某个构造函数的代码可以在构造函数定义之前就运行——而且不出错，只是得到错的 `this`。

这不算严重的 bug，但它是一种**时序上的模糊性**：读代码的人不知道 `User` 到底在哪定义的，甚至不确定它在这个位置是否真的可用。

### 新约：暂时性死区（TDZ）

Class 声明虽然也会提升，但被放进了暂时性死区：

```js
const u = new User('张三'); // ReferenceError: Cannot access 'User' before initialization
class User {
  constructor(name) {
    this.name = name;
  }
}
```

跟 `let`/`const` 一样的行为：引擎知道 `User` 存在（它确实被提升了），但在声明语句执行之前，访问它就是报错。

这比函数声明的行为更合理——**如果你还没到达定义的位置，就不应该用。**

> 另外注意：class **表达式**也有同样行为：
> ```js
> const User = class { /* ... */ }; // 只有赋值完成后才能用
> ```
>
> 这和函数表达式是一致的，但和函数声明不同。这又是一个"class 更安全"的点。

**第三笔旧债清了。** 声明前不能用的，就是不能用。

---

## 四、旧债：原型方法可枚举，混进 for...in

```js
function User(name) {
  this.name = name;
}

User.prototype.sayHi = function () {
  console.log(`Hi, I'm ${this.name}`);
};

const u = new User('张三');

for (const key in u) {
  console.log(key);
}
// 'name'
// 'sayHi' —— 原型方法被遍历出来了
```

每个 `for...in` 都要把原型上的方法遍历一遍。实践中人们这样防：

```js
Object.defineProperty(User.prototype, 'sayHi', {
  value: function () {
    console.log(`Hi, I'm ${this.name}`);
  },
  enumerable: false, // 手动设为不可枚举
});
```

能用，但谁这么写？几乎没人。大家要么用 `Object.keys()`（跳过原型），要么在 `for...in` 里加 `hasOwnProperty` 检查——**又是在用运行时守卫弥补语言默认行为的问题**。

### 新约：方法默认不可枚举

```js
class User {
  constructor(name) {
    this.name = name;
  }

  sayHi() {
    console.log(`Hi, I'm ${this.name}`);
  }
}

const u = new User('张三');

for (const key in u) {
  console.log(key);
}
// 'name' —— 只输出实例属性，原型方法不会出现

Object.getOwnPropertyDescriptor(User.prototype, 'sayHi');
// { value: [Function: sayHi], writable: true, enumerable: false, configurable: true }
```

`enumerable: false`。不用你手动设置，class 帮你做了。

实际上 class 在属性描述符上做了全套调整：

| 属性 | class 方法 | 手动挂原型 |
|------|-----------|-----------|
| `writable` | `true` | `true` |
| `enumerable` | **`false`** | `true`（默认） |
| `configurable` | `true` | `true` |

就这一个 `enumerable` 的差异，省掉了多少 `hasOwnProperty` 守卫？

**第四笔旧债清了。** 原型方法不再污染遍历。

---

## 五、旧债：constructor 指向丢失

```js
function User(name) {
  this.name = name;
}

User.prototype.sayHi = function () {
  console.log(`Hi, I'm ${this.name}`);
};

console.log(User.prototype.constructor === User); // true，目前还好

// 但如果你重写了 prototype：
User.prototype = {
  sayHi() {
    console.log(`Hi, I'm ${this.name}`);
  },
};

console.log(User.prototype.constructor === User); // false
// constructor 现在指向 Object，因为对象字面量的 constructor 默认是 Object
```

这在 ES5 时代非常常见——当你手写原型链继承的时候，几乎每次重写 `prototype` 都要手动修 `constructor`：

```js
Sub.prototype = Object.create(Super.prototype);
Sub.prototype.constructor = Sub; // 别忘了这行
```

忘了？`instanceof` 还能正常用（因为它走 `[[Prototype]]` 链），但 `x.constructor` 就会给你一个错误答案。更麻烦的是，某些库和框架依赖 `constructor` 来做类型推断。

### 新约：class 自动维护 constructor

```js
class User {
  sayHi() {
    console.log('Hi');
  }
}

console.log(User.prototype.constructor === User); // true
console.log(User.prototype.constructor.name);       // 'User'
```

class 声明会自动在 `prototype` 上创建一个不可枚举的 `constructor` 属性，指向类本身。你不需要手动维护它。

而且即使你显式定义了 `constructor`：

```js
class User {
  constructor(name) {
    this.name = name;
    // 不需要 return this
  }
}
```

Class 的 `constructor` 默认返回 `this`。你不需要（也不应该）写 `return this`。这又是和 ES5 构造函数的一个微妙区别——ES5 构造函数里如果不小心返回了一个对象，`new` 的结果就变成了那个对象：

```js
function User(name) {
  this.name = name;
  return { oops: true }; // 糟了，new User() 返回的不是 this
}

const u = new User('张三');
console.log(u.name);    // undefined
console.log(u.oops);    // true
```

Class 的 `constructor` 虽然也支持显式返回对象（后文会详细讲），但你再也不需要写 `return this` 了——引擎帮你做了。

**第五笔旧债清了。** `constructor` 不会丢，`return this` 不用写。

---

## 六、旧债：继承是手艺活

```js
// ES5 的寄生组合式继承——"推荐"写法
function Animal(name) {
  this.name = name;
}

Animal.prototype.run = function () {
  console.log(`${this.name} runs`);
};

function Rabbit(name, earLength) {
  Animal.call(this, name); // 第一步：借用构造函数
  this.earLength = earLength;
}

// 第二步：建立原型链
Rabbit.prototype = Object.create(Animal.prototype);
Rabbit.prototype.constructor = Rabbit; // 第三步：修复 constructor

// 第四步：定义子类方法
Rabbit.prototype.hide = function () {
  console.log(`${this.name} hides`);
};
```

四步，每一步都有坑：

| 步骤 | 常见错误 |
|------|---------|
| `Animal.call(this, name)` | 忘了传参数，或 `this` 指向错了 |
| `Rabbit.prototype = Object.create(...)` | 写成 `new Animal()`，父类构造函数被多调一次 |
| `Rabbit.prototype.constructor = Rabbit` | 忘了写，`constructor` 指向 `Animal` |
| 定义子类方法 | 写在 `Object.create` 之前，被覆盖掉了 |

这不是"高级技巧"——这是**每个 JS 开发者都得背下来的样板代码**。而且即使你背对了，`instanceof` 也只能检查一条链，因为 JS 是单继承。

### 新约：extends 一键继承

```js
class Animal {
  constructor(name) {
    this.name = name;
  }

  run() {
    console.log(`${this.name} runs`);
  }
}

class Rabbit extends Animal {
  constructor(name, earLength) {
    super(name); // 调用父类构造器
    this.earLength = earLength;
  }

  hide() {
    console.log(`${this.name} hides`);
  }
}

const rabbit = new Rabbit('White Rabbit', 10);
rabbit.run();  // White Rabbit runs
rabbit.hide(); // White Rabbit hides
console.log(rabbit instanceof Rabbit); // true
console.log(rabbit instanceof Animal); // true
```

一个 `extends`，四个步骤全包了。原型链自动建立、`constructor` 自动正确、方法定义在正确位置。

但如果你只把 `extends` 理解成"语法糖，本质上还是原型链"——你就错过了 class 继承真正的新东西。

---

## 七、super 不只是 Parent.prototype.method.call(this)

ES5 时代怎么调父类方法？

```js
Rabbit.prototype.hide = function () {
  // 调用父类方法
  Animal.prototype.run.call(this); // 手动绑定 this
};
```

这行代码有四个问题：

1. **硬编码父类名**：`Animal` 写死了。如果哪天改了继承关系，这行也得改。
2. **手写 `.call(this)`**：每次都要手动绑定 `this`。
3. **静态方法没有 `prototype`**：`Animal.create.call(this)` 这种写法对静态方法不通用——静态方法挂在类本身上，不在 `prototype` 上。
4. **多重层级时更痛苦**：三层继承时，你写 `GrandParent.prototype.method.call(this)`，中间层稍有变动就崩了。

### 新约：[[HomeObject]] 绑定 super

Class 用一个内部槽位 `[[HomeObject]]` 彻底解决了这个问题。

当你写 `super.method()` 时，引擎不是去找"某个叫 `Parent` 的类"——它找的是 **当前方法所在的 `[[HomeObject]]` 的 `[[Prototype]]`**：

```txt
Rabbit.prototype.hide 的 [[HomeObject]] === Rabbit.prototype
Rabbit.prototype 的 [[Prototype]] === Animal.prototype
所以 super.run() 等价于从 Animal.prototype 上找 run
```

这意味着：

```js
class Animal {
  run() {
    console.log(`${this.name} runs`);
  }
}

class Rabbit extends Animal {
  hide() {
    super.run(); // 引擎根据 [[HomeObject]] 自动定位，不需要你写 Animal.prototype
  }
}
```

**`super` 不依赖类名。** 即使你改了继承链，只要 `[[HomeObject]]` 链是对的，`super` 就能正确找到上一级。

有两个地方需要特别注意 `super` 的行为差异：

### super 在实例方法 vs 静态方法中

```js
class Parent {
  static greet() {
    return 'Hello from Parent';
  }

  sayHi() {
    return `Hi from ${this.name}`;
  }
}

class Child extends Parent {
  static greet() {
    return super.greet() + ' and Child'; // super 指向 Parent 本身（静态方法在类上）
  }

  sayHi() {
    return super.sayHi() + ' Jr.'; // super 指向 Parent.prototype（实例方法在原型上）
  }
}

console.log(Child.greet()); // 'Hello from Parent and Child'
console.log(new Child().sayHi()); // 'Hi from undefined Jr.'
```

规律很简单：

| 位置 | `super` 指向 |
|------|------------|
| 实例方法 | `Parent.prototype` |
| 静态方法 | `Parent` 本身 |

### super 中的 this 仍然是子类实例

```js
class Parent {
  constructor() {
    this.x = 1;
  }

  print() {
    console.log(this.x);
  }
}

class Child extends Parent {
  constructor() {
    super();
    this.x = 2;
  }

  m() {
    super.print(); // 调用父类方法，但 this 仍然是 Child 实例
  }
}

const child = new Child();
child.m(); // 2，不是 1
```

`super.print()` 执行的是 `Parent.prototype.print`，但 `print` 内部的 `this` 是子类实例。这使得 `super` 方法可以正常操作子类状态——**委托而非复制**，这才是 `super` 的本质。

**第六笔旧债清了。** 不再需要手动查找和绑定父类方法。

---

## 八、子类构造器中的 this——为什么必须先 super？

在 ES5 中，构造函数里的 `this` 是 `new` 运算符创建的空对象：

```js
function Animal(name) {
  // this 已经存在，是 new 创建的空对象
  this.name = name;
}
```

不管有没有继承，`this` 都在一开始就准备好了。

但在 class 继承中，事情变了：

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
}

class Rabbit extends Animal {
  constructor(name, earLength) {
    // 这里还没有 this！
    console.log(this); // ReferenceError: Must call super() before accessing 'this'
    super(name);
    // super() 之后 this 才可用
    this.earLength = earLength;
  }
}
```

**为什么？** 因为在派生类（有 `extends` 的类）中，`new` 不再为子类创建 `this`——创建 `this` 的责任交给了父类构造器。调用 `super()` 的过程就是让父类创建 `this`：

```txt
new Rabbit('White Rabbit', 10)
  → 引擎发现 Rabbit 是派生类
  → 不创建 this
  → 进入 Rabbit 构造器
  → super() → 进入 Animal 构造器
  → Animal 完成初始化 → this 被创建
  → 回到 Rabbit 构造器 → this 可用
```

这解释了一个迷惑行为：

```js
class Parent {
  constructor() {
    console.log(new.target.name); // 'Child'，不是 'Parent'
  }
}

class Child extends Parent {
  constructor() {
    super();
  }
}

new Child(); // 打印 'Child'
```

即使在 `Parent` 的构造器里，`new.target` 指向的是最初 `new` 的那个类——`Child`。因为 `this` 最终是给 `Child` 创建的，`Parent` 只负责初始化一部分。

### 如果子类不写 constructor 呢？

引擎会自动插入：

```js
constructor(...args) {
  super(...args);
}
```

这很合理：子类什么都不需要额外初始化，就全部委托给父类。

### 构造器可以返回别的对象吗？

可以，但行为和 ES5 构造函数一致：

```js
class Foo {
  constructor() {
    return Object.create(null); // 返回了别的对象
  }
}

console.log(new Foo() instanceof Foo); // false
```

规则：

- 构造器返回**对象或函数**：`new` 的结果就是那个返回值
- 构造器返回**原始值**：被忽略，仍然返回 `this`

> 实战中几乎不建议这么做，这会让类的行为难以预测。

**第七笔旧债清了。** `this` 的创建现在是显式可控的——父类负责建，子类负责填。

---

## 九、旧债：没有私有，靠约定

ES5 有私有吗？没有。大家靠命名约定：

```js
function User(name) {
  this._name = name; // 下划线约定：别碰我
}

User.prototype.getName = function () {
  return this._name;
};
```

`_name` 仍然是公开的：

```js
const u = new User('张三');
console.log(u._name); // '张三' —— "私有"？不，随时能访问
delete u._name;       // 甚至能删
console.log(u.getName()); // undefined
```

更惨的是，`for...in`、`Object.keys()`、`JSON.stringify()` 都会暴露 `_name`。你唯一的防线是团队约定——而约定在代码规模大了以后就是没有防线。

闭包可以制造真私有，但代价大：

```js
function User(name) {
  let _name = name; // 真私有，但在构造函数作用域内

  this.getName = function () {
    return _name;
  };

  this.setName = function (newName) {
    _name = newName;
  };
}
```

问题是：每个实例都创建一份 `getName` 和 `setName`，不在原型上共享。如果类有 1000 个实例，就有 1000 份闭包。

### 新约：#private 强制不可访问

ES2022 引入了 `#private` 字段：

```js
class BankAccount {
  #balance = 0; // 私有字段，必须声明
  #pin;

  constructor(initialBalance, pin) {
    this.#balance = initialBalance;
    this.#pin = pin;
  }

  #validatePin(inputPin) {
    return this.#pin === inputPin;
  }

  withdraw(amount, pin) {
    if (!this.#validatePin(pin)) {
      throw new Error('错误的 PIN');
    }
    if (amount > this.#balance) {
      throw new Error('余额不足');
    }
    this.#balance -= amount;
    return amount;
  }
}

const account = new BankAccount(1000, '1234');
console.log(account.#balance); // SyntaxError: Private field '#balance' must be declared in an enclosing class
console.log(account['#balance']); // undefined —— 不是同一个东西
```

注意这几点：

**1. 私有字段必须先声明**

```js
class Foo {
  constructor() {
    this.#x = 1; // SyntaxError: Private field '#x' must be declared in an enclosing class
  }
}
```

不能像公共属性那样 `this.xxx = 1` 动态添加。私有字段必须在类体顶层声明：

```js
class Foo {
  #x = 1; // 声明
  // #y;    // 也可以只声明不赋值

  getX() {
    return this.#x;
  }
}
```

这是有意为之的设计——私有字段是**声明式的**，不是**动态添加的**。你要在类定义的时候就决定"这个类有哪些私密态"。

**2. 子类无法访问父类私有字段**

```js
class Parent {
  #secret = 'parent secret';
}

class Child extends Parent {
  getSecret() {
    return this.#secret; // SyntaxError: Private field '#secret' must be declared in an enclosing class
  }
}
```

`#secret` 只属于 `Parent` 的类体作用域。子类看不到它，就像函数的局部变量对外部不可见一样。这是**词法作用域**的私密性，不是基于继承链的。

这也意味着：私有字段名不会和公共字段名冲突：

```js
class MyClass {
  #x = 1; // 私有
  x = 2;  // 公共

  getX() {
    return [this.#x, this.x]; // [1, 2] 各走各的
  }
}
```

**3. 无法通过任何反射手段访问**

```js
const account = new BankAccount(1000, '1234');
Object.keys(account);                  // 只有公共属性
Object.getOwnPropertyNames(account);   // 还是只有公共属性
account.hasOwnProperty('#balance');     // false
```

`Object.keys()`、`Object.getOwnPropertyNames()`、`JSON.stringify()`——全都看不到 `#balance`。它不是"不可枚举"，是**根本不在公共属性系统里**。

**4. 私有字段的访问检查：`in` 运算符**

既然外部无法访问，那怎么检测一个对象上是否有某个私有字段？

```js
class Foo {
  #x = 1;

  static hasX(obj) {
    return #x in obj; // 只能在类内部使用
  }
}

console.log(Foo.hasX(new Foo())); // true
console.log(Foo.hasX({}));        // false
```

`#x in obj` 只能在声明了 `#x` 的类体内使用。外部无法检测。

**5. 静态私有字段和方法**

```js
class Counter {
  static #count = 0;

  static increment() {
    this.#count++;
  }

  static getCount() {
    return this.#count;
  }
}

Counter.increment();
Counter.increment();
console.log(Counter.getCount()); // 2
// console.log(Counter.#count);  // SyntaxError
```

静态私有成员属于**类本身**，不属于实例。

**6. 为什么用 `#` 而不是 `private`？**

这是一个有意为之的设计决策：

- `private` 是访问修饰符，暗示"运行时也有这个字段，只是不可访问"——Java/C# 的私有就是这样
- `#` 是词法绑定，意味着"这个字段名只在类的 `{}` 内有意义"——出了这个类体，`#x` 就是一个语法错误

这种设计确保了**真正的封装**：没有后门。即使是子类、甚至是 `Proxy`，都无法绕过 `#` 的访问限制。

```js
class Secret {
  #value = 42;
}

const s = new Secret();
const p = new Proxy(s, {
  get(target, prop) {
    if (prop === '#value') return 'hacked'; // 没用，#value 不是属性
    return target[prop];
  },
});

s.#value; // 仍然 SyntaxError，proxy 根本拦不到私有字段访问
```

语义上，`#value` 不是属性访问——它是**内部槽位访问**。Proxy 拦截的是属性操作（`get`/`set`/`has`/`deleteProperty`），而私有字段走的是完全不同的一条路。

> 详见 [[JavaScript/Symbol]] 中关于 Proxy 和内部槽位的讨论。

**第八笔旧债清了。** JS 终于有了真正的私有——不是约定，不是闭包的 hack，是语言层面的保证。

---

## 十、旧债：静态成员只能手动挂

ES5 怎么写静态方法？

```js
function User(name) {
  this.name = name;
}

// 实例方法
User.prototype.sayHi = function () {
  console.log(`Hi, I'm ${this.name}`);
};

// 静态方法
User.create = function (name) {
  return new User(name);
};
```

静态方法就是在构造函数对象上手动挂属性。能用，但有问题：

- 构造函数的定义和静态方法的定义**分离在两处**，读代码时要来回跳
- `create` 是可枚举的（`for...in` 会遍历到）
- 没有静态属性的声明式写法（只能 `User.count = 0`）

### 新约：static 关键字

```js
class User {
  static count = 0; // 静态字段，声明式

  static create(name) {
    return new User(name);
  }

  constructor(name) {
    this.name = name;
    User.count++;
  }
}

const u1 = User.create('张三');
const u2 = User.create('李四');
console.log(User.count); // 2
```

静态成员定义在**类体内部**，和实例方法在一起。来回跳的问题没了。

而且静态成员有继承行为：

```js
class Animal {
  static planet = 'Earth';

  static getPlanet() {
    return this.planet; // this 指向调用的类
  }
}

class Rabbit extends Animal {
  static planet = 'Mars';
}

console.log(Animal.getPlanet()); // Earth
console.log(Rabbit.getPlanet()); // Mars —— this 指向 Rabbit
```

注意这里 `this` 的指向：`Rabbit.getPlanet()` 调用时，`this` 是 `Rabbit`，所以 `this.planet` 是 `'Mars'`。**静态方法中的 `this` 永远指向调用的类本身**，不是父类。

这使得工厂方法模式变得自然：

```js
class Article {
  constructor(title, date) {
    this.title = title;
    this.date = date;
  }

  static createTodays(title) {
    return new this(title, new Date()); // this 指向调用的类
  }
}

class PremiumArticle extends Article {}

const a = Article.createTodays('普通文章');
const p = PremiumArticle.createTodays('精品文章');
// this 自动指向子类，工厂方法天然支持继承
```

**第九笔旧债清了。** 静态成员再也不是后挂的补丁。

---

## 十一、Getter 和 Setter：看起来像属性，骨子里是方法

Class 的 getter/setter 不是新概念——ES5 的 `Object.defineProperty` 就有。但 class 让它们从"配置项"变成了"声明"：

```js
class Temperature {
  #celsius;

  constructor(celsius) {
    this.#celsius = celsius;
  }

  get celsius() {
    return this.#celsius;
  }

  set celsius(value) {
    if (value < -273.15) {
      throw new Error('温度不能低于绝对零度');
    }
    this.#celsius = value;
  }

  get fahrenheit() {
    return this.#celsius * 1.8 + 32;
  }

  set fahrenheit(value) {
    this.celsius = (value - 32) / 1.8; // 走 setter，自动验证
  }
}

const temp = new Temperature(25);
console.log(temp.celsius);    // 25 —— 看起来像属性访问
console.log(temp.fahrenheit); // 77 —— 其实是方法调用

temp.fahrenheit = 86;
console.log(temp.celsius); // 30 —— setter 自动做了验证和转换
```

关键理解：**getter/setter 是定义在原型上的存取器属性，不是数据属性。**

```js
const desc = Object.getOwnPropertyDescriptor(Temperature.prototype, 'celsius');
console.log(desc);
// { get: [Function], set: [Function], enumerable: false, configurable: true }
// 没有 value 有 get/set —— 这是存取器属性
```

这意味着：

- `for...in` 不会遍历到 getter/setter（class 方法默认不可枚举）
- 在原型上定义，所有实例共享同一个 getter/setter 函数
- getter/setter 不能和同名字段同时存在

常见用法：

| 场景 | 例子 |
|------|------|
| 数据验证 | setter 中检查值合法性 |
| 计算属性 | `get fullName()` 从 `firstName + lastName` 派生 |
| 懒加载 | getter 中首次计算并缓存 |
| 向后兼容 | 原来 `obj.name` 直接读写，现在要加验证——改成 getter/setter，调用代码不用改 |

---

## 十二、new.target：构造器的元信息

在讲继承的时候我们提过 `new.target`——现在展开讲完。

`new.target` 是 ES6 引入的一个元属性（meta-property）。它回答一个问题：**当前这次 `new` 调用，到底 `new` 的是哪个构造器？**

### 基本行为

```js
function Person(name) {
  console.log(new.target); // 指向被 new 的构造函数
  this.name = name;
}

new Person('张三'); // [Function: Person]
Person('李四');     // undefined —— 不是通过 new 调用的
```

在非 `new` 调用中，`new.target` 是 `undefined`。在 `new` 调用中，它指向**最初被 `new` 的那个构造器**。

### 在继承链中

```js
class Parent {
  constructor() {
    console.log(new.target.name);
  }
}

class Child extends Parent {
  constructor() {
    super();
  }
}

new Child(); // 'Child' —— 不是 'Parent'
```

即使在 `Parent` 的构造器里，`new.target` 仍然指向 `Child`。因为 `new` 的是 `Child`，`Parent` 只是被委托调用了。

### 实战：防止抽象类被直接实例化

```js
class Shape {
  constructor() {
    if (new.target === Shape) {
      throw new Error('Shape 是抽象类，不能直接实例化');
    }
  }
}

class Circle extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }
}

// new Shape();  // Error: Shape 是抽象类，不能直接实例化
new Circle(5);   // 正确
```

### 实战：单例模式

```js
class Singleton {
  static #instance = null;

  constructor() {
    if (Singleton.#instance) {
      return Singleton.#instance;
    }
    if (new.target !== Singleton) {
      throw new Error('不能继承 Singleton');
    }
    Singleton.#instance = this;
  }
}

const s1 = new Singleton();
const s2 = new Singleton();
console.log(s1 === s2); // true
```

> `new.target` 是词法绑定的——箭头函数内部访问到的 `new.target` 来自其外层函数或构造器。跟 `this` 的词法绑定类似。

---

## 十三、类字段初始化顺序——继承场景下的陷阱

类字段（Class Fields）的初始化顺序是一个容易踩坑的地方，尤其在继承场景下。

### 基类的初始化顺序

对于不继承任何类的基类：

```txt
1. 创建实例对象（this）
2. 执行实例字段初始化
3. 执行 constructor 函数体
```

```js
class Parent {
  field = console.log('field init');

  constructor() {
    console.log('constructor');
  }
}

new Parent();
// field init
// constructor
```

**字段初始化在 constructor 之前执行。** 这意味着字段赋的默认值会被 constructor 中的赋值覆盖——如果你的 constructor 也给同名字段赋值：

```js
class Foo {
  x = 1;        // 先执行：x 被赋为 1

  constructor() {
    this.x = 2; // 后执行：x 被覆盖为 2
  }
}

console.log(new Foo().x); // 2
```

### 子类的初始化顺序

对于继承自其他类的子类，事情变得更重要：

```txt
1. 创建"未初始化"的 this
2. 执行 super(...) 调用父类构造器
3. 执行子类实例字段初始化
4. 执行子类 constructor 剩余代码
```

```js
class Parent {
  field = console.log('Parent field');

  constructor() {
    console.log('Parent constructor');
  }
}

class Child extends Parent {
  field = console.log('Child field');

  constructor() {
    super();
    console.log('Child constructor');
  }
}

new Child();
// Parent field
// Parent constructor
// Child field
// Child constructor
```

顺序是：**父类字段 → 父类构造器 → 子类字段 → 子类构造器。**

这个顺序意味着一件事：

```js
class Parent {
  show() {
    console.log(this.x);
  }

  constructor() {
    this.show(); // 子类字段还没初始化！
  }
}

class Child extends Parent {
  x = 42;

  constructor() {
    super();
  }
}

new Child(); // undefined —— x 在父类构造器执行时还没赋值
```

**父类构造器调用子类方法时，子类的实例字段还没初始化。** 这是一个非常常见的陷阱。因为 `show` 是原型方法，在父类构造器执行时已经可以调用——但 `this.x` 这时候还不存在。

解决方式是在 `constructor` 中初始化，而不是用类字段：

```js
class Child extends Parent {
  constructor() {
    super(); // 先让父类完成
    this.x = 42; // 再赋值
  }
}
```

或者用 getter：

```js
class Child extends Parent {
  get x() {
    return 42;
  }
}
```

---

## 十四、extends 后面可以跟表达式

`extends` 后面不仅是一个类名，可以是任何求值结果为构造函数的表达式：

```js
// 根据条件选择父类
function Animal() {}
function Plant() {}

const isMammal = true;
class Organism extends (isMammal ? Animal : Plant) {}
```

这使得 Mixin 模式变得可能：

```js
const TimestampMixin = (Base) =>
  class extends Base {
    createdAt = new Date();

    getTimestamp() {
      return this.createdAt.getTime();
    }
  };

const NameMixin = (Base) =>
  class extends Base {
    printName() {
      console.log(this.name);
    }
  };

class Person {
  constructor(name) {
    this.name = name;
  }
}

class Employee extends NameMixin(TimestampMixin(Person)) {}

const emp = new Employee('张三');
emp.printName();       // 张三
console.log(emp.getTimestamp()); // 当前时间戳
```

Mixin 给了 JS 一种"多继承"的模拟方式：你仍然只有一条 `[[Prototype]]` 链，但可以通过嵌套的 `extends` 表达式组合多个行为。

但 Mixin 不是银弹。注意：

- 方法名冲突：多个 Mixin 可能定义同名方法，后面的会覆盖前面的
- 调试困难：原型链嵌套层级深，调用栈不直观
- **优先考虑组合而非 Mixin**——如果能用普通对象组合解决，就不要用继承链

---

## 十五、原生构造函数的继承

在 ES5 时代，继承 `Array`、`Error` 等原生构造函数是有坑的：

```js
// ES5 时代：试图继承 Array
function MyArray() {
  Array.apply(this, arguments);
}
MyArray.prototype = Object.create(Array.prototype);

const arr = new MyArray(1, 2, 3);
arr.push(4);
console.log(arr.length); // 期望 4，实际可能不对
```

问题是原生构造函数的内部行为没法通过 `Array.apply(this)` 完全复制——数组的 `length` 自动维护、`[[Class]]` 内部标记等，ES5 构造函数借用搞不定。

### Class 时代：原生继承终于完整了

```js
class MyArray extends Array {
  first() {
    return this[0];
  }

  last() {
    return this[this.length - 1];
  }
}

const arr = new MyArray(1, 2, 3);
console.log(arr.first());  // 1
console.log(arr.last());   // 3
console.log(arr instanceof MyArray); // true
console.log(arr instanceof Array);   // true

const mapped = arr.map((x) => x * 2);
console.log(mapped instanceof MyArray); // true —— map 返回的仍然是 MyArray
```

这归功于 `Symbol.species`——某些数组方法（`map`、`filter`、`slice` 等）在创建新实例时，会检查 `this.constructor[Symbol.species]`，决定用哪个构造函数。默认情况下 `Symbol.species` 指向类本身，所以子类化后这些方法返回的仍然是子类实例。

继承 `Error` 也是常见需求：

```js
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

try {
  throw new ValidationError('无效输入');
} catch (e) {
  console.log(e instanceof ValidationError); // true
  console.log(e instanceof Error);          // true
  console.log(e.name);   // ValidationError
  console.log(e.message); // 无效输入
}
```

> 注意：自定义 Error 子类的 `stack` 属性在不同引擎中行为有差异。生产环境中建议通过测试确认。

---

## 十六、类表达式——class 不只是声明

和函数一样，class 也有表达式形式：

```js
// 命名类表达式
const User = class MyClass {
  sayHi() {
    console.log(MyClass); // MyClass 名字只在类内部可见
  }
};

new User().sayHi(); // 正常运行
// console.log(MyClass); // ReferenceError: MyClass is not defined
```

`MyClass` 是类名，只在类体内部可用（类似函数表达式的命名）。外部只能通过 `User` 访问。

类表达式的意义不在于命名——而在于**动态创建类**：

```js
function makeClass(phrase) {
  return class {
    sayHi() {
      console.log(phrase);
    }
  };
}

const User = makeClass('Hello');
new User().sayHi(); // Hello
```

这和前面 Mixin 中 `extends` 表达式的写法一脉相承——**类可以是值，可以被传递、被返回、被动态组合**。

---

## 十七、组合优于继承——什么时候不该用 extends？

讲这么多 class 和 extends，最后必须说一句：

> **默认优先考虑组合，在确实需要继承的语义时才引入 extends。**

### 继承的问题

```txt
Animal
  ├── FlyingAnimal
  │     ├── Bird
  │     └── Bat
  └── SwimmingAnimal
        ├── Fish
        └── Duck ← ─ ─ ─  鸭子既会飞又会游，继承谁？
```

这就是经典的"钻石问题"的变体——JS 单继承，你没法同时继承 `FlyingAnimal` 和 `SwimmingAnimal`。

更深层的问题是：

| 继承的病 | 说明 |
|---------|------|
| 紧耦合 | 子类强依赖父类实现，父类改一行，子类行为可能崩 |
| 脆弱基类 | 看起来无害的基类修改可以破坏整条继承链 |
| 层级膨胀 | 为了复用一个方法，你继承了一整棵你不需要的树 |
| 猩猩香蕉问题 | "你想要一个香蕉，结果拿到一只拿着香蕉的猩猩和整个丛林" |

### 组合怎么写

```js
// 能力定义为独立对象
const canFly = {
  fly() {
    console.log(`${this.name} is flying`);
  },
};

const canSwim = {
  swim() {
    console.log(`${this.name} is swimming`);
  },
};

const canEat = {
  eat() {
    console.log(`${this.name} is eating`);
  },
};

// 用类 + Object.assign 组合
class Duck {
  constructor(name) {
    this.name = name;
  }
}

Object.assign(Duck.prototype, canFly, canSwim, canEat);

const duck = new Duck('唐老鸭');
duck.fly();  // 唐老鸭 is flying
duck.swim();  // 唐老鸭 is swimming
duck.eat();   // 唐老鸭 is eating
```

或者用工厂函数更干脆：

```js
const canFly = (state) => ({
  fly() {
    console.log(`${state.name} is flying`);
  },
});

const canSwim = (state) => ({
  swim() {
    console.log(`${state.name} is swimming`);
  },
});

const createDuck = (name) => {
  const state = { name };
  return {
    ...canFly(state),
    ...canSwim(state),
  };
};

createDuck('唐老鸭').fly(); // 唐老鸭 is flying
```

### 什么时候仍然用继承

| 场景 | 原因 |
|------|------|
| 稳定的 is-a 关系 | `Dog` is an `Animal`，这种语义用继承表达最自然 |
| 需要多态 | 子类实例需要被当作父类在系统中传递 |
| 框架要求 | 某些框架设计为通过继承扩展（如 React 的 class 组件，虽然现在推荐函数组件） |
| 原生类型子类化 | 继承 `Array`、`Error` 等原生构造函数 |

> 最佳实践：**默认用组合。只有当你确认需要 `is-a` 语义和多态时才用 `extends`，并保持继承层次 2～3 层以内。**

---

## 十八、ES5 继承的痛点——一笔算过的旧债

前面说过，ES5 的寄生组合式继承要写四步。这里不讲细节（那是 [[JavaScript/Object]] 和原型链篇的事），只列痛点让你感受 class 到底省掉了什么：

```js
// 寄生组合式继承——ES5 时代的"最佳实践"
function Sub(name) {
  Super.call(this, name); // 借用构造函数
  this.subProp = true;
}

Sub.prototype = Object.create(Super.prototype); // 建原型链
Sub.prototype.constructor = Sub;                 // 修 constructor
Sub.prototype.getSubProp = function () {          // 定义方法
  return this.subProp;
};
```

四行代码，每个都有坑：

| 步骤 | 常见错误 |
|------|---------|
| `Super.call(this, name)` | 忘了传参，或 `this` 指向错了 |
| `Object.create(Super.prototype)` | 写成 `new Super()`，父类构造函数被多调一次 |
| `Sub.prototype.constructor = Sub` | 忘了写，`constructor` 指向 `Super` |
| 定义方法 | 写在 `Object.create` 之前，被覆盖 |

而 class 继承只需要：

```js
class Sub extends Super {
  constructor(name) {
    super(name);
    this.subProp = true;
  }

  getSubProp() {
    return this.subProp;
  }
}
```

原型链自动建立、`constructor` 自动正确、方法定义不会被覆盖。**class 省掉的不仅是代码量，更是出错的空间。**

更详细的 ES5 继承机制和原型链原理，见 [[JavaScript/Object]]。

---

## 本质到底是什么

回到开头那个问题：class 是不是语法糖？

如果你指的是"class 编译后生成的代码等价于某个 ES5 手写版本"——那不是。`[[IsClassConstructor]]`、`[[HomeObject]]`、`super` 的词法绑定、`#private` 的槽位机制、TDZ、强制严格模式、non-enumerable 方法……这些要么是新的内部语义，要么是 ES5 没法实现的运行时行为。

如果你指的是"class 让你用更直观的语法做了原来需要样板代码才能做的事"——那确实，语法糖的本意就是这样。

> **Class 不是糖衣包裹的旧药，而是还清旧债之后的新配方。它保留了原型链的底层语义（** `instanceof` 仍然走 `[[Prototype]]` 链、方法仍然挂在 `prototype` 上），同时在语言层面堵住了那些靠"记住别踩"才能避开的坑。**

每一笔债的偿还方式：

| 旧债 | class 的偿还 |
|------|-------------|
| 构造函数可以不用 `new` 调用 | `[[IsClassConstructor]]`，不行就报错 |
| 默认 sloppy mode | 类体强制严格模式 |
| 声明提升，未定义就能用 | TDZ，声明前访问直接炸 |
| 方法可枚举，混进 `for...in` | 方法默认 non-enumerable |
| `constructor` 指向丢失 | 自动维护，不可枚举 |
| 继承靠手写四步样板代码 | `extends` 一键继承 |
| `super` 不存在，手写 `Parent.prototype.method.call(this)` | `[[HomeObject]]` 词法绑定 `super` |
| 子类 `this` 在 `super()` 前可用 | 派生类 `this` 必须等 `super()` 创建 |
| 没有私有，靠 `_` 前缀约定 | `#private` 词法作用域，不可绕过 |
| 静态成员只能后挂 | `static` 关键字，声明式，可继承 |
| 原生构造函数继承不了 | `extends Array/Error/...` 完整子类化 |

这不是语法糖。这是 JavaScript 对自己十年 OPO 债务的一次系统性偿还。

当然，债还没还完——`class` 没有多继承、没有装饰器（还在提案中）、没有抽象类语法（只能靠 `new.target` 模拟）、类型系统还要靠 TypeScript。但至少，最重要的一笔债已经还清了：**你再也不用在每个构造函数里写 `if (!(this instanceof User))` 了。**