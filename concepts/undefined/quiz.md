# undefined 自测题

## 一、复述讲解

> 费曼第二步：看代码，用规范术语讲清行为。本组都是规范直陈，输出不会因混淆答错——答得出外在表现才算入门。

**题目 1**
```javascript
var x;
console.log(x);
console.log(({}).foo);
function f() {}
console.log(f());
console.log(typeof a);  // a 从未声明
```

<details>
<summary>查看答案</summary>

**答案：** `undefined`, `undefined`, `undefined`, `"undefined"`

**考察点：** 四种语法特征毫无共同之处的机制（变量声明 / 属性访问 / 函数调用 / typeof 未声明），分属三套独立系统（Binding / Reference / Completion），全部收敛到 undefined——ECMAScript 对运行时缺席的统一编码。

</details>

---

**题目 2**
```javascript
console.log(a);
var a = 1;

console.log(b);
let b = 1;
```

<details>
<summary>查看答案</summary>

**答案：** 第一行 `undefined`，第二行抛 `ReferenceError`（TDZ）

**考察点：**
- `var a`：binding 已创建，用 undefined 填充窗口期（hoisting 只是表象，底下是 binding exists + 值尚未到达）
- `let b`：binding exists ≠ readable，未初始化时读取抛 ReferenceError（TDZ）。TDZ 不是对 undefined 的否定——`let b; console.log(b)` 仍是 undefined，初始化后缺席重新编码为 undefined

</details>

---

**题目 3**
```javascript
const obj = {};
console.log(obj.foo);
console.log(obj.foo.bar);

const holey = [1, , 3];
console.log(holey[1]);
console.log(1 in holey);
```

<details>
<summary>查看答案</summary>

**答案：** `undefined`, `TypeError`, `undefined`, `false`

**考察点：**
- `obj.foo`：`[[Get]]` 查找失败，HasProperty 为 false → undefined
- `obj.foo.bar`：第一步 `obj.foo` 得 undefined，第二步 `undefined.bar` 对 primitive 取属性 → TypeError
- 数组空洞：HasProperty 为 false → undefined；`1 in` 为 false 说明连属性都没有（区别于 `[1, undefined, 3]`，那个 `1 in` 为 true）

</details>

---

**题目 4**
```javascript
function f() {}
function g() { return; }
function h() { return 42; }

console.log(f(), g(), h());
```

<details>
<summary>查看答案</summary>

**答案：** `undefined undefined 42`

**考察点：** 三者 Completion 的 `[[Value]]` 路径不同：
- `f()`：函数体 Completion 为 `{Type: normal, Value: empty}`，经 UpdateEmpty 把 empty 换成 undefined
- `g()`：`return;` 直接写 `{Type: "return", Value: undefined}`，不经 UpdateEmpty
- f 和 g 结果都是 undefined，但 Completion `[[Type]]` 不同（normal vs return）
- `h()`：`[[Value]]` 为 42，不是 empty，不涉及 UpdateEmpty

</details>

---

**题目 5**
```javascript
const { a = 1 } = {};
const { b = 1 } = { b: null };
function f(x = 1) { return x; }

console.log(a, b, f(undefined), f(null));
```

<details>
<summary>查看答案</summary>

**答案：** `1 null 1 null`

**考察点：** 默认值机制判断的是「缺席」（undefined）而非假值——`{}.a` 是 undefined 触发回退；`null` 是程序员的主动语义，保留；`f(undefined)` 等于没传触发默认，`f(null)` 明确传了空值保留。所有缺席被统一编码成 undefined，故默认值只需一条规则覆盖所有场景。

</details>

---

## 二、暴露盲区

> 费曼第三步：陷阱场景探测概念混淆。本组每题的输出都与常见误解相反——做错说明有地方没真懂，回 `articles/` 对应章节重看。

**题目 6**
```javascript
console.log(typeof a);  // a 从未声明
console.log(a);
```

<details>
<summary>查看答案</summary>

**答案：** `"undefined"`, `ReferenceError`

