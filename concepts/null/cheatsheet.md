# null 速查卡

## 核心概念

null = 程序员说的"没有"（有意的空） vs undefined = 引擎说的"没有"（系统缺失）

## 一句话总结

> `null` 是你检查后确认的空，`undefined` 是系统告诉你的缺失。

## 关键行为对比

| 场景 | `null` | `undefined` |
|---|---|---|
| 谁赋的值 | 程序员主动赋值 | 引擎自动填充 |
| `typeof` | `"object"`（历史 Bug） | `"undefined"` |
| `Number()` | `0` | `NaN` |
| `Boolean()` | `false` | `false` |
| `==` 对方 | 只与 `undefined` 相等 | 只与 `null` 相等 |
| `==` 其他 | `false`（不转换） | `false`（不转换） |
| JSON | 保留为 `null` | 丢弃 / 替换 |
| 原型链终点 | `null`（主动终止） | 不使用 |
| `??` | 被替换 | 被替换 |
| `?.` | 短路返回 `undefined` | 短路返回 `undefined` |
| 参数默认值 | 保留 `null` | 走默认值 |

## typeof null 的 Bug

```js
typeof null          // "object"  ← 实现事故，不是设计意图
Type(null)           // Null      ← 规范真相（§6.1.1），独立类型
typeof null === 'null' // 曾提议修复，因兼容性被拒绝
```

## == 的专属分支

```js
null == undefined  // true  — Abstract Equality Step 2/3 专属通道
null == 0          // false — 不走通用转换
null == false      // false
null == ""         // false
```

## Object.create(null)

```js
const dict = Object.create(null)
// 原型链被切断 → 没有继承属性 → 安全的纯字典
// 核心价值：安全性（防原型污染），不是性能
```

## 现代 nullish 操作符

```js
// ?? 只判断 null/undefined（不是所有 falsy）
0 ?? 'default'         // 0
null ?? 'default'      // 'default'

// ?. 安全穿透
user?.address?.city    // 遇到 null/undefined → undefined

// 参数默认值只对 undefined 生效
function f(x = 1) {}   // f(undefined) → 1, f(null) → null
```

## ECMAScript 抽象操作对比

| 抽象操作 | `null` | `undefined` |
|---|---|---|
| **ToNumber** | `0`（可计算） | `NaN`（不可计算） |
| **ToBoolean** | `false` | `false` |
| **ToObject** | TypeError | TypeError |
| **Strict Equality** | 只与自身相等 | 只与自身相等 |
| **SameValue** | 只与自身相等 | 只与自身相等 |
| **Abstract Equality** | 与 `undefined` 相等 | 与 `null` 相等 |
| **JSON Serialization** | 保留为 `null` | 丢弃 / 替换 |
| **IsNullOrUndefined** | `true` | `true` |

> **洞察**：null 和 undefined 在某些操作中被区分（ToNumber、JSON），在某些操作中被统一（ToBoolean、IsNullOrUndefined）。这种"分裂 vs 统一"反映了语言设计的演化。

## JSON 序列化：三种行为

```js
// 1. 对象属性的 undefined → 被忽略（不传输）
JSON.stringify({ a: undefined })          // '{}'

// 2. 数组中的 undefined → 被替换为 null
JSON.stringify([1, undefined, 3])         // '[1,null,3]'

// 3. null 始终保留
JSON.stringify({ a: null })               // '{"a":null}'
JSON.stringify([1, null, 3])              // '[1,null,3]'
```

**原理**：JSON 是跨语言数据交换协议，只能传输"值"，不能传输"状态"。`null` 是可传输的空值，`undefined` 是引擎内部状态。

## TypeScript 与 Web 生态实践

```ts
// 类型系统中的语义区分
type User = {
  name: string | null      // 明确为空：查过了，结果是 null
  email?: string           // 可能缺席：字段本身可能不存在
  age: number | undefined  // 可能缺席：引擎返回的缺失信号
}

// 查询函数的返回类型
function findUser(id: number): User | null {
  // 查到了返回 User，查不到返回 null（不是 undefined）
}

// Map.get() 返回 undefined（需配合 has() 判断）
const map = new Map<string, number>()
map.get('missing')  // undefined（不是 null）
```

**生态共识**：
- JSON、GraphQL、DOM API：用 `null` 表示空值
- TypeScript：`T | null` = 明确为空，`T | undefined` = 可能缺席
- Zod、Prisma 等工具区分 `nullable` 和 `optional`

## 3 个核心问题（2 分钟自测）

1. **null 和 undefined 的本质区别是什么？**
   `null` 是程序员主动声明的"空"，`undefined` 是引擎自动表示的"缺失"。

2. **`typeof null` 为什么返回 `'object'`？**
   早期引擎类型标签 `0` 撞车的历史 Bug。规范真相是 `Type(null) = Null`。

3. **`??` 和 `||` 的关键区别？**
   `||` 基于 ToBoolean（所有 falsy 被替换），`??` 基于 IsNullOrUndefined（只替换 null/undefined）。

**答不上来？** → 跑 `code/` 或看 `articles/`
