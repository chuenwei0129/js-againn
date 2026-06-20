## 对象的认知起源

一个小孩蹲在水盆边，里面有三条一模一样的金鱼。他指着左边那条说“这条游得慢”，指着右边那条说“这条尾巴在甩”，然后手指停在中间那条上面——“这条刚才在看我。”

一模一样的鱼，他嘴里说出的是三个不同的东西。这不是什么了不起的本事。差不多每个两三岁的孩子都会。但如果你停下来想，你会发现自己轻松地区分了三个独立存在的东西，而且完全没用“左右”之外的信息。你甚至能感觉到，如果其中一条鱼受伤了，另外两条还是好好的，跟那条受伤的鱼没有半点关系。

这件事太常见了，常见到我们几乎忘了它有多奇怪。为什么三个长得一样的东西，我们能立刻认定它们是三个，而不是一个东西复制了三份？

答案藏在我们的脑子里。人天生就懂得给每个东西贴上一张看不见的标签。这张标签不贴在身上，不写名字，也不会掉色，但它让“这个苹果”和“那个苹果”永远是两回事，哪怕你咬一口发现甜度、大小、颜色全都一样。你手里拿着的还是你手里那个，不会突然变成桌上那个。

程序员把这个发现搬进了代码里。他们管这张看不见的标签叫“身份”，管一个带身份的东西叫“对象”。你没看错，就是“对象”这个词。在英文里，它原来的意思更接近“物件”——一个摆在那儿的、实实在在的个体。但中文翻译成了“对象”，听起来有点玄乎。别管翻译，记住那个蹲在水盆边的小孩就行了。他脑子里在做的事，和你写代码时让电脑做的事，本质上同一件：认出独立的个体。

一个东西光有身份还不够。假如那条鱼没有任何特征，没有颜色、没有尾巴、不会游、不会看你——你就没法认出它来。你能认出它，是因为它有一堆你能看见、能说出来的特点：尾巴完整吗？游得快不快？现在停在哪个角落？这些特点，程序员叫“状态”。状态就是这东西眼下是什么样。

但状态不会自己变。鱼会自己游，可代码里的东西不行。你得给它办法，让它能改变自己的状态。比如一条鱼可以“掉尾巴”，掉完之后尾巴没了，状态就变了。这种能改变状态的动作，程序员叫“行为”。行为就像一个东西自己能做的事。

现在你可以想象一个三角形，三个角上分别写着身份、状态、行为。东西就站在中间。身份让它永远是它自己；状态让人知道它怎么了；行为让它能动起来。

用代码写出来，大概长这样：

一个鱼物件，有自己的编号，有尾巴，还能掉尾巴。另一个鱼物件，编号不同，也有尾巴，但没掉。你问电脑“这两个物件是同一个吗？”电脑说不是。就算它们此刻的状态一模一样，编号对不上，就绝不是同一个。就像那个小孩，永远不会把左边那条鱼当成中间那条。

这个想法简单到孩子都懂，可它撑起了今天几乎所有软件的骨架。你用的每一个 App，背后都有成千上万个这样的小物件，各自带着编号、状态和行为，互相叫来叫去，像水盆里的鱼群。你点一下屏幕，其实就是对某个物件说“做你该做的事吧”，然后它的状态变了，界面上的一行字也跟着变了。

回到开始的水盆。三条鱼，三条命，三个独立的身份。哪怕上帝又造了第四条，和前三条分毫不差，它也还是个新东西，有自己的那张看不见的标签。这就是“对象”这个词真正想说的——世界不是一堆属性的清单，而是一个个完整的、活生生的个体。

这套思路是所有面向对象语言的基础。

## 对象的三要素

一个对象通常由三大核心要素组成：

1. **唯一标识（Identity）**
   用来区分不同对象的身份，如内存引用 ID。

2. **状态（State）**
   对象的属性集合，描述其当前状况。

3. **行为（Behavior）**
   改变对象状态的方法。

示意图：

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

---

## 对象的创建

JavaScript 提供了多种创建对象的方式：

```js
// 1. 对象字面量（最常用）
const obj1 = { name: 'Alice' };

// 2. new Object()
const obj2 = new Object();
obj2.name = 'Bob';

// 3. Object.create()
const proto = { type: 'person' };
const obj3 = Object.create(proto);

// 4. 构造函数
function Person(name) {
  this.name = name;
}
const obj4 = new Person('Charlie');

// 5. class（ES6）
class Animal {
  constructor(name) {
    this.name = name;
  }
}
const obj5 = new Animal('Dog');
```

## 面向对象编程

### JavaScript 的面向对象特性

JavaScript 是一种基于原型（prototype-based）的面向对象语言，而不是基于类（class-based）的语言。虽然 ES6 引入了 `class` 语法，但这只是语法糖，本质上仍然是基于原型的。

### 对象的描述方式

JavaScript 作为一门动态语言，同时支持 **基于类（Class-based）** 和 **基于原型（Prototype-based）** 的对象构建方式。

#### 1. 分类（Class-based）

类似生物学"界–门–纲–目–科–属–种"的层级分类。

> 从"动物"到"鱼"，再到"金鱼"，是一层一层细化的过程。

**代码示例**：

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  breathe() {
    console.log(`${this.name} is breathing`);
  }
}

class Fish extends Animal {
  constructor(name) {
    super(name);
    this.canSwim = true;
  }
  swim() {
    console.log(`${this.name} is swimming`);
  }
}

class Goldfish extends Fish {
  constructor(name) {
    super(name);
    this.color = 'orange';
  }
}

const goldie = new Goldfish('Goldie');
goldie.breathe(); // Goldie is breathing
goldie.swim(); // Goldie is swimming
```

**特点**：

- 单继承结构
- 类型系统友好
- 层次清晰，适合明确的业务对象建模

#### 2. 归类（Generalization）

通过提取多个对象的共性形成一个更抽象的类，甚至具有多继承的可能。

示意图：

```
┌───────┐       ┌───────┐
│  鱼   │──────▶│ 动物  │
└───────┘       └───────┘
   ▲                ▲
   │                │
┌───────┐       ┌──────────┐
│水生生物│      │  哺乳动物 │
└───────┘       └──────────┘
```

JavaScript 虽不直接支持多继承，但可以通过 **mixin** 技巧实现多种能力组合。

**Mixin 示例**：

```javascript
const swimmable = {
  swim() {
    console.log(`${this.name} is swimming`);
  },
};

const flyable = {
  fly() {
    console.log(`${this.name} is flying`);
  },
};

class Animal {
  constructor(name) {
    this.name = name;
  }
}

Object.assign(Animal.prototype, swimmable, flyable);

const duck = new Animal('Duck');
duck.swim();
duck.fly();
```

#### 3. 原型（Prototype-based）

JavaScript 的本质就是基于原型的对象系统。新对象可以"照猫画虎"地拷贝已有对象，然后修改部分属性。

**原型链示例**：

```
┌──────────────────────┐
│  catfish (实例对象)   │
└──────────▲───────────┘
           │ __proto__
┌──────────────────────┐
│ Catfish.prototype    │
└──────────▲───────────┘
           │ __proto__
┌──────────────────────┐
│ Fish.prototype       │
└──────────▲───────────┘
           │ __proto__
┌──────────────────────┐
│ Animal.prototype     │
└──────────▲───────────┘
           │ __proto__
┌──────────────────────┐
│ Object.prototype     │
└──────────▲───────────┘
           │ __proto__
           null

```

**代码演示**：

```javascript
function Animal(name) {
  this.name = name;
}
Animal.prototype.breathe = function () {
  console.log(`${this.name} is breathing`);
};

function Fish(name) {
  Animal.call(this, name);
  this.canSwim = true;
}
Fish.prototype = Object.create(Animal.prototype);
Fish.prototype.constructor = Fish;
Fish.prototype.swim = function () {
  console.log(`${this.name} is swimming`);
};

function Catfish(name) {
  Fish.call(this, name);
}
Catfish.prototype = Object.create(Fish.prototype);
Catfish.prototype.constructor = Catfish;

const catfish = new Catfish('Catfish');
```

### 实践案例：设计"狗咬人"场景

#### 错误设计：

```javascript
class Dog {
  bite(human) {
    // ❌ 错误：这个行为改变的是 Human 的状态
  }
}
```

#### 正确设计：

```javascript
class Human {
  hurt(damage) {
    this.health -= damage;
    console.log(`${this.name} is hurt`);
  }
}

class Dog {
  bark() {
    console.log('Woof!');
  }
}
```

**原则**：

- 对象的行为必须用来改变对象自身的状态
- 不要让一个对象直接修改另一个对象的内部状态，否则会降低内聚性

**参考资料：**

- [视频教程：对象的基础认知](https://www.bilibili.com/video/BV11e4y1W7CF?p=10)
- [JavaScript 凭什么不是面向对象的语言？](https://www.zhihu.com/question/506559729/answer/2276185739)

---

## 原型与原型链

### 核心概念

原型链是 JavaScript 实现继承的主要机制。理解原型链是掌握 JavaScript 面向对象编程的关键。

### 关键知识点

#### 1. `__proto__` 与 `prototype` 的区别

- **`__proto__`**：每个对象都有的属性，指向该对象的原型（即创建该对象的构造函数的 `prototype`）
- **`prototype`**：只有函数才有的属性，用于实现基于原型的继承

> **注意**：`__proto__` 是非标准属性，在生产环境中应使用 `Object.getPrototypeOf()` 和 `Object.setPrototypeOf()` 来操作原型。

#### 2. 原型链的形成

当我们通过构造函数创建实例时，会发生以下过程：

1. JavaScript 为构造函数自动添加 `prototype` 属性，值是一个空对象
2. 通过 `new` 关键字调用构造函数时，创建一个新实例
3. 新实例的 `__proto__` 指向构造函数的 `prototype`
4. 实例继承了构造函数 `prototype` 上的所有属性和方法

#### 3. 特殊的 `Function.prototype`

`Function.prototype` 是一个特殊的对象：

- 它是一个函数，可以被调用，但总是返回 `undefined`
- 它没有 `prototype` 属性
- 它继承自 `Object.prototype`
- 所有函数（包括构造函数）都是 `Function` 的实例

**为什么 `Function.prototype` 是函数？**

为了保持类型一致性：

- `Array.prototype` 是 **Array** 类型
- `Map.prototype` 是 **Map** 类型
- `Set.prototype` 是 **Set** 类型
- 因此，`Function.prototype` 也应该是 **Function** 类型

#### 4. 重要的原型关系

- 实例的 `__proto__` 指向构造函数的 `prototype`
- 构造函数的 `__proto__` 指向 `Function.prototype`
- 原型对象的 `__proto__` 指向 `Object.prototype`
- `Object.prototype.__proto__` 指向 `null`（原型链的终点）

### 代码示例

```js
// 定义一个构造函数
function A() {
  // ...
}

