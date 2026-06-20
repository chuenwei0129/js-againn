# Symbol 自测题

## 读懂题

**题目 1**
```javascript
const a = Symbol('foo');
const b = Symbol('foo');
console.log(a === b);
```

<details>
<summary>查看答案</summary>

**答案：** `false`  
**考察点：** Symbol 的唯一性，描述字符串不影响 identity

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
**考察点：** Symbol 的基本 API

</details>

---

**题目 3**
```javascript
const id = Symbol('id');
const user = { [id]: 123, name: 'seven' };
console.log(Object.keys(user));
console.log(user.id);
```

<details>
<summary>查看答案</summary>

**答案：** `["name"]`, `undefined`  
**考察点：** Symbol 属性不可枚举，Symbol key 不等于字符串 key

</details>

---

**题目 4**
```javascript
const s1 = Symbol.for('shared');
const s2 = Symbol.for('shared');
console.log(s1 === s2);
console.log(Symbol.keyFor(s1));
```

<details>
<summary>查看答案</summary>

**答案：** `true`, `"shared"`  
**考察点：** Symbol.for() 创建共享 Symbol

</details>

---

**题目 5**
```javascript
const sym = Symbol('test');
const obj = { [sym]: 'value' };
console.log(obj[sym]);
console.log(obj['sym']);
```

<details>
<summary>查看答案</summary>

**答案：** `"value"`, `undefined`  
**考察点：** Symbol 必须用中括号访问，不能用字符串

</details>

---

## 想通题

**题目 6**
```javascript
const obj = {
  [Symbol.iterator]() {
    let i = 0;
    return {
      next() {
        return i < 3 ? { value: i++, done: false } : { done: true };
      }
    };
  }
};
console.log([...obj]);
```

<details>
<summary>查看答案</summary>

**答案：** `[0, 1, 2]`  
**考察点：** 自定义可迭代对象

</details>

---

**题目 7**
```javascript
const obj = {
  value: 42,
  [Symbol.toPrimitive](hint) {
    return hint === 'string' ? 'hello' : this.value;
  }
};
console.log(`${obj}`);
console.log(+obj);
```

<details>
<summary>查看答案</summary>

**答案：** `"hello"`, `42`  
**考察点：** Symbol.toPrimitive 根据 hint 返回不同类型

</details>

---

**题目 8**
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
**考察点：** Symbol.hasInstance 自定义 instanceof 行为

</details>

---

**题目 9**
```javascript
const arr = [1, 2, 3];
arr[Symbol.isConcatSpreadable] = false;
console.log([].concat(arr).length);
```

<details>
<summary>查看答案</summary>

**答案：** `1`（arr 被当成单个元素，结果是 `[[1, 2, 3]]`）  
**考察点：** Symbol.isConcatSpreadable 控制 concat 展开行为

</details>

---

**题目 10**
```javascript
const sym = Symbol('test');
try { +sym; } catch (e) { console.log(e.constructor.name); }
try { '' + sym; } catch (e) { console.log(e.constructor.name); }
```

<details>
<summary>查看答案</summary>

**答案：** `"TypeError"`, `"TypeError"`  
**考察点：** Symbol 不允许隐式类型转换

</details>

---

## 写出题

**题目 11**

写一个 `Range` 类，支持 `for...of` 遍历：

```js
for (const n of new Range(1, 5)) {
  console.log(n); // 1, 2, 3, 4
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
- 用了 `[Symbol.iterator]` 而不是普通方法名？
- `next()` 返回 `{ value, done }` 格式？
- 遍历结束时返回 `{ done: true }`（没有 value）？

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
- 没用 `toString()` + `valueOf()` 这对旧方案？

</details>

---

**题目 13**

解释：为什么 `Symbol('foo') === Symbol('foo')` 是 `false`？如果需要共享 Symbol 应该怎么做？写代码演示。

<details>
<summary>查看参考答案</summary>

```js
// 唯一性：每次 Symbol() 调用都创建新的 identity
const a = Symbol('foo');
const b = Symbol('foo');
console.log(a === b); // false

// 共享 Symbol：Symbol.for() 从全局注册表取
const c = Symbol.for('shared');
const d = Symbol.for('shared');
console.log(c === d); // true

// 反查
console.log(Symbol.keyFor(c)); // 'shared'
```

**本质：** `Symbol('foo')` 的参数只是描述字符串（description），不影响 identity。`Symbol.for()` 维护一个全局注册表（[[GlobalSymbolRegistry]]），相同 key 返回同一个 Symbol。

</details>

---

## 评分

- **13/13：** ✓ 掌握良好
- **10-12/13：** 基础扎实，错题对应章节重看
- **9/13 以下：** 建议完整复习 `articles/`
