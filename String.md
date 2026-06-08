---
title: 一个 emoji，揭开 JavaScript 字符串的底层真相
created: 2023-02-23
updated: 2025-09-07
tags:
  - JavaScript
  - String
description: 从一个 emoji 截断 bug 出发，深入 Unicode、UTF-16、surrogate pair、grapheme cluster，彻底理解 JavaScript 字符串的设计取舍与现代最佳实践。
status: evergreen
---

你正在做一个再普通不过的需求：

> 昵称最多显示 1 个字符，超出部分截断。

于是你很自然地写下：

```js
const name = '👍小明';

name.slice(0, 1);
```

你以为结果会是 `'👍'`，但实际得到：

```js
'\ud83d'
```

不是 👍，不是「小」，而是一个你从没见过的、毫无意义的半截字符。页面上显示成了乱码方块。

你愣住了，于是又看了下长度：

```js
name.length; // 4
```

明明 👍 是 1 个字符、「小明」是 2 个字符，怎么会是 4？

如果你继续深挖：

```js
'👍'.length === 2
```

甚至：

```js
'👨‍👩‍👧‍👦'.length === 11
```

一个 emoji，长度 11？

这背后藏着 Unicode、UTF-16、surrogate pair、code point、grapheme cluster、JavaScript 字符串设计、现代 Unicode 的复杂性。理解它们之后，你会意识到：**JavaScript 字符串根本不是"字符数组"。**

> **先剧透一下**：正确的截断方式是用 `Intl.Segmenter` 按 grapheme cluster 操作——后面第十二章会展开。但要理解*为什么*必须这么做，需要先搞清楚 JavaScript 字符串到底在哪个层级工作。

---

## 一、先说结论：JavaScript 操作的并不是"字符"

### JavaScript 字符串的 5 层模型

```txt
用户看到的字符（grapheme cluster）
        ↓
Unicode 码点（code point）
        ↓
UTF-16 编码单元（code unit）
        ↓
字节（UTF-8 / UTF-16）
        ↓
二进制
```

来看几个例子：

| 层级                       | 示例            | JavaScript API   |
| ------------------------ | ------------- | ---------------- |
| grapheme cluster（用户感知字符） | 👍🏻          | `Intl.Segmenter` |
| code point（Unicode 码点）   | U+1F44D       | `codePointAt()`  |
| code unit（UTF-16 编码单元）   | 0xD83D        | `charCodeAt()`   |
| byte（字节序列）               | `F0 9F 91 8D`（UTF-8）| `TextEncoder`    |

> **注意**：JS 引擎内部用的是 UTF-16，但 `TextEncoder` 默认输出 UTF-8——而 UTF-8 正是 Web、文件、数据库实际传输时使用的编码。所以上面展示的是 UTF-8 字节，也是你日常工作中更常打交道的格式。

> **注意**：这里说"UTF-16 是 JavaScript 的字符串模型"，指的是 **ECMAScript 规范层**的抽象。V8 等引擎内部实际上会对纯 ASCII 字符串做 8-bit 压缩存储，还有 Rope String 等优化结构——规范层和实现层不一定相同。但对开发者而言，你面对的行为就是 UTF-16 定义的。

**JavaScript 最大的问题在于：它暴露给开发者的底层抽象，是 UTF-16 code unit。**

于是 `str.length`、`str[i]`、`slice()`、`charAt()` 这些 API 操作的，本质上都不是"字符"，而是 **UTF-16 编码单元**。

理解这一点，后面所有"反直觉行为"都会突然变得合理。

但你可能还有疑问：UTF-16 到底是什么？为什么 JavaScript 要选它？要回答这个问题，得从最底层讲起。

---

## 二、Unicode：先统一"字符编号"

### 从 ASCII 到乱码时代

计算机只认识数字，想存文字就必须建立一张 `字符 → 数字` 的映射表。最早流行的是 ASCII：

```txt
A -> 65
B -> 66
```

ASCII 只有 128 个字符——英文字母、数字、标点、控制字符，美国够用了。但世界不只有英语，中文、日文、韩文怎么办？

于是各国开始发明自己的编码：GBK、Shift-JIS、Big5……结果就是**同一串字节，在不同编码里可能代表不同文字**。乱码时代开始了。

### Unicode：全球统一字符表

Unicode 的思路很简单：**给全世界每个字符分配一个唯一编号**，这个编号叫 **code point（码点）**。

```txt
'A'  -> U+0041
'好' -> U+597D
'👍' -> U+1F44D
```