// 验证原型关系
// 1. A 是通过 Function 构造函数生成的，所以 A.__proto__ 指向 Function.prototype
console.log(A.__proto__ === Function.prototype); // true

// 2. 原型对象是 Object 构造函数的实例
console.log(A.prototype.__proto__ === Object.prototype); // true

// 3. 原型链的顶端：Object.prototype.__proto__ 为 null
console.log(Object.prototype.__proto__ === null); // true

// 4. Function.prototype 继承自 Object.prototype
console.log(Function.prototype.__proto__ === Object.prototype); // true

// 5. Object 构造函数也是 Function 构造函数的实例
console.log(Object.__proto__ === Function.prototype); // true

// 6. Function 构造函数是它自己的实例（特殊情况）
console.log(Function.__proto__ === Function.prototype); // true

// 创建实例
var a = new A();

// 7. 实例的 __proto__ 指向构造函数的 prototype
console.log(a.__proto__ === A.prototype); // true

// 8. 原型的 constructor 属性指向构造函数
console.log(A.prototype.constructor === A); // true

// 9. 实例可以通过原型链访问 constructor
// 当 a.constructor 被访问时，会沿着原型链查找
// a 本身没有 constructor 属性
// 于是在 a.__proto__（即 A.prototype）中找到
console.log(a.constructor === A); // true
```

### 原型链查找机制

当访问对象的属性时，JavaScript 会按照以下顺序查找：

1. 在对象自身查找
2. 在对象的原型（`__proto__`）中查找
3. 在原型的原型中查找
4. 一直查找到 `Object.prototype`
5. 如果还没找到，返回 `undefined`

```js
function Person(name) {
  this.name = name;
}

Person.prototype.sayHello = function () {
  console.log(`Hello, I'm ${this.name}`);
};

const alice = new Person('Alice');

// 属性查找顺序：
alice.sayHello(); // Hello, I'm Alice
// 1. alice 自身没有 sayHello 方法
// 2. 在 alice.__proto__（Person.prototype）中找到
// 3. 调用该方法

console.log(alice.toString()); // [object Object]
// 1. alice 自身没有 toString 方法
// 2. alice.__proto__（Person.prototype）中没有
// 3. alice.__proto__.__proto__（Object.prototype）中找到
// 4. 调用该方法
```

**相关资源：**

> [Lodash 严重安全漏洞背后你不得不知道的 JavaScript 知识](https://zhuanlan.zhihu.com/p/73186974)

---

## 属性系统

属性成员是如何在对象中存储的呢？其实并非是简单的一个 key 和 一个 value 就够了。因为属性本身还有属性，比如是否只读，是否可删除，是否可遍历。

在 ES3 时代，规范规定，一个对象属性（Property）可以包含下列 3 个属性（Attribute）：

ReadOnly
DontEnum
DontDelete
从 ES5 开始，重新定义了属性的结构，现在它可能包含下面这 6 种属性，为了避免歧义，后面我称之为属性参数：

[[Value]]
[[Writable]]
[[Get]]
[[Set]]
[[Enumerable]]
[[Configurable]]
这几种参数并非允许同时存在，其中 [[Enumerable]] 和 [[Configurable]] 可以一直在，而 [[Value]]+[[Writable]] 与 [[Get]]+ [[Set]] 这两对之间是互斥的。这里事实上代表了 ECMAScript 对属性成员的两种格式定义：数据属性（Data Property）和存取器属性（Accessor Property）。

它们的属性差异如下：

类型	结构
数据属性	1. [[Enumerable]]
2. [[Configurable]]
3. [[Value]]
4. [[Writable]]
存取器属性	1. [[Enumerable]]
2. [[Configurable]]
3. [[Get]]
4. [[Set]]
从功能上来讲，存取器属性是数据属性的超集，数据属性能实现的，存取器属性也都能实现，比如存取器属性中不定义 [[Set]] 就相当于数据属性中 [[Writable]] 设为 false，即只读。

那我们在编程过程中如何与这两种属性打交道呢？这里就涉及到属性结构的 API 表示，也就是属性描述符（Property Descriptor）。

在 TypeScript 中，属性描述符是这样定义的：

interface PropertyDescriptor {
    configurable?: boolean;
    enumerable?: boolean;
    value?: any;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
}
但这并不严格，因为 value/writable 与 get/set 之间的互斥关系并没有表现出来。将它们混淆在一起是不被允许的。现在我们尝试取出对象中的属性描述符。

定义一个简单 key-value 对象：{ name: 'js' }，但实际上对象存储的是 key-descriptor，我们可以用 Object.getOwnPropertyDescriptor() 来取出属性描述符：

Object.getOwnPropertyDescriptor({ name: 'js' }, 'name')
在 Chrome 下打印出来的是：

image.png

说明这是一个数据属性。以大括号声明的对象，其属性都是数据形式的，如果想定义成存取器属性，那么就需要使用到 Object.defineProperty() 或者 Object.defineProperties() 了：

var obj = {};

let _internal_name = null;

Object.defineProperty(obj, 'name', {
    set(n) {
        _internal_name = n;
    },
    get() {
        return _internal_name;
    },
    configurable: true,
    enumerable: true,
});
如果在 class 环境下，也可以使用 setter/getter 函数：

class Foo {
    #name = null;
    get name() {
        return this.#name;
    }
    set name(n) {
        this.#name = n;
    }
}
我们知道了如何把属性定义成哪种类型，那么，日常开发中我们应该如何选择呢？另外属性描述符中的参数都应该如何取值呢？

如何使用属性描述符？
如果你的属性希望在被访问的时候，动态输出取值，那么毫无疑问，存取器属性是唯一选项。除此之外，两者几乎一致，包括在其余参数的定义上。

我们先来看看两者共用的参数 enumerable 和 configurable 都是做什么的吧。

enumerable 顾名思义，代表是否可枚举，也就是在 for...in 的时候能否被遍历到。在上一章节，我们讲过 constructor 在构造函数的 prototype 中就定义为 enumerable=false，因而不可遍历出来。

还有哪些耳熟能详的属性是不可遍历的呢？我举几个例子：

数组的所有方法，比如 concat、filter、map、reduce，在 for...in 时都不可见，这个我们在数组那一章提到过；
字符串的 length 属性，在 for...in 时也不可见；
数字对象的所有方法，比如 toPrecision、toFixed、toExponential 等。
直接赋值定义给对象的属性，或者类的非函数成员，默认都是可枚举的，比如下面中的 foo、bar 和 baz：

const obj = { foo: 1 };
obj.bar = 2;

class Foo {
    baz = 2
}
如果使用 Object.defineProperty() 或者 Object.defineProperties()，那么需要确保明确设置 enumerable=true 才能开启可枚举性，否则默认是 false：

const obj = {};

Object.defineProperty(obj, 'name', {
    value: 'foo'
});

Object.getOwnPropertyDescriptor(obj, 'name').enumerable; // false
configurable 参数代表是否可配置，这背后代表的行为要更复杂，按照 ECMAScript 定义，如果其为 false，那么：

不允许删除此属性；
不允许在数据属性和存取器属性之间变换；
不允许修改描述符的其他参数（但不包括修改 value，以及把 writable 设为 false）：
不允许修改 enumerable 的值；
不允许修改 set/get 的值；
不允许将 writable 从 false 改为 true。
其他都还容易记得住，也能理解允许对 value 的修改，但为什么还能允许把 writable 从 true 改成 false 呢？很遗憾，我没有在 ECMAScript 的规范中找到对这个策略的解释。我们不妨粗浅地这样理解：configurable 并不是为了完全锁定对象，要不然也不会允许对 value 的修改，它只是想保证对象结构和表达的稳定性，那么把一个对象从可写改成只读，似乎并不会影响这种稳定性。

我们验证一下违反 configurable 规则的案例：

const obj = {};

Object.defineProperties(obj, {
  // name 为数据属性
  name: {
    value: "foo",
    writable: false,
    enumerable: true,
    configurable: false,
  },
  // age 为存取器属性
  age: {
    get() {},
    set() {},
    enumerable: true,
    configurable: false,
  },
});

// 删除属性
delete obj.name; // ❌ Uncaught TypeError: Cannot delete property 'name' of #<Object>

// 变换属性结构
Object.defineProperty(obj, "name", { // ❌ Uncaught TypeError: Cannot redefine property: name
  get() {
    return "foo";
  },
  enumerable: true,
  configurable: false,
});

// 修改 enumerable
Object.defineProperty(obj, "name", { // ❌ Uncaught TypeError: Cannot redefine property: name
  enumerable: false,
});

// 修改 set/set
Object.defineProperty(obj, "age", { // ❌ Uncaught TypeError: Cannot redefine property: age
  set() {},
  get() {},
});

// 修改 writable=true
Object.defineProperty(obj, "name", { // ❌ Uncaught TypeError: Cannot redefine property: name
  writable: true,
});
以上这些错误，都会导致程序中断。因此严格来讲，我们如果想保证程序的绝对健壮，在操作陌生对象时，一是用 try...catch 来包裹代码块，二是在修改属性之前探测它的属性描述符，即便是 obj.name = "bar" 这样简单的赋值语句也是如此。

💡 大家应该能看到，修改一个现有的属性，defineProperty/defineProperties 并不需要列举属性描述符的全部参数，而只需要被修改的那几个就可以了。

定义新的属性时，如果不指定，configurable 默认也是 false。

以上我们熟悉了属性描述符的两个公共参数，也是最关键的两个，enumerable 和 configurable。对于两种不同的属性类型来说，它们都还各有两个额外的参数。

数据属性的 writable 会阻止对 value 的修改，注意，即便是修改前后值一样也不行，writable 阻止的是行为，而不管结果。但是 value 依然有可能通过 defineProperty/defineProperties 来改变取值，这超出了 writable 的控制范围：

const obj = {};

Object.defineProperty(obj, 'name', {
    value: 'foo',
    writable: false,
    enumerable: true,
    configurable: true,
});

// 重新定义 value
Object.defineProperty(obj, 'name', {
    value: 'bar',
});
如果不声明，新属性的 writable 默认也是 false。

存取器属性中的 set/get 与 Java Bean 的思想是一致的。这个能力允许我们能拦截对属性的赋值和读取操作，熟悉的同学应该知道，Vue 2 正是利用这一特性来监视数据的变更，进而驱动视图的。

set 和 get 可以不成对出现，如果缺失了 set，那么该属性就是只读的；如果缺失了 get，那么该属性就是只写的；如果都不存在，那么该属性会被当作一个 value=undefined 的数据属性。

💡 set/get 必须是函数类型，即便是异步函数、生成器函数也可以，否则会抛出错误。

两种属性结构我们就讨论到这。但是对于一个对象来说，除了这些后期定义的属性之外，还有很多内部属性发挥着至关重要的作用，比如前面我们在函数那一讲当中提到 [[Call]] 和 [[Construct]] 都属于对象内部可能存在的属性。除此之外， ECMAScript 还定义了如下这些内部属性：

属性名	格式
[[GetPrototypeOf]]	() → Object | Null
[[SetPrototypeOf]]	(Object | Null) → Boolean
[[IsExtensible]]	() → Boolean
[[PreventExtensions]]	() → Boolean
[[GetOwnProperty]]	(propertyKey) → Undefined | PropertyDescriptor
[[DefineOwnProperty]]	(propertyKey, PropertyDescriptor) → Boolean
[[HasProperty]]	(propertyKey) → Boolean
[[Get]]	(propertyKey, Receiver) → any
[[Set]]	(propertyKey, value, Receiver) → Boolean
[[Delete]]	(propertyKey) → Boolean
[[OwnPropertyKeys]]	() → List of property keys
[[Prototype]]	Object | Null
有经验的同学可能已经发现了，里面的函数都有对应的 API 可用，比如其中的 [[DefineOwnProperty]] 其实就对应着 Object.defineProperty。确实如此，当我们调用静态函数 Object.defineProperty 的时候，本质上是在对象身上调用其 [[DefineOwnProperty]] 内部函数，其他函数大体也是如此。

我们要特别关注的是最后那个叫做 [[Prototype]] 的属性，这不是一个函数，在规范上是叫做 slot，它是实现原型链、进而实现继承的根本。

### 属性描述对象

#### 什么是属性描述对象

对象的每个属性都有一个描述对象（Descriptor），用来控制该属性的行为。属性描述对象提供了细粒度的属性控制能力。

#### 六个元属性

属性描述对象包含以下 6 个元属性：

**数据属性**

- **`value`**：属性的值，默认为 `undefined`
- **`writable`**：布尔值，表示属性值是否可修改，默认为 `true`
- **`enumerable`**：布尔值，表示属性是否可枚举，默认为 `true`
  - 如果设为 `false`，某些操作（如 `for...in`、`Object.keys()`）会跳过该属性
  - **注意**：原型上的方法默认 `enumerable` 为 `false`，以避免 `for...in` 遍历到不必要的属性
- **`configurable`**：布尔值，表示属性是否可配置，默认为 `true`
  - 如果设为 `false`，将阻止删除该属性，也不能修改属性描述对象（`value` 除外）

**访问器属性**

- **`get`**：取值函数（getter），默认为 `undefined`
  - **注意**：通过对象字面量定义的 getter 默认可枚举，通过 `Object.defineProperty` 定义的 getter 默认不可枚举
- **`set`**：存值函数（setter），默认为 `undefined`

> **重要**：一个属性不能同时拥有数据属性（`value`/`writable`）和访问器属性（`get`/`set`）。

#### 获取属性描述对象

使用 `Object.getOwnPropertyDescriptor()` 方法可以获取属性的描述对象：

```js
const obj = { foo: 1 };
const descriptor = Object.getOwnPropertyDescriptor(obj, 'foo');

