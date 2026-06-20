## PRD：`js-object-model-04.md` 成稿

### Problem Statement

笔记 `JavaScript/js-object-model-04.md` frontmatter，正文为空。它位于已写完的第 3 篇（ECMAScript 三层模型：Internal Method / Property Descriptor / Internal Slot）第 3 篇结尾已明确预告第 4 篇要回答"ECMAScript 给开发者留下了哪些入口"。这里只需要读第三篇第六章和第二章即可。

成稿参考源有1篇：旧 `Object` 系列的 `old-object-model-4.md`（[[Get]]/[[Set]]/[[Delete]] 完整机制、Receiver 原型链传递、Reflect 作 Internal Method 1:1 投影、Proxy 13 trap 三层模型、ArraySetLength 回滚）已覆盖第 4 篇 Behavior / Semantics 板块的实质素材。第 4 篇需把这一篇论点内化为新系列叙事正文，承接第 3 篇预告、收口三层开放程度切面。

只需要参考这两篇文章。

### Solution

按 grill-me 达成的八项设计决定写成第 4 篇：以"开放程度分层"为切面，Behavior（Proxy/Reflect，内嵌 Receiver）/ Semantics（Descriptor + Symbol 交界）/ State（品牌身份为轴）三层递进，第五部分用强/弱身份化解"`[[Prototype]]` 例外"的张力，第六部分以"开放边界画在可伪造与不可伪造品牌身份之间"上升式收尾。Behavior/Semantics 板块直接吸收 `old-object-model-4.md` 的核心论点（Receiver 传递、Reflect 1:1 投影、Proxy trap、Symbol 运行时协议），但不复述其算法逐步细节——第 4 篇做切面收口，不做机制逐行重述。

### User Stories

1. 作为新系列读者，我希望第 4 篇承接第 3 篇"三层模型"的预告，使我理解开发者能介入对象模型的多少。
2. 作为读者，我希望第 3 篇流程图里反复出现却从未解释的 `Receiver` 在第 4 篇得到回收。
3. 作为读者，我希望理解 Proxy/Reflect 是 Internal Method/trap 在 JS 层的 1:1 投影这一设计根基。
4. 作为读者，我希望理解 Symbol 协议为何是 Behavior 与 Semantics 的交界。
5. 作为读者，我希望理解 State 封闭的根本原因是品牌身份，而非任意限制。
6. 作为读者，我希望第 4 篇化解"原型可改却身份不可伪造"的表面矛盾。
7. 作为读者，我希望读到一个上升式收尾原理而非单纯分层总结。
8. 作为作者，我希望第 4 篇以 `old-object-model-4.md` 内化其论点为正文

### Implementation Decisions（grill-me 设计契约）

- **定位声明**：第一部分开头显式说明本篇不讲 Internal Method 完整算法（算法逐步细节已沉淀在 `old-object-model-4.md`），只讲开放程度切面。
- **第二部分 Behavior**：Proxy 总览(点出 13 trap 不逐个讲)→ 用 `obj.name = '张三'`（呼应第 3 篇开头例子）串 get/set/has/delete → Receiver 嵌入此处（原型链访问器"this 不丢失"为主，Reflect.get/set 第三/四参数 receiver 为辅）→ Reflect 定位为 Internal Method 的 1:1 投影/对偶。素材源自 `old-object-model-4.md` 的 Receiver/Reflect/Proxy 段落，内化为新系列叙事而非复述其代码注释。
- **第三部分 Semantics**：Descriptor 类（defineProperty/freeze/seal/preventExtensions/Accessor）+ Symbol（iterator/toPrimitive/hasInstance 各点对应 Internal Method）。
- **第四部分 State**：以品牌身份为轴，三层递进——不变量（PromiseState）→ 品牌（MapData，真假 Map）→ 内存安全（WeakMapData）；`[[Environment]]` 一句带过或删。可借 `old-object-model-4.md` 的 ArraySetLength 回滚（数组 Exotic Object 维护 length 一致性）作为"品牌身份/不变量"的具体佐证。
- **第五部分 少数例外**：`[[Prototype]]` + `[[Extensible]]` 合并，用强身份（专属槽、不可伪造）/弱身份（原型链、instanceof、可伪造）区分化解张力——开放的是弱身份/可恢复结构状态，印证而非削弱 State 论点。
- **第六部分 边界（高潮）**：保留分层图 ★★★★★/★★★☆☆/★☆☆☆☆（现象层）+ 叠加身份原理层（上升式收尾）：开放边界画在"可伪造"与"不可伪造品牌身份"之间。
- **frontmatter**：写 description 贴合新大纲

### Testing Decisions（质量验收缝）

- **无算法重述**：本篇不含 `[[Get]]/[[Set]]/[[Delete]]` 完整算法步骤（第 3 篇已示范 `[[Set]]`，逐步细节已在 `old-object-model-4.md` 沉淀，重述即三重复读）。对 `old-object-model-4.md` 只做论点内化，不逐行复刻其算法展开。
- **代码示例有效**：Receiver 两层场景、Proxy trap、品牌检查示例须为可运行 JS。
- **论点自洽**：State 品牌论点与第 5 部分 `[[Prototype]]` 例外不矛盾（强/弱身份区分成立）。
- **语调一致**：沿用第 1-3 篇的叙事风格（"追问"、blockquote 点睛、ASCII/mermaid 图、代码示例、章节承上启下）。








## 从理解模型到亲手操作模型

到这里，我们已经完整拆开了 ECMAScript 对象模型。

但理解模型只是第一步。

更有意思的问题是：

> 开发者究竟能参与这套模型多少？

ECMAScript 并没有把整个对象模型完全开放出来。

有些层次几乎完全可编程。

有些层次只能有限介入。

有些层次仍然牢牢掌握在引擎内部。

例如：

- Proxy 与 Reflect，可以参与对象行为；
    
- defineProperty，可以修改属性语义；
    
- Symbol.iterator、Symbol.toPrimitive，可以让对象接入特定协议；
    
- `[[Prototype]]` 是少数允许读写的内部槽；
    
- 而 PromiseState、MapData 等内部状态，则始终封闭。
    

于是，对象模型会呈现出另一幅图景：

```text
Behavior
↑
高度开放


Semantics
↑
部分开放


State
↑
基本封闭
```

下一篇，我们就沿着这个视角继续看：

> ECMAScript 给开发者留下了哪些入口？

> Proxy、Reflect、Descriptor 与 Symbol，又是如何成为对象协议在 JavaScript 层面的投影。


# ArraySetLength 具有”回滚”能力

真正让 `ArraySetLength` 精彩的，并不是删除元素，而是规范为了保证数组始终保持一致，专门设计的一套**回滚（Rollback）机制**。

来看一个例子：

```javascript
const arr = [1, 2, 3];

Object.defineProperty(arr, “2”, {
  configurable: false,
});
```

现在 `Property “2”` 已经不能再被删除。

接着执行：

```javascript
arr.length = 1;
```

如果按最朴素的思路，过程似乎是：  
`length = 1` → 删除索引 2 → 结束。  
但规范并不会这样做。真正的执行顺序是：

1. 收到新的 `length` Property Descriptor
2. 进入 `ArraySetLength`
3. 尝试删除 `Property “2”`
4. 删除失败 → 终止 → 恢复 `length`

删除失败之后，规范会立即终止整个算法。如果继续把 `length = 1` 写回数组，对象就会进入非法状态：`length = 1`，但 `Property “2”` 仍然存在。这违反了数组的基本约束，整个过程更像数据库事务（Transaction）：所有步骤成功，才提交结果。

#### 回滚的本质：Descriptor 的约束与数组的一致性

为什么删除会失败？原因在 `Object.defineProperty(arr, “2”, { configurable: false })` 之后，对应 Property Descriptor 的 `[[Configurable]]` 变成了 `false`。删除 Property 时，删除算法会首先检查 `[[Configurable]]`，只有 `true` 才允许——真正控制删除是否成功的，始终是 **Property Descriptor**，而不是数组。

