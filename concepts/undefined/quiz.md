# undefined 自测题

## 基础题（必须全对）

**题目 1**
```javascript
var x;
console.log(x);
console.log(({}).foo);
function f(){}
console.log(f());
console.log(typeof a);  // a 从未声明
```

<details>
<summary>查看答案</summary>

**答案：** `undefined`, `undefined`, `undefined`, `"undefined"`

**考察点：** 四种语法特征毫无共同之处的机制（变量声明 / 属性访问 / 函数调用 / typeof 未声明），分属三套独立系统（Binding / Reference / Completion），全部收敛到 undefined——ECMAScript 对运行时缺席的统一编码

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
- `var a`：binding 已创建用 undefined 填充窗口期（hoisting 只是表象）
- `let b`：binding exists ≠ readable，未初始化时读取抛 ReferenceError。TDZ 不是对 undefined 的否定，初始化后缺席仍编码为 undefined

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

**答案：** `undefined`，`TypeError`，`undefined`，`false`

**考察点：**
- `obj.foo`：`[[Get]]` 查找失败，HasProperty 为 false → undefined
- `obj.foo.bar`：第一步 `obj.foo` 得 undefined，第二步 `undefined.bar` 对 primitive 取属性 → TypeError
- 数组空洞：HasProperty 为 false → undefined；`1 in` 为 false 说明连属性都没有

</details>

---

**题目 4**
```javascript
console.log(typeof a);  // a 从未声明
console.log(a);
```

<details>
<summary>查看答案</summary>

**答案：** `"undefined"`，`ReferenceError`

**考察点：** typeof 是 ECMAScript 唯一允许 unresolvable Reference 安静失败的运算符——拿到 unresolvable Reference 直接返回 "undefined"（出于 Web 兼容，特性检测依赖它）；普通 ResolveBinding 失败则抛 ReferenceError

</details>

---

**题目 5**
```javascript
function f() {}
function g() { return; }
function h() { return 42; }

console.log(f(), g(), h());
```

<details>
<summary>查看答案</summary>

**答案：** `undefined undefined 42`

**考察点：**
- `f()`：函数体 `[[Value]]` = empty，UpdateEmpty 换成 undefined
- `g()`：`return;` 直接写 `{Type:"return", Value:undefined}`，不经 UpdateEmpty
- f 和 g 结果都是 undefined，但 Completion `[[Type]]` 不同（normal vs return）
- `h()`：返回真实值，`[[Value]]` 不是 empty，不涉及 UpdateEmpty

</details>

---

## 进阶题（理解核心机制）

**题目 6**
```javascript
console.log(void (1 + 2));
console.log(1 + 2);
```

<details>
<summary>查看答案</summary>

**答案：** `undefined`, `3`

**考察点：** void 不是「获取 undefined」，而是把 `1+2` 的结果 3 扔掉，把 Completion `[[Value]]` 重编码为 undefined。undefined 负责表示缺席，void 负责制造缺席

</details>

---

**题目 7**
```javascript
// 以下说法对吗？
// "函数没有 return 时返回 undefined，是因为 undefined 是 Completion 的默认值"
```

<details>
<summary>查看答案</summary>

**答案：** 不对。

**考察点：**
- 无 return 的函数，函数体 Completion 是 `{Type: normal, Value: empty}`，empty 是规范内部占位符（不是 undefined）
- 经 UpdateEmpty 把 empty 换成 undefined，你才看到 undefined
- undefined 不是 Completion 天生携带的默认值，而是 Empty Completion 暴露给用户代码时的统一编码

</details>

---

**题目 8**
```javascript
const { a = 1 } = {};
const { b = 1 } = { b: null };
function f(x = 1) { return x; }

console.log(a, b, f(undefined), f(null));
```

<details>
<summary>查看答案</summary>

**答案：** `1 null 1 null`

**考察点：** 默认值机制判断的是「缺席」(undefined) 而非假值——`{}.a` 是 undefined 触发回退；`null` 是程序员的主动语义，保留；`f(undefined)` 等于没传触发默认，`f(null)` 明确传了空值保留

</details>

---

**题目 9**
```javascript
console.log(0 ?? "default");
console.log(0 || "default");
console.log(null ?? "default");
console.log("" ?? "default");
```

<details>
<summary>查看答案</summary>

**答案：** `0`, `"default"`, `"default"`, `""`

**考察点：** `??` 基于 IsNullOrUndefined（只替换 null/undefined），`||` 基于 ToBoolean（所有 falsy 被替换）。`0` 和 `""` 是合法值，`??` 保留、`||` 吃掉

</details>

---

**题目 10**
```javascript
{
  const undefined = 123;
  console.log(undefined);
  console.log(typeof undefined);
}
console.log(typeof undefined);
console.log(void 0);
```

<details>
<summary>查看答案</summary>

**答案：** `123`, `"number"`, `"undefined"`, `undefined`

**考察点：**
- undefined 不是保留字，语法树里是 Identifier，可被局部遮蔽
- `typeof undefined` 里的 undefined 先做名字解析（拿到 123）再做 typeof
- 全局 undefined 是 `globalThis.undefined` 属性（ES5 起 writable:false），但局部遮蔽仍生效
- `void 0` 是永远可靠的取值出口，不受遮蔽影响

</details>

---

**题目 11**
```javascript
console.log(JSON.stringify({ a: undefined, b: null }));
console.log(JSON.stringify([undefined, null]));
```

<details>
<summary>查看答案</summary>

**答案：** `'{"b":null}'`, `'[null,null]'`

**考察点：** undefined 是运行时缺席，JSON 无法表达——对象属性中被忽略，数组中被替换为 null；null 是显式数据，始终保留。呼应 null vs undefined：引擎说的没有 vs 程序员说的没有

</details>

---

## 评分

- **10-11/11：** ✓ 掌握良好
- **8-9/11：** 基础扎实，错题对应章节重看
- **7/11 以下：** 建议完整复习 `articles/`
