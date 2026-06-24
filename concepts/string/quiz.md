# String 自测题

## 一、复述讲解

> 费曼第二步：看代码，用规范术语讲清行为。本组都是规范直陈，输出不会因混淆答错——答得出外在表现才算入门。

**题目 1**
```javascript
'👍'.length
'好'.length
'👍🏻'.length
'👨‍👩‍👧‍👦'.length
```

<details>
<summary>查看答案</summary>

**答案：** `2`, `1`, `4`, `11`

**考察点：** `.length` 统计的是 UTF-16 码元个数，不是字符数。`👍`（U+1F44D）超过 BMP 需要两个码元（高代理 `0xD83D` + 低代理 `0xDC4D`），故 `.length` 为 2。`好`（U+597D）在 BMP 内，一个码元足矣。`👍🏻` 是两个码点（大拇指 + 肤色修饰符），各占两个码元，共 4 个。`👨‍👩‍👧‍👦` 是 ZWJ 序列，含 7 个码点，部分码点占两个码元，总共 11 个码元。

</details>

---

**题目 2**
```javascript
const str = '👍';
console.log(str[0]);
console.log(str[1]);
console.log(str.charCodeAt(0).toString(16));
console.log(str.codePointAt(0).toString(16));
```

<details>
<summary>查看答案</summary>

**答案：** `'\ud83d'`, `'\udc4d'`, `'d83d'`, `'1f44d'`

**考察点：** `[]` 和 `charCodeAt` 工作在码元层。`str[0]` 取第 0 个码元——高代理 `\ud83d`；`str[1]` 取第 1 个码元——低代理 `\udc4d`。`charCodeAt(0)` 返回第 0 个码元的 16 位整数值 `0xD83D`，`codePointAt(0)` 则主动解析代理对，返回真正的 Unicode 码点 `U+1F44D`（`0x1F44D`）。

</details>

---

**题目 3**
```javascript
const arr1 = [...'👍A'];
const arr2 = Array.from('👍A');
console.log(arr1, arr1.length);
console.log(arr2, arr2.length);
console.log('👍A'.length);
```

<details>
<summary>查看答案</summary>

**答案：** `['👍', 'A'] 2`, `['👍', 'A'] 2`, `3`

**考察点：** 展开运算符和 `Array.from()` 都调用字符串迭代器（String Iterator），而迭代器按码点遍历——遇到代理对自动合并成一个码点返回。故 `[...'👍A']` 得到 `['👍', 'A']`，长度为 2。而 `'👍A'.length` 数码元，`👍` 两个码元 `A` 一个码元，共 3。

</details>

---

**题目 4**
```javascript
for (const ch of '👍A🏻') {
  console.log(ch);
}
```

<details>
<summary>查看答案</summary>

**答案：** `👍`, `A`, `🏻`

**考察点：** `for...of` 调用字符串迭代器，按码点而非码元遍历。`👍`（U+1F44D）虽是两个码元，但迭代器合并为一次迭代返回；`A` 一个码点；`🏻`（U+1F3FB）也是一个码点。三次迭代分别输出 `👍`、`A`、`🏻`。

</details>

---

**题目 5**
```javascript
const seg = new Intl.Segmenter('zh', { granularity: 'grapheme' });
const input = 'A👍🏻家庭🇨🇳';
console.log([...seg.segment(input)].length);
console.log([...input].length);
console.log(input.length);
```

<details>
<summary>查看答案</summary>

**答案：** `5`, `6`, `10`

**考察点：** 三层长度代表不同抽象级别：

| 层级 | 值 | 说明 |
|------|-----|------|
| `.length` | 10 | 码元层，`A`(1) + `👍`(2) + `🏻`(2) + `家`(1) + `庭`(1) + `🇨`(1) + `🇳`(1) + `🇨`(1) + `🇳`(1) |
| `[...str].length` | 6 | 码点层，`A`(1) + `👍`(1) + `🏻`(1) + `家`(1) + `庭`(1) + `🇨🇳`(2) |
| Segmenter | 5 | 字素簇层，`A`(1) + `👍🏻`(1) + `家`(1) + `庭`(1) + `🇨🇳`(1) |

