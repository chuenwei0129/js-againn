// 01-code-unit.js — 码元层：JavaScript 实际操作的单元
// .length 数码元，不是数字符
// charCodeAt / [] / slice 全都工作在码元层，BMP 内无感，遇到代理对就露馅

// —— .length 数码元 ——

console.log('=== .length 数码元 ===')

// BMP 字符，一个码元对应一个码点，看起来很「正常」
console.log('A.length:', 'A'.length)           // 1
console.log('好.length:', '好'.length)         // 1

// 超过 BMP（补充平面）的字符，UTF-16 用两个码元表示
// 👍 的码点 U+1F44D → 高代理 0xD83D + 低代理 0xDC4D
console.log('👍.length:', '👍'.length)         // 2

// ZWJ sequence + 肤色修饰符，更多码元
console.log('👨‍👩‍👧‍👦.length:', '👨‍👩‍👧‍👦'.length)   // 11
console.log('👍🏻.length:', '👍🏻'.length)         // 4（大拇指 + 肤色修饰符，各两个码元）

// —— 下标访问 []：按码元索引 ——

console.log('\n=== 下标访问 [] ===')

// 正常：第 0 个码元就是字符本身
console.log('ABC'[0])  // A

// 代理对：第 0 个码元只是高代理
console.log('👍'[0])   // \ud83d（肉眼不可见，但能打印）
console.log('👍'[1])   // \udc4d
console.log('AB👍CD'[2]) // \ud83d——只有半个代理
console.log('AB👍CD'[3]) // \udc4d——另一半

// —— charCodeAt：取的是码元值，不是码点 ——

console.log('\n=== charCodeAt（码元值）===')

console.log('👍'.charCodeAt(0).toString(16)) // d83d（高代理）
console.log('👍'.charCodeAt(1).toString(16)) // dc4d（低代理）

// BMP 字符 charCodeAt 碰巧和码点一致
console.log('A'.charCodeAt(0).toString(16))  // 41
console.log('好'.charCodeAt(0).toString(16)) // 597d

// —— slice：同样按码元切 ——

console.log('\n=== slice ===')

// 切到代理对中间获得半个字符
console.log('AB👍CD'.slice(2, 3)) // 半个代理
console.log('AB👍CD'.slice(2, 4)) // 两个码元一起才拼回 👍

// —— lone surrogate：ECMAScript 允许非法代理序列 ——

console.log('\n=== Lone Surrogate ===')

// 只有高代理，没有低代理——在 UTF-16 里是非法的
// 但 ECMAScript 只要求「一串有序的 16 位整数」，不校验合法性
const lone = '\ud83d'
console.log('lone.length:', lone.length)       // 1
console.log('lone[0]:', lone[0])               // \ud83d

// ECMAScript 2024 提供检查/修复方法
console.log("'👍'.isWellFormed():", '👍'.isWellFormed())                 // true
console.log("lone.isWellFormed():", lone.isWellFormed())                 // false
console.log("lone.toWellFormed():", lone.toWellFormed())                 // �（替换字符）