注意 `U+1F44D = 128077`，已经超过了一个 16 位整数能表示的范围（0 ~ 65535）。

到这里，Unicode 解决的只是"给字符编号"的问题。但编号本身只是个数字——计算机真正存储和传输的是**字节**。数字怎么变成字节？这就引出了一个很多人混淆的概念。

---

## 三、编号怎么变成字节？Unicode ≠ UTF-8

很多人会误解"Unicode 不就是 UTF-8 吗？"其实不是。

Unicode 只做一件事：**给每个字符分配一个唯一编号**（"好" = U+597D）。但编号只是个数字，计算机真正存储和传输的是**字节**。怎么把编号变成字节？这就是 **编码** 的工作。

UTF（**U**nicode **T**ransformation **F**ormat）就是做这件事的——把 Unicode 编号转换成字节序列。后面的数字（8、16、32）表示"编码的基本单位是几位"：

打个比方：Unicode 是"给每个学生编一个学号 `22909`"，UTF-8 和 UTF-16 是"学号写到纸上"的不同格式——同一个学号，写法不同。

| 编码     | 写法                                           | 特点                          |
| ------ | -------------------------------------------- | --------------------------- |
| UTF-8  | 变长（1~4 字节），英文 1 字节，中文 3 字节                   | 兼容 ASCII、互联网标准              |
| UTF-16 | 以 16 位为一个编码单元（**码元**，code unit），大部分字符占 1 个码元 | Java / JavaScript / Windows |
| UTF-32 | 固定 4 字节                                      | 简单但浪费空间                     |

来看同一个字符 `'好'`（学号 U+597D = 22909）在不同编码下的字节表示：

```txt
UTF-8:  E5 A5 BD          → 3 字节
UTF-16: 59 7D              → 1 个码元（2 字节）
UTF-32: 00 00 59 7D        → 4 字节
```

同一个编号，三种写法。

**JavaScript 规范层使用 UTF-16**，但网络传输、文件、JSON 通常都是 UTF-8。所以一个字符串在 Web 中的旅程是：

```txt
磁盘 UTF-8 → 网络 UTF-8 → JS 引擎 UTF-16 → 网络 UTF-8 → 磁盘 UTF-8
```

JS 引擎内部是 UTF-16，外部世界基本都是 UTF-8。当你需要在两者之间搬运数据时，就需要做编码转换——`TextEncoder` / `TextDecoder` 就是干这个的：

```js
const encoder = new TextEncoder();

encoder.encode('你好').length; // 6 — UTF-8 字节数
'你好'.length;                 // 2 — UTF-16 码元数
```

一个有用的记忆：**今天 Web、Linux、macOS、HTTP、JSON、数据库几乎全部默认 UTF-8**。UTF-16 主要还保留在 JavaScript、Java、Windows API 这些历史系统里。

---

## 四、JavaScript 为什么选了 UTF-16？

现在你已经知道 Unicode 是什么、UTF-16 是什么了。答案要回到 1995 年。

那时候 Unicode 还只有 BMP（Basic Multilingual Plane，基本多文种平面，即 `U+0000 ~ U+FFFF` 这 65536 个码位），emoji 不存在，大多数字符都能用 16 位表示。UTF-16 意味着每个编码单元恰好是一个 16 位整数，能精确表达 `0 ~ 2^16 - 1`（即 0 ~ 65535）的全部取值——刚好覆盖整个 BMP。**这意味着在 BMP 范围内，一个码点（code point）恰好对应一个码元（code unit），1:1，简单又高效。** 当时所有人都觉得这肯定够用了，于是 JavaScript 直接采用 UTF-16 作为字符串内部模型——每个"字符位置"固定占 16 位。

这在当年是个非常合理的工程决策。

但后来 Unicode 疯狂扩容，emoji 出现了。很多字符已经超过了 16 位能表示的范围，UTF-16 不得不引入 **surrogate pair（代理对）**——用两个 16 位编码单元拼成一个字符。

这就是所有问题的源头。

---

## 五、BMP 与代理对：为什么 👍 的 length 是 2？

来看 `'👍'.length`，为什么是 2？

因为 `👍 -> U+1F44D` 已经超过 `U+FFFF`（BMP 的边界），一个 16 位编码单元装不下。UTF-16 会**用两个 code unit 拼成一个字符**，这就是 surrogate pair（代理对）。

### 👍 在内存里长什么样？

UTF-16 会把 `U+1F44D` 拆成：

```txt
0xD83D
0xDC4D
```