那为什么删除失败后必须回滚，而不是”保留 `length = 1`、剩下的 Property 留着”？因为对于数组，`length` 还承担着描述索引边界的职责。如果 `length = 1` 而 `Property “2”` 仍然存在，对象就进入了自相矛盾的状态——规范不允许这种不一致。

因此 `ArraySetLength` 最核心的目标并不是维护 `length` 属性本身，而是维护**整个数组对象的一致性（Consistency）**。

#### 理解 ArraySetLength，其实就是理解 Internal Method

回头再看 `arr.length = 2`，整个过程已经非常清楚了。  
JavaScript 代码 `arr.length = 2` 并不是“修改一个数字”，真正发生的是：

```
JavaScript 语法
   ↓
[[Set]]
   ↓
构造新的 Property Descriptor
   ↓
Array [[DefineOwnProperty]]
   ↓
ArraySetLength
   ↓
检查合法性
   ↓
必要时删除 Property
   ↓
更新 length Property
```

可以看到，整个过程中真正负责判断、删除、回滚、更新 `length` 的，全部都是 `Array` 的 `[[DefineOwnProperty]]` 与 `ArraySetLength`——真正执行规则的是 Internal Method。

---

## 一次属性读取：`[[Get]]` 的完整机制

上一篇中，我们已经接触过 `[[Get]]` 的基本流程。这一篇，我们把它拆开来看——特别是那些容易被忽略的细节。

### 核心流程回顾

当 JavaScript 执行 `obj.x` 时，规范描述的是：

```text
obj.x
   ↓
obj.[[Get]]("x", Receiver)
```

`[[Get]]` 的核心流程：

```text
[[Get]](P, Receiver)
   ↓
查找 Property Descriptor
   ↓
Data Property？ → 返回 [[Value]]
Accessor Property？ → Call(getter, Receiver)
没有找到？ → 沿 [[Prototype]] 继续执行 [[Get]]
```

这个流程中，有几个关键细节值得展开。

### `Object.[[Get]]` 与 `Descriptor.[[Get]]`：同一个名字，完全不同的含义

阅读 ECMAScript 规范时，最容易混淆的就是 `[[Get]]` 的双重身份。

当 `[[Get]]` 写在对象层面：

```text
Object.[[Get]]
```

它指的是 **Internal Method**——对象响应"读取属性"这一操作的行为。

当 `[[Get]]` 写在 Property Descriptor 层面：

```text
Descriptor.[[Get]]
```

它指的是 **getter 函数**——访问器属性中保存的那个函数。

一个是"对象如何响应读取"，另一个是"属性被读取时执行什么代码"。名字相同，职责完全不同。

分辨的办法很简单：看 `[[Get]]` 出现在哪里。属于对象的，是 Internal Method；属于 Descriptor 的，是 getter 函数。

### Prototype Lookup 只是 `[[Get]]` 的递归过程

当属性不在对象自身时，`[[Get]]` 并不会立即返回 `undefined`。它会读取 `[[Prototype]]`，然后在原型对象上再次调用 `[[Get]]`。

```text
child.[[Get]]("name", child)
   ↓
没找到 Descriptor
   ↓
读取 [[Prototype]]
   ↓
parent.[[Get]]("name", child)
   ↓
找到 Descriptor → 返回结果
```

注意这里的关键认知：**并没有一个独立的"Prototype Lookup"机制。** 所谓的原型链查找，只是 `[[Get]]` 在不同对象之间的递归调用。

这意味着 Property、Descriptor、Prototype 并不是三套独立的知识。它们是**同一个属性访问过程中的不同阶段**。

---

## Receiver：为什么 getter 中的 `this` 不会丢失？

上面的 `[[Get]]` 签名中，我们一直忽略了一个参数：**Receiver**。这是理解整个对象模型中最精妙的设计之一。

### 问题

```js
const parent = {
  get name() {
    return this._name;
  }
};

const child = Object.create(parent);
child._name = "child";

child.name; // "child"
```

`name` 明明定义在 `parent` 上。getter 执行时，`this` 指向谁？

直觉可能认为 `this === parent`。但实际结果是 `"child"`——说明 `this === child`。

### `[[Get]]` 真正接收两个参数

规范中 `[[Get]]` 的完整签名是：

```text
[[Get]](P, Receiver)
```

- `P`：要读取的属性名
- `Receiver`：最初发起这次属性访问的对象

当执行 `child.name` 时：

```text
child.[[Get]]("name", child)
```

Receiver 就是 `child`。

### Receiver 在原型链上传递

当 `[[Get]]` 在 `child` 上没有找到 `"name"`，它会继续在 `parent` 上执行 `[[Get]]`：

```text
parent.[[Get]]("name", child)
```

注意第二个参数——**仍然是 `child`**。

对象可以变化，原型可以变化，但 Receiver 从头到尾都不会变化。它永远是**最初发起这次访问的对象**。

### getter 执行时，Receiver 成为 `this`

找到 Accessor Descriptor 后，规范执行：

```text
Call(getter, Receiver)
```

由于 `Receiver === child`，所以 `this === child`。于是 `return this._name` 读取的是 `child._name`，最终得到 `"child"`。

整个流程：

```text
child.name
   ↓
child.[[Get]]("name", child)
   ↓
没找到 Descriptor
   ↓
parent.[[Get]]("name", child)
   ↓
找到 Accessor Property
   ↓
Call(getter, child)
   ↓
getter 内部：this === child
   ↓
返回 child._name → "child"
```

### 为什么必须这样设计？

getter 描述的是"这个属性应该如何计算"，而不是"这个属性属于哪个对象"。

```js
const point = {
  get x() { return this._x; }
};

const p1 = Object.create(point);
const p2 = Object.create(point);

p1._x = 10;
p2._x = 20;

p1.x; // 10
p2.x; // 20
```

如果 `this` 永远指向 `point`，那 getter 就完全失去了继承的意义——所有对象读到的都是同一个值。

Receiver 保证的是：

> **行为共享，状态独立。**

getter 定义在原型上（共享行为），但 `this` 指向最初发起访问的对象（独立状态）。这是 JavaScript 原型继承能够工作的关键之一。

### Receiver 不只是 getter 使用

`[[Set]]` 同样接收 Receiver。setter 里的 `this` 也必须指向最初发起写入的对象：

```js
const parent = {
  set name(value) {
    this._name = value;
  }
};

const child = Object.create(parent);
child.name = "Tom";
// setter 中的 this === child，不是 parent
```

Receiver 是整个属性访问模型的一部分，不是 getter 的特殊机制。

---

## 一次属性写入：`[[Set]]` 的完整机制

### 核心流程

当 JavaScript 执行：

```js
student.name = "Jerry";
```

规范描述的是：

```text
student.[[Set]]("name", "Jerry", Receiver)
```

语言并没有要求对象"把这个值改掉"。语言只是说：**请处理这次写入。** 至于最终是修改属性、调用 setter、创建新属性，还是直接拒绝——都是 `[[Set]]` 自己决定的。

### 找到 Descriptor，判断类型

和 `[[Get]]` 一样，`[[Set]]` 的第一步是查找 Property Descriptor，然后判断类型。

#### Data Property：检查 `[[Writable]]`

如果是 Data Property：

```text
[[Set]]
   ↓
找到 Descriptor
   ↓
Data Property
   ↓
检查 [[Writable]]
   ↓
true → 更新 [[Value]]
false → 拒绝修改
```

这里有一个容易被忽略的机制问题。

很多人会说"`writable: false` 阻止了赋值"。这句话没有错，但它描述的是**结果**，不是**机制**。

