---
title: 'JavaScript Number 的本质 —— 一种类型如何同时承载整数、小数与"不是数字"'
created: 2023-02-23
updated: 2026-06-05
tags:
  - JavaScript
  - Number
description: '从"JavaScript 没有整数类型"这个反直觉事实出发，拆解 Number 作为 IEEE 754 双精度浮点数的全部行为——安全整数边界、精度丢失、NaN 的自反性悖论、±0 的方向记忆、ToNumber 类型转换、=== 与 Object.is 的分歧、Number API 的实战陷阱，以及 BigInt 为什么是 JavaScript 的第二套数值运行时而非 Number 的升级。'
status: evergreen
---
# 第一部分

## 一个疯狂的设计

1995 年。

Brendan Eich 被要求在十天内做出 JavaScript。

时间紧到什么程度？

根本来不及设计复杂的数字体系。

于是他做了一个极其大胆的决定：

> JavaScript 只有一种数字类型。

没有：

```java
byte
short
int
long
float
double
```

没有：

```c
int
long
float
double
```

只有：

```js
Number
```

今天看起来理所当然。

但实际上这是现代主流语言里极少见的设计。

你写：

```js
let age = 18;
let pi = 3.1415926;
```

结果：

```js
typeof age
// "number"

typeof pi
// "number"
```

甚至：

```js
typeof Infinity
// "number"

typeof NaN
// "number"
```

也是 Number。

整个 JavaScript 世界的数字秩序，都建立在这个决定之上。

---

# 第二部分

## Number到底是什么

前两篇我们已经讲过：

- 浮点数为什么出现
    
- IEEE754 如何编码
    

因此这里只记住一个结论：

> JavaScript 的 Number，本质上就是 IEEE754 双精度浮点数（Binary64）。

也就是说：

```js
1
```

其实不是整数。

而是：

```text
1.0
```

这个双精度浮点数。

同样：

```js
100
```

本质也是：

```text
100.0
```

甚至：

```js
9007199254740991
```

仍然是浮点数。

很多刚接触 JavaScript 的人都会问：

> 那整数去哪了？

答案是：

> 从来就没有整数。

只有看起来像整数的浮点数。

这里导向 BigInt

---

# 第三部分

## Number的边界

数学里的实数没有边界。

但 Number 有。

打开控制台：

```js
Number.MAX_VALUE
```

得到：

```js
1.7976931348623157e+308
```

这是 Number 能表示的最大有限值。

继续：

```js
Number.MAX_VALUE * 2
```

结果：

```js
Infinity
```

溢出了。

另一边：

```js
Number.MIN_VALUE
```

得到：

```js
5e-324
```

很多人第一次看到会误会。

它并不是：

```text
最小负数
```

而是：

```text
最接近0的正数
```

因为 IEEE754 的世界里：

```text
0和非0之间
还能继续细分
```

---

# 第四部分

## 53位精度统治世界

如果说 Number 有什么最重要的秘密。

那就是：

```text
53位有效数字
```

这是整个 Number 世界最重要的一条规则。

它直接决定了：

```js
Number.MAX_SAFE_INTEGER
```

的存在。

结果：

```js
9007199254740991
```

也就是：

2^{53}-1

为什么不是：

```text
2^60
```

为什么不是：

```text
2^64
```

因为 Number 只有 53 位有效精度。

超过这个范围以后。

不同整数会开始挤到同一个浮点数上。

例如：

```js
9007199254740992 === 9007199254740993
```

结果：

```js
true
```

第一次看到的人都会怀疑人生。

但对于 IEEE754 来说。

这是完全合理的。

因为这两个整数已经落在同一个表示点上了。

从这里开始。

Number 不再能安全地区分相邻整数。

这就是：

```js
Number.MAX_SAFE_INTEGER
```

名字里的 Safe 的含义。

---

# 第五部分

## 为什么会有BigInt

53位够吗？

对于年龄：

```js
18
```

够。

对于价格：

```js
99.99
```

够。

对于绝大多数业务系统：

```js
1000000000
```

也够。

但如果遇到：

