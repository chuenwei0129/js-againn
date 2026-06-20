# Symbol 自测题

## 基础题（必须全对）

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

## 进阶题（理解核心机制）

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

## 评分

- **9-10/10：** ✓ 掌握良好
- **7-8/10：** 基础扎实，错题对应章节重看
- **6/10 以下：** 建议完整复习 `article.md`
