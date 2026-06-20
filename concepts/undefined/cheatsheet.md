# undefined 速查卡

## 核心概念

undefined = ECMAScript 对运行时「缺席」(absence) 的统一编码
三套彼此独立的系统全部收敛到同一个 primitive undefined

## 一句话总结

> undefined 不是某一种空，它是 ECMAScript 在运行时反复使用的一个统一信号。

## 三套缺席系统

| 系统 | 缺席类型 | 触发场景 | 规范机制 |
|---|---|---|---|
| Binding | 值还没来 | `var`/`let` 未赋值、参数未传 | binding 创建后用 undefined 初始化 |
| Reference | 值找不到 | 属性不存在、数组空洞、未声明变量 | `[[Get]]` 查找失败 / unresolvable Reference |
| Completion | 值没产生 | 函数无返回、`void`、`eval` | UpdateEmpty 把 empty 换成 undefined |

设计意图：一种缺席，一个值，一条判断路径。代价是 undefined 不再携带「来自哪个系统」的信息，但那正是设计意图——绝大多数时候只需知道「这里本应有结果，但缺席了」。

## Binding System：值还没来

```js
var x;            // undefined — binding 已创建，值未到达
let y;            // undefined — 初始化后同上
console.log(z);   // ReferenceError — let z 的 TDZ，binding exists ≠ readable
let z = 1;
function f(a){}   // f() → a === undefined，参数 binding 已创建
```

- `var x = 1`：先创建 binding（undefined 填充窗口期），再赋值。hoisting 只是表象。
- `let`/`const`：binding exists → initialized → readable，未初始化时读取抛 ReferenceError（TDZ）。
- TDZ 不是对 undefined 的否定；初始化之后缺席仍编码为 undefined。

## Reference System：值找不到

```js
({}).foo;         // undefined — [[Get]] 查找失败，HasProperty 为 false
[1,,3][1];        // undefined — 数组空洞，HasProperty 为 false
typeof a;         // 'undefined' — a 从未声明，unresolvable Reference 安静失败
a;                // ReferenceError — 普通 ResolveBinding 失败
```

- 属性访问走 `[[Get]]`：HasProperty 为 false → 返回 undefined。undefined 是查找失败后引擎给的结果，不是存进去的。
- `obj.foo.bar` 抛 TypeError：第一步 `obj.foo` 得 undefined，第二步 `undefined.bar` 对 primitive 取属性。
- `?.` 不创造 undefined，只让 property miss 产生的 undefined 安全传播。
- `typeof` 是唯一允许 unresolvable Reference 安静失败的运算符——出于 Web 兼容（`if (typeof Promise !== 'undefined')` 特性检测）。

## Completion System：值没产生

```js
function f(){}     // undefined — 函数体 Completion 经 UpdateEmpty
function g(){return;} // undefined — 直接写 {Type:"return", Value:undefined}，不经 UpdateEmpty
void (1+2);        // undefined — void 把结果重编码为缺席
eval("var x=1;");  // undefined — 语句 Completion 暴露给用户代码
```

- 每段代码求值返回一个 Completion Record：`[[Type]]` + `[[Value]]` + `[[Target]]`，规范写作 `NormalCompletion(value)`。
- 不产出值的语句，`[[Value]]` 填占位符 `empty`（规范内部记账符号，你看不到）。
- **empty ≠ undefined**：UpdateEmpty 拿到 `[[Value]]` 为 empty 的信封就换成 undefined。
- `return;` 的 undefined 是直接写进信封的，不经 UpdateEmpty；无 return 的 undefined 是 UpdateEmpty 补出来的。两者 `[[Type]]` 不同（return vs normal），只是 `[[Value]]` 恰好都是 undefined。
- void 不是「获取 undefined」，而是「我知道有结果，但主动抹成缺席」。undefined 负责表示缺席，void 负责制造缺席。

## 默认值机制：统一编码的回报

```js
const {a = 1} = {};         // a === 1 — {}.a 是 undefined，启动默认
const {a = 1} = {a: null};  // a === null — null 不触发回退
function f(x = 1){}         // f(undefined) → 1，f(null) → null
x ?? 'default';             // 只对 null/undefined 回退
```

判断的都是「缺席」(undefined)，不是假值。正因为所有缺席统一编码成 undefined，默认参数、可选链、空值合并、解构默认值只需要一条规则就能覆盖所有场景。

## undefined vs null

| 维度 | undefined | null |
|---|---|---|
| 谁说的 | 引擎（被动产物） | 程序员（主动语义） |
| `typeof` | `"undefined"` | `"object"`（历史 Bug） |
| 语法地位 | Identifier（非保留字） | Literal（保留字） |
| 默认值机制 | 触发回退 | 保留 |
| JSON | 丢弃 / 替换为 null | 保留 |
| `Number()` | `NaN` | `0` |

## 抽象操作对照

| 抽象操作 | undefined 的角色 |
|---|---|
| ResolveBinding | 名字解析失败 → ReferenceError（typeof 除外） |
| GetValue | 从 Reference 取值，property miss → undefined |
| `[[Get]]` / HasProperty | HasProperty 为 false → undefined |
| UpdateEmpty | Completion `[[Value]]` = empty → undefined |
| ToNumber | `NaN` |
| ToBoolean | `false` |
| IsNullOrUndefined | `true` |

## 两个彩蛋

- **undefined 不是保留字**：语法树里是 Identifier，靠 `globalThis.undefined` 全局属性提供（ES5 起 writable:false / configurable:false），可被局部遮蔽。可靠取值用 `void 0`。
- **void 为谁而生**：早期 `javascript:` 协议链接里，表达式结果非 undefined 会覆盖整个页面；void 保证返回 undefined。语义后来泛化为「执行表达式但丢弃结果」。

## 3 个核心问题（2 分钟自测）

1. **为什么四种语法特征毫无共同之处的机制（var 声明 / 属性访问 / 函数调用 / typeof 未声明）都得到 undefined？**
   它们分属三套独立系统（Binding / Reference / Completion），各有内部缺席状态，ECMAScript 把所有运行时缺席统一编码成 undefined。

2. **empty 和 undefined 有什么区别？**
   empty 是 Completion Record 里「不产出值」的规范内部占位符，你看不到；undefined 是运行时真实值。UpdateEmpty 把 empty 暴露给用户代码时换成 undefined。

3. **typeof 未声明变量为什么不报错？**
   typeof 是 ECMAScript 唯一允许 unresolvable Reference 安静失败的运算符，拿到 unresolvable Reference 直接返回 "undefined"——出于 Web 兼容，海量代码依赖它做特性检测。

**答不上来？** → 跑 `code/` 或看 `articles/`