`false` 本身只是一个布尔值。它不会自己阻止任何事情，它甚至不知道 JavaScript 正在执行赋值。真正作出决定的是 `[[Set]]`——它读取了 `[[Writable]]`，然后决定拒绝修改。

再一次体现了职责划分：

> Property Descriptor **描述规则**。
>
> Internal Method **执行规则**。

#### Accessor Property：执行 setter

如果是 Accessor Property：

```text
[[Set]]
   ↓
找到 Descriptor
   ↓
Accessor Property
   ↓
取得 setter
   ↓
Call(setter, Receiver, value)
```

赋值做的事情不是"修改 Property"，而是"执行 setter"。Accessor Property 没有 `[[Value]]`——它保存的是 `[[Get]]` 和 `[[Set]]` 两个函数。

### 没有找到属性时：原型链上的 setter 检查

`[[Set]]` 比 `[[Get]]` 更复杂的一个关键原因是：**没找到属性并不等于"立即创建新属性"。**

```js
const parent = {
  set name(value) {
    console.log("setter:", value);
  }
};

const child = Object.create(parent);
child.name = "Tom";
```

如果 `[[Set]]` 在 `child` 上没找到属性就立即创建新属性，那 `parent` 上的 setter 就永远不会执行。

实际上，规范会先沿原型链寻找是否有 setter。如果找到了，`[[Set]]` 会执行 `Call(setter, Receiver, value)`，而不是创建新属性。

只有当原型链上也没有找到任何访问器时，`[[Set]]` 才会通过 `[[DefineOwnProperty]]` 在当前对象上创建新属性。

### `[[Set]]` 的完整决策树

可以看到，`[[Set]]` 远不是一个简单的"修改值"操作：

```text
[[Set]](P, value, Receiver)
   ↓
查找 Property Descriptor
   ↓
   ├─ 在当前对象找到了
   │    ├─ Data Property
   │    │    └─ 检查 [[Writable]] → 允许则更新，不允许则拒绝
   │    └─ Accessor Property
   │         └─ 执行 Call(setter, Receiver, value)
   │
   └─ 没找到 → 沿原型链继续查找
        ├─ 原型链上找到了 Accessor Property
        │    └─ 执行 Call(setter, Receiver, value)
        └─ 原型链上也没有 Accessor
             └─ Reflect.set 创建新属性（通过 [[DefineOwnProperty]]）
```

这就是为什么前一篇强调：**赋值不是修改 Property，而是对象收到一次写入请求后按规则响应。**

---

## `[[Delete]]`：删除属性到底发生了什么？

理解了 `[[Get]]` 和 `[[Set]]` 的完整机制，再看 `[[Delete]]` 就会发现，它遵循的仍然是同一套设计模式。

### 核心流程

```js
delete obj.x
```

规范描述的是：

```text
obj.[[Delete]]("x")
```

注意，`[[Delete]]` 不需要 Receiver——删除操作不存在"最初发起者"的问题。

流程：

```text
[[Delete]](P)
   ↓
查找 Property Descriptor
   ↓
   ├─ 没找到 → 返回 true（消歧：属性本来就不存在，删除成功）
   │
   └─ 找到了
        ├─ [[Configurable]] = false → 返回 false 或抛出 TypeError
        └─ [[Configurable]] = true → 执行删除，返回 true
```

### `[[Configurable]]` 才是删除的真正开关

很多人以为 `delete` 的作用是"移除属性"。其实更准确地说：

> `[[Delete]]` 先读取 `[[Configurable]]`，决定是否允许删除。

如果 `[[Configurable]]` 为 `false`：

```js
const obj = {};
Object.defineProperty(obj, "x", {
  configurable: false
});

delete obj.x; // false（非严格模式）或 TypeError（严格模式）
```

属性并没有被移除。因为 `[[Configurable]] = false` 告诉 `[[Delete]]`："这个属性不允许被删除"。

再一次看到同样的模式：**Descriptor 描述规则，Internal Method 执行规则。**

### `[[Delete]]` 不会查原型链

与 `[[Get]]` 和 `[[Set]]` 不同，`[[Delete]]` 只作用于对象自身。

```js
const parent = { x: 1 };
const child = Object.create(parent);

delete child.x; // true — 但 child 本来就没有 x
child.x;        // 1 — parent 上的 x 仍然存在
```

删除只在对象的自身属性上操作。原型链上的属性不受影响，也不能通过 `delete` 删除。

### 严格模式对 `[[Delete]]` 的影响

这是一个容易被忽略的细节。在严格模式下：

```js
"use strict";
const obj = {};
Object.defineProperty(obj, "x", {
  configurable: false
});

delete obj.x; // TypeError
```

严格模式下，`[[Delete]]` 返回 `false` 时会直接抛出 `TypeError`。而非严格模式下，它只是静默返回 `false`。

这其实揭示了更深层的一点：**严格模式改变了 `[[Delete]]` 的错误处理策略，但并没有改变 `[[Delete]]` 本身的逻辑。** 内部算法仍然是读取 `[[Configurable]]`，判断是否允许删除。区别只在于：失败时，是返回 `false` 还是抛出异常。

---

## Strict Mode 与 Internal Method

严格模式的影响远不止 `[[Delete]]`。它改变了多个 Internal Method 的行为：

### `[[Set]]` 在严格模式下的表现

非严格模式：

```js
const obj = {};
Object.defineProperty(obj, "x", {
  value: 1,
  writable: false
});

obj.x = 2; // 静默失败，不报错
obj.x;     // 1
```

严格模式：

```js
"use strict";
obj.x = 2; // TypeError
```

同样，**`[[Set]]` 的核心逻辑没有变**——它仍然是读取 `[[Writable]]`，发现为 `false`，然后拒绝修改。区别只在于拒绝的方式：静默返回 `false`，还是抛出 `TypeError`。

### `[[DefineOwnProperty]]` 在严格模式下的表现

严格模式还影响 `Object.defineProperty` 的某些失败场景。不过，由于 `Object.defineProperty` 本身就是显式调用，大多数失败情况无论严格与否都会抛出 `TypeError`。

### 关键认知

严格模式并没有引入新的 Internal Method，也没有改变任何 Internal Method 的算法逻辑。它改变的是**失败时的响应方式**：

```text
非严格模式：静默失败（返回 false 或 undefined）
严格模式：抛出 TypeError
```

这意味着严格模式是**语言层面的选择**，而不是对象模型层面的改变。对象的行为规则始终由 Internal Method 定义，严格模式只是决定了违反规则时应该如何报告。

---

## 闭合的行为集合

普通对象拥有完整的一组 Essential Internal Methods：

| Internal Method | 对应语言操作 |
|---|---|
| `[[Get]]` | `obj.x` |
| `[[Set]]` | `obj.x = value` |
| `[[Delete]]` | `delete obj.x` |
| `[[HasProperty]]` | `"x" in obj` |
| `[[DefineOwnProperty]]` | `Object.defineProperty()` |
| `[[OwnPropertyKeys]]` | `Reflect.ownKeys()` |
| `[[GetOwnProperty]]` | `Object.getOwnPropertyDescriptor()` |
| `[[GetPrototypeOf]]` | `Object.getPrototypeOf()` |
| `[[SetPrototypeOf]]` | `Object.setPrototypeOf()` |
| `[[IsExtensible]]` | `Object.isExtensible()` |
| `[[PreventExtensions]]` | `Object.preventExtensions()` |


注意一个重要事实：**对象能够响应的操作是有限的。** 没有 `[[Clone]]`，没有 `[[Copy]]`，没有 `[[Serialize]]`。JavaScript 语言从未定义过这些操作，所以对象也不需要响应它们。

这意味着 Internal Method 构成的行为接口是**闭合的（closed）**。以后学习 Proxy 时，你会发现 Proxy 能拦截的，也恰好只有这些 Internal Method。

---

## Reflect：Internal Methods 的外显版本