`Intl.Segmenter` 按字素簇（Grapheme Cluster）分割——人眼认知的字符。`👍🏻` 虽是两个码点，但肤色修饰符附着在大拇指上，用户视作一个字符；`🇨🇳` 虽是两个区域指示符，但用户视作一面国旗。只有字素簇层才与人眼感知一致。

</details>

---

## 二、暴露盲区

> 费曼第三步：陷阱场景探测概念混淆。本组每题的输出都与常见误解相反——做错说明有地方没真懂，回 `articles/` 对应章节重看。

**题目 6**
```javascript
const a = 'é';          // U+00E9 预组合
const b = 'é';    // U+0065 + U+0301 分解
console.log(a === b);
console.log(a.length, b.length);
```

<details>
<summary>查看答案</summary>

**答案：** `false`, `1`, `2`

**考察点：** 两个字符串视觉效果完全一样（é），但码点序列不同：`a` 是单个码点 U+00E9（预组合 é），`b` 是 e（U+0065）+ 锐音符（U+0301）。`===` 比较的是码元序列，不是视觉呈现，序列不同返回 false。长度自然也不同（1 vs 2）。

**盲区：** 以为"看起来一样"就一定相等。永远记得先 `normalize()` 再比较。

</details>

---

**题目 7**
```javascript
const a = 'é';          // NFC
const c = a.normalize('NFC');
const d = a.normalize('NFD');
console.log(a === c);
console.log(a === d);
console.log(d.normalize('NFC') === a);
```

<details>
<summary>查看答案</summary>

**答案：** `true`, `false`, `true`

**考察点：** NFC 是默认组合形式，把分解序列合并为单码点；NFD 是分解形式，拆回基字符 + 组合符号。`'é'` 本身已在 NFC 形式（单码点 U+00E9），故 `normalize('NFC')` 不变。`normalize('NFD')` 拆成 e + 锐音符，序列变了不再相等。但 `d.normalize('NFC')` 又回到单码点，和 `a` 相等——说明 NFC/NFD 是双向互逆的。

**盲区：** 以为 normalize 只有一种形式、或者以为字符串 normalize 后一定变短。NFD 可能变长（拆分）、NFC 可能变短（合并）。

</details>

---

**题目 8**
```javascript
console.log(/^.$/.test('👍'));
console.log(/^.$/u.test('👍'));
console.log(/^.$/.test('A'));
```

<details>
<summary>查看答案</summary>

**答案：** `false`, `true`, `true`

**考察点：** 默认 `/^.$/` 的 `.` 匹配一个码元。`👍` 是两个码元，所以不匹配。加 `u` flag 后，`.` 按码点匹配，自动合并代理对，`/^.$/u.test('👍')` 为 `true`。`A` 是一个码元，默认也匹配。

**盲区：** 以为正则的 `.` 默认匹配"一个字符"。在 Unicode 字符面前，默认匹配的是码元。

</details>

---

**题目 9**
```javascript
try {
  String.fromCodePoint(0xD800);
} catch (e) {
  console.log(e.constructor.name);
}

console.log(String.fromCharCode(0xD800));
```

<details>
<summary>查看答案</summary>

**答案：** `"RangeError"`, `'\ud800'`（半个代理）

**考察点：** `fromCodePoint()` 操作的是 Unicode 标量值（真正的字符码点），禁止代理区码点（U+D800 ~ U+DFFF）。因为这些编号不对应任何字符，只是 UTF-16 编码内部零件。`fromCharCode()` 没有这个限制——它机械地构造一个 16 位码元，不管它是不是代理。两者的定位不同：一个面向码点/字符，一个面向码元/存储单元。

**盲区：** 以为 fromCodePoint 接受任意码点，以为 fromCharCode 和 fromCodePoint 行为一致。

</details>

---

**题目 10**
```javascript
const encoder = new TextEncoder();
const str = '你好';
console.log(str.length);
console.log(encoder.encode(str).length);
```

<details>
<summary>查看答案</summary>

