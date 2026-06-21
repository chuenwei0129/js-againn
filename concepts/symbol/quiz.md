# Symbol 自测题

## 一、复述讲解

> 费曼第二步：看代码，用规范术语讲清行为。本组都是规范直陈，输出不会因混淆答错——答得出外在表现才算入门。

**题目 1**
```javascript
const a = Symbol('foo');
const b = Symbol('foo');
console.log(a === b);
```

<details>
<summary>查看答案</summary>

**答案：** `false`

**考察点：** `Symbol()` 每次调用都创建新的唯一值，identity 就是这个值本身。描述字符串 `description` 只是给人看的调试信息，不参与 identity——故描述相同 ≠ 值相同。

</details>

---

**题目 2**
```javascript
const a = Symbol('foo');
console.log(a.description);
console.log(String(a));
```

<details>
<summary>查看答案</summary>

**答案：** `"foo"`, `"Symbol(foo)"`

**考察点：** `.description` 返回描述字符串 `"foo"`；`String(symbol)` 返回 `"Symbol(foo)"`（Symbol 不允许隐式转换，但允许显式 `String()` / `.toString()`）。另：`Symbol` 不是构造函数，`new Symbol()` 抛 TypeError。

</details>

---

**题目 3**
```javascript
const id = Symbol('id');
const user = { [id]: 123, name: 'seven' };
console.log(Object.keys(user));
console.log(JSON.stringify(user));
```

<details>
<summary>查看答案</summary>

**答案：** `["name"]`, `{"name":"seven"}`

**考察点：** Symbol-keyed 属性默认不参与普通枚举——`Object.keys()`、`for...in`、`JSON.stringify` 只枚举字符串 key，自动忽略 symbol 属性。它们承载的是运行时钩子，不是业务数据。

</details>

---

**题目 4**
```javascript
const s1 = Symbol.for('shared');
const s2 = Symbol.for('shared');
console.log(s1 === s2);
console.log(Symbol.keyFor(s1));
console.log(Symbol.keyFor(Symbol('foo')));
```

<details>
<summary>查看答案</summary>

**答案：** `true`, `"shared"`, `undefined`

**考察点：** `Symbol.for(key)` 查找全局 Symbol 注册表（`[[GlobalSymbolRegistry]]`），相同 key 返回同一个 Symbol；`Symbol.keyFor()` 反查注册 key，未注册的 Symbol（`Symbol('foo')`）返回 `undefined`。普通 `Symbol()` 的 identity 由值本身决定，共享 `Symbol.for()` 的 identity 由注册 key 决定。

</details>

---

**题目 5**
```javascript
const obj = {
  *[Symbol.iterator]() { yield 1; yield 2; }
};
console.log([...obj]);
console.log(Array.isArray(obj));
```

<details>
<summary>查看答案</summary>

**答案：** `[1, 2]`, `false`

**考察点：** `for...of`、展开运算符 `...` 不检查对象是不是 Array，只检查 `obj[Symbol.iterator]` 是否存在且是函数（`typeof obj[Symbol.iterator] === 'function'`）。这就是语言级 duck typing——行为由协议决定，不由类型决定。

</details>

---

## 二、暴露盲区

> 费曼第三步：陷阱场景探测概念混淆。本组每题的输出都与常见误解相反——做错说明有地方没真懂，回 `articles/` 对应章节重看。

**题目 6**
```javascript
const sym = Symbol('test');
const obj = { [sym]: 'value' };
console.log(obj[sym]);
console.log(obj.sym);
console.log(obj['sym']);
```

<details>
<summary>查看答案</summary>

**答案：** `"value"`, `undefined`, `undefined`

**考察点：** Symbol 必须用中括号 `obj[sym]` 访问。`obj.sym` 等价于 `obj["sym"]`，访问的是字符串 `"sym"`，不是 Symbol——Symbol 与字符串是两套独立命名空间。

**盲区：** 以为 `obj.sym` 能拿到 Symbol 属性。点访问永远走字符串。

</details>

---

**题目 7**
```javascript
const id = Symbol('id');
const obj = { [id]: 1, name: 'seven' };

console.log(Object.keys(obj));
console.log(Object.getOwnPropertySymbols(obj));
console.log(Reflect.ownKeys(obj));
```

<details>
<summary>查看答案</summary>

**答案：** `["name"]`, `[Symbol(id)]`, `["name", Symbol(id)]`

**考察点：** Symbol 属性默认不参与普通枚举，但**不是隐藏属性**——`Object.getOwnPropertySymbols()` 拿自身所有 symbol 属性，`Reflect.ownKeys()` 同时拿字符串和 symbol 属性。

**盲区：** 以为 Symbol 属性被"隐藏"了拿不到。它只是默认跳过普通枚举，仍可显式获取。

</details>

---

**题目 8**
```javascript
const sym = Symbol('test');
try { +sym; } catch (e) { console.log(e.constructor.name); }
try { '' + sym; } catch (e) { console.log(e.constructor.name); }
try { String(sym); } catch (e) { console.log('caught'); }
```

<details>
<summary>查看答案</summary>

**答案：** `"TypeError"`, `"TypeError"`, （无输出，不抛）

