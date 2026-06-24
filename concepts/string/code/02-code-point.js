// 02-code-point.js — 码点层：ES6 Unicode 工具箱
// ES6 新增：\u{}、for...of、Array.from()、codePointAt()、fromCodePoint()
// 迭代器自动合并代理对，按码点遍历

// —— \u{} 码点字面量 ——

console.log('=== \\u{} 码点字面量 ===')

// ES5 只能写代理对或直接粘 emoji
console.log('👍')  // 👍（人工代理对）

// ES6 直接按码点写
console.log('\u{1F44D}')     // 👍
console.log('\u{1F600}')     // 😀
console.log('\u{597D}')      // 好

// —— for...of 迭代器：自动合并代理对 ——

console.log('\n=== for...of ===')

const str = 'A👍好'

// ES5 风格：按下标遍历——码元层
console.log('按下标遍历（码元层）:')
for (let i = 0; i < str.length; i++) {
  console.log(`  str[${i}]:`, str[i])
}
// A, \ud83d, \udc4d, 好 — 👍 被拆成两个

// ES6 风格：for...of——码点层，自动合并代理对
console.log('for...of（码点层）:')
for (const ch of str) {
  console.log(' ', ch)
}
// A, 👍, 好 — 👍 完整保留

// —— Array.from()：同理由迭代器驱动 ——

console.log('\n=== Array.from ===')

console.log([...'👍A'])       // ['👍', 'A']
console.log([...'👍A'].length) // 2

// 对比 .length
console.log('👍A'.length)     // 3

console.log([...'👨‍👩‍👧‍👦'].length) // 7（7 个码点，按码点拆）
console.log('👨‍👩‍👧‍👦'.length)     // 11（11 个码元）

// —— codePointAt()：取真正的码点 ——

console.log('\n=== codePointAt ===')

// charCodeAt 拿到码元，codePointAt 拿到码点
console.log("'👍'.charCodeAt(0):", '👍'.charCodeAt(0).toString(16))  // d83d
console.log("'👍'.codePointAt(0):", '👍'.codePointAt(0).toString(16)) // 1f44d

// 对于不在代理对的码元，两者返回相同
console.log("'A'.codePointAt(0):", 'A'.codePointAt(0))               // 65

// —— fromCodePoint()：从码点生成字符 ——

console.log('\n=== fromCodePoint ===')

// 码点 → 字符
console.log('String.fromCodePoint(0x1F44D):', String.fromCodePoint(0x1F44D)) // 👍

// 代理区码点（U+D800 ~ U+DFFF）被拒绝
try {
  String.fromCodePoint(0xD800)
} catch (e) {
  console.log('fromCodePoint(0xD800) throws:', e.constructor.name)
  // RangeError: 代理区码点不是有效 Unicode 标量值
}

// fromCharCode 不会拒绝，因为它只机械地构造码元
console.log('String.fromCharCode(0xD800):', String.fromCharCode(0xD800)) // \ud800（半个代理）