到目前为止我们一直在说：Internal Methods 是对象与语言之间的行为接口，但开发者无法直接调用它们。

```js
obj.x       // 触发 [[Get]]
obj.x = 1   // 触发 [[Set]]
delete obj.x // 触发 [[Delete]]
```

问题在于：如果我们想**显式地**调用这些行为，而不是通过语法隐式触发，该怎么办？

ECMAScript 的答案是：**Reflect API。**

### Reflect 不是"另一套工具函数"

很多人第一次看到 Reflect 会以为它只是一组新的工具函数。但从我们已经建立的模型来看，正确的理解应该是：

> **Reflect 是 Internal Methods 在语言层面的映射。**

```text
Internal Method（规范层）
        ↓
Reflect（语言层映射）
        ↓
对象行为
```

`Reflect.get(obj, "x")` 并不是"重新实现一次属性读取"。它等价于：

```text
obj.[[Get]]("x", obj)
```

只不过 Internal Method 无法在 JavaScript 代码中直接调用，而 Reflect 提供了一个等价的函数接口。

### 为什么需要 Reflect？

如果只是为了触发 `[[Get]]`，确实可以直接写 `obj.x`。但 Reflect 解决了三个更深层的问题。

#### 1. 统一返回值语义

```js
obj.x = 1;  // 失败时：可能抛错，也可能静默失败
```

```js
Reflect.set(obj, "x", 1);  // 始终返回 true 或 false
```

Reflect 把"控制流问题"转化成"数据问题"。这在组合 Proxy 时非常关键——handler 需要返回布尔值。

#### 2. 保留 Receiver 语义

这是 Reflect 最重要的用途。

```js
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    return target[key];       // ❌ 丢失了 Receiver
  }
});
```

```js
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver); // ✅ 保留 Receiver
  }
});
```

`target[key]` 会重新发起一次 `[[Get]]`，但 Receiver 变成了 `target`——原始的 Receiver 丢失了。而 `Reflect.get` 会完整保留 `[[Get]](P, Receiver)` 的语义。

这一点直接呼应了前面关于 Receiver 的整个讨论：属性最终在哪里找到并不重要，重要的是**谁最初发起了这次访问**。

#### 3. 提供"不会破坏语义的默认路径"

如果不使用 Reflect，在 Proxy handler 中手动模拟默认行为：

```js
if (key in target) {
  return target[key];
}
```

这段代码永远无法正确处理 getter、原型链、Receiver 绑定和 Exotic Object 行为。Reflect 提供了一条"不会破坏语义"的默认路径：

> **Reflect 的每个方法，都等价于对应的 Internal Method 的默认实现。**

---

## Proxy：不是包装器，而是 Internal Method 的替换

下一篇会深入讲解 Proxy 的完整机制。这里先建立最关键的认知框架。

### Proxy 拦截的不是语法，而是行为接口

很多人第一次学 Proxy 时会写成：

```js
proxy.x  // 看起来拦截的是"属性访问语法"
```

但规范层面是：

```text
proxy.x
   ↓
Proxy.[[Get]]("x", proxy)
   ↓
handler.get(target, "x", receiver)
   ↓
target.[[Get]]("x", ...)
   ↓
返回结果
```

Proxy 拦截的是 **Internal Method**，不是 JavaScript 语法本身。语言触发 `[[Get]]`，Proxy 在 `[[Get]]` 与目标对象之间插入了 handler。

### 三层模型

现在可以把整个体系收束成三层：

```text
Ordinary Object
   Internal Methods = 规范默认实现（OrdinaryGet、OrdinarySet……）

Exotic Object
   部分 Internal Methods = 引擎自定义实现

Proxy Object
   Internal Methods = 用户定义实现（handler.get、handler.set……）
```

| 类型 | Internal Method 来源 | 行为 |
|---|---|---|
| Ordinary | 规范默认 | 可预测的标准行为 |
| Exotic | 引擎/类型自定义 | 特殊行为（数组维护 length、字符串拒绝修改等） |
| Proxy | 用户定义 | 任意行为 |

三者共享同一套行为接口，区别只在实现的来源。

### Proxy 与 Receiver

前面关于 Receiver 的推导，在 Proxy 中直接体现为最常见的坑：

```js
// ❌ 错误写法
const proxy = new Proxy(target, {
  get(target, key) {
    return target[key];
  }
});

// ✅ 正确写法
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver);
  }
});
```

原因已经完全清楚了：`target[key]` 会重新发起 `[[Get]]`，丢失原始 Receiver；`Reflect.get(target, key, receiver)` 则完整保留 `[[Get]](P, Receiver)` 的调用语义，确保 getter 中的 `this` 不会断裂。

---

## 回顾：Internal Method 如何统一一切

这一篇最重要的信息可以浓缩为一点：

> **所有对象操作，最终都归结为 Internal Method 的调用。**

```text
JavaScript 语法
   ↓
触发 Internal Method
   ↓
读取 Property Descriptor（描述规则）
读取 Internal Slot（当前状态）
   ↓
执行规范算法
   ↓
得到最终行为
```

读取属性 → `[[Get]]`
写入属性 → `[[Set]]`
删除属性 → `[[Delete]]`

每个 Internal Method 都遵循同一套模式：接收请求，读取 Descriptor 和 Slot，执行算法，返回结果。只是不同对象可以有不同的实现。

而 Receiver 的设计保证了一个微妙但关键的语义：**无论属性最终在原型链的哪一层找到，`this` 始终指向最初发起访问的对象。**

Reflect 把 Internal Methods 的语义暴露给开发者。Proxy 让开发者可以替换 Internal Methods 的实现。

它们看似是不同的 API，但本质上服务于同一个对象模型：

```text
Internal Method     →  规范定义的行为接口
Reflect              →  Internal Method 的语言层映射
Proxy                →  Internal Method 的用户自定义替换
```

理解了这一层，再看任何内建对象的行为——数组维护 length、字符串对象拒绝修改、Proxy 拦截操作——都会发现它们遵循同一套设计：

> **同一个接口，不同的实现。**




---
title: JavaScript 对象模型（四）：ECMAScript 给开发者开放了多少对象能力？
created: 2023-06-05
updated: 2026-06-19
tags:
  - JavaScript
  - ECMAScript
  - Object
  - Receiver
  - Reflect
  - Proxy

description: 从开放程度切面看 ECMAScript 对象模型：Behavior 通过 Proxy/Reflect 高度可编程，Semantics 通过 Property Descriptor 与 Symbol 协议部分可介入，State 则以品牌身份为边界基本封闭。理解可伪造与不可伪造身份之间的开放边界。
status: evergreen
series:
  - name: JavaScript Object Model
    index: 4
---

## 一、从“理解模型”到“操作模型”

在上一篇，我们拆解了 ECMAScript 对象模型的三层结构：**Internal Method（行为）**、**Property Descriptor（语义）** 与 **Internal Slot（状态）**。结尾留下了一个问题：

> **ECMAScript 给开发者留下了哪些入口？**

本篇就来回答这个问题。

我们会发现，这三层并不是同等开放的。

| 层次 | 开放程度 | 核心入口 |
|------|----------|----------|
| Behavior | ★★★★★ | Proxy / Reflect |
| Semantics | ★★★☆☆ | Property Descriptor / Symbol 协议 |
| State | ★☆☆☆☆ | 基本封闭，仅有少数例外 |

接下来，我们就沿着这个分层，一层一层看开发者究竟能介入到哪里，以及为什么有些部分可以开放，有些部分必须封闭。

---

## 二、Behavior 层：Proxy 与 Reflect —— 行为接管

Behavior 层是三层中最开放的。ECMAScript 在这里给了开发者一把“手术刀”：Proxy 和 Reflect。

### Reflect 不是"另一套工具函数"

很多人第一次看到 Reflect 会以为它只是一组新的工具函数。但从我们已经建立的模型来看，正确的理解应该是：

