# null 自测题

## 读懂题

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
**考察点：** 未赋值变量得到 `undefined`，显式赋 `null` 是程序员的主动声明，两者类型不同所以 `===` 为 `false`

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
**考察点：** `typeof null` 返回 `"object"` 是历史 Bug（类型标签 `0` 撞车），不是 `null` 真的是对象

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
**考察点：** ToNumber 分裂——`null → 0`（可计算），`undefined → NaN`（不可计算）

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
**考察点：** Abstract Equality 为 null/undefined 设了专属分支（Step 2/3），但 `null` 不等于任何其他值

</details>

---

**题目 5**
```javascript
console.log(Object.getPrototypeOf(Object.prototype));
```

<details>
<summary>查看答案</summary>

**答案：** `null`
**考察点：** 原型链以 `null` 作为终点——表示"主动终止"，不是"未初始化"

</details>

---

## 想通题

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
**考察点：** `||` 基于 ToBoolean（`0` 是 falsy 被替换），`??` 基于 IsNullOrUndefined（`0` 是合法值被保留）

</details>

---

**题目 7**
```javascript
const user = null;
console.log(user?.address?.city);
console.log(user?.address?.city ?? 'Unknown');
```

<details>
<summary>查看答案</summary>

**答案：** `undefined`, `"Unknown"`
**考察点：** `?.` 遇到 null 短路返回 `undefined`，`??` 对 nullish 值提供默认值

</details>

---

**题目 8**
```javascript
function greet(name = 'Guest') {
  return `Hello, ${name}`;
}
console.log(greet(undefined));
console.log(greet(null));
```

<details>
<summary>查看答案</summary>

**答案：** `"Hello, Guest"`, `"Hello, null"`
**考察点：** 参数默认值只对 `undefined` 生效。`null` 是"明确传了空值"，保留。

</details>

---

**题目 9**
```javascript
const dict = Object.create(null);
dict.__proto__ = 'evil';
console.log(dict.__proto__);
console.log(dict instanceof Object);
```

<details>
<summary>查看答案</summary>

**答案：** `"evil"`, `false`
**考察点：** `Object.create(null)` 切断原型链。`__proto__` 只是普通属性，`instanceof` 无法沿原型链找到 `Object.prototype`

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
**考察点：** JSON 中——对象属性的 `undefined` 被忽略，数组中的 `undefined` 被替换为 `null`（SerializeJSONArray 规范要求），`null` 始终保留

</details>

---

---

**题目 11**
```typescript
type User = {
  name: string | null;
  email?: string;
  age: number | undefined;
}

const user1: User = { name: null, age: undefined }
const user2: User = { name: 'Alice', email: undefined, age: 25 }
const user3: User = { name: 'Bob', age: 30 }  // 能编译吗？
```

<details>
<summary>查看答案</summary>

**答案：**
- `user1` ✓ 合法。`name` 允许 `null`，`age` 允许 `undefined`
- `user2` ✓ 合法。`email` 是可选字段，传 `undefined` 等于不传
- `user3` ✓ 合法。`email` 是可选字段，可以省略

**考察点：**
- `T | null` = 明确为空（程序员主动赋值）
- `T | undefined` = 可能缺席（引擎信号或可选字段）
- `?` 可选属性 = 该字段可能不存在，值自动为 `undefined`

</details>

---

**题目 12**
```typescript
function findUser(id: number): User | null {
  // 实现 A
  if (id === 1) return { name: 'Alice', age: 30 }
  return null  // 查不到
}

function getConfig(key: string): string | undefined {
  // 实现 B
  const map: Record<string, string> = {}
  return map[key]  // 属性不存在返回 undefined
}

const user = findUser(999)  // 类型是什么？
const config = getConfig('db')  // 类型是什么？
```

<details>
<summary>查看答案</summary>

**答案：**
- `user` 类型：`User | null`
- `config` 类型：`string | undefined`

**考察点：**
- 函数返回 `null` = 明确查过，没有结果（业务语义）
- 属性访问返回 `undefined` = 引擎告知的缺失（系统信号）
- 这两种"没有值"在类型系统中应该区分

</details>

---