console.log(descriptor);
// { value: 1, writable: true, enumerable: true, configurable: true }

// 获取所有属性的描述对象
const obj2 = {
  foo: 123,
  get bar() {
    return 'abc';
  },
};

console.log(Object.getOwnPropertyDescriptors(obj2));
// {
//   foo: { value: 123, writable: true, enumerable: true, configurable: true },
//   bar: { get: [Function: get bar], set: undefined, enumerable: true, configurable: true }
// }
```

#### 定义或修改属性

**单个属性：`Object.defineProperty()`**

该方法允许通过属性描述对象定义或修改一个属性，接受三个参数：

- `object`：属性所在的对象
- `propertyName`：字符串，表示属性名
- `attributesObject`：属性描述对象

```js
const obj = {};

// 定义一个只读属性
Object.defineProperty(obj, 'name', {
  value: 'Alice',
  writable: false, // 不可修改
  enumerable: true,
  configurable: true,
});

console.log(obj.name); // Alice
obj.name = 'Bob'; // 严格模式下会报错，非严格模式下静默失败
console.log(obj.name); // Alice

// 定义一个不可枚举的属性
Object.defineProperty(obj, 'age', {
  value: 25,
  enumerable: false, // 不可枚举
});

console.log(Object.keys(obj)); // ['name']（age 不会出现）

// 定义访问器属性
Object.defineProperty(obj, 'greeting', {
  get() {
    return `Hello, ${this.name}`;
  },
  set(value) {
    console.log(`Setting greeting to: ${value}`);
  },
  enumerable: true,
  configurable: true,
});

console.log(obj.greeting); // Hello, Alice
obj.greeting = 'Hi'; // Setting greeting to: Hi
```

**多个属性：`Object.defineProperties()`**

如果需要一次性定义或修改多个属性，可以使用 `Object.defineProperties()` 方法：

```js
const person = {};

Object.defineProperties(person, {
  name: {
    value: 'Alice',
    writable: true,
    enumerable: true,
  },
  age: {
    value: 25,
    writable: true,
    enumerable: true,
  },
  fullName: {
    get() {
      return `${this.name} (${this.age} years old)`;
    },
    enumerable: true,
  },
});

console.log(person.fullName); // Alice (25 years old)
```

#### 属性的可枚举性

描述对象的 `enumerable` 属性称为"可枚举性"，如果该属性为 `false`，以下操作会忽略该属性：

| 操作                 | 范围                           | 说明                          |
| -------------------- | ------------------------------ | ----------------------------- |
| `for...in`           | 对象自身的和继承的可枚举属性   | 唯一会遍历继承属性的方法      |
| `Object.keys()`      | 对象自身的所有可枚举属性的键名 | 返回数组                      |
| `JSON.stringify()`   | 对象自身的可枚举属性           | 序列化时忽略不可枚举属性      |
| `Object.assign()`    | 对象自身的可枚举属性           | 只拷贝可枚举属性              |
| 对象扩展运算符 `...` | 对象自身的可枚举属性           | 与 `Object.assign()` 行为类似 |

```js
const obj = {};

Object.defineProperty(obj, 'visible', {
  value: 1,
  enumerable: true,
});

Object.defineProperty(obj, 'hidden', {
  value: 2,
  enumerable: false,
});

console.log(Object.keys(obj)); // ['visible']
console.log(JSON.stringify(obj)); // {"visible":1}

for (const key in obj) {
  console.log(key); // 只输出 'visible'
}
```

### 属性的遍历

JavaScript 提供了多种方法来遍历对象的属性，不同的方法有不同的遍历范围和特性。

#### 五种遍历方法对比

| 方法                             | 自身属性 | 继承属性 | 可枚举 | 不可枚举 | Symbol | 返回值      |
| -------------------------------- | -------- | -------- | ------ | -------- | ------ | ----------- |
| `for...in`                       | ✅       | ✅       | ✅     | ❌       | ❌     | 键名        |
| `Object.keys()`                  | ✅       | ❌       | ✅     | ❌       | ❌     | 键名数组    |
| `Object.getOwnPropertyNames()`   | ✅       | ❌       | ✅     | ✅       | ❌     | 键名数组    |
| `Object.getOwnPropertySymbols()` | ✅       | ❌       | ✅     | ✅       | ✅     | Symbol 数组 |
| `Reflect.ownKeys()`              | ✅       | ❌       | ✅     | ✅       | ✅     | 键名数组    |

#### 1. `for...in`

遍历对象自身的和继承的可枚举属性（不包含 Symbol 属性）：

```js
const proto = { inherited: 'from prototype' };
const obj = Object.create(proto);
obj.own = 'own property';

for (const key in obj) {
  console.log(key);
  // 输出: own, inherited
}

// 只遍历自身属性
for (const key in obj) {
  if (obj.hasOwnProperty(key)) {
    console.log(key); // 只输出: own
  }
}

// 推荐使用 Object.hasOwn()（ES2022）
for (const key in obj) {
  if (Object.hasOwn(obj, key)) {
    console.log(key); // 只输出: own
  }
}
```

#### 2. `Object.keys()`

返回对象自身的所有可枚举属性的键名（不包含继承的和 Symbol 属性）：

```js
const obj = { a: 1, b: 2, c: 3 };

console.log(Object.keys(obj)); // ['a', 'b', 'c']

// 不包含不可枚举属性
Object.defineProperty(obj, 'd', {
  value: 4,
  enumerable: false,
});