> **Reflect 是 Internal Methods 在语言层面的映射。**

```text
Internal Method（规范层）
        ↓
Reflect（语言层映射）
        ↓
对象行为
```

`Reflect.get(obj, "x")` 并不是"重新实现一次属性读取"。它等价于：

```text
obj.[[Get]]("x", obj)
```

只不过 Internal Method 无法在 JavaScript 代码中直接调用，而 Reflect 提供了一个等价的函数接口。

### 为什么需要 Reflect？

如果只是为了触发 `[[Get]]`，确实可以直接写 `obj.x`。但 Reflect 解决了三个更深层的问题。

#### 1. 统一返回值语义

```js
obj.x = 1;  // 失败时：可能抛错，也可能静默失败
```

```js
Reflect.set(obj, "x", 1);  // 始终返回 true 或 false
```

Reflect 把"控制流问题"转化成"数据问题"。这在组合 Proxy 时非常关键——handler 需要返回布尔值。

#### 2. 保留 Receiver 语义

这是 Reflect 最重要的用途。

```js
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    return target[key];       // ❌ 丢失了 Receiver
  }
});
```

```js
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver); // ✅ 保留 Receiver
  }
});
```

`target[key]` 会重新发起一次 `[[Get]]`，但 Receiver 变成了 `target`——原始的 Receiver 丢失了。而 `Reflect.get` 会完整保留 `[[Get]](P, Receiver)` 的语义。

这一点直接呼应了前面关于 Receiver 的整个讨论：属性最终在哪里找到并不重要，重要的是**谁最初发起了这次访问**。

#### 3. 提供"不会破坏语义的默认路径"

如果不使用 Reflect，在 Proxy handler 中手动模拟默认行为：

```js
if (key in target) {
  return target[key];
}
```

这段代码永远无法正确处理 getter、原型链、Receiver 绑定和 Exotic Object 行为。Reflect 提供了一条"不会破坏语义"的默认路径：

> **Reflect 的每个方法，都等价于对应的 Internal Method 的默认实现。**

---

## Proxy：不是包装器，而是 Internal Method 的替换


### Proxy 拦截的不是语法，而是行为接口

很多人第一次学 Proxy 时会写成：

```js
proxy.x  // 看起来拦截的是"属性访问语法"
```

但规范层面是：

```text
proxy.x
   ↓
Proxy.[[Get]]("x", proxy)
   ↓
handler.get(target, "x", receiver)
   ↓
target.[[Get]]("x", ...)
   ↓
返回结果
```

Proxy 拦截的是 **Internal Method**，不是 JavaScript 语法本身。语言触发 `[[Get]]`，Proxy 在 `[[Get]]` 与目标对象之间插入了 handler。

### 三层模型

现在可以把整个体系收束成三层：

```text
Ordinary Object
   Internal Methods = 规范默认实现（OrdinaryGet、OrdinarySet……）

Exotic Object
   部分 Internal Methods = 引擎自定义实现

Proxy Object
   Internal Methods = 用户定义实现（handler.get、handler.set……）
```

| 类型 | Internal Method 来源 | 行为 |
|---|---|---|
| Ordinary | 规范默认 | 可预测的标准行为 |
| Exotic | 引擎/类型自定义 | 特殊行为（数组维护 length、字符串拒绝修改等） |
| Proxy | 用户定义 | 任意行为 |

三者共享同一套行为接口，区别只在实现的来源。

### Proxy 与 Receiver

前面关于 Receiver 的推导，在 Proxy 中直接体现为最常见的坑：

```js
// ❌ 错误写法
const proxy = new Proxy(target, {
  get(target, key) {
    return target[key];
  }
});

// ✅ 正确写法
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver);
  }
});
```

原因已经完全清楚了：`target[key]` 会重新发起 `[[Get]]`，丢失原始 Receiver；`Reflect.get(target, key, receiver)` 则完整保留 `[[Get]](P, Receiver)` 的调用语义，确保 getter 中的 `this` 不会断裂。

---

Proxy：不是包装器，而是 Internal Method 的替换
很多人第一次学 Proxy，会觉得它拦截了语法。

js
proxy.x  // 看起来像拦截了 `.x` 这个语法
但在规范层面，Proxy 拦截的是 Internal Method。当引擎执行 proxy.x，真正发生的是：

text
proxy.x
  ↓
proxy.[[Get]]("x", proxy)           // 触发 Internal Method
  ↓
handler.get(target, "x", receiver)  // Proxy 把调用转发给 handler
  ↓
return Reflect.get(target, "x", receiver) // handler 再调用真正的 [[Get]]
JavaScript 语法从未被拦截，语法只是触发了 [[Get]]。Proxy 所做的，是在 [[Get]] 与目标对象之间插入了一层用户定义的实现。

这就把对象分成了三类：

对象类型	Internal Method 来源
Ordinary Object	规范默认实现（OrdinaryGet / OrdinarySet …）
Exotic Object（Array 等）	引擎自定义实现
Proxy Object	用户定义实现
三者共享同一套行为接口——[[Get]]、[[Set]]、[[Delete]]、[[HasProperty]] 等十几个 Internal Method——区别只在于“谁来实现”。

13 个 Trap：行为接口的投影
规范定义了 Proxy 可以拦截的 13 个 trap。这个数字不是随意的，它精确对应着对象行为接口的集合。没有 trap("clone")，因为 [[Clone]] 根本就不是 Internal Method。你所能拦截的，恰好是语言对对象的全部行为要求。

13 个 trap，就是 Internal Method 集合在 JavaScript 层的 1:1 投影。

### 2.1 Proxy 拦截的不是语法，而是行为接口

回到最熟悉的例子：

```javascript
obj.name = '张三';
```

第 3 篇告诉我们，这条语句在规范层会触发：

```text
obj.[[Set]]("name", "张三", Receiver)
```

`[[Set]]` 是一个 Internal Method，它描述的是对象对“设置属性”这一操作的响应方式。普通对象走默认实现 `OrdinarySet`，Proxy 则会先查看用户有没有提供 `set` trap。

```text
proxy.name = '张三'
    ↓
Proxy.[[Set]]("name", "张三", proxy)
    ↓
handler.set(target, "name", "张三", receiver)
```

注意这里的关键认知：**Proxy 拦截的不是 `=` 这条语法，而是 `[[Set]]` 这个行为接口。** 语法只是触发 Internal Method 的入口，真正被替换的是对象的行为实现。

Proxy 一共提供了 13 个 trap：`get`、`set`、`has`、`deleteProperty`、`apply`、`construct`、`getOwnPropertyDescriptor`、`defineProperty`、`getPrototypeOf`、`setPrototypeOf`、`preventExtensions`、`isExtensible`、`ownKeys`。它们几乎一一对应 Essential Internal Methods。本文不会逐个讲解每个 trap，因为理解了下面这个结构，剩下的只是名字不同：

```text
语言语法
    ↓
触发 Internal Method
    ↓
Proxy 用同名 trap 替换默认实现
    ↓
可选择转发给 target
```

> **Proxy 的能力本质：把对象的行为接口从“规范默认实现”切换成“用户自定义实现”。**

Reflect：Internal Method 的 1:1 对偶
如果说 Proxy 是 Internal Method 的“替换”，那 Reflect 就是 Internal Method 的“外显”。

Reflect.get(obj, "x") 并不是“重新实现了一次属性读取”。在规范语义上，它等价于：

text
obj.[[Get]]("x", obj)
只是 [[Get]] 无法在 JavaScript 代码中直接调用，Reflect 提供了一条语言层面的等价路径。