具体拆分规则：超出 BMP 的码点先减去 `0x10000`（`0x1F44D - 0x10000 = 0xF44D`），然后高 10 位加上 `0xD800` 得到前半代理（`0xD83D`），低 10 位加上 `0xDC00` 得到后半代理（`0xDC4D`）。

于是 `'👍'.length` 等于 2，因为 `.length` 数的是 **code unit 数量**，不是"字符数"。

知道了它在内存里怎么存的，那用 JS 怎么读呢？这里就涉及两代 API：

```js
// 旧 API：按 code unit 读，拿到的是代理对的两半
'👍'.charCodeAt(0).toString(16);  // 'd83d'
'👍'.charCodeAt(1).toString(16);  // 'dc4d'

// 新 API：按 code point 读，自动拼回完整码点
'👍'.codePointAt(0).toString(16); // '1f44d'
```

`charCodeAt` 拿到的是代理对的两半，`codePointAt` 才会正确拼回完整码点。

这只是其中一个 API。Unicode 越来越复杂，旧 API 又不能改（会破坏存量代码），于是 ES6 陆续打了一整批"补丁"。

---

## 六、ES6 补丁 API

### 转义语法的演进

ES5 时代必须手写代理对：

```js
'\uD83D\uDC4D' // 👍
```

ES6 开始可以直接写完整码点，明显更直观：

```js
'\u{1F44D}' // 👍
```

### ES6 新增的 Unicode 感知 API

Unicode 越来越复杂，但 JavaScript 又不能破坏旧 API，于是 ES6 开始新增"Unicode 感知"的 API：

| API                      | 用途              | 示例                                                                  |
| ------------------------ | --------------- | ------------------------------------------------------------------- |
| `codePointAt()`          | 获取完整码点          | `'👍'.codePointAt(0)` → `128077`                                    |
| `String.fromCodePoint()` | 从码点构造字符         | `String.fromCodePoint(0x1f44d)` → `'👍'`                            |
| `for...of`               | 码点感知遍历          | `for (const ch of '👍a')` 正确迭代 ⚠️ 对 ZWJ 组合 emoji（如 👨‍👩‍👧‍👦）仍会拆开 |
| `normalize()`            | Unicode 正规化     | `'é'.normalize('NFC') === 'é'.normalize('NFC')` → `true`            |
| `u` flag（正则）             | Unicode 感知匹配    | `/^.$/u.test('👍')` → `true`                                        |
| `v` flag（ES2024）         | 更精确的 Unicode 匹配 | `/^\p{RGI_Emoji}$/v`                                                |

---

## 七、为什么 slice 会把 emoji 劈成两半？

回到开头那个 bug：

```js
const name = '👍小明';
name.slice(0, 1);  // '\ud83d'
```

原因很简单：**`slice()` 按 code unit 切割**。它根本不知道 `0xD83D + 0xDC4D` 其实属于同一个字符，所以 `slice(0, 1)` 只切走了代理对前半截，得到一个非法 Unicode 字符串。

这不是 `slice` 一家的问题，几乎所有"按位置操作字符串"的旧 API 都有同样的毛病：

| 旧 API                                                             | 问题                     |
| ----------------------------------------------------------------- | ---------------------- |
| `str.length`                                                      | 数 code unit，emoji 长度翻倍 |
| `str[i]` / `str.charAt(i)` / `str.at(i)`                          | 取到代理对的半截               |
| `str.charCodeAt(i)` / `String.fromCharCode()`                     | 只能处理 16 位码元，超出 BMP 就出错 |
| `str.slice()` / `str.substring()` / `str.substr()`                | 按码元位置切割，可能劈开 emoji     |
| `str.indexOf()` / `str.lastIndexOf()`                             | 按码元搜索，可能停在代理对中间        |
| `str.split('')`                                                   | 按码元拆分，emoji 被拆成两半      |
| `/regex/`（无 `u` flag）以及基于正则的 `match()` / `search()` / `replace()` | `.` 匹配单个码元，匹配不了 emoji  |

因为这些 API 都诞生于"16 位字符肯定够用"的年代，操作的都是 code unit 而非 code point。

---

## 八、"码点"依然不等于"字符"

即使使用 `for...of` 遍历，问题也没有完全解决。来看两组对比：

```js
// 👍：1 个码点，但占 2 个码元（代理对）— for...of 可以正确处理
'👍'.length;       // 2（码元）
[...'👍'].length;  // 1（码点）✅

// 👨‍👩‍👧‍👦 = 👨 + ZWJ + 👩 + ZWJ + 👧 + ZWJ + 👦
// 7 个 emoji 码点 + 4 个 ZWJ = 11 个 UTF-16 码元
'👨‍👩‍👧‍👦'.length;       // 11（码元）
[...'👨‍👩‍👧‍👦'].length;  // 7（码点）❌ 依然不是用户看到的 1 个字符
```