console.log(Object.keys(obj)); // ['a', 'b', 'c']（d 不在列表中）
```

#### 3. `Object.getOwnPropertyNames()`

返回对象自身的所有属性（包括不可枚举属性，但不包含 Symbol 属性）：

```js
const obj = { a: 1 };

Object.defineProperty(obj, 'b', {
  value: 2,
  enumerable: false,
});

console.log(Object.keys(obj)); // ['a']
console.log(Object.getOwnPropertyNames(obj)); // ['a', 'b']
```

#### 4. `Object.getOwnPropertySymbols()`

返回对象自身的所有 Symbol 属性的键名：

```js
const sym1 = Symbol('foo');
const sym2 = Symbol('bar');

const obj = {
  [sym1]: 'value1',
  [sym2]: 'value2',
  normalProp: 'value3',
};

console.log(Object.getOwnPropertySymbols(obj)); // [Symbol(foo), Symbol(bar)]
console.log(Object.keys(obj)); // ['normalProp']
```

#### 5. `Reflect.ownKeys()`

返回对象自身的所有键名，包括字符串键、Symbol 键、可枚举和不可枚举属性：

```js
const sym = Symbol('symbol');
const obj = {
  a: 1,
  [sym]: 2,
};

Object.defineProperty(obj, 'b', {
  value: 3,
  enumerable: false,
});

console.log(Reflect.ownKeys(obj)); // ['a', 'b', Symbol(symbol)]
```

#### 属性遍历的次序规则

以上所有遍历方法都遵守相同的属性遍历次序规则：

1. **首先遍历所有数值键**，按照数值升序排列
2. **其次遍历所有字符串键**，按照加入时间升序排列
3. **最后遍历所有 Symbol 键**，按照加入时间升序排列

```js
const result = Reflect.ownKeys({
  [Symbol()]: 1,
  10: 'number 10',
  3: 'number 3',
  a: 'string a',
  [Symbol()]: 2,
  z: 'string z',
});

console.log(result);
// 输出顺序：['3', '10', 'a', 'z', Symbol(), Symbol()]
// 1. 数值键：3, 10（按数值升序）
// 2. 字符串键：a, z（按加入时间）
// 3. Symbol 键：Symbol(), Symbol()（按加入时间）
```

#### 实际应用示例

```js
// 场景1：遍历对象的所有可枚举属性
const user = { name: 'Alice', age: 25, city: 'New York' };

Object.keys(user).forEach((key) => {
  console.log(`${key}: ${user[key]}`);
});
// name: Alice
// age: 25
// city: New York

// 场景2：检查对象是否为空
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

console.log(isEmpty({})); // true
console.log(isEmpty({ a: 1 })); // false

// 场景3：获取对象的所有属性（包括不可枚举的）
function getAllProperties(obj) {
  const stringProps = Object.getOwnPropertyNames(obj);
  const symbolProps = Object.getOwnPropertySymbols(obj);
  return [...stringProps, ...symbolProps];
}

// 场景4：安全地遍历对象（排除原型链属性）
function forOwnProperties(obj, callback) {
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      callback(key, obj[key]);
    }
  }
}
```

### 对象的简写语法

ES6 允许在对象字面量中使用简写语法，使代码更加简洁易读。

#### 1. 属性简写

当对象的属性名与变量名相同时，可以省略属性值的书写：

```js
const name = 'Alice';
const age = 25;

// ES5 写法
const person1 = {
  name: name,
  age: age,
};

// ES6 简写
const person2 = {
  name,
  age,
};

console.log(person1); // { name: 'Alice', age: 25 }
console.log(person2); // { name: 'Alice', age: 25 }

// 实际应用：函数返回对象
function createUser(name, age, role) {
  return {
    name,
    age,
    role,
    // 等同于 name: name, age: age, role: role
  };
}
```

#### 2. 方法简写

ES6 允许在对象中直接定义方法，省略 `function` 关键字：

```js
// ES5 写法
const obj1 = {
  sayHello: function () {
    console.log('Hello!');
  },
};

// ES6 简写
const obj2 = {
  sayHello() {
    console.log('Hello!');
  },
};

obj1.sayHello(); // Hello!
obj2.sayHello(); // Hello!

// 实际应用：定义多个方法
const calculator = {
  add(a, b) {
    return a + b;
  },
  subtract(a, b) {
    return a - b;
  },
  multiply(a, b) {
    return a * b;
  },
};

console.log(calculator.add(5, 3)); // 8
```

#### 3. 属性名表达式

ES6 允许使用表达式作为对象的属性名，需要将表达式放在方括号内：

```js
const propKey = 'foo';
const methodKey = 'sayHello';

const obj = {
  // 使用变量作为属性名
  [propKey]: 'bar',

  // 使用变量作为方法名
  [methodKey]() {
    console.log('Hello!');
  },

  // 使用表达式作为属性名
  ['prop' + 'Name']: 'value',

  // 使用计算值作为属性名
  [`key_${Date.now()}`]: 'timestamp value',
};

console.log(obj.foo); // bar
console.log(obj.propName); // value
obj.sayHello(); // Hello!

// 实际应用：动态创建属性
function createObject(key, value) {
  return {
    [key]: value,
  };
}

const obj2 = createObject('dynamicKey', 'dynamicValue');
console.log(obj2.dynamicKey); // dynamicValue
```

#### 综合示例

```js
// 结合多种简写语法
const prefix = 'user';
const name = 'Alice';
const age = 25;

const user = {
  // 属性简写
  name,
  age,

  // 属性名表达式
  [prefix + 'Id']: 12345,

  // 方法简写
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  },

  // getter 方法
  get info() {
    return `${this.name} (${this.age})`;
  },
};