Internal Method	Reflect 方法
[[Get]]	Reflect.get()
[[Set]]	Reflect.set()
[[Delete]]	Reflect.deleteProperty()
[[HasProperty]]	Reflect.has()
[[DefineOwnProperty]]	Reflect.defineProperty()
[[GetPrototypeOf]]	Reflect.getPrototypeOf()
…	…
Reflect 的每个方法，都与对应的 Internal Method 共享同一套语义和返回值约定。这产生了两个深层价值：

一、把控制流问题转化为数据问题。

js
// 语法方式：失败可能抛出异常，也可能静默失败
obj.x = 1;

// Reflect 方式：始终返回布尔值
Reflect.set(obj, "x", 1);  // true 或 false
在 Proxy handler 里，你必须返回布尔值来告知引擎操作是否成功。Reflect 把原先混合了“异常”和“静默失败”的控制流，统一成了数据返回值。

二、提供一条“不破坏语义”的默认路径。

如果你在 Proxy handler 里这样写：

js
// ❌ 丢失了 Receiver 语义
get(target, key) {
  return target[key];
}
target[key] 会触发一次全新的 [[Get]]，Receiver 变成了 target——这直接破坏了 getter 中 this 的正确指向。

正确的写法是：

js
// ✅ 完整保留 [[Get]](P, Receiver) 语义
get(target, key, receiver) {
  return Reflect.get(target, key, receiver);
}
而这引出了我们在上一篇流程图中反复出现却从未解释的参数：Receiver

### 2.2 Receiver：为什么原型链上的 getter 不会丢失 `this`？

第 3 篇的流程图里反复出现了一个参数：`Receiver`。但当时我们只是说“它会被传递下去”，没有解释它到底是什么。现在回收这个伏笔。

考虑下面这个例子：

```javascript
const parent = {
  get name() {
    return this._name;
  }
};

const child = Object.create(parent);
child._name = 'child';

child.name; // "child"
```

`name` 定义在 `parent` 上，但 `child.name` 读到的却是 `child._name`。这意味着 getter 执行时，`this` 指向 `child`。

ECMAScript 能做到这一点，靠的就是 `Receiver`。

`[[Get]]` 的完整签名是：

```text
[[Get]](P, Receiver)
```

当执行 `child.name` 时，最初发起访问的对象是 `child`，所以：

```text
child.[[Get]]("name", child)
```

`child` 自身没有 `name`，于是沿原型链继续：

```text
parent.[[Get]]("name", child)
```

**Receiver 始终是 `child`，不会因为查找到了 `parent` 而改变。** 最终找到 Accessor Descriptor 时，规范执行：

```text
Call(getter, Receiver)
```

于是 getter 里的 `this` 就是 `child`。

setter 同理。`[[Set]]` 同样接收 Receiver，确保 setter 里的 `this` 指向最初发起写入的对象：

```javascript
const parent = {
  set name(value) {
    this._name = value;
  }
};

const child = Object.create(parent);
child.name = 'Tom';
// setter 中的 this === child
```

Receiver 保证了一件看起来很自然、但实现上很精妙的事：

> **行为可以共享，状态必须独立。**
>
> getter/setter 定义在原型上（共享行为），但 `this` 始终指向最初发起访问的对象（独立状态）。

### 2.3 Reflect：Internal Method 的 1:1 投影

Proxy 让开发者可以替换 Internal Method 的实现，但随之而来的是一个直接问题：**在 trap 里，如何正确地“做默认该做的事”？**

一个常见的错误写法是：

```javascript
const proxy = new Proxy(target, {
  get(target, key) {
    return target[key]; // ❌ 丢失了 Receiver
  }
});
```

`target[key]` 会重新发起一次 `[[Get]]`，但新的 Receiver 变成了 `target`。如果 `target` 的某个属性是继承来的 getter，那么 getter 里的 `this` 就会指向 `target`，而不是 `proxy`，原型链访问器语义被破坏了。

正确写法是：

```javascript
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver); // ✅ 保留 Receiver
  }
});
```

`Reflect.get(target, key, receiver)` 等价于：

```text
target.[[Get]](key, receiver)
```

它不是“重新实现属性读取”，而是把 Internal Method 的调用语义原样暴露到 JavaScript 层。

Reflect 的关键定位可以概括为三点：

1. **1:1 投影**：每个 Reflect 方法都对应一个 Internal Method，例如 `Reflect.get` 对应 `[[Get]]`，`Reflect.set` 对应 `[[Set]]`，`Reflect.deleteProperty` 对应 `[[Delete]]`。
2. **保留 Receiver**：`Reflect.get` 的第三个参数、`Reflect.set` 的第四个参数，都是 Receiver，确保 `this` 绑定不会断裂。
3. **统一返回值**：`Reflect.set` 始终返回布尔值，把“失败时抛错还是静默”这种控制流问题，转化为数据问题，这对 Proxy handler 的返回值要求至关重要。

> **Reflect 不是另一套工具函数，而是 Internal Method 在 JavaScript 层的对偶。**
>
> Proxy 让用户能替换行为接口；Reflect 让用户能在替换后，仍然按规范默认方式完成行为。

### 2.4 Behavior 层的开放极限

到这一步，Behavior 层几乎是完全开放的。开发者可以：

- 用 Proxy 替换对象的 `[[Get]]`、`[[Set]]`、`[[Delete]]`、`[[HasProperty]]` 等行为接口；
- 用 Reflect 精确控制默认行为的转发路径；
- 通过 Receiver 的显式传递，维持 getter/setter 里的 `this` 语义。

但开放是有条件的：Proxy 和 Reflect 能操作的，始终是 **Internal Method 这个行为接口**，而不是对象内部的状态本身。Behavior 可以替换，但 State 不能直接被读取或修改。

这就是为什么我们还要继续往下问：Descriptor 和 Symbol 能开放到哪一层？

---

## 三、Semantics：Descriptor 与 Symbol 协议，部分可介入的语义层

### 3.1 Property Descriptor：开发者能直接构造的语义说明书

第 3 篇把 Property Descriptor 比喻成“属性的说明书”。它描述了一个属性是数据属性还是访问器属性、是否可写、是否可枚举、是否可配置。

开发者最直接的介入方式，就是 `Object.defineProperty`：

```javascript
Object.defineProperty(obj, 'name', {
  value: '张三',
  writable: false,
  enumerable: false,
  configurable: false,
});
```

这个 API 允许开发者直接构造 Property Descriptor，从而决定一个属性的语义。类似的入口还有：

- `Object.defineProperties`
- `Object.getOwnPropertyDescriptor`
- `Object.freeze`
- `Object.seal`
- `Object.preventExtensions`

它们共同构成了 Semantics 层的主要开放接口。

但需要注意的是，这些 API 能修改的只是“属性的语义”，而不是对象内部的状态。`Object.freeze(obj)` 本质上是把 `obj` 上所有属性的 `[[Writable]]` 和 `[[Configurable]]` 设为 `false`，并把 `[[Extensible]]` 设为 `false`。它改变的是对象和属性的语义约束，而不是某个不可见的 Internal Slot 的直接值。

### 3.2 Accessor：把属性语义变成行为

Accessor Property 是 Semantics 层最特殊的存在。它让 Property Descriptor 里保存的不再是值，而是函数：

```javascript
const obj = {
  get name() {
    return this._name;
  },
  set name(value) {
    this._name = value;
  }
};
```

从 Descriptor 的角度看，这是一个 Semantic 声明：这个属性“应该如何被读取和写入”。但从实现角度看，它又会触发函数调用，进入 Behavior 层。

这正好说明：**Semantics 和 Behavior 并不是截然分开的。** Accessor 是语义层向行为层的延伸。

### 3.3 Symbol 协议：Behavior 与 Semantics 的交界

Symbol 协议是另一个 Semantics 与 Behavior 交汇的地带。

例如 `Symbol.iterator`：

```javascript
const obj = {
  *[Symbol.iterator]() {
    yield 1;
    yield 2;
    yield 3;
  }
};

for (const x of obj) {
  console.log(x);
}
```