**答案：** `2`, `6`

**考察点：** `'你好'.length` 是 JS 引擎内部 UTF-16 的码元数——每个汉字在 BMP 占一个码元，共 2。`TextEncoder` 把字符串转换为 UTF-8 字节序列——每个汉字在 UTF-8 中占 3 字节，共 6。两者度量单位不同：一个数码元（16-bit），一个数字节（8-bit）。关心存储空间和网络带宽时，答案在 UTF-8 字节层。

**盲区：** 以为 `.length` 反映存储开销。在 Web 的 UTF-8 世界里，存储/传输开销应算 UTF-8 字节数，不是 UTF-16 码元数。

</details>

---

**题目 11**
```javascript
const str = 'A✨';
console.log(str.length);
console.log([...str].length);
console.log(/^.$/u.test(str));
console.log(/^[\u{1F31F}\u{FE0F}]$/u.test('✨'));
```

<details>
<summary>查看答案</summary>

**答案：** `3`, `2`, `false`, `false`

**考察点：** ✨（U+1F31F + U+FE0F）—— sparkles 加变体选择符 VS16。`A✨.length` = A(1) + ✨的码元(2) = 3。按码点拆开是 ['A', '✨', '️']，共 2 个字符 + 1 个变体选择符。`/^.$/u` 匹配一个码点，`✨` 是两个码点，不匹配。尝试直接匹配 `️` 也错——`✨` 来自 U+1F31F，不是 U+FE0F。

**盲区：** 以为 emoji 加 VS16 后只是一个"字符"。它是两个码点（字符 + 样式控制符），码点和码点层都无法将其作为一个整体匹配。

</details>

---

## 三、简化输出

> 费曼第四步：手写实现或用大白话教别人。能造出来、讲明白才算真懂——背术语不算。

**题目 12**

写一个函数 `charCount(str)`，返回"人眼看到的字符数"（输入框字数统计用）。要求正确处理代理对、肤色修饰符、ZWJ 序列和国旗。

```js
charCount('A👍🏻')    // 2（A 和 👍🏻）
charCount('👨‍👩‍👧‍👦')  // 1（一个家庭）
charCount('🇨🇳')     // 1（一面国旗）
charCount('你好')   // 2
```

<details>
<summary>查看参考答案</summary>

```js
function charCount(str) {
  const seg = new Intl.Segmenter('zh', { granularity: 'grapheme' });
  return [...seg.segment(str)].length;
}
```

**自检：**
- 用的是 `Intl.Segmenter` 而不是 `[...str].length`？（后者对肤色修饰符和 ZWJ 序列多算）
- 用的是 `grapheme` 粒度而不是 `character` 或 `word`？

**备选方案（对于不支持 Intl.Segmenter 的旧环境）：**
- 使用 `lodash.toArray` 或 `punycode.ucs2.decode` 处理码点层
- 字素簇层则需要自行实现 UAX #29 规则——通常不值得，建议 polyfill `Intl.Segmenter` 而非手写

**考察点：** 能区分三层抽象（码元/码点/字素簇），并选择正确工具解决实际问题。

</details>

---

**题目 13**

字符串的「三层长度」分别是什么？用 `'👍🏻'` 举例说明每一层返回什么、为什么。

<details>
<summary>查看参考讲解</summary>

`'👍🏻'`（大拇指 + 浅肤色修饰符）在三个层面表现不同：

| 层 | API | 结果 | 解释 |
|----|-----|------|------|
| **码元层**（Code Unit） | `'👍🏻'.length` | 4 | 两个码点各占两个码元，共 4 个 16-bit 单元 |
| **码点层**（Code Point） | `[...'👍🏻'].length` | 2 | 两个 Unicode 码点：👍（U+1F44D）+ 🏻（U+1F3FB） |
| **字素簇层**（Grapheme Cluster） | `Intl.Segmenter` | 1 | 用户感知为一个字符（一个视觉 emoji） |

**为什么有三层？**

