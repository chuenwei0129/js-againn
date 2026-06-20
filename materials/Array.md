---
title: JavaScript 数组的本质：为什么它这么怪？
created: 2022-01-04
updated: 2025-09-08
tags:
  - JavaScript
  - Array
description: 从 ECMAScript 规范和 V8 引擎角度深入剖析 JavaScript 数组的本质——Array Exotic Object、稀疏数组与 hole、length 机制、API 差异、Elements Kind 性能退化路径，以及 TypedArray 与类数组对比。
status: evergreen
---

你有没有好奇过，JavaScript 的数组为什么总有点"不像数组"？

* 数组能像对象一样挂属性？
* 数组长度为什么会自动变化？
* 为什么数组可以如此稀疏？
* 为什么有些 API 会跳过空位（hole），有些不会？
* 为什么 `delete` 不会改变数组长度？
* 为什么数组有时候很快，有时候性能又很差？

好家伙，这到底是个啥？

其实答案就一句话——

> JavaScript 数组，本质上是被特殊优化过的对象。

是不是瞬间就懂了？不对，可能更懵了。别急，我们慢慢聊。

---

## 一、揭开数组的真面目

先做个实验：

```js
typeof []; // 'object'
```

没错，数组就是对象。但更准确地说，它是 ECMAScript 规范中的一种 **Array Exotic Object（数组奇异对象）**——它仍然是对象，但拥有一些特殊内部行为：

* 自动维护 `length`
* 对整数索引做特殊处理
* 拥有特殊的 `[[DefineOwnProperty]]` 行为

所以 Array 真不是"普通对象 + length"那么简单。

---

### 数组索引其实是字符串

```js
const arr = [];
arr[0] = 'A';
```

你可能觉得"数组在索引 0 的位置放了个元素"，但在规范层面，更接近 `arr['0'] = 'A'`。因为对象属性键会经过内部的 `ToPropertyKey` 转换，而 JavaScript 对象的键本质上只能是字符串或 Symbol：

```js
arr[0] === arr['0']; // true
Object.keys(arr);    // ['0']
```

数组索引最终仍然是字符串键，只不过 Array 对"整数索引字符串"做了特殊优化。

---

### length 为什么会自动变化？

当你写 `arr[0] = 'A'`，引擎除了设置 `'0'` 这个属性外，还会自动更新 `arr.length === 1`。因为数组会自动维护"当前最大整数索引 + 1"：

```js
const arr = [];
arr[5] = 'A';
console.log(arr.length); // 6
```

所以 `length` 不是元素个数，而是"最大索引边界"。这是理解稀疏数组的关键。

而且 `length` 不是普通属性——它的属性描述符很特殊：

```js
Object.getOwnPropertyDescriptor([], 'length')
// { value: 0, writable: true, enumerable: false, configurable: false }
```

**可写但不可枚举、不可配置。** 这解释了三个行为（后文会介绍）：

- `for...in` 不会遍历出 `length`（non-enumerable）
- `delete arr.length` 失败（non-configurable）
- `arr.length = 0` 能清空数组（writable）

这是 `Array Exotic Object` 的特殊内部行为，普通对象的属性默认三个标志都是 `true`。

---

### 数组能挂属性吗？

既然数组本质是对象，挂个普通属性自然也没毛病：

```js
const arr = [1, 2, 3];
arr.name = 'array';
console.log(arr.name); // 'array'
```

但注意，`arr.name = 'array'` 不会影响 `length`——只有"数组索引"才会触发长度更新。

---

### 什么才算"数组索引"？

这里有个很多人不知道的细节：并不是所有数字键都会被当成数组索引。只有满足 `0 <= index < 2^32 - 1` 的整数键，才算真正的数组索引。

```js
const arr = [];
arr[4294967294] = 'A';
console.log(arr.length); // 4294967295

arr[4294967295] = 'B';
console.log(arr.length); // 4294967295，不会再增长了
```

因为 `4294967295 === 2^32 - 1`，已经超出合法数组索引范围，会退化成普通对象属性。

---

说到这里你可能会想："既然数组就是对象，那我直接用对象不就行了？"

## 二、数组和普通对象到底哪里不一样？

真正的区别在于引擎优化：**引擎会为"连续整数索引"做专门优化。**

当你规规矩矩地使用数组：

```js
const arr = [1, 2, 3];
```