`for...of` 不是某个 Internal Method 的单一调用，而是一组规范步骤。它会先读取对象的 `Symbol.iterator` 属性（触发 `[[Get]]`），然后调用返回的迭代器对象上的 `next` 方法。`Symbol.iterator` 让对象声明“我该如何被迭代”，这是一种语义声明；但它又通过 `[[Get]]` 这一 Behavior 接口被消费。

类似地：

- `Symbol.toPrimitive`：对象声明自己应该如何被转换为原始值；
- `Symbol.hasInstance`：对象声明 `instanceof` 应该如何判断；
- `Symbol.toStringTag`：对象声明 `Object.prototype.toString` 应该返回什么标签。

这些 Symbol 协议的特点是：

> **它们不像 Proxy 那样替换整个 Internal Method，而是让对象在保留默认行为框架的前提下，声明某些特定语义。**

```text
Proxy: 替换行为接口本身
Symbol 协议: 在默认行为内部插入自定义语义
```

因此，Symbol 协议正好落在 Behavior 与 Semantics 的交界：它通过 `[[Get]]` 等行为接口被读取（Behavior），但表达的是“这个对象在特定场景下应该如何被理解”（Semantics）。

### 3.4 Semantics 层的开放边界

Semantics 层的开放程度不如 Behavior 层彻底。开发者可以：

- 用 `defineProperty` 构造 Descriptor；
- 用 `freeze / seal / preventExtensions` 约束对象和属性；
- 用 Symbol 协议声明特定语义。

但这些操作都依赖于 Property 系统。开发者能修改的，是“属性的语义”和“对象通过属性暴露出来的协议”，而不是对象内部那些不属于 Property 的状态。

这就自然引出了下一层：State。

---

## 四、State：品牌身份，是封闭的根本原因

### 4.1 Internal Slot 为什么不开放？

第 3 篇提到，Internal Slot 是对象内部保存状态的槽位，例如：

```text
[[Prototype]]       → 原型引用
[[Extensible]]      → 是否可扩展
[[PromiseState]]    → pending / fulfilled / rejected
[[PromiseResult]]   → Promise 的结果值
[[MapData]]         → Map 的键值对列表
[[WeakMapData]]     → WeakMap 的弱引用条目
```

这些槽位都不是 Property，开发者无法通过 `.` 或 `[]` 访问，也无法用 `Object.defineProperty` 修改。

为什么？

一个常见的误解是：引擎“故意”把这些状态藏起来，不让开发者碰。但真正的原因是：**这些状态往往与对象的身份、不变量或内存安全绑定，一旦开放，对象的语义就会崩溃。**

我们可以从三个层次理解这种封闭性。

Semantics 层：Descriptor 与 Symbol 交界
Behavior 层高度开放，但往下走一层——到 Descriptor 和 Symbol 这一层——开放度就开始收窄。你可以修改规则，但你不能凭空发明新的规则种类。

Descriptor：属性语义的精确控制
Object.defineProperty 允许你逐个定义属性的结构：

js
Object.defineProperty(obj, "x", {
  value: 1,
  writable: false,
  enumerable: true,
  configurable: false
});
沿着这个方向，Object.freeze、Object.seal、Object.preventExtensions 这些方法本质上都是对整批属性的 Descriptor 做约束：

freeze：所有 Data Property 的 [[Writable]] 和 [[Configurable]] 设为 false

seal：所有 Property 的 [[Configurable]] 设为 false

preventExtensions：禁止新增 Property

你参与的仍然是“设置规则”——[[Writable]]、[[Configurable]] 只有 true/false 两个值；[[Value]] 只能是语言值；[[Get]]/[[Set]] 只能是函数。Descriptor 的“字段”是固定的，你不能向规范申请一个新字段叫 [[Atomic]]，然后让引擎去实现它。

Symbol：运行时协议入口
如果说 Descriptor 控制的是“属性自身的语义”，那 Symbol 控制的是“对象在语言协议中的语义”。

Symbol.iterator 就是最典型的例子：

js
const obj = {
  *[Symbol.iterator]() {
    yield 1;
    yield 2;
  }
};

[...obj];  // [1, 2]
[...obj] 触发 obj.[[Get]](Symbol.iterator, obj) → 拿到迭代器方法 → 执行。语言协议（迭代器协议）通过 Symbol 这个“钥匙”，找到了对象提供的实现。

这不是语法糖。在规范里，for...of、yield*、展开运算符，都会统一调用对象的 [[Get]](Symbol.iterator)。

同一个模式适用于多个协议：

Symbol	语言协议	触发的 Internal Method 调用
Symbol.iterator	可迭代协议	[[Get]](Symbol.iterator, …)
Symbol.toPrimitive	类型转换协议	[[Get]](Symbol.toPrimitive, …) 后在 ToPrimitive 中使用
Symbol.hasInstance	instanceof 协议	[[Get]](Symbol.hasInstance, …)
Symbol 恰好卡在 Behavior 与 Semantics 的交界：引擎依然通过 Internal Method（[[Get]]）来读取 Symbol 属性，但它读到的内容决定了对象在整个语言协议中“表现成什么”。

Symbol 把“新协议”变成“已有 Behavior 框架内的新属性”。

规范不需要为 for...of 新增一个 [[Iterate]] Internal Method。它只是复用 [[Get]]，读一个约定好的 Symbol 属性。你作为开发者，只被允许“实现已有协议”，而不能“设计新协议”。

4. State 层：品牌身份与不可伪造的内部状态
Behavior 层高度开放，Semantics 层部分开放。到了最底层的 State，开放度急剧收窄。

不变量：PromiseState
一个 Promise 有三种状态：pending、fulfilled、rejected。状态一旦从 pending 变为 fulfilled/rejected，就永远不能再变。这不是“推荐做法”，而是规范强制的不变量（invariant）。

你不被允许直接修改 PromiseState。你只能通过 resolve() 或 reject() 这两个“受控接口”间接触发状态变更，且只能变更一次。

数组与 length 不变量：ArraySetLength 的回滚机制
数组是 Exotic Object 的典型代表，它的 length 属性与索引属性之间有一个严格的不变量：length 必须大于所有有效索引。当开发者试图修改 length 而破坏这个不变量时，引擎不会“部分成功”，而会像数据库事务一样回滚（rollback）。

来看一个例子：

js
const arr = [1, 2, 3];

// 将索引 2 设置为不可配置，意味着无法删除
Object.defineProperty(arr, "2", {
  configurable: false
});

arr.length = 1;  // 试图收缩数组，删除索引 2
console.log(arr.length); // 3 —— 回滚了！
console.log(2 in arr);   // true —— 索引 2 依然存在
规范中的 ArraySetLength 算法是这样运作的：

收到新的 length 描述符（值为 1）。

尝试删除索引大于等于 1 的属性（即索引 2）。

发现索引 2 的 [[Configurable]] 为 false，删除失败。

整个操作回滚，length 保持原值 3。

之所以必须回滚，是因为如果只把 length 改为 1 而保留索引 2，数组就会进入“ length 为 1 但索引 2 仍存在”的非法状态。这套回滚机制完全封闭在引擎内部——开发者既无法绕过，也无法伪造。你不可能写一个普通对象来模拟这种“一旦违反不变量就自动恢复原状”的行为，因为这需要引擎在设置属性时就介入判断，而普通对象的 [[Set]] 没有这种特殊逻辑。

这里的“不变量”守卫，正是引擎牢牢握在手里的 State 层。

品牌身份：MapData
Map 的实例内部有一个 [[MapData]] 槽，存储所有键值对。这个槽没有暴露给 JavaScript。你无法直接读写它。

这产生了一个有趣的现象：“真假 Map”问题。

js
const realMap = new Map();
realMap.set("key", "value");

const fakeMap = {
  get() { /* ... */ },
  set() { /* ... */ },
  has() { /* ... */ }
};