`for...of` 解决了代理对的问题，但 👨‍👩‍👧‍👦 本质上是**多个 emoji + ZWJ（零宽连接符）** 组合出来的。类似的：

- `'👍🏻'` = 👍 + 肤色修饰符
- `'🇨🇳'` = 区域指示符 C + 区域指示符 N

所以 **code point 依然不是用户看到的"字符"**。

你可能有点恼火：code unit 不对，code point 也不对，那到底什么才对？

别急。这不是文章在刁难你——是"字符"这个概念本身就没有统一定义。我们能做的，是找一个**最接近用户感知**的层级。

---

## 九、grapheme cluster：最接近"用户看到的字符"

Unicode 里有这样一个概念，叫 **grapheme cluster（书写簇）**，也叫 user-perceived character（用户感知字符）。

它是 Unicode 最容易让人误解的一点：**"字符"根本没有统一定义。** grapheme cluster 不是"真正的字符"，它是现有定义里**最接近用户感知**的那一个。

ES2022 引入的 `Intl.Segmenter` 就是按照 grapheme cluster 来分割字符串的：

```js
const family = '👨‍👩‍👧‍👦';

const seg = new Intl.Segmenter('en', {
  granularity: 'grapheme',
});

[...seg.segment(family)].length; // 1
```

终于正确了。

**但有一个边界要清楚**：Intl.Segmenter 依赖系统提供的 Unicode 版本。不同浏览器、不同 Node 版本对新 emoji 的支持可能不一致——刚发布的 emoji 组合在旧系统上可能仍会被拆开。

---

## 十、为什么不直接按 grapheme cluster 存储？

读到这里你可能会问：既然 Intl.Segmenter 能正确识别字符，为什么 JavaScript 不直接把 grapheme cluster 作为底层模型？

**因为成本太高。**

如果 JS 把用户感知字符作为底层抽象，那么 `str[i]` 每次索引都需要：

- 扫描 Unicode 边界规则
- 判断代理对
- 判断组合字符
- 判断 ZWJ
- 判断 emoji 修饰符

而 Unicode 规则还在不断更新，随机访问成本会非常高。

所以 JavaScript 做了一个工程上的妥协：**使用 UTF-16 code unit 作为最小可寻址单位**，`str.length` 和 `str[i]` 都可以做到 O(1)。代价则是不符合人类对"字符"的直觉。

Intl.Segmenter 存在，正是为了在需要时弥补这个妥协——不是默认行为，而是按需使用。

这也意味着，同一个字符串，用不同层级去量，会得到不同的"长度"：

---

## 十一、字符串长度根本没有标准答案

同一个字符串 `'👨‍👩‍👧‍👦'` 可以有三种"长度"：

| 统计方式 | 结果 | 对应 API |
|---|---|---|
| UTF-16 code unit | 11 | `str.length` |
| Unicode code point | 7 | `[...str].length` |
| grapheme cluster | 1 | `[...seg.segment(str)].length` |

**"字符串长度"没有标准答案**——你必须先定义"字符"到底是什么意思。

---

## 十二、实战中的 Unicode 问题

理解了底层模型，来看实际项目中最常踩的坑。

### 1. 前端字符截断

现实项目里经常这样写：

```js
nickname.slice(0, 10)
```

结果 emoji 被截断、ZWJ 被破坏、数据库存储异常、UI 出现乱码。尤其 `'👨‍👩‍👧‍👦'.slice(0, 2)` 会得到非法 Unicode。

**正确做法**——用 `Intl.Segmenter` 按用户看到的字符处理：

```js
const seg = new Intl.Segmenter('zh', {
  granularity: 'grapheme',
});

// 统计长度
const chars = [...seg.segment(str)];
chars.length;

// 截断
chars
  .slice(0, 10)
  .map(x => x.segment)
  .join('');
```

### 2. 数据库长度限制

`VARCHAR(10)` 到底是 10 bytes、10 code units、10 code points、还是 10 grapheme clusters？不同数据库行为并不完全一致。

emoji 在 UTF-8（准确说 utf8mb4）中通常占 4 bytes，于是经常出现**前端校验通过、数据库插入失败**这种线上问题。

### 3. 正则里的 Unicode 坑

默认正则也是按 code unit 工作：