**考察点：** Symbol 没有合理的数值语义，禁止隐式转换——`+sym`（ToNumber）、`'' + sym`（ToPrimitive 走字符串 hint）都抛 TypeError。但显式 `String(sym)` 合法，返回 `"Symbol(test)"`。

**盲区：** 以为 Symbol 能像其他原始值一样隐式转字符串/数字。

</details>

---

**题目 9**
```javascript
class Even {
  static [Symbol.hasInstance](num) {
    return num % 2 === 0;
  }
}
console.log(2 instanceof Even);
console.log(3 instanceof Even);
```

<details>
<summary>查看答案</summary>

**答案：** `true`, `false`

**考察点：** `instanceof` 的判定逻辑可被 `Symbol.hasInstance` 改写——runtime 检查 `Ctor[Symbol.hasInstance]`，把"如何判定归属"这个决策权交给构造函数自己。

**盲区：** 以为 `instanceof` 是铁板一块、只能沿原型链判定。它是个可插拔的 runtime hook。

</details>

---

**题目 10**
```javascript
const arr = [1, 2, 3];
arr[Symbol.isConcatSpreadable] = false;
console.log([].concat(arr).length);
console.log([].concat(arr));
```

<details>
<summary>查看答案</summary>

**答案：** `1`, `[[1, 2, 3]]`

**考察点：** `Symbol.isConcatSpreadable` 控制数组在 `concat` 时是否被展开。设为 `false` 后，`arr` 被当成单个元素整体拼接，结果长度为 1。

**盲区：** 以为 `concat` 一定展开数组。展开行为受 `Symbol.isConcatSpreadable` 控制。

</details>

---

## 三、简化输出

> 费曼第四步：手写实现或用大白话教别人。能造出来、讲明白才算真懂——背术语不算。

**题目 11**

写一个 `Range` 类，支持 `for...of` 遍历：

```js
for (const n of new Range(1, 5)) {
  console.log(n); // 1, 2, 3, 4, 5
}
```

<details>
<summary>查看参考答案</summary>

```js
class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;
    return {
      next() {
        return current <= end
          ? { value: current++, done: false }
          : { done: true };
      }
    };
  }
}
```

**自检：**
- 用了 `[Symbol.iterator]` 而不是普通方法名？（协议入口标识）
- `next()` 返回 `{ value, done }` 格式？（Iterator Protocol 的结构契约）
- 遍历结束时返回 `{ done: true }`（没有 value）？

**考察点：** 能落地 Iterable Protocol——`Symbol.iterator` 是入口标识，调用它返回一个带 `next()` 的迭代器对象，`next()` 吐 `{ value, done }` 直到 `done: true`。

</details>

---

**题目 12**

写一个 `Money` 类，支持模板字符串和 `+` 运算：

```js
const price = new Money(100, 'CNY');
console.log(`价格: ${price}`);  // '价格: ¥100'
console.log(price + 50);        // 150
```

<details>
<summary>查看参考答案</summary>

```js
class Money {
  constructor(amount, currency) {
    this.amount = amount;
    this.currency = currency;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'string') {
      const symbols = { CNY: '¥', USD: '$' };
      return `${symbols[this.currency] || this.currency}${this.amount}`;
    }
    return this.amount; // number 或 default
  }
}
```

**自检：**
- `hint === 'string'` 时返回格式化字符串？
- 其他 hint（`'number'`、`'default'`）时返回数值？
- 没用 `toString()` + `valueOf()` 这对旧方案？（`Symbol.toPrimitive` 一次接管所有 hint）

**考察点：** 能落地 `Symbol.toPrimitive` hook——`${price}` 走 string hint，`price + 50` 走 default hint，对象自己决定每种 hint 返回什么。

</details>

---

**题目 13**

有人问："`Symbol.iterator` 就是迭代协议，对吧？"——请用日常语言向Ta讲清 `Symbol.iterator` 和"迭代协议"的关系。

**不许只甩术语**，要讲清两者的边界。

<details>
<summary>查看参考讲解</summary>

打个比方：`Symbol.iterator` 是一张**门禁卡**，迭代协议是大楼里的**可迭代通道**。

- 门禁卡本身不是通道。它只是个稳定的标识，告诉 runtime "去这个位置找迭代能力"。
- 真正的协议是找到入口之后的**行为契约**：调用它必须返回一个对象，这个对象必须有 `next()` 方法，`next()` 必须返回 `{ done, value }`，如此反复直到 `done` 为 `true`。这部分由规范文字规定，跟 Symbol 无关。

所以 `Symbol.iterator` 解决的是"协议入口怎么稳定定位、不会撞名"（它和业务字段共享同一个对象，但独立命名空间）；而"协议本身长什么样"是另一回事。

把这两层分清，才不会把 Symbol 和 protocol 混为一谈。

**考察点：** 费曼第四步——能讲清"协议入口标识"与"协议本身的结构契约"是两层。讲不清说明把 Symbol 等同于协议了。

</details>

---

## 评分

- **11-13/13：** 掌握良好
- **8-10/13：** 基础扎实，错题对应章节重看
- **7/13 以下：** 建议完整复习 `articles/`
