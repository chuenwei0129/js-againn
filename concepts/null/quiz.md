# null 自测题

## 基础题（必须全对）

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

## 进阶题（理解核心机制）

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

## TypeScript 与生态实践（理解类型语义）

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

## 评分

- **12-14/14：** 掌握良好
- **10-11/14：** 基础扎实，错题对应章节重看
- **9/14 以下：** 建议完整复习 `articles/`