**考察点：** typeof 是 ECMAScript 唯一允许 unresolvable Reference 安静失败的运算符——拿到 unresolvable Reference 直接返回 `"undefined"`；普通 ResolveBinding 失败则抛 ReferenceError。

**盲区：** 以为 typeof 认识 undefined 才安全。它真正特殊的是对 unresolvable Reference 不抛错（出于 Web 兼容，特性检测依赖它）。

</details>

---

**题目 7**
```javascript
// 说法对吗？
// "void 0 是获取 undefined 的可靠方式，因为 void 运算符返回 undefined"
```

<details>
<summary>查看答案</summary>

**答案：** 不准确。

**考察点：** void 不是「获取 undefined」，而是把操作数的求值结果扔掉，把 Completion `[[Value]]` 重编码为 undefined。`void (1 + 2)` 是把 3 扔掉改成 undefined，不是"取 undefined"。undefined 负责表示缺席，void 负责制造缺席——两者互补。

**盲区：** 把 void 理解成"undefined 的别名/取值器"。它是主动制造缺席的运算符，结果恰好是 undefined。

</details>

---

**题目 8**
```javascript
// 说法对吗？
// "函数没有 return 时返回 undefined，是因为 undefined 是 Completion 的默认值"
```

<details>
<summary>查看答案</summary>

**答案：** 不对。

**考察点：**
- 无 return 的函数，函数体 Completion 是 `{Type: normal, Value: empty}`，`empty` 是规范内部占位符（不是 undefined）
- 经 UpdateEmpty 把 empty 换成 undefined，你才看到 undefined
- undefined 不是 Completion 天生携带的默认值，而是 Empty Completion 暴露给用户代码时的统一编码

**盲区：** 把 empty 当成 undefined。empty 在规范内部、undefined 在你能碰到的运行时，两个完全不同的东西。

</details>

---

**题目 9**
```javascript
{
  const undefined = 123;
  console.log(undefined);
  console.log(typeof undefined);
}
console.log(void 0);
```

<details>
<summary>查看答案</summary>

**答案：** `123`, `"number"`, `undefined`

**考察点：** undefined 不是保留字，语法树里是 Identifier，可被局部遮蔽。`typeof undefined` 里的 undefined 先做名字解析（拿到 123）再做 typeof。全局 `undefined` 是 `globalThis.undefined`（ES5 起 `writable: false`），但局部遮蔽仍生效。`void 0` 是永远可靠的取值出口，不受遮蔽影响。

**盲区：** 以为 undefined 像 null 一样是保留字、不可遮蔽。它只是全局对象的一个属性，局部可重新声明。

</details>

---

**题目 10**
```javascript
console.log(JSON.stringify({ a: undefined, b: null }));
console.log(JSON.stringify([undefined, null]));
```

<details>
<summary>查看答案</summary>

**答案：** `'{"b":null}'`, `'[null,null]'`

**考察点：** undefined 是运行时缺席，JSON 无法表达——对象属性中被忽略（不输出该属性），数组中被替换为 `"null"`；null 是显式数据，始终保留。

**盲区：** 以为 undefined 要么全忽略要么全变 null，实际对象与数组两种处理。

</details>

---

**题目 11**
```javascript
console.log(0 ?? "default");
console.log(0 || "default");
console.log(null ?? "default");
console.log("" ?? "default");
```

<details>
<summary>查看答案</summary>

**答案：** `0`, `"default"`, `"default"`, `""`

**考察点：** `??` 基于 IsNullOrUndefined（只替换 null/undefined——即缺席），`||` 基于 ToBoolean（所有 falsy 被替换）。`0` 和 `""` 是合法值，`??` 保留、`||` 吃掉。缺席（undefined）被 ?? 识别为"该回退"，合法 falsy 值被保留。

**盲区：** 把 `??` 当 `||` 用，`0`、`""`、`false` 这类合法 falsy 值被误替换。

</details>

---

## 三、简化输出

> 费曼第四步：手写实现或用大白话教别人。能造出来、讲明白才算真懂——背术语不算。

