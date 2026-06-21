# null 自测题

## 一、复述讲解

> 费曼第二步：看代码，用规范术语讲清行为。本组都是规范直陈，输出不会因混淆答错——答得出外在表现才算入门。

**题目 1**
```javascript
let a;
let b = null;
console.log(a);
console.log(b);
console.log(a === b);
```

<details>
<summary>查看答案</summary>

**答案：** `undefined`, `null`, `false`

**考察点：** `let a;` 未赋值，引擎自动填 `undefined`；`b = null` 是程序员主动声明的空值。两者 ECMA 类型不同（`Type(null)` 为 `Null`，`Type(undefined)` 为 `Undefined`），IsStrictlyEqual 因 Type 不同返回 `false`。

</details>

---

**题目 2**
```javascript
console.log(typeof null);
console.log(typeof undefined);
```

<details>
<summary>查看答案</summary>

**答案：** `"object"`, `"undefined"`

**考察点：** `typeof null` 返回 `"object"` 是实现事故——早期引擎类型标签 `0` 与对象撞车，非设计意图。规范真相是 `Type(null)` 为 `Null`（§6.1 The Null Type），与 `Object` 同级；`null` 无属性无原型，`null.foo` 抛 TypeError。修复提议因兼容性被拒。

</details>

---

**题目 3**
```javascript
console.log(1 + null);
console.log(1 + undefined);
```

<details>
<summary>查看答案</summary>

**答案：** `1`, `NaN`

**考察点：** `+` 运算对操作数调用 ToNumber。`ToNumber(null)` = `0`（可计算的空），`ToNumber(undefined)` = `NaN`（不可计算的未知）。于是 `1 + null` 得 `1`，`1 + undefined` 得 `NaN`。

</details>

---

**题目 4**
```javascript
console.log(null == undefined);
console.log(null === undefined);
console.log(null == 0);
console.log(null == false);
console.log(null == '');
```

<details>
<summary>查看答案</summary>

**答案：** `true`, `false`, `false`, `false`, `false`

**考察点：** IsLooselyEqual（`==`）开头 Step 2/3 为 null/undefined 开专属分支：一方为 `null`、另一方为 `undefined` 直接返回 `true`，不进入转换链——故 `null == undefined` 为 `true`。其余情况 `null` 拒绝进入通用 ToNumber 转换，不与 `0`、`false`、`''` 相等。IsStrictlyEqual（`===`）因 `Type(null)` ≠ `Type(undefined)` 返回 `false`。

</details>

---

**题目 5**
```javascript
console.log(Object.getPrototypeOf(Object.prototype));
```

<details>
<summary>查看答案</summary>

**答案：** `null`

**考察点：** `Object.prototype` 的 `[[Prototype]]` 内部槽为 `null`——原型链主动终止，表达"到此为止"，不是"未初始化"。故用 `null` 而非 `undefined`。

</details>

---

## 二、暴露盲区

> 费曼第三步：陷阱场景探测概念混淆。本组每题的输出都与常见误解相反——做错说明有地方没真懂，回 `articles/` 对应章节重看。

**题目 6**
```javascript
console.log(0 || 'default');
console.log(0 ?? 'default');
console.log(null || 'default');
console.log(null ?? 'default');
```

<details>
<summary>查看答案</summary>

**答案：** `"default"`, `0`, `"default"`, `"default"`

**考察点：** `||` 基于 ToBoolean，`0` 是 falsy 被替换；`??` 基于 IsNullOrUndefined，`0` 不是 nullish 被保留。

**盲区：** 把 `??` 当 `||` 用，`0`、`''`、`false` 这类合法 falsy 值会被误替换。

</details>

---

**题目 7**
```javascript
function greet(name = 'Guest') { return `Hello, ${name}`; }
console.log(greet(undefined));
console.log(greet(null));
```

<details>
<summary>查看答案</summary>

**答案：** `"Hello, Guest"`, `"Hello, null"`

**考察点：** 参数默认值仅当实参为 `undefined` 时触发——`undefined`（含不传）走默认值，`null` 是"明确传了空值"被保留。

**盲区：** 以为传 `null` 等于没传、会走默认值。默认值只认 `undefined`，不认 `null`。

</details>

---

**题目 8**
```javascript
const dict = Object.create(null);
dict.__proto__ = 'evil';
console.log(dict.__proto__);
console.log(dict instanceof Object);
```

<details>
<summary>查看答案</summary>

**答案：** `"evil"`, `false`

**考察点：** `Object.create(null)` 使对象的 `[[Prototype]]` 为 `null`，切断原型链。`__proto__` 降为普通自有属性（赋值不改原型），`instanceof` 沿空原型链找不到 `Object.prototype`。

**盲区：** 以为 `__proto__` 一定改原型、`instanceof` 一定为 `true`。

</details>

---

**题目 9**
```javascript
console.log(JSON.stringify({ a: undefined, b: null }));
console.log(JSON.stringify([undefined, null]));
```

<details>
<summary>查看答案</summary>

**答案：** `'{"b":null}'`, `'[null,null]'`

**考察点：** 对象属性的 `undefined` 被 SerializeJSONProperty 忽略（返回 `undefined` 不输出该属性）；数组元素的 `undefined` 被 SerializeJSONArray 替换为 `"null"`；`null` 始终保留。

**盲区：** 以为 `undefined` 要么全忽略要么全变 `null`，实际对象与数组两种处理。

</details>

---

**题目 10**
```javascript
const map = new Map();
map.set('count', 0);

const count = map.get('count');      // 值为 0
const missing = map.get('missing');  // 值为？

console.log(count || 'missing');
console.log(count ?? 'missing');
console.log(missing ?? 'missing');
console.log(Boolean(count));   // 拿来判"key 是否存在"靠谱吗？
```