1. **码元**是 JavaScript 的底层存储单位（UTF-16），所有字符串 API 的本职工作——`.length`、`[]`、`charCodeAt`、`slice` 都基于它。"历史原因"——1995 年设计时 BMP 够用，一个字符一个码元，后来 Unicode 扩张拿代理对打补丁。
2. **码点**是 Unicode 字符编号方案。ES6 补了按码点操作的 API（`for...of`、`Array.from`、`codePointAt`、`fromCodePoint`），解决了代理对问题，但码点依然小于"人类认知单元"。
3. **字素簇**是人眼感知的字符。Unicode 允许多码点组合为一个视觉单元（肤色修饰符、ZWJ 序列、国旗），码点层不够用。`Intl.Segmenter` 按 UAX #29 规则识别字素簇边界，给出最终答案。

**现实意义：** 输入框字数统计、文本截断、光标移动——这些面向用户的功能应该用字素簇层，而不是 `.length` 或 `[...str].length`。

**考察点：** 能清晰区分三层，讲清每层解决了什么问题、留下了什么坑，以及在什么场景下用哪一层。

</details>

---

**题目 14**

有人问："没有 `Intl.Segmenter` 的时候怎么做字数统计？"——考察点不在能不能写 polyfill，而在于你有没有意识到这是个什么问题。请解释为什么码点层（`[...str].length`）在某些场景下仍然不够，并举一个具体的 emoji 例子说明。

<details>
<summary>查看参考讲解</summary>

码点层不够的原因：**Unicode 允许任意多个码点通过组合 modifier / ZWJ / variation selector 形成一个人类认知字符。** 码点层只把代理对合并了，但不会继续合并多码点组合。

典型例子：

```
'👨‍👩‍👧‍👦'  → 码点层长度 7，人眼看到 1 个字符
'👍🏻'      → 码点层长度 2，人眼看到 1 个字符
'🇨🇳'     → 码点层长度 2，人眼看到 1 面国旗
'☀️'      → 码点层长度 2，人眼看到 1 个太阳
```

若要精确统计，只有 `Intl.Segmenter`（字素簇层）才是正确答案。在 `Intl.Segmenter` 不支持的环境中，可以：
1. polyfill `Intl.Segmenter`
2. 或者接受近似值（例如只合并代理对，忽略 modifier/ZWJ 组合——这是很多"行数统计"库的现状）

**关键认知：** "字符数"的定义取决于你在哪一层。不是没有 `Intl.Segmenter` 就做不了统计，而是不管你用什么方案，都要清楚它工作在哪一层、误差有多大。

</details>

---

**题目 15**

用日常语言向一个刚学编程的新人讲清：为什么 `'👍'.length` 等于 2？建议用实物类比，不许只甩术语（代理对、码元、BMP……都不许出现）。

<details>
<summary>查看参考讲解</summary>

这其实是一个"盒子"和"箱子里装什么"的问题。

想象一辆自行车。在仓库系统里，一辆完整的自行车 = 前后轮 + 车架 + 把手 + 车座……好几个零件。但如果你是买家，你只会说"我要一辆自行车"。

JavaScript 的 `.length` 数的不是"自行车数量"，它数的是"零件数量"。

emoji 也是类似。有些 emoji 比较小（在 BMP 内），一个编号就能装下，算一个零件。但像 👍 这样的 emoji，因为 Unicode 的大编号规则，JavaScript 需要用两个"零件槽位"才能装下它。`.length` 老老实实告诉你：这里有 2 个零件。

而后来（ES6）新增的 `for...of`、`Array.from()` 这些，就可以帮你在"零件层"之上组装出一辆完整的"自行车"，让你遍历时不会只拿到半个。

所以 `.length` 没有骗你，它只是数了一个你直觉上不关心的东西——它数的是内部零件，不是成品。它这么做是因为 JavaScript 诞生于 1995 年，当时每个字符都正好是 1 个零件，当年这么设计没有错。只是后来 Unicode 扩张了，这个"1 字符 = 1 零件"的假设才不再成立。

</details>

---

## 评分

- **13-15/15：** 掌握良好
- **10-12/15：** 基础扎实，错题对应章节重看
- **9/15 以下：** 建议完整复习 `articles/`