console.log(user.userId); // 12345
console.log(user.info); // Alice (25)
user.greet(); // Hello, I'm Alice
```

---

## 对象操作

基于这些基础知识，本章节我们来学习对象的各种常见操作，涉及对类型判断、对象锁定、对象合并、对象比较等等，是日常非常常用的。

类型判断
我们判断一个对象 o 是否是类 C 的实例，通常会用到 instanceof 运算符：

o instanceof C
它具体是怎么工作的呢？随着 ECMAScript 的版本迭代，instanceof 的逻辑也在逐渐趋于复杂，不过总体上来看还是分成了 Symbol.hasInstance 和原型链两个分支。

Symbol.hasInstance 是一个预定义的 Symbol 常量，我们之前提到过，但是没有讲它是怎么使用的。今天才轮到它上场。

第一步，判断 C 是否有 [Symbol.hasInstance] 这个函数，注意，它应该定义在构造函数本身上，而不是实例上：

class MyString {
    static [Symbol.hasInstance](instance) {
      return 'string' === typeof instance;
    }
  }
  
console.log('abc' instanceof MyString); // true
如果存在这个函数，那么调用它，传入 instanceof 左边的值。像上面那样，我们声明了一个自定义类型，在 instanceof 下成功利用 Symbol.hasInstance 把字符串伪装成了其实例。

有同学可能认为这样做也太草率了，岂不是很容易实现类型攻击。我之前也这样想，但是在充分掌握了类型结构的知识后，大家不觉得，在 JavaScript 中，对象和构造函数之间的关系不是本来就很脆弱么？

如果不认同，我们继续往下看在引入 Symbol 之前的 instanceof 工作方式。

第二步，先来判断 C 是不是一个 bind 之后的函数，像这样 C = Foo.bind(ko)。这一步怎么实现的呢？我们前面提到过，一个函数在经过 bind 后，它的 name 属性会有 bound 字样：

function Foo() {}

const C = Foo.bind("this", 1, 2, 3);
C.name // "bound Foo"
但是却无法获取原始函数。对于规范来说却并非难事。bind 后的函数会把原始函数记录在 [[BoundTargetFunction]] 内部属性中，也有其他属性，其结构大概是这样：

// C 的额外内部属性
{
    [[BoundTargetFunction]]: Foo,
    [[BoundThis]]: "this",
    [[BoundArguments]]: [1, 2, 3]
}
拿到原始函数 F 后，问题就转化为 o instanceof F 了，接下来就是原型链的舞场了，一句话概括就是，顺着 o 的原型链查找，如果能找到 F.prototype，就返回 true，否则 false。

image.png

用一行伪代码表示就是：

o.__proto__.__proto__.__proto__... === F.prototype
甚至我们真的可以写出能运行的 instanceof 实现：

function myInstanceof(o, C) {
    const current  = o;
    while(current)
        const proto = Object.getPrototypeOf(current);
        if (proto && proto === C.prototype) {
            return true;
        }
        current = proto;
    }
    return false;
}
其实就是一个递归的过程，逻辑并不复杂。不过需要注意一些边界条件：

C 如果不是对象，会抛出异常，这里的对象指的是非 Primitive 类型，像 null、undefined、true、5、"abc"、Symbol("x") 都不允许；
除非命中 [Symbol.hasInstance] 逻辑，否则 C 还必须是一个函数；
如果 o 不是对象，返回 false，这里的对象也指的是非 Primitive 类型，比如 "string" instanceof String === false；
如果 C 没有对象类型的 prototype，抛出异常。
根据以上规则，下列 instanceof 表达式都会抛出异常：

({}) instanceof null
({}) instanceof undefined
({}) instanceof true
({}) instanceof 5
({}) instanceof "abc"
({}) instanceof Symbol()
({}) instanceof {}
({}) instanceof Object.create(null)

function Foo (){}
  
Object.defineProperty(Foo, 'prototype', {
    value: 6, // 非对象格式
})

({}) instanceof Foo
以上就是 instanceof 的全部工作原理。大家有没有发现什么呢？因为原型链本身就是易被操控的，因此 instanceof 的结果严格来讲也不能客观反映对象 o 和构造函数 C 之间的关系。即便不使用 Symbol.hasInstance 这种后门，我们也可以通过简单的操作，让 o 看上去是 C 的实例：

var o = {};
function Foo() {}

Object.setPrototypeOf(o, Foo.prototype);

o instanceof Foo // true
因此，instanceof 代表的只是一种判定规则，并不能真的就代表对象 o 就是 C 的实例。而关于这句对象 o 是 C 的实例本身，其实也是一种伪命题，没有触及问题的本质，我们将在后面的章节中深入讲解。

对象的结构锁定
在上一章节的属性结构学习中，我们了解到使用 configurable 配合 writable 可以在一定程度上锁定对象的结构。但是操作麻烦，并且也有一定的漏洞，比如不能阻止新增属性。

因此，ECMAScript 还提供了另外三个静态函数，Object.preventExtensions()、Object.seal()、Object.freeze()，用于提供不同级别的对象锁定能力。

阻止对象扩展
Object.preventExtensions() 用于禁止给对象新增属性。它的本质是在调用对象内部的 [[PreventExtensions]] 函数，这个我们讲过。因此，具体效果是由对象自身来决定的。

JavaScript 普通对象的 [[PreventExtensions]] 逻辑，仅仅是讲对象内部的 [[Extensible]] 标志位设成 true。

这个属性我们之前没有涉及过，但是提到过 [[IsExtensible]] 函数，这个函数返回的就是 [[Extensible]] 的值。

[[Extensible]] 影响到多种操作的结构，以下这些行为都是不允许的：

var o = {};

Object.preventExtensions(o);

// 不允许设置原型
Object.setPrototypeOf(o, null);

// 不允许定义新属性
Object.defineProperty(o, 'foo', {
    value: 2
});

// 不允许创建新属性
o.bar = 3
是不是这样就不能让对象访问到新的属性了呢？并不是，我们有原型啊，原型对象如果没有被 preventExtensions 的话，可以在原型对象上新增属性，也算是个投机的办法。

判断一个对象是否可扩展，可以使用 Object.isExtensible(o) 静态函数。

密封对象
Object.seal() 用来密封对象。什么是密封呢？就是不可扩展的升级版，除了不能新增属性之外，所有现有属性都需要变成不可配置的。

所以，Object.seal() 的执行原理可以分成两步：

执行 preventExtensions；
遍历所有属性，修改 configurable 为 false。
判断一个对象是否被密封，可以使用 Object.isSealed(o) 静态函数。

冻结对象
Object.freeze() 用来冻结对象。冻结又密封的升级版，除了不能新增属性、现有属性都需要变成不可配置之外，对于数据属性，writable 还需要变成 false。

判断一个对象是否被密封，可以使用 Object.isFrozen(o) 静态函数。

所以，我们总结一下这三种对象锁定操作，层级逐渐加深，限制逐渐增多，可以用下面这张表格来形容：

操作	状态判断	可新增属性	现有属性可配置	数据属性可写
preventExtensions	isExtensible()	❌	✅	✅
seal	isSealed()	❌	❌	✅
freeze	isFrozen()	❌	❌	❌
💡 大家需要注意一个事实，即便最严格的 freeze 操作，在面对存取器属性时，也无法让属性变成“只读”。

对象的 isExtensible、isSealed、isFrozen 状态会让我们的对象操作变得更不安全。但归根到底，isSealed 和 isFrozen 对于存量属性的影响仍然只是属性描述符层面的，并无其他参量需要考量。对于新属性，除了属性描述符（一定是 undefined）之外，还必须额外关注 isExtensible 的状态，增加了判断的成本。

isExtensible、isSealed、isFrozen 依次是子集-超集的关系，也就是说，当你调用 freeze 后，isExtensible 一定返回 false，isSealed 一定返回 true；当你只调用 seal 后，isExtensible 也会是 false。

从原理上来看，isExtensible 由于只是获取对象的一个内部属性，成本很小，但是对于 isSealed 和 isFrozen 来说，需要遍历所有属性的描述符，判断参数，成本可能会比较高，大家注意这一点。

对象合并
对象是属性的集合，那么就一定存在集合的合并操作。我把这一部分放在对象锁定之后，是因为锁定会明显影响到合并能否成功。

严格来讲，从熟悉完了对象的属性结构之后，我们完全可以自行实现任意规则的对象合并。但一般来讲，用现成的 API 和语法就能满足绝大部分需求。我们这节来聊一聊 Object.assign() 和 Object Spread（对象展开） 这两种方式。

我相信很大部分同学会把这两种做通用处理，使用哪一种，很多时候取决于个人习惯。

class System {
    #options = {};
    constructor(options) {
        // this.#options = Object.assign(this.#options, options);
        this.#options = {
            ...this.#options,
            ...options,
        }
    }
}
然而事实上，它们的原理完全不同，在某些情况下，也会产生不一样的结果。一句话描述就是：Object.assign 以 set 的方式赋值属性，而 Object Spread 以 defineProperty 的方式定义属性。可能用代码模拟更能说明问题：

function assign(dest, src) {
    for (let key in src) {
        // 跳过非自身属性
        if (!src.hasOwnProperty(key)) continue;
        // set
        dest[key] = src[key];
    }
}

function spread(dest, src) {
    for (let key in src) {
        // 跳过非自身属性
        if (!src.hasOwnProperty(key)) continue;
        // defineProperty
        Object.defineProperty(dest, key, {
            value: src[key],
            writable: true,
            enumerable: true,
            configurable: true,
        })
    }
}
这里的 set，并非指一定要调用属性的 set 方法，毕竟属性也不都是存取器属性。这里指的是赋值操作，在 ECMAScript 规范中叫做 PutValue，在语法上有 foo.bar 和 foo["bar"] 两种。看上去非常普通的操作，其实也不见得所有同学都掌握了细节。

注意，虽然读取 bar 会遍历 foo 的原型链，但是如果是赋值的话，并不一定会修改 foo 的原型对象的属性值，要看原型对象上的属性类型。如果是存取器类型，那么确实会调用其 set；如果是数据，那么则会折返到 foo 对象上创建新属性。

Object.assign() 将源对象的可枚举属性都取出来，直接赋值给目标对象；Object Spread 语法也是将源对象的可枚举属性都取出来，不过是在目标对象上定义一个数据属性。

这里面体现出了几个细节，需要特别说明：

Object.assign() 可能会将数据赋值到目标对象的原型上，如果原型上有这个 key 的存取器属性的话；
Object Spread 抛弃了源对象属性的描述符，无论它是数据属性还是存取器属性，无论是可配置的还是不可配置的，也无论是可枚举的还是不可枚举的，最终都转换为目标对象上的一个可枚举、可配置、可写的数据属性。
我们写几个例子验证一下：

var _name = null;

var dest = Object.create({
    set name(n){
        _name = n;
    },
    get name(){
        return _name;
    },

});

Object.assign(dest, {
    name: 'bar'
});
console.log(dest.name); // "bar"
// Object.assign 赋值到了对象的原型上而非对象本身
console.log(Object.getOwnPropertyDescriptor(dest, 'name')); // undefined
var source = Object.create(null, {
    name: {
        get() {
            return 'foo';
        },
        set(){},
        enumerable: true,
        configurable: false,
    },
});

const dest = { ...source };
// Object Spread 在目标对象上定义可配置的数据属性
console.log(Object.getOwnPropertyDescriptor(dest, 'name')); // { value: 'foo', writable: true, enumerable: true, configurable: true }
既然我们了解到了这两种写法的原理，那么就能在适当的时机判断该使用哪一种，一般来说，只操作简单的对象的话，没什么差异。如果你的合并对象目标是未知来源，你需要知道可能引起报错的场景：

如果目标对象现存属性是只读的，Object 可能会失败；
如果目标对象现存属性是不可配置的，或者对象不可扩展，那么 Object Spread 可能会失败。
这两种方法都是操作批量属性的，如果其中某一属性合并失败，那么之前已经合并的属性会保留，不会回滚，因此，合并失败是可能产生未知的对象污染的。举一个例子：

var dest = Object.create(null, {
    a: {
        value: 'a',
        writable: true,
        enumerable: true,
        configurable: true,
    },
    b: {
        value: 'b',
        // 合并b会报错
        writable: false,
        enumerable: true,
        configurable: true,
    }
});

try {
    Object.assign(dest, {
        a: 'aa',
        b: 'bb'
    });
} catch {}

console.log(dest.a, dest.b); // aa b


### 对象的扩展运算符

对象的扩展运算符（`...`）用于取出对象的所有可枚举属性，拷贝到当前对象中。

#### 基本用法

```js
// 对象拷贝
const original = { a: 3, b: 4 };
const copy = { ...original };
console.log(copy); // { a: 3, b: 4 }

// 合并对象
const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3, d: 4 };
const merged = { ...obj1, ...obj2 };
console.log(merged); // { a: 1, b: 2, c: 3, d: 4 }

// 覆盖属性（后面的属性会覆盖前面的）
const defaults = { color: 'blue', size: 'medium' };
const userSettings = { size: 'large' };
const finalSettings = { ...defaults, ...userSettings };
console.log(finalSettings); // { color: 'blue', size: 'large' }
```

#### 类型转换行为

```js
// 空对象和假值
console.log({ ...{} }); // {}
console.log({ ...null }); // {}
console.log({ ...undefined }); // {}

// 数字、布尔值会被忽略
console.log({ ...1 }); // {}
console.log({ ...true }); // {}

// 字符串会转换为类数组对象
console.log({ ...'abc' }); // { '0': 'a', '1': 'b', '2': 'c' }

// 数组会转换为索引对象
console.log({ ...[1, 2, 3] }); // { '0': 1, '1': 2, '2': 3 }

// 综合示例
console.log({ ...1, ...'abc', ...true, ...null, ...undefined });
// { '0': 'a', '1': 'b', '2': 'c' }
```

#### 只拷贝可枚举的自身属性

扩展运算符只会返回对象自身的、可枚举的属性：

```js
class C {
  p = 12; // 实例属性
  m() {} // 原型方法
}

const c = new C();
const clone = { ...c };

console.log(clone); // { p: 12 }
// 注意：m 方法在原型上，不会被拷贝

// 等同于使用 Object.assign()
const clone2 = Object.assign({}, c);
console.log(clone2); // { p: 12 }

// 添加新属性
const extended = { ...clone, q: 13 };
console.log(extended); // { p: 12, q: 13 }
```

#### 实际应用场景

**1. 对象浅拷贝**

```js
const user = {
  name: 'Alice',
  age: 25,
};