<details>
<summary>查看答案</summary>

**答案：** `'missing'`, `0`, `'missing'`, `false`

**考察点：** `Map.get()` 缺失返回 `undefined`（不是 `null`）。用 `||` 或 truthiness 判存在性会误伤 `0`——`Boolean(0)` 为 `false`，把"存在且值为 0"误判成"不存在"。

**盲区：** 用 `if (value)` / `||` 判 Map key 是否存在，`0`、`''`、`false` 被误杀。正确做法：`map.has(key)` 或 `!== undefined` 或 `??`。

</details>

---

**题目 11**
```typescript
// API 返回固定结构，但 data 可能"查过且无值"。哪个类型定义最准？
//
// 选项 A
type ApiResponseA = { data: User | null; error: string | null; };
// 选项 B
type ApiResponseB = { data?: User; error?: string; };
// 选项 C
type ApiResponseC = { data: User | undefined; error: string | undefined; };
```

<details>
<summary>查看答案</summary>

**答案：** 选项 A

**分析：**
- **选项 A**（✓）：字段始终存在，值可能为空。API 响应结构确定，用 `| null` 表示"值属于模型，但当前为空"。
- **选项 B**（✗）：`?` 表示字段可能不存在，误导成"结构不确定"。
- **选项 C**（✗）：`| undefined` 表示"可能缺席"，而 API 明确返回 `null` 表示"查过了，没结果"。

**盲区：** 把"字段值为空"（用 `null`）和"字段缺席"（用 `?`/`undefined`）混了。

</details>

---

## 三、简化输出

> 费曼第四步：手写实现或用大白话教别人。能造出来、讲明白才算真懂——背术语不算。

**题目 12**

写一个函数 `getNestedValue(obj, path)`，安全获取嵌套对象属性，任意一层为 `null` 或 `undefined` 时返回默认值。

```js
const user = { address: { city: 'Beijing' } };
getNestedValue(user, 'address.city')     // 'Beijing'
getNestedValue(user, 'address.zip.code') // undefined
getNestedValue(null, 'address.city')     // undefined
```

不许用 `?.`，手写逻辑。

<details>
<summary>查看参考答案</summary>

```js
function getNestedValue(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null) return defaultValue;  // null 或 undefined 都短路
    current = current[key];
  }
  return current === undefined ? defaultValue : current;
}
```

**自检：**
- `current == null` 而不是 `=== null`？（借 IsLooselyEqual 的 null/undefined 专属分支，一行覆盖两种空）
- 路径拆分后逐层访问，任意一层 nullish 就返回默认值？
- 最终值是 `undefined` 也返回默认值？

</details>

---

**题目 13**

解释：为什么 `Object.create(null)` 创建的对象适合作为"纯净字典"？它和普通对象 `{}` 有什么本质区别？请写代码演示。

<details>
<summary>查看参考答案</summary>

```js
const normal = {};
const pure = Object.create(null);

// 区别 1：原型链
console.log(Object.getPrototypeOf(normal)); // [Object: null prototype] {}
console.log(Object.getPrototypeOf(pure));   // null

// 区别 2：继承的属性
console.log('toString' in normal); // true（从 Object.prototype 继承）
console.log('toString' in pure);   // false（没有原型）

// 区别 3：安全的 key 查找
const userKey = '__proto__';
normal[userKey] = 'evil';  // 可能触发原型污染
pure[userKey] = 'evil';    // 只是普通属性
```

**本质：** `Object.prototype` 的 `[[Prototype]]` 槽为 `null`，`Object.create(null)` 生成的对象 `[[Prototype]]` 也为 `null`，切断了原型链——没有 `toString`、`hasOwnProperty` 等继承属性，也不会被 `__proto__` 污染。当 key 来自用户输入时，这是唯一安全的选择。（价值在安全性，不是性能。）

</details>

---

**题目 14**

为下面两个函数设计返回类型，并说明为什么一个用 `null`、一个用 `undefined`。

```ts
function findUser(id: number): /* 你填 */ {
  // 查数据库：查到返回 User，查不到……
}

function getConfig(key: string): /* 你填 */ {
  // 从 Map 读：key 不存在时……
}
```

<details>
<summary>查看参考答案</summary>

```ts
function findUser(id: number): User | null {
  // 查到 → User；查不到 → null（明确查过，无结果，业务语义的空）
}

function getConfig(key: string): string | undefined {
  // Map.get 缺失返回 undefined（引擎告知的缺失，系统信号）
}
```

**考察点：** 能区分"业务空"（用 `null`：我知道这里该有值，查过了，没有）与"系统缺失"（用 `undefined`：引擎说这里没有），并落到返回类型设计。

</details>

---

**题目 15**

用日常语言向一个刚学编程的新人讲清 `null` 和 `undefined` 的区别。

**不许写代码，不许用规范术语**（ToNumber、falsy、原型链、抽象操作……都不许出现）。

<details>
<summary>查看参考讲解</summary>

用储物柜打比方：

- `undefined` 是「这个柜子从没人用过」。系统打开一看是空的，只能说「目前没东西」——它不知道这里本来该放什么。
- `null` 是「有人打开柜子检查过，贴了张『确认为空』的标签」。人主动声明：我知道这里该有东西，但我确认过，现在是空的。

前者是系统告诉你「不知道该有啥」，后者是人主动声明「我知道该有啥，但现在没有」。

**考察点：** 费曼第四步——能用最朴素的话讲明白，才算真懂。讲不清说明还在背术语，没真正消化。

</details>

---

## 评分

- **13-15/15：** 掌握良好
- **10-12/15：** 基础扎实，错题对应章节重看
- **9/15 以下：** 建议完整复习 `articles/`