```js
/^.$/.test('👍');    // false — 👍 = 2 个 code unit
/^.$/u.test('👍');   // true  — 加上 u flag 进入 Unicode 感知模式
```

ES2018 引入的 `\p{}` 可以按 Unicode 属性匹配：

```js
/\p{Script=Han}+/u.test('你好');  // true
/\p{Letter}/u;                     // 匹配所有字母
```

ES2024 的 `v` flag 可以更准确处理复杂 emoji（如 `/^\p{RGI_Emoji}$/v`），但目前兼容性仍在完善。

---

## 十三、同一根源的更多陷阱

emoji 长度问题是 Unicode 复杂性的冰山一角。同一个底层原因还会制造其他 bug，这里列三个最常遇到的：

### 1. 长得一样，不一定相等（normalize）

```js
const a = 'é';        // U+00E9
const b = 'e\u0301'; // e + COMBINING ACUTE ACCENT

a === b; // false — 编码不同
```

它们看起来都是 é，但编码不同，比较结果为 `false`。`normalize()` 可以解决——它把字符串统一成同一种标准形式。`NFC`（Normalization Form C，先组合再比较）是最常用的形式：

```js
a.normalize('NFC') === b.normalize('NFC'); // true
```

什么时候必须 normalize？Map key、Set 去重、用户名、标签系统、搜索匹配——只要系统会处理非英文输入，normalize 基本就是必须的。

### 2. 排序：码点顺序 ≠ 人类语言顺序

`['ä', 'z'].sort()` 的结果是什么？`['z', 'ä']`——因为 `ä` 的码点（U+00E4 = 228）大于 `z`（U+007A = 122）。但德语字典里 `ä` 应该排在 `z` 前面。

根源一样：**JS 排序用的是码点顺序，而人类期望的是语言顺序**。`localeCompare` 可以按指定语言的规则排序：

```js
['ä', 'z'].sort((a, b) => a.localeCompare(b, 'de')); // ['ä', 'z']
```

不同语言的排序规则不同（德语、瑞典语、中文各不一样），所以必须指定 locale。

### 3. 大小写转换：Unicode 规则依赖语言

`'ß'.toUpperCase()` 等于 `'SS'`——这是 Unicode 标准定义的映射。但 `'I'.toLowerCase()` 在土耳其语里并不等于 `i`（而是 `ı`，不带点），因为土耳其语有两套 i/I。

根源也一样：**JS 的大小写操作看起来是简单的字符替换，但 Unicode 的大小写规则其实是语言相关的**。需要 `str.toLocaleLowerCase('tr')` 才能正确处理。

---

## 十四、最佳实践总结

Unicode 早期根本没考虑 emoji，但今天 Unicode Consortium 每年都在新增 emoji，新的 ZWJ 组合不断出现，grapheme 规则持续扩展。"字符"的定义越来越复杂，`字符 ≠ code point` 这个认知会越来越重要。以下是在实际项目中处理这些问题的速查手册。

### API 分层速查

```txt
grapheme cluster
    ↑
Intl.Segmenter

code point
    ↑
for...of / codePointAt / fromCodePoint / u/v regex

code unit
    ↑
length / slice / charAt / charCodeAt

byte
    ↑
TextEncoder / TextDecoder
```

### 场景对照表

| 场景 | 推荐做法 |
|---|---|
| 遍历字符串 | `for...of` |
| 用户字符统计 | `Intl.Segmenter` |
| Unicode 正则 | `u` / `v` flag |
| 获取完整码点 | `codePointAt()` |
| 构造 Unicode 字符 | `fromCodePoint()` |
| UTF-8 编解码 | `TextEncoder` / `TextDecoder` |
| 用户输入比较 | `normalize()` |
| 多语言排序 | `localeCompare()` |

---

## 尾声

很多人第一次接触这些问题，会觉得"JavaScript 字符串设计太烂了。"但事实上 Java、Python、Go、Rust 都在以不同方式处理 Unicode 的复杂性。问题根本不在 JavaScript，而在于**人类文字系统，本来就远比"字符数组"复杂**。

Unicode 解决了"字符如何统一编号"，但并没有真正解决"'字符'到底是什么"。

这才是整个问题最底层的核心。

JavaScript 字符串并不是"字符数组"，它真正存储的是 UTF-16 code unit 序列。而 code unit、code point、grapheme cluster、glyph 其实都是不同层级的"字符"。

理解这一点之后，length、emoji、slice、normalize、Unicode 正则、字符串截断——这些看似零散的问题，会突然连成一张完整的图。