const userCopy = { ...user };
userCopy.name = 'Bob';

console.log(user.name); // Alice（原对象不变）
console.log(userCopy.name); // Bob
```

**2. 合并配置对象**

```js
const defaultConfig = {
  timeout: 3000,
  retries: 3,
  cache: true,
};

const userConfig = {
  timeout: 5000,
  cache: false,
};

const finalConfig = { ...defaultConfig, ...userConfig };
console.log(finalConfig);
// { timeout: 5000, retries: 3, cache: false }
```

**3. 添加或修改属性**

```js
const user = { name: 'Alice', age: 25 };

// 添加新属性
const userWithId = { ...user, id: 1 };
console.log(userWithId); // { name: 'Alice', age: 25, id: 1 }

// 修改属性
const olderUser = { ...user, age: 26 };
console.log(olderUser); // { name: 'Alice', age: 26 }
```

**4. 条件添加属性**

```js
const includeEmail = true;
const user = {
  name: 'Alice',
  age: 25,
  ...(includeEmail && { email: 'alice@example.com' }),
};

console.log(user);
// { name: 'Alice', age: 25, email: 'alice@example.com' }
```

#### 注意事项

> **重要**：扩展运算符执行的是浅拷贝，而不是深拷贝。如果对象的属性值是引用类型，拷贝的是引用。

```js
const original = {
  name: 'Alice',
  address: {
    city: 'New York',
  },
};

const copy = { ...original };

// 修改嵌套对象会影响原对象
copy.address.city = 'Boston';
console.log(original.address.city); // Boston（原对象也被修改了）
```

### 控制对象状态

有时需要冻结对象的读写状态，防止对象被意外修改。JavaScript 提供了三种冻结方法，限制程度从弱到强依次为：`Object.preventExtensions` < `Object.seal` < `Object.freeze`。

#### 三种冻结方法对比

| 方法                       | 添加新属性 | 删除属性 | 修改属性值 | 修改属性描述符 | 应用场景                         |
| -------------------------- | ---------- | -------- | ---------- | -------------- | -------------------------------- |
| `Object.preventExtensions` | ❌         | ✅       | ✅         | ✅             | 防止对象扩展，但允许修改现有属性 |
| `Object.seal`              | ❌         | ❌       | ✅         | ❌             | 密封对象，不能添加删除属性       |
| `Object.freeze`            | ❌         | ❌       | ❌         | ❌             | 完全冻结对象，变成只读常量       |

#### 1. `Object.preventExtensions()`

使对象无法添加新属性，但可以修改和删除现有属性：

```js
const obj = { name: 'Alice' };

Object.preventExtensions(obj);

// 无法添加新属性
obj.age = 25;
console.log(obj.age); // undefined

// 可以修改现有属性
obj.name = 'Bob';
console.log(obj.name); // Bob

// 可以删除现有属性
delete obj.name;
console.log(obj.name); // undefined

// 检查对象是否可扩展
console.log(Object.isExtensible(obj)); // false
```

#### 2. `Object.seal()`

密封对象，既无法添加新属性，也无法删除现有属性，但可以修改现有属性的值：

```js
const obj = { name: 'Alice', age: 25 };

Object.seal(obj);

// 无法添加新属性
obj.city = 'New York';
console.log(obj.city); // undefined

// 无法删除现有属性
delete obj.age;
console.log(obj.age); // 25

// 可以修改现有属性的值
obj.name = 'Bob';
console.log(obj.name); // Bob

// 检查对象是否被密封
console.log(Object.isSealed(obj)); // true
```

#### 3. `Object.freeze()`

完全冻结对象，无法添加、删除或修改属性，对象变成只读的：

```js
const obj = { name: 'Alice', age: 25 };

Object.freeze(obj);

// 无法添加新属性
obj.city = 'New York';
console.log(obj.city); // undefined

// 无法删除现有属性
delete obj.age;
console.log(obj.age); // 25

// 无法修改现有属性的值
obj.name = 'Bob';
console.log(obj.name); // Alice

// 检查对象是否被冻结
console.log(Object.isFrozen(obj)); // true
```

#### 局限性

**1. 原型链漏洞**

上述三个方法只能锁定对象本身，但可以通过修改原型对象来间接影响对象：

```js
const obj = Object.freeze({ name: 'Alice' });

// 无法直接修改
obj.age = 25;
console.log(obj.age); // undefined

// 但可以通过修改原型来添加属性
Object.prototype.age = 25;
console.log(obj.age); // 25

// 清理
delete Object.prototype.age;
```

**解决方案**：同时冻结原型对象

```js
const proto = Object.freeze({ type: 'person' });
const obj = Object.freeze(Object.create(proto));
```

**2. 浅冻结问题**

这些方法都是浅层操作，只能冻结对象的第一层属性。如果属性值是对象，内层对象不会被冻结：

```js
const obj = Object.freeze({
  name: 'Alice',
  address: {
    city: 'New York',
  },
});

// 第一层属性不能修改
obj.name = 'Bob';
console.log(obj.name); // Alice

// 但嵌套对象的属性可以修改
obj.address.city = 'Boston';
console.log(obj.address.city); // Boston
```

**解决方案**：实现深度冻结

```js
function deepFreeze(obj) {
  // 冻结对象本身
  Object.freeze(obj);

  // 递归冻结所有对象类型的属性
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = obj[prop];
    if (value !== null && typeof value === 'object') {
      deepFreeze(value);
    }
  });

  return obj;
}

const obj = deepFreeze({
  name: 'Alice',
  address: {
    city: 'New York',
  },
});

obj.address.city = 'Boston';
console.log(obj.address.city); // New York（修改失败）
```

### super 关键字

#### 基本概念

`this` 关键字总是指向函数所在的当前对象，ES6 新增的 `super` 关键字则**指向当前对象的原型对象**。

#### 内部机制

JavaScript 引擎内部，`super` 的工作方式如下：

- **访问属性**：`super.foo` 等同于 `Object.getPrototypeOf(this).foo`
- **调用方法**：`super.foo()` 等同于 `Object.getPrototypeOf(this).foo.call(this)`

#### 使用示例

```js
const proto = {
  greet() {
    return 'Hello from prototype';
  },
  name: 'Proto',
};

const obj = {
  greet() {
    // 调用原型上的方法
    return super.greet() + ', extended in obj';
  },
  getName() {
    // 访问原型上的属性
    return super.name;
  },
};

Object.setPrototypeOf(obj, proto);

console.log(obj.greet()); // Hello from prototype, extended in obj
console.log(obj.getName()); // Proto
```

#### 注意事项

> **重要**：`super` 关键字只能用在对象的方法之中，用在其他地方会报错。

```js
// ❌ 错误：super 用在属性中
const obj1 = {
  foo: super.bar, // SyntaxError
};

// ❌ 错误：super 用在函数中
const obj2 = {
  foo: () => super.bar, // SyntaxError
};

// ❌ 错误：super 用在普通函数中
const obj3 = {
  foo: function () {
    return super.bar; // SyntaxError
  },
};

// ✅ 正确：super 用在对象方法中
const obj4 = {
  foo() {
    return super.bar; // 正确
  },
};
```

**相关资源：**

> [为什么会产生 'super' keyword unexpected here 的错误？](https://www.zhihu.com/question/519019902)

---

### Object 静态方法

### Object() 工具方法

`Object` 本身是一个函数，可以当作工具方法使用，将任意值转为对象。

- 如果参数为空 (或者为 `undefined` 和 `null`)，`Object()` 返回一个空对象。
- 如果参数是原始类型的值，`Object` 方法将其转为对应的包装对象的实例。
- 如果 `Object` 方法的参数是一个对象，它总是返回该对象，即不用转换。

利用这一点，可以写一个判断变量是否为对象的函数。

```js
function isObject(value) {
  return value === Object(value);
}

isObject([]); // true
isObject(true); // false
```

### Object.is()

用于比较两个值是否严格相等，与 `===` 的区别在于对特殊值的处理：

```js
console.log(+0 === -0); // true
console.log(NaN === NaN); // false

console.log(Object.is(+0, -0)); // false
console.log(Object.is(NaN, NaN)); // true
```

### Object.assign()

用于对象的合并，将源对象（source）的所有可枚举属性，复制到目标对象（target）。

```js
const target = { a: 1 };
const source1 = { a: 2, b: 2 };
const source2 = { c: 3 };

Object.assign(target, source1, source2);
console.log(target); // { a: 2, b: 2, c: 3 }

// 隐式类型转换
console.log(typeof Object.assign(2)); // "object"

// 如果 undefined 和 null 不在首参数，就不会报错。
let obj4 = { a: 1 };
console.log(Object.assign(obj4, undefined, null) === obj4); // true

// 属性名为 Symbol 值的属性，也会被 Object.assign() 拷贝。
console.log(Object.assign({ a: 'b' }, { [Symbol('c')]: 'd' })); // { a: 'b', [Symbol(c)]: 'd' }

// Object.assign 方法总是拷贝一个属性的值，而不会拷贝它背后的赋值方法或取值方法。
const source3 = {
  get foo() {
    return 1;
  },
};
const target2 = {};
console.log(Object.assign(target2, source3)); // { foo: 1 }
```

### Object.keys() / values() / entries()

用于获取对象的键名、值或键值对数组：

```js
const obj = { foo: 123, bar: 456 };
console.log(Object.keys(obj)); // [ 'foo', 'bar' ]
console.log(Object.values(obj)); // [ 123, 456 ]
console.log(Object.entries(obj)); // [ [ 'foo', 123 ], [ 'bar', 456 ] ]
```

### Object.fromEntries()

将键值对数组转换为对象，是 `Object.entries()` 的逆操作：

```js
console.log(
  Object.fromEntries([
    ['foo', 123],
    ['bar', 456],
  ]),
); // { foo: 123, bar: 456 }

const map = new Map([
  ['a', 1],
  ['b', 2],
]);