- 雪花ID
    
- 数据库主键
    
- 区块链交易哈希
    
- 密码学运算
    

53位很快就不够了。

于是 ES2020 引入：

```js
123n
```

这就是 BigInt。

例如：

```js
9007199254740993n
```

依然精确。

不会丢失任何位。

但代价是：

```js
1n + 1
```

直接报错。

因为：

```text
BigInt
≠
Number
```

它们属于两套不同的数字体系。

---

# 第六部分

## Infinity：无穷大

当 Number 超出自己的能力范围时。

它不会报错。

而是进入一种特殊状态：

```js
Infinity
```

例如：

```js
1 / 0
```

结果：

```js
Infinity
```

继续：

```js
Infinity + 1
```

还是：

```js
Infinity
```

甚至：

```js
Infinity * 1000000
```

仍然：

```js
Infinity
```

Infinity 本身也是 Number。

```js
typeof Infinity
```

结果：

```js
"number"
```

---

# 第七部分

## NaN：最奇怪的数字

另一个特殊值：

```js
NaN
```

意思是：

```text
Not a Number
```

例如：

```js
0 / 0
```

结果：

```js
NaN
```

或者：

```js
Number("hello")
```

结果：

```js
NaN
```

最离谱的是：

```js
NaN === NaN
```

结果：

```js
false
```

这是整个 JavaScript 最反直觉的行为之一。

原因在上一篇 IEEE754 中已经解释过：

> NaN 不等于任何值。
> 
> 包括它自己。

因此正确写法是：

```js
Number.isNaN(value)
```

而不是：

```js
value === NaN
```

---

# 第八部分

## +0 与 -0

很多开发者工作几年都不知道：

```js
+0
```

和：

```js
-0
```

同时存在。

看起来：

```js
+0 === -0
```

结果：

```js
true
```

但实际上：

```js
Object.is(+0, -0)
```

结果：

```js
false
```

最大的区别出现在倒数运算：

```js
1 / +0
```

得到：

```js
Infinity
```

而：

```js
1 / -0
```

得到：

```js
-Infinity
```

这同样来自 IEEE754 的设计。

---

# 第九部分

## 0.1 + 0.2 为什么不等于 0.3

终于来到那个最著名的问题。

```js
0.1 + 0.2
```

结果：

```js
0.30000000000000004
```

如果你已经读过前两篇。

答案其实已经知道了。

因为：

```text
0.1
```

无法被二进制有限表示。

只能存储一个最接近它的近似值。

```text
0.2
```

也是如此。

两个近似值相加。

结果自然也是近似值。

所以：

```js
0.1 + 0.2 === 0.3
```

结果：

```js
false
```

这不是 JavaScript 的 Bug。

这是浮点数的宿命。

---

# 第十部分

## Number其实是一套工具箱

除了存数字。

ECMAScript 还给 Number 配套了一整套工具。

检测：

```js
Number.isFinite()
Number.isNaN()
Number.isInteger()
Number.isSafeInteger()
```

格式化：

```js
toFixed()
toPrecision()
toExponential()
```

进制转换：

```js
toString(2)
toString(16)
```

国际化：

```js
Intl.NumberFormat()
```

这些 API 解决的已经不是：

```text
数字是什么
```

而是：

```text
数字怎么和人交流
```

---

# 结尾

三篇文章到这里。

我们终于走完整条链路。

第一篇讲：

```text
为什么需要浮点数
```

第二篇讲：

```text
IEEE754如何实现浮点数
```

第三篇讲：

```text
JavaScript如何建立在IEEE754之上
```

当你写下：

```js
let price = 19.99;
```

你以为自己在操作一个普通数字。

实际上。

背后是一套拥有：

- 符号位
    
- 指数位
    
- 尾数位
    

的 IEEE754 双精度浮点系统。

它给了 JavaScript 简洁统一的数字模型。

也带来了：

```js
0.1 + 0.2
```

这样的经典问题。

理解 Number。

本质上不是理解一个 JavaScript 类型。

而是在理解：

> 计算机里的数字，为什么永远不是数学里的数字。