**题目 12**

写代码展示 TDZ（暂时性死区），对比 `var` 的行为，并解释为什么 `let`/`const` 要设计成这样。

<details>
<summary>查看参考答案</summary>

```js
// TDZ：声明前访问报错
{
  // TDZ 开始
  console.log(x); // ReferenceError
  // TDZ 结束
  let x = 1;
}

// 对比 var：声明前访问得到 undefined
console.log(y); // undefined
var y = 1;

// 实际陷阱：函数参数默认值
function foo(a = b, b = 1) {
  console.log(a, b);
}
foo(); // ReferenceError: b is not defined
// a 的默认值在 b 声明之前，b 在 TDZ 内
```

**为什么要设计 TDZ？**
1. 避免意外使用未初始化的值——`var` 的 undefined 是 bug 温床（binding 存在但值未到，程序却拿到了 undefined 当真值用）
2. 让 `const` 有意义——如果声明前可以访问，`const` 就无法保证"初始化后不变"
3. 代码可预测：变量在声明语句之后才可用，符合直觉

**考察点：** 能演示 binding exists ≠ readable（TDZ），并讲清设计动机：把"值还没来"从"安静返回 undefined"改成"直接报错"，堵住 var 的 bug 温床。

</details>

---

**题目 13**

写一个函数，安全获取 `undefined` 值（不依赖全局 `undefined`，因为可能被遮蔽），并解释为什么这样做。

<details>
<summary>查看参考答案</summary>

```js
// 方法 1：void 运算符（最可靠）
function getUndefined() {
  return void 0;
}

// 方法 2：无参函数（空 Completion → UpdateEmpty → undefined）
function getUndefined2() {}

// 方法 3：立即执行空函数
const undef = (() => {})();

// 为什么需要这样做？
{
  const undefined = 123; // 局部遮蔽
  console.log(undefined);         // 123
  console.log(void 0);            // undefined（不受遮蔽影响）
  console.log(getUndefined());    // undefined
}
```

**本质：** `undefined` 不是保留字，是全局对象的属性（`globalThis.undefined`，ES5 起 `writable: false`），但局部作用域可以遮蔽它。`void 0` 是永远可靠的取值出口——`void` 运算符丢弃操作数的值，把 Completion `[[Value]]` 重编码为 undefined，不经过名字解析。

**考察点：** 能给出绕过遮蔽的取值方式，并讲清 undefined 作为 Identifier 可被遮蔽、`void 0` 不走名字解析所以可靠。

</details>

---

**题目 14**

用日常语言向一个刚学编程的新人讲清 `undefined` 到底是什么。

**不许写代码，不许用规范术语**（Binding、Reference、Completion、absence、ToBoolean、抽象操作……都不许出现）。

<details>
<summary>查看参考讲解</summary>

undefined 不是某一种具体的"空"，它是 JavaScript 在运行时遇到"这里本该有结果，但什么都没得到"时，统一给出的一句话：「暂时没有」。

它出现在好几种完全不同的场合：
- 一个变量刚声明还没赋值——「还没放东西进去」
- 访问对象上一个不存在的属性——「没找到」
- 一个函数跑完了但没写 return——「没产出结果」
- 用 typeof 探测一个根本没声明过的名字——「查无此人，但我不报错」

这几种场合本来互不相干，但 JavaScript 给了它们同一个答案：undefined。这样你写判断时只需要认一种"没有"，不用为每种场合单独记一套规则。

代价是你光看到一个 undefined，没法反推它到底来自上面哪种场合——但这恰恰是有意为之，因为绝大多数时候你只需要知道"这里缺席了"，不需要知道是哪种缺席。

**考察点：** 费曼第四步——能用最朴素的话讲明白"undefined 是运行时缺席的统一编码"，才算真懂。讲不清说明还在背"声明了没赋值"那套第一层答案。

</details>

---

## 评分

- **12-14/14：** 掌握良好
- **9-11/14：** 基础扎实，错题对应章节重看
- **8/14 以下：** 建议完整复习 `articles/`