console.log(Object.fromEntries(map)); // { a: 1, b: 2 }
```

### Object.getPrototypeOf() / setPrototypeOf()

用于获取或设置对象的原型：

```js
const obj = { a: 1 };
const proto = Object.create(obj);
console.log(Object.getPrototypeOf(proto) === obj); // true

Object.setPrototypeOf(proto, null);
console.log(Object.getPrototypeOf(proto)); // null
```

### Object.hasOwn()

`Object.hasOwn()` 是 ES2022 新增的方法，用于判断对象自身是否具有指定的属性。它是 `Object.prototype.hasOwnProperty()` 的更安全替代方案。

```js
const obj = {
  prop: 'value',
};

// 传统方法
console.log(obj.hasOwnProperty('prop')); // true
console.log(Object.prototype.hasOwnProperty.call(obj, 'prop')); // true

// 使用 Object.hasOwn()（推荐）
console.log(Object.hasOwn(obj, 'prop')); // true
console.log(Object.hasOwn(obj, 'nonExistent')); // false

// 优势：处理没有原型的对象
const objWithoutPrototype = Object.create(null);
objWithoutPrototype.prop = 'value';

// 这会报错，因为对象没有 hasOwnProperty 方法
// console.log(objWithoutPrototype.hasOwnProperty('prop')) // TypeError

// 使用 Object.hasOwn() 不会报错
console.log(Object.hasOwn(objWithoutPrototype, 'prop')); // true

// 优势：避免属性名冲突
const objWithConflict = {
  hasOwnProperty: 'I am a property, not a method',
};

// 这会报错
// console.log(objWithConflict.hasOwnProperty('hasOwnProperty')) // TypeError

// 使用 Object.hasOwn() 可以正常工作
console.log(Object.hasOwn(objWithConflict, 'hasOwnProperty')); // true
```

---


### 可选链操作符

可选链操作符 (`?.`) 允许读取位于连接对象链深处的属性的值，而不必明确验证链中的每个引用是否有效。

```js
const user = {
  name: 'Alice',
  address: {
    street: 'Main St',
    city: 'New York',
  },
};

// 传统写法
const city1 = user && user.address && user.address.city;
console.log(city1); // New York

// 使用可选链
const city2 = user?.address?.city;
console.log(city2); // New York

// 访问不存在的属性
const zipCode = user?.address?.zipCode;
console.log(zipCode); // undefined

// 可选链与函数调用
const obj = {
  method() {
    return 'Hello';
  },
};

console.log(obj.method?.()); // Hello
console.log(obj.nonExistent?.()); // undefined

// 可选链与数组索引
const arr = [1, 2, 3];
console.log(arr?.[0]); // 1
console.log(arr?.[10]); // undefined
```

### 空值合并操作符

空值合并操作符 (`??`) 是一个逻辑操作符，当左侧的操作数为 `null` 或 `undefined` 时，返回其右侧操作数，否则返回左侧操作数。

```js
// 与 || 的区别
const value1 = 0 || 'default';
console.log(value1); // 'default'（0 被视为 falsy）

const value2 = 0 ?? 'default';
console.log(value2); // 0（0 不是 null 或 undefined）

// 常用场景
const config = {
  timeout: 0,
  maxRetries: null,
};

const timeout = config.timeout ?? 3000;
const maxRetries = config.maxRetries ?? 3;

console.log(timeout); // 0
console.log(maxRetries); // 3

// 与可选链结合使用
const user = {
  profile: {
    name: 'Alice',
  },
};

const age = user?.profile?.age ?? 18;
console.log(age); // 18
```

## 对象遍历

属性和原型链操作是对象操作中最为关键的组成部分，但只有补齐`遍历`这一环才能实现对象的完整访问能力。大家可以这样理解，对象就像一个拥有很多把锁的黑盒，你用相应的钥匙（key）就能打开相应的锁（value），但是你连用哪些钥匙都不知道，那么只能俩眼一抹黑，啥也做不了。

单纯依靠暴露出来的属性访问语法和 API，我们是无法遍历对象的，只有引擎的底层才知道对象的结构。前面曾经提到过对象的内部属性中有这么一个 `[[OwnPropertyKeys]]`，它可理解为一个数组，记录了对象的所有键（key）。

对象的遍历实际上是对键的遍历，因此都离不开对 `[[OwnPropertyKeys]]` 的访问，只不过策略有所不同。

我们把遍历需求分为 4 个层次：

<p align=center><img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1a07bc39114f43419c0e82942c3409b1~tplv-k3u1fbpfcp-watermark.image" width="80%"></p>




## 遍历对象自身的可枚举数据

`Object.keys`、`Object.values` 和 `Object.entries` 是遍历对象自身属性的常用方法。原型链上的属性不会被纳入最终结果：

```js
const obj = Object.create({
    // 原型链不会被遍历
    age: 12
}, {
    name: {
        value: 'foo',
        enumerable: true,
    }
});

Object.keys(obj); // ["name"]
```

这三个函数的筛选逻辑本质上是一致的，都是调用了一个叫做 `EnumerableOwnProperties()` 的内部方法，只不过输出的数据不同，一个是所有的键，一个是所有的值，最后一个是键值。

从这个方法的名字上就能看到，它只会遍历到`可枚举`的属性，因此，要想使得某个键不出现在其结果中，可以设置 `enumerable` 为 false：

```js
const obj = Object.create(null, {
    name: {
        value: 'foo',
        enumerable: true,
    },
    age: {
        value: 'foo',
        // 不可枚举
        enumerable: false,
    }
});

Object.keys(obj); // ["name"]
```

还有一个特征没有明显体现出来，就是它不会遍历到 `Symbol` 类型的键：

```js
const obj = {
    name: 'foo',
    // Symbol 不输出
    [Symbol('age')]: 16,
};

Object.keys(obj); // ["name"]
```

因此，我们可以总结出 `Object.keys/values/entries 只会遍历出对象自身的、可枚举的、以字符串类型为键的属性`，这三个条件，缺一不可。

<p align=center><img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9c951316b58046eb8cf9b98be9b6a308~tplv-k3u1fbpfcp-watermark.image" width="50%"></p>

现在我们放松部分条件，希望不可枚举的，以及 Symbol 类型的也会被遍历到，该怎么办呢？




## 遍历对象自身的所有数据

问题归结为遍历对象自身的所有数据，等价于获取 `[[OwnPropertyKeys]]` 的内容。

`Object.getOwnPropertyNames` 可以用来获取其中的字符串键，`Object.getOwnPropertySymbols` 用来获取其中的 `Symbol` 键，把它们合起来，就相当于得到 `[[OwnPropertyKeys]]` 完整内容：

```js
var obj = Object.create(null, {
    [Symbol('b')]: {
        value: 'b',
        writable: false,
        enumerable: true,
        configurable: true,
    },
    a: {
        value: 'a',
        writable: true,
        enumerable: true,
        configurable: true,
    },
});
console.log([
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj),
]); // ["a", Symbol(b)]
```

至于说为什么这样设计，要把字符串和 Symbol 分开，其实是一个历史问题。

`Object.getOwnPropertyNames` 是 ES5 引入的，当时还没有 Symbol 类型，因此它只会返回一个字符串数组。ES6 引入 Symbol 之后，如果要求 `Object.getOwnPropertyNames` 也返回 Symbol 类型的话，那么恐怕很多代码都会出错。所以为了向后兼容的考量，又引入了一个 `Object.getOwnPropertySymbols` 专门返回 Symbol 类型的键。

但话说回来，ES6 同时又引入了一个 `Reflect.ownKeys` 函数，实打实地返回的就是 `[[OwnPropertyKeys]]` 的完整内容，免去了需要拼接的麻烦：

```js
console.log(Reflect.ownKeys(obj)); // ["a", Symbol(b)]
```

能提供和 `Reflect.ownKeys` 类似效果的还有 `Object.getOwnPropertyDescriptors`，它提供的也是 `[[OwnPropertyKeys]]` 的全部内容，外加各个键的属性描述符：

```js
// {
//   a: { value: 'a', writable: true, enumerable: true, configurable: true },
//   [Symbol(b)]: { value: 'b', writable: false, enumerable: true, configurable: true }
// }
console.log(Object.getOwnPropertyDescriptors(obj));
```

> 💡 `Object.getOwnPropertyDescriptors` 是 `Object.getOwnPropertyDescriptor` 的批量版本。

总体而言，这几个 API 相较于前面的，提供的信息量更加全面。至于使用哪个，很大程度上取决于需求。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2c6c0e9fea6d47ec8cba88f1dfccf0d9~tplv-k3u1fbpfcp-watermark.image?)

接下来，我们突破对象自有属性的限制，来把原型链也考虑进去。




## 遍历对象及原型链的所有可枚举数据

能够实现遍历原型链的现成方法，目前只有 `for...in` 一种，然而，它一是只能遍历可枚举属性，二是只能遍历字符串键的属性：

```js
var obj = Object.create(
    Object.create(null, {
        // 原型链上的属性会被遍历
        d: {
            value: 'd',
            writable: true,
            enumerable: true,
            configurable: true,
        },
    }), {
        // Symbol 不会被遍历
        [Symbol('b')]: {
            value: 'b',
            writable: false,
            enumerable: true,
            configurable: true,
        },
        a: {
            value: 'a',
            writable: true,
            enumerable: true,
            configurable: true,
        },
        // 不可枚举的属性不会被遍历
        c: {
            value: 'c',
            writable: true,
            enumerable: false,
            configurable: true,
        },
    }
);