**题目 13**
```typescript
// 以下哪个类型定义最准确？
// 选项 A
type ApiResponse = {
  data: User | null;
  error: string | null;
}

// 选项 B
type ApiResponse = {
  data?: User;
  error?: string;
}

// 选项 C
type ApiResponse = {
  data: User | undefined;
  error: string | undefined;
}
```

<details>
<summary>查看答案</summary>

**答案：** 选项 A 最准确

**分析：**
- **选项 A**（✓）：`data` 和 `error` 字段**始终存在**，但值可能为空。API 响应结构是确定的，只是某些字段可能没有值。
- **选项 B**（✗）：`data?` 和 `error?` 表示字段**可能不存在**。这会误导：API 响应格式应该是确定的，不应该时有时无。
- **选项 C**（✗）：`undefined` 表示"可能缺席"，但 API 响应中明确返回 `null` 表示"查询过了，没有结果"。

**考察点：**
- `null` 用于明确表示"值属于模型，但当前为空"
- `undefined` 或 `?` 用于表示"值可能根本不属于当前模型"
- API 响应、数据库查询结果：用 `null`（明确查过，没有）
- 配置项、可选参数：用 `undefined` 或 `?`（可能没传）

</details>

---

**题目 14**
```typescript
// 实际开发中的陷阱
const map = new Map<string, number>()
map.set('count', 0)

const count = map.get('count')      // 类型是什么？
const missing = map.get('missing')  // 类型是什么？

if (count) {
  console.log('count 存在')  // 会执行吗？
}

if (count !== undefined) {
  console.log('count 存在')  // 会执行吗？
}
```

<details>
<summary>查看答案</summary>

**答案：**
- `count` 类型：`number | undefined`（值为 `0`）
- `missing` 类型：`number | undefined`（值为 `undefined`）
- `if (count)` → **不会执行**。`0` 是 falsy 值，被误判为"不存在"
- `if (count !== undefined)` → **会执行**。正确判断"key 是否存在于 map 中"

**考察点：**
- `Map.get()` 返回 `undefined` 表示 key 不存在（不是 `null`）
- 用 `||` 或 `if (value)` 判断会误伤 `0`、`''`、`false` 等 falsy 值
- 正确做法：用 `map.has(key)` 或 `!== undefined` 或 `??`

```js
// 推荐写法
if (map.has('count')) { ... }
const count = map.get('count') ?? defaultValue
```

</details>

---

## 写出题

**题目 15**

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
- `current == null` 而不是 `=== null`？（利用 null == undefined 的专属分支）
- 路径拆分后逐层访问，任意一层 nullish 就返回默认值？
- 最终值是 undefined 也返回默认值？

</details>

---

**题目 16**

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

**本质：** 原型链以 `null` 为终点（ECMA-262 10.1.1.2），`Object.create(null)` 切断了原型链，没有 `toString`、`hasOwnProperty` 等继承属性，也不会被 `__proto__` 污染。当 key 来自用户输入时，这是唯一安全的选择。

</details>

---

**题目 17**

看代码，预测输出并解释原因：

```js
const map = new Map();
map.set('a', 0);

console.log(map.get('a') || 'missing');
console.log(map.get('a') ?? 'missing');
console.log(map.get('b') || 'missing');
console.log(map.get('b') ?? 'missing');
```

<details>
<summary>查看参考答案</summary>

**答案：** `'missing'`, `0`, `'missing'`, `'missing'`

**解释：**
- `map.get('a')` 是 `0`，`||` 基于 ToBoolean，`0` 是 falsy → 被替换为 `'missing'`
- `map.get('a')` 是 `0`，`??` 基于 IsNullOrUndefined，`0` 不是 null/undefined → 保留 `0`
- `map.get('b')` 是 `undefined`，`||` 和 `??` 都替换 → `'missing'`

**关键：** `||` 和 `??` 的分水岭是 ToBoolean vs IsNullOrUndefined。值为 `0`、`''`、`false` 时两者行为不同。

</details>

---

## 错题追踪

复习时在题目标题后标 `❌`（做错），下次复习优先刷带 `❌` 的题。答对后改成 `✅` 并填复习记录表的错题列。

## 评分

- **15-17/17：** 掌握良好
- **12-14/17：** 基础扎实，错题对应章节重看
- **11/17 以下：** 建议完整复习 `articles/`