引擎会识别出索引连续、元素密集、类型统一，于是把它当成"可连续存储的数据"来优化，性能非常接近传统语言里的数组。

但如果你开始乱来：

```js
const arr = [];
arr[999999999] = 1;
```

引擎总不能真的分配 `0 ~ 999999999` 这么大一片连续内存，于是只能退化为**字典模式（Dictionary Mode）**——元素不再按连续内存存储，改用更适合稀疏索引的数据结构（在 V8 中通常是哈希结构）。

所以更准确的说法其实是：

> JavaScript 数组 = 针对整数索引做特殊优化的对象。

真正的核心价值不是 `length`，而是**引擎能根据数组形态选择不同的存储策略**。V8 内部用一套叫 `Elements Kind` 的分类系统来管理这种优化——数组越规整，引擎给的"待遇"越好。具体怎么分级？为什么稀疏数组会拖慢性能？我们后面细说。

---

## 三、为什么传统数组快？

传统语言里的数组，比如 C：

```cpp
int arr[5];
```

真的就是 `[ ][ ][ ][ ][ ]`，一整块连续内存。CPU 有个习惯：读一个数据时，会把旁边一整条"数据块"（cache line，通常 64 字节）一起搬进高速缓存。就像翻书——你翻开第 100 页时，第 101、102 页已经在手边了。所以读 `arr[0]` 时，`arr[1]`、`arr[2]` 已经顺便进缓存了。这叫**缓存友好（cache friendly）**。

反过来，如果元素分散在内存各处：

```txt
A -> 某处
B -> 另一处
C -> 很远的地方
```

CPU 每次都得重新取内存，这就是 **cache miss（缓存未命中）**，性能会明显下降。

而 JavaScript 数组有时候会"散架"。比如 `arr[999999999] = 1`，连续内存已经不现实了，指针跳来跳去、缓存命中率下降、JIT 优化变困难，性能自然就下来了。

---

## 四、稀疏数组：当数组变得"千疮百孔"

稀疏数组可以理解成"一个只有部分柜子有东西的储物柜"：

```js
const arr = [];
arr[100] = 'A';
```

实际上 `0 ~ 99` 都是空的。这就是**稀疏数组（Sparse Array）**，而"空位（hole）"就是理解 JavaScript 数组最关键的概念之一。

一个常见疑问：`new Array(1_000_000_000)` 会分配 10 亿个槽位、把内存撑爆吗？**不会。** 这只是把 `length` 设成了 10 亿，并没有实际创建任何属性。V8 不会预分配对应内存，访问未设置的索引只会返回 `undefined`。只有当你真正往里塞元素时，引擎才会按需分配——极度稀疏的话，直接进入字典模式，用哈希表存储你实际设置的那些索引。

那这些空位到底是怎么产生的？又该怎么理解它？我们先从 JS 创建数组说起。

---

## 五、创建数组的方式，决定了空位的命运

最安全的方式永远是字面量：

```js
const arr = [1, 2, 3];
```

连续、密集、规整，引擎最喜欢。

但 `new Array()` 有个经典坑——**单个数字参数会被当成长度，而不是元素：**

```js
const arr = new Array(5);
console.log(arr);
// [ <5 empty items> ]
```

注意，这里不是 `[undefined, undefined, undefined, undefined, undefined]`，而是 5 个空位（hole）。因为 `new Array(5)` 表示"创建长度为 5 的数组"，而不是"放入元素 5"。

多个参数才会被当元素：

```js
new Array(1, 2); // [1, 2]
```

这个设计历史包袱极重，所以后来 ES6 才新增 `Array.of(5); // [5]` 来解决歧义。经典对比：

```js
Array(5);    // 创建空位
Array.of(5); // 创建元素
```

现在你知道了——`new Array(n)` 是产生空位最常见的来源。那空位到底是什么？它跟 `undefined` 是一回事吗？

---

## 六、空位（hole）≠ undefined

这是整个数组体系里最容易误解的地方。

```js
const arr = new Array(3);
console.log(arr);
// [ <3 empty items> ]
```

很多人会以为这是 `[undefined, undefined, undefined]`，其实完全不是。

> 顺便说一句，ECMAScript 规范里其实没有"hole"这个词。规范用的是 **"empty"**（出现在 `ArrayLiteral` 语法中）和"属性不存在"。"hole"是开发者社区的通俗叫法，本文沿用。

先看一个视觉差异：

