// 07-regex.js — 正则与 Unicode
// 默认：/^.$/ 匹配码元，u flag 切到码点层，v flag (ES2024) 处理 emoji

// —— 默认（码元层）——

console.log('=== 默认：码元层 ===')

// /^.$/ 匹配一个码元
console.log("/^.$/.test('A'):", /^.$/.test('A'))     // true — 1 个码元
console.log("/^.$/.test('好'):", /^.$/.test('好'))   // true — 1 个码元
console.log("/^.$/.test('👍'):", /^.$/.test('👍'))   // false — 2 个码元

// 手动写代理对反而能匹配
console.log("/^👍$/.test('👍'):", /^👍$/.test('👍')) // true

// —— u flag：码点层 ——

console.log('\n=== u flag：码点层 ===')

// 加了 u flag，一个 . 匹配一个码点，自动合并代理对
console.log("/^.$/u.test('👍'):", /^.$/u.test('👍'))  // true

// 多码点组合仍然算多个「点」
console.log("/^.$/u.test('👍🏻'):", /^.$/u.test('👍🏻')) // false — 两个码点

// /\p{...}/ 按 Unicode 属性匹配——必须有 u flag

console.log('\n=== \\p{} Unicode 属性匹配 ===')

// 匹配汉字
console.log("/\\p{Script=Han}+/u.test('你好'):", /\p{Script=Han}+/u.test('你好')) // true
console.log("/\\p{Script=Han}+/u.test('A'):", /\p{Script=Han}+/u.test('A'))       // false

// 匹配字母（任何语言的字母）
console.log("/\\p{Letter}/u.test('A'):", /\p{Letter}/u.test('A'))     // true
console.log("/\\p{Letter}/u.test('好'):", /\p{Letter}/u.test('好'))   // true（汉字属于 Letter）
console.log("/\\p{Letter}/u.test('3'):", /\p{Letter}/u.test('3'))     // false

// 匹配 emoji 属性
console.log("/\\p{Emoji}/u.test('👍'):", /\p{Emoji}/u.test('👍'))     // true
console.log("/\\p{Emoji}/u.test('😀'):", /\p{Emoji}/u.test('😀'))     // true

// —— v flag（ES2024）：增强 Unicode 属性匹配 ——

console.log('\n=== v flag（ES2024）===')

// v flag 扩展了 u flag 的 \p{} 能力
// 匹配 RGI（推荐用于通用交换）emoji 序列
console.log("/^\\p{RGI_Emoji}$/v.test('👨‍👩‍👧‍👦'):", /^\p{RGI_Emoji}$/v.test('👨‍👩‍👧‍👦')) // true
console.log("/^\\p{RGI_Emoji}$/v.test('👍🏻'):", /^\p{RGI_Emoji}$/v.test('👍🏻'))       // true
console.log("/^\\p{RGI_Emoji}$/v.test('A'):", /^\p{RGI_Emoji}$/v.test('A'))           // false

// v flag 支持集合操作（差集、交集）
console.log("/^[\\p{ASCII}--[abc]]+$/v.test('def'):", /^[\p{ASCII}--[abc]]+$/v.test('def'))     // true（d/e/f 在 ASCII 且不在 abc 中）
console.log("/^[\\p{ASCII}--[abc]]+$/v.test('ab'):", /^[\p{ASCII}--[abc]]+$/v.test('ab'))       // false

// —— 各 flag 长度对比 ——

console.log('\n=== 长度对比 ===')

function regexMatchCount(str, regex) {
  return [...str.matchAll(regex)].length
}

const test = 'A👍🏻B🇨🇳C'

// 默认：匹配码元
console.log('默认（码元）:', test.match(/./g).length)    // 12

// u flag：匹配码点
console.log('u flag（码点）:', test.match(/./ug).length)  // 9

// v flag：集合操作差集
console.log("/^[\\p{ASCII}--[abc]]+$/v.test('def'):", /^[\p{ASCII}--[abc]]+$/v.test('def'))     // true
console.log("/^[\\p{ASCII}--[abc]]+$/v.test('ab'):", /^[\p{ASCII}--[abc]]+$/v.test('ab'))       // false