fakeMap instanceof Map;  // false
realMap instanceof Map;  // true
你可以在一个普通对象上实现 get、set、has 方法，让它看起来像 Map。但引擎永远知道它不是——因为它没有 [[MapData]] 内部槽。instanceof 并不检查方法签名，而是检查品牌身份。

这个身份信息保存在引擎里，你无法伪造。

内存安全：WeakMapData
WeakMap 比 Map 更进一步。它的 [[WeakMapData]] 不仅不可访问，而且其中的键是弱引用——引擎有能力在键对象被垃圾回收时，自动清除对应条目。

这种“自动清除”的能力，开发者永远无法在 JavaScript 层面模拟。它依赖的是 GC 的底层协作，而不是任何暴露给 JS 的 API。

三层安全递进关系：

text
PromiseState / Array length  → 保证对象状态一致性（不变量约束）
MapData                      → 保证类型身份不可伪造（品牌检查）
WeakMapData                  → 保证内存安全（GC 协作，弱引用）
每一层，都在回答同一个问题：哪些东西必须由引擎牢牢握住？

5. 少数例外：[[Prototype]] 与 [[Extensible]]
前面画出的图景是一路收紧的。但有一处看起来像是“例外”：[[Prototype]] 和 [[Extensible]]。

它们也是 Internal Slot，但却是少数允许开发者读写的槽：

js
Object.getPrototypeOf(obj);   // 读 [[Prototype]]
Object.setPrototypeOf(obj, p); // 写 [[Prototype]]

Object.isExtensible(obj);      // 读 [[Extensible]]
Object.preventExtensions(obj); // 写 [[Extensible]]（单向）
这似乎与“State 基本封闭”矛盾：为什么这两个槽开放了？

强身份 vs 弱身份
仔细看会发现，[[Prototype]] 与 [[MapData]] 承载着两种截然不同的“身份”：

强身份（[[MapData]]）：由专属内部槽承载，不可伪造。instanceof 检查的就是这种身份。你没有 [[MapData]]，就永远不是 Map。

弱身份（[[Prototype]]）：由原型链关系承载，完全可以伪造。

js
const fakeMap = {};
Object.setPrototypeOf(fakeMap, Map.prototype);

fakeMap instanceof Map;  // true  ← 弱身份被成功伪造
原型链上的 Map.prototype 是共享对象，不属于 fakeMap 的专属状态。instanceof 沿着原型链查找，一旦发现 Map.prototype，就返回 true。这不需要任何内部槽。

原型与可扩展性是“可恢复的结构状态”
[[Prototype]] 和 [[Extensible]] 之所以开放，不是因为它们是“特权槽”，而是因为它们描述的是对象与外部结构的关系，而不是对象自身不可替代的内在身份。

原型可以换，品牌槽不能换。

可扩展性可以锁死（单向），但它锁的是“能否添加属性”这一结构约束，而不是内部状态的完整性。

因此，[[Prototype]] 和 [[Extensible]] 的开放，并没有削弱 State 层的论点。它只是揭示了一层更精细的区分：

开放的是弱身份和可恢复的结构状态。强身份和内部状态不变量，始终封闭。

---

## 六、边界：开放边界画在哪里？

现在我们可以把三层开放程度重新摆出来：

```text
Behavior  ★★★★★  高度开放
Semantics ★★★☆☆  部分开放
State     ★☆☆☆☆  基本封闭
```

但这只是现象层。如果只停留在这里，第 4 篇就只是一个分层总结，而不是上升式收尾。

真正值得追问的是：**为什么边界恰好画在这里？**

答案可以浓缩为一句话：

> **ECMAScript 的开放边界，画在“可伪造身份”与“不可伪造品牌身份”之间。**

| 层次 | 身份性质 | 例子 |
|------|----------|------|
| Behavior | 行为接口可替换，但对象身份不依赖 trap | Proxy 替换 `[[Get]]` |
| Semantics | 语义可声明，但品牌身份不变 | Symbol.iterator / defineProperty |
| State（弱身份） | 结构状态可修改，但不改变品牌 | `[[Prototype]]` / `[[Extensible]]` |
| State（强身份） | 品牌身份不可伪造 | `[[PromiseState]]` / `[[MapData]]` / `[[WeakMapData]]` |

开发者可以：

- 替换对象如何响应操作（Behavior）；
- 声明属性的语义和特定协议（Semantics）；
- 调整对象的结构关系（弱身份 State）。

但开发者不能：

- 伪造一个真正的 Promise、Map 或 WeakMap（强身份 State）；
- 破坏对象的不变量（如 Promise 状态不可逆）；
- 干涉与内存安全绑定的状态（如 WeakMap 的弱引用条目）。

这就是为什么 Reflect 是 Proxy 的“对偶”：Reflect 提供了一条不会跨越这条边界的安全路径。它让开发者能够调用 Internal Method，却不会暴露那些必须封闭的 Internal Slot。

---

## 七、结语

从第 3 篇的三层模型，到第 4 篇的开放程度切面，我们看到的不是两套独立的理论，而是同一套对象模型的两个视角：

- 第 3 篇问的是：**ECMAScript 如何组织对象？**
- 第 4 篇问的是：**这套组织中，开发者能参与多少？**

答案就是那张分层图：

```text
Behavior  ★★★★★
Semantics ★★★☆☆
State     ★☆☆☆☆
```

以及它背后的身份原理：

> **可伪造的交给开发者编排，不可伪造的品牌身份留给引擎维护。**

Proxy 和 Reflect 让 Behavior 完全可编程，Symbol 协议让 Semantics 部分可声明，Descriptor 让属性的意义可以被直接构造。但跨越到 State 层时，规范必须守住一道底线：那些定义对象“是什么”的强身份，必须保持不可伪造。

这不是 ECMAScript 的任意限制，而是对象模型能够在安全、可扩展与可预测之间保持平衡的根本原因。

边界：开放到哪里为止？
现在我们可以把三层开放程度，绘制成一幅叠加了“身份原理”的完整图景。

分层开度（现象层）：

text
★★★★★ Behavior      Proxy / Reflect —— 你几乎可以替换一切行为（包括劫持 Map）
  ↑
★★★☆☆ Semantics     Descriptor / Symbol —— 你只能修改既定规则、实现已有协议
  ↑
★☆☆☆☆ State         不变量 / 品牌 / 内存安全 —— 你只能间接触发，无法直接读写（数组回滚是典型）
身份原理层（为什么偏偏画在这里）：

text
Behavior      拦截操作 — 全部可替换
                 ↑
Semantics     修改规则 — 部分可参与
                 ↑
State         身份定义 — 不可伪造品牌（[[MapData]]、回滚机制）
   ─ ─ ─ ─ ─ ─ ─ ─ ─ 开放边界画在这里 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                 ↑
             可伪造身份（原型链 instanceof）— 允许
ECMAScript 在“可伪造”与“不可伪造”之间画了一条清晰的线：

你可以在语言层面伪造任何行为（Proxy）。

你可以在语义层面调整属性的结构和协议。

你甚至可以伪造 instanceof（修改原型链）。

但你永远无法让一个普通对象成为 Map，因为你无法获得 [[MapData]] 这个由引擎持有的身份凭证。

你也永远无法让一个普通对象拥有数组那样的自动回滚能力，因为那种一致性维护代码在引擎内部，不暴露给 JavaScript。

开放的边界，精确画在“可伪造的语义与行为”和“不可伪造的品牌身份与不变量”之间。

这层边界不是任意的限制。Promise 的状态不可逆、Map 的身份不可伪造、WeakMap 的弱引用不可模拟、数组的 length 一致性必须由引擎强制——这些不是规范“不给你用”，而是如果这些也能伪造，整个语言的可靠性就瓦解了。

对象模型的开放程度，到此为止，也到此为止了。