```js
JSON.stringify([undefined]);    // '[null]'
JSON.stringify(new Array(3));   // '[,,]'
```

`undefined` 被序列化成 `null`，但 hole 直接变成连续逗号——它根本不存在。用 `in` 运算符精确验证：

```js
0 in [undefined];  // true  —— 属性存在，值是 undefined
0 in new Array(3); // false —— 属性根本不存在
```

注意 `0 in arr` 内部仍然会转成 `'0' in arr`，因为数组索引本质还是字符串键。

这里差别巨大：

* **undefined**：属性存在，但值是 undefined
* **hole**：属性根本不存在

就像：`undefined` 是"柜子存在，但里面空的"；hole 是"柜子压根没装"。

用 `hasOwnProperty` 再验证一次：

```js
const arr = new Array(3);
arr.hasOwnProperty(0); // false

arr.fill(undefined);
arr.hasOwnProperty(0); // true
```

填充之后索引 0 才真正存在。

---

## 七、为什么 map 不会填满空位？

这是很多人第一次真正意识到"hole 根本不是 undefined"的瞬间。

```js
const arr = new Array(3);
arr.map((x, i) => {
  console.log(i);
  return 1;
});
// 什么都不会打印
```

为什么？因为 `map` 内部会先检查 `if (index in array)`，只有属性真实存在时回调才会执行。而 hole 连属性都没有，所以 `new Array(3).map(() => 1)` 最终仍然是 `[ <3 empty items> ]`。

既然 hole 和 `undefined` 不是同一回事，那不同的 API 遇到空位时会怎么处理呢？答案是——各说各话。

---

## 八、API 对空位的态度：各说各话

JavaScript 对 hole 的处理，其实充满历史包袱。

### 第一类：跳过 hole

`map`、`forEach`、`filter`、`reduce` 会直接跳过不存在的属性：

```js
new Array(3).forEach(console.log);
// 什么都不会输出
```

### 第二类：把 hole 当 undefined

ES6 后新增的一批 API（`for...of`、展开运算符、`Array.from`、`includes`）会把 hole 视为 `undefined`：

```js
[...new Array(3)];
// [undefined, undefined, undefined]

for (const x of new Array(3)) {
  console.log(x);
}
// undefined × 3
```

注意：`for...of` 不会跳过空位，它会访问空位并把它当作 `undefined`。

### 第三类：保留 hole 结构

`slice`、`concat` 不会处理元素，只是原样复制数组结构，所以 hole 会被保留下来。

### 一张表彻底搞懂

| API                                     | 对 hole 的态度     |
| --------------------------------------- | -------------- |
| `map` / `forEach` / `filter` / `reduce` | 跳过             |
| `indexOf` / `lastIndexOf`               | 跳过             |
| `includes`                              | 当作 `undefined` |
| `for...of`                              | 当作 `undefined` |
| 展开运算符                                   | 当作 `undefined` |
| `Array.from`                            | 当作 `undefined` |
| `slice` / `concat`                      | 保留 hole        |
| `join`                                  | 输出空字符串         |

除了 `new Array(n)`会产生空位 ，还有一个常见来源——`delete`。

---

## 九、delete 的坑：删了但 length 不变

看这个经典问题：

```js
const arr = [1, 2, 3];
delete arr[1];
console.log(arr);        // [1, empty, 3]
console.log(arr.length); // 3
```

很多人第一次都懵。原因很简单——`delete` 本质是删除对象属性，它不会重排索引、修改 length、挪动元素，只是单纯把属性删掉，于是索引 1 变成了 hole。

### delete vs undefined

这俩完全不是一回事：

* `delete arr[1]` → 结果是 hole（属性不存在）
* `arr[1] = undefined` → 属性仍然存在，值是 undefined

验证：`1 in arr` 的结果完全不同。

### 真正删除元素应该用 splice

```js
arr.splice(1, 1);
console.log(arr); // [1, 3]
```

它会删除元素、重排索引、修改 length。而且 splice 会保留已有 hole，但不会像 `delete` 那样主动制造空位。

既然 `delete` 处理不了 `length`，那反过来想——能不能直接操作 `length` 来控制数组呢？

---

## 十、length 的魔法：可读，也可写

很多人不知道 `length` 不是只读属性。

**缩短数组：**

```js
const arr = [1, 2, 3];
arr.length = 1;
console.log(arr); // [1]
```

后面的元素直接被删除。