for (let key in obj) {
    console.log(key); // a d
}
```

如果想把 `Symbol` 包括进来，甚至和那些不可枚举的属性，我们只能自己实现。下面就是一种未经过优化的代码，仅代表其可能性，大家看看能不能读得懂：

```js
function getExtendedKeys(obj) {
    const visitedKeys = new Set();
    let current = obj;
    
    // 向上遍历原型链
    while (current) {
        // 遍历当前属性
        const keys = Reflect.ownKeys(current);
        keys.forEach(key => {
            // 去重
            if (visitedKeys.has(key)) return;
            visitedKeys.add(key);
        });

        current = Object.getPrototypeOf(current);
    }

    return Array.from(visitedKeys);
}
```

核心原理仍然是原型链遍历和属性遍历。

可以这样说，上面我们讲到的所有遍历方法，无论是 `Object.keys/values/entries/getOwnPropertyNames/getOwnPropertySymbols/getOwnPropertyDescriptors`，还是 `Reflect.ownKeys`，亦或是 `for...in`，都是基于对象属性的，不可能遍历出属性之外的东西。如果我们想实现遍历数据的动态性，那就必须先把它写入到对象中才行。

现在，我们有了更加强大的语法，`for...of`，它真正实现了突破对象属性圈子的能力。






## 完全自定义遍历数据

`for...of` 不绑定任何对象属性，每次遍历出什么数据，完全是自定义的。从这一点上来说，`for...in` 的功能是其子集。在如今的 ECMAScript 规范中，`for...in` 依赖的是内部的一种特殊迭代器。而 **`迭代器（iterator）`，正是 `for...of` 工作原理的本质所在**。

### 什么是迭代器

可以认为迭代器就是一个接口（interface），实现了该接口的对象，就可以被 `for...of` 遍历。

有多种方式可以实现迭代器。

第一种是利用生成器函数。前面函数那一章我们讲过，生成器函数始终返回一个迭代器对象：

```js
function* range(start, end) {
    for (let i = start; i <= end; ++i) {
        yield i;
    }
}

for (const i of range(3, 6)) {
    console.log(i); // 3 4 5 6
}
```

简单理解的话，`yield` 指令的右侧值就是遍历时每次得到的值。显然这里返回的数据和对象的属性没有任何关系。

迭代器也可以不通过 `for...of` 调用，它主要就包含一个 `next` 函数，返回格式是：

```ts
{
    value?: any;
    done?: boolean;
}
```

所谓的遍历过程，本质上就是一直调用 `next` 函数，直到 `done` 为 true：

```js
let it = range(3,6), value, done;

while(1) {
    const ret = it.next();
    done = ret.done;
    value = ret.value;
    if (done) break;
    console.log(value); // 3 4 5 6
}
```

第二种定义迭代器的方法是第一种的变种，需要使用到前面曾经提到过的 `Symbol` 常量： `Symbolt.iterator`，定义了这个键的对象，且值为一个生成器，那么该对象就可以被遍历：

```js
class Range {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    *[Symbol.iterator]() {
        for (let i = this.start; i <= this.end; ++i) {
            yield i;
        }
    }
}

for (const i of new Range(3, 6)) {
    console.log(i); // 3 4 5 6
}
```

> 💡 之所以字符串、数组、Map、Set 都可以在 `for...of` 中使用，就是因为它们在原型上都定义了 `[Symbol.iterator]` 属性。

这个特性给了我们自定义遍历数据的很大灵活性，大家可以自己试一试，把前面我们写的那个 `getExtendedKeys` 函数改写为一个迭代器，进而能用 `for...of` 遍历。

如果你不熟悉或者不喜欢生成器，那么第三种定义迭代器的方法就很适合你：

```js
function createRanger(start, end) {
    let current = start;
    return {
        next() {
            const nextValue = current++;
            return {
                value: nextValue,
                done: nextValue > end,
            };
        },
        // 返回自身
        [Symbol.iterator]() {
            return this;
        },
    };
}

for (const i of createRanger(3,6)) {
    console.log(i); // 3 4 5 6
}
```

本质上它在模拟迭代器的结构。`next` 函数遵照协议，必须返回一个 `{ value, done }` 结构的对象，你自己来决定其中的字段值。但这还不够，`for...of` 会发现被遍历的对象依旧不是迭代器，这就需要靠 `[Symbol.iterator]()` 函数的返回值了。

前面的例子中，生成器函数一定返回迭代器对象，那么在这里，我们就强行返回自身，这样就“骗过”了 `for...of`。

以上就是三种迭代器的定义方法。比较来说，它们适合不同的场景：
1. 第一种，生成器函数，适合简单入参的、无额外数据字段的场景；
2. 第二种，对象，适合需要进一步封装额外数据、增加内聚性的场景；
3. 第三种，迭代器模拟，是第二种的变种，适合不想用生成器的场景。

无论哪一种，当我们遍历的时候，数据都是立即输出的，也就是说它们都是`同步遍历`。

假设有这么一个场景，我们需要遍历一个很大的数据库，不可能一次性把数据全都加载过来，因此需要一边遍历，一边读取，而读取是异步的，怎么办？

<p align=center><img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/802ad0aef931406d899a14d0950ff025~tplv-k3u1fbpfcp-watermark.image" width="80%"></p>



### 异步遍历

很多人对异步迭代有一定的误解，认为在 for 循环中调用异步过程，就算异步遍历了：

```js
for (const item of datas) {
    await Promise.resolve(item).then(...
}
```

但事实上这只是同步迭代、异步消费。我们所说的异步遍历，指的是从数据集合中取出的过程就是异步的，不关心消费过程是否异步。用 Promise 来描述异步的话， 大概是这样的：


```js
class AsyncProducer {
    constructor(size) {
        this.current = size;
    }
    async produce() {
        return this.current--;
    }
}
```

我们过去怎么做的呢？`异步递归`，本质上还是 Promise 首尾相连：

```js
const producer = new AsyncProducer(5);

async function process() {
    const num = await producer.produce();
    if (0 === num) {
        return;
    }

    console.log(num); // 5 4 3 2 1

    await process();
}

process().finally(() => console.log('all done'));
```

但这样的代码阅读起来稍微有一些吃力，现在我们有更好的办法，就是使用异步迭代语法：`for await...of`。

`await` 字样代表其必须在一个异步函数内部才能运行，而且还与 `Promise` 脱不开干系，是 `for...of` 的超集。`for...of` 能用的地方，`for await...of` 也能用，比如：

```js
for await (const num of [1, 2, 3]) {
    console.log(num); // 1 2 3
}
```

不过两者有一个很大的不同，`for await...of` 会把迭代器返回的值用 `Promise` 包裹进去，然后再 `resolve` 出来，因此上面代码中的三次打印动作之间并不是同步的，也正因为多了这两步操作，它要比 `for...of` 慢一点点。

所以说，在同步迭代器上，虽然可以，但没有理由使用 `for await...of` 语法。它真正能体现价值的，是`异步迭代器`。

同步迭代器的三种定义方法也适用于异步迭代器，只不过需要把同步的生成器函数改成异步生成器函数，`Symbol.iterator` 改成 `Symbol.asyntIterator`：

```js
// 第一种，异步生成器函数
async function* range(start, end) {
    for (let i = start; i <= end; ++i) {
        yield i;
    }
}

// 第二种，Symbol.iterator => Symbol.asyncIterator，注意这里虽然同步和异步都能工作，但是只有异步才有实际意义
class Range {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    async *[Symbol.asyncIterator]() {
        for (let i = this.start; i <= this.end; ++i) {
            yield i;
        }
    }
}

// 第三种，Symbol.iterator => Symbol.asyncIterator，注意，这里的函数必须是同步的
// 同时 next 返回的是 Promise 格式
function createRanger(start, end) {
    let current = start;
    return {
        next() {
            const nextValue = current++;
            return Promise.resolve({
                value: nextValue,
                done: nextValue > end,
            });
        },
        // 必须同步返回自身
        [Symbol.asyncIterator]() {
            return this;
        },
    };
}
```

现在我们改写一下上面那个`异步递归`：

```js
const producer = {
    current: 5,
    // 异步生成器函数
    async * [Symbol.asyncIterator]() {
        for(let i = this.current; i > 0;i--) {
            yield await Promise.resolve(i);
        }
    }
};

// 必须在异步函数内部执行
(async() => {
    for await(const num of producer) {
        console.log(num); // 5 4 3 2 1
    }
})();
```

这么遍历是不是更容易阅读呢？大家用这么一句话理解就行了：**`异步迭代 = 同步迭代 + Promise`**。

## 小结

遍历是对象这样的属性集合的常见操作，除了大家耳熟能详的 `for...in` 之外，还有 `Object.keys/values/entries/getOwnPropertyNames/getOwnPropertySymbols/getOwnPropertyDescriptors`、`Reflect.ownKeys`、`for...of`、`for await...of` 这么多种，本章节一共“遍历”了这 10 种方式。肯定有些同学已经眼花缭乱了，感觉更加迷惑。

我们可以分成两类来看待这 10 个方法，最独特的莫过于 `for...of` 和 `for await...of`，它们本质上和对象的属性无关，而剩下的 8 种则全部是在对象属性这个范围内工作的。我制作了下面这张表格，来体现它们的异同点：

|遍历方法|包括自身 `String` 属性|包括自身 `Symbol` 属性|包括`原型链`属性|包括`不可枚举`属性|
|---------|----|----|----|----|
|`for...in`|✅|❌|✅|❌|
|`Object.keys/values/entries`|✅|❌|❌|❌|
|`Object.getOwnPropertyNames`|✅|❌|❌|✅|
|`Object.getOwnPropertySymbols`|❌|✅|❌|✅|
|`Object.getOwnPropertyDescriptors`|✅|✅|❌|✅|
|`Reflect.ownKeys`|✅|✅|❌|✅|

有两条关键特征需要关注：
1. 只有 `for...in` 能遍历原型链；
2. 带 `own` 字样的都不关心是否可枚举。

除了遍历范围之外，它们返回的信息量也有不同，比如 `Object.values/entries/getOwnPropertyDescriptors`，在有些场景可能必须要用到某些 API，特别是 `Object.getOwnPropertyDescriptors`，它提供的的信息量几乎是最完备的。再加上原型链的相关知识，我们可以实现任意逻辑的遍历操作，当上面这些现成的遍历方法不满足的时候，你就可以自己去实现了。

到这里为止，我们在对象上的各种操作基本就都了解完毕了，三要素：`属性`、`原型`和`遍历`，大家要记牢。

下一节，我们回过头来看 ES6 以后创建对象的新语法 `class`
，看它到底是如何工作的，以作为对象操作的高级案例来巩固相关知识。