**清空数组（经典技巧）：**

```js
arr.length = 0;
```

瞬间清空。如果元素没有其他引用，垃圾回收器会自动回收，不会内存泄漏。

增、删、length 都聊了，接下来是"改"——怎么修改数组里的元素？

---

## 十一、修改数组：原地改，还是返回新数组？

数组修改，本质只有两种思路。

### 第一种：原地修改（Mutable）

直接改原数组：

```js
const arr = [1, 2, 3];
arr[0] = 'A';
arr.fill(0);
arr.splice(1, 1);
```

特点：性能好、少创建对象，但副作用大。

### 第二种：返回新数组（Immutable）

原数组不变：

```js
const arr = [1, 2, 3];
const newArr = arr.map(x => x * 2);
```

特点：更适合函数式编程、更安全，但会占更多内存。

### ES2023 的不可变数组 API

以前 `reverse()`、`sort()`、`splice()` 都只能原地修改，想保留原数组还得先 `slice()` 一份。现在有了不可变版本：

```js
arr.toReversed();
arr.toSorted();
arr.toSpliced();
arr.with(0, 'A');
```

增删改都聊过了，就差"查"了——在数组里找一个元素，你用的是哪个方法？

---

## 十二、查找元素：includes 更符合直觉

### indexOf 的经典问题

```js
[NaN].indexOf(NaN); // -1
```

因为 `NaN !== NaN`，而 `indexOf` 用 `===` 比较。

### includes 更现代

```js
[NaN].includes(NaN); // true
```

因为它使用 **SameValueZero** 算法。而且 `includes` 对 hole 的行为也更直观：

```js
new Array(3).includes(undefined); // true
```

因为 hole 会被视为 `undefined`。

### 按条件查找：find

```js
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

users.find(u => u.id === 2);
// { id: 2, name: 'Bob' }
```

ES2023 还加了从后往前找的版本：`findLast()` 和 `findLastIndex()`。

查完了，接下来该遍历了。不过这里有个老坑——既然数组本质是对象，用对象的方式遍历会怎样？

---

## 十三、遍历数组：别再用 for...in 了

**for...in 的坑**

`for...in` 是给对象用的，会把可枚举属性全翻出来：

```js
const arr = [1, 2, 3];
arr.foo = 'bar';

for (let key in arr) {
  console.log(key); // 0, 1, 2, foo
}
```

连 `foo` 都跑出来了，就问你烦不烦。

**for...of：最干净的选择**

用 `for...of` 吧，纯粹、干净，只取元素值：

```js
for (const v of arr) {
  console.log(v); // 1, 2, 3
}
```

想要索引，带上 `entries()`：

```js
for (const [i, v] of arr.entries()) {
  console.log(i, v); // 0 1, 1 2, 2 3
}
```

它基于迭代器协议（数组内置了 `Symbol.iterator`），跳过空位（当作 `undefined`），也不会摸到自定义属性。这也意味着你可以让任何对象"可遍历"——只要给它加 `Symbol.iterator`。类数组转可遍历的底层原理就在这。

**forEach：能用，但别过度**

```js
arr.forEach((v, i) => {
  console.log(i, v);
});
```

看起来跟 `for...of` 差不多，但有两个区别：

- `forEach` 跳过空位，`for...of` 不跳过
- `forEach` 里 `break` 不了，`return` 只是跳过当前轮

所以需要提前终止的场景，老老实实用 `for...of` + `break`。

**什么时候用 for 循环？**

传统 `for` 循环在今天用得少了，但还有它的用武之地：

- 需要同时遍历多个数组（交错访问）
- 需要反向遍历且不想创建反转副本
- 对性能有极端要求（`for` 比 `for...of` 略快一丁点）

一般情况下，`for...of` 就够了。

遍历方式聊完了，但不管用哪种，性能终究取决于引擎怎么存你的数组。这就得深入 V8 的内部了。

---

## 十四、V8 的性能退化：单向下坡路

还记得第二节说的"引擎根据数组形态选择存储策略"吗？具体机制就是这个——V8 会根据数组形态，给数组打"元素类型标签（Elements Kind）"。

**最理想状态：`PACKED_SMI_ELEMENTS`**——密集（Packed）+ 小整数（SMI），性能极高。

一步步退化：

* 出现浮点数 `[1, 2, 3.5]` → 退化为 `PACKED_DOUBLE_ELEMENTS`
* 出现对象 `[1, {}, 3]` → 退化为 `PACKED_ELEMENTS`
* 出现 hole `[1, , 3]` → 退化为 `HOLEY_ELEMENTS`

注意——只要有空位就触发 HOLEY 退化，跟元素类型无关。

### 为什么 HOLEY 会慢？

PACKED 数组默认认为"每个位置都有值"，访问时不需要检查属性是否存在、不需要检查是不是 hole，JIT 很容易优化。但 HOLEY 数组每次读取都得额外检查"这个位置到底有没有元素"，这会增加分支判断、让 CPU 分支预测更困难、让 JIT 优化复杂化。

所以 HOLEY 慢，不只是因为存储稀疏，更因为**优化模型被破坏了**。

### 最终退化：Dictionary Mode

如果索引极度稀疏、属性乱挂、数组结构极不稳定，最终会退化为 `DICTIONARY_ELEMENTS`，进入字典模式。

**最关键的一点：这个退化基本是单向的，退化后通常不会恢复。** 所以数组越规整，引擎越容易优化。

但话说回来，V8 再怎么优化，普通 Array 终究是动态的、可以随便塞任何类型。如果你追求的是真正的连续内存呢？

---

## 十五、TypedArray：真正的"传统数组"

普通 Array 动态、可扩容、可混合类型、可出现 hole，本质上还是很"对象"。如果你真正需要连续内存、固定类型、二进制数据、高性能，就该用 TypedArray：

```js
const bytes = new Uint8Array(4);
```

它们不允许 hole、固定元素类型、更接近 C 数组，因此 WebGL、Canvas、音视频处理都会大量使用。

说完了"真正的数组"，再来看看那些"冒牌货"——长得像数组，但不是数组的东西。

---

## 十六、类数组：长得像数组，但不是数组

经典例子：

```js
function foo() {
  console.log(arguments.length);
  console.log(arguments[0]);
}
```

它有 `length`、有数字索引，但 `arguments.map` 不存在——因为它不是 Array，只是 **array-like（类数组）**。

常见类数组：`arguments`、`NodeList`、字符串。

转成真正数组：

```js
Array.from(arguments);   // ES6 最简洁
[...arguments];          // 展开运算符也行
[].slice.call(arguments); // 经典老写法
```

---

## 十七、尾声

早年的 JavaScript 里，数组几乎无所不能——当列表、当栈、当队列、当哈希表，什么都往里面塞。但后来 `Map`、`Set`、`TypedArray`、迭代器、Records & Tuples（未来）都在慢慢分担它的职责，数组正在回归它最擅长的角色。

其实 JavaScript 的 Array 从来都不是传统意义上的数组。它更像一种动态顺序容器、可优化对象、面向开发体验的数据结构，而不是 C 语言里的裸连续内存。这也是为什么 JavaScript 数组能同时拥有动态扩容、稀疏索引、自动 length、函数式 API、任意类型混存，以及——复杂到离谱的底层优化。

最后，把所有问题串起来。

为什么 JavaScript 数组这么"怪"？

> 因为它本质上是对象，只是在整数索引上开了"性能外挂"。

理解了这一点——hole、length、delete、稀疏数组、API 差异、V8 优化——全都豁然开朗。

是不是突然发现，数组这东西，其实比想象中复杂得多？

---

## 附录：Array 到底是构造函数还是类？

> 这是一个偏规范层面的问题，不影响日常开发，但如果你对语言设计感兴趣，可以继续往下看。

### `[[Call]]` 与 `[[Construct]]`

规范中有 `[[Call]]` → 可以直接调用；有 `[[Construct]]` → 可以 `new`：

```js
function Foo() {}
Foo();     // [[Call]]
new Foo(); // [[Construct]]
```

### class 为什么不能直接调用？

```js
class A {}
A(); // TypeError
```

因为 class 有 `[[IsClassConstructor]]` 内部标记，禁止被当成普通函数直接调用。

### 为什么 Array 不是 class？

因为 `Array()` 合法，说明它仍然是可调用函数，而不是真正的 class。

### 但为什么又能 extends Array？

因为 `extends` 并不要求父类一定是 class，它只要求拥有 `[[Construct]]`。所以普通构造函数、内建构造器、class 都可以被继承。

### 小结

工程里把 Array 当成"内建类"完全没问题。这些区分更多是规范设计和语言内部机制层面的概念。
