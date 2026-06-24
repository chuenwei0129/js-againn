// 03-multi-codepoint.js — 多码点组合
// 一个视觉字符可能由多个码点组成
// 肤色修饰符、区域指示符、ZWJ 序列、变体选择符

// —— 肤色修饰符 ——

console.log('=== 肤色修饰符 ===')

// 👍🏻 = 👍 (U+1F44D) + 🏻 (U+1F3FB, 肤色修饰符)
// `[...'👍🏻']` → ['👍', '🏻'] — 两个码点，组合展示为 👍🏻
console.log("'👍🏻' 的码点序列:", [...'👍🏻'].map(c => c.codePointAt(0).toString(16)))
// ['1f44d', '1f3fb']
console.log("[...'👍🏻'].length:", [...'👍🏻'].length) // 2

// —— 区域指示符（国旗） ——

console.log('\n=== 区域指示符（国旗）===')

// 🇨🇳 = 🇨 (U+1F1E8) + 🇳 (U+1F1F3)
// 两个区域指示符（Regional Indicator Symbol）拼成一个国旗
console.log("'🇨🇳' 的码点:", [...'🇨🇳'].map(c => c.codePointAt(0).toString(16)))
// ['1f1e8', '1f1f3']
console.log("[...'🇨🇳'].length:", [...'🇨🇳'].length) // 2

// —— ZWJ（零宽连字符）序列 ——

console.log('\n=== ZWJ（零宽连字符）序列 ===')

// 👨‍👩‍👧‍👦 = 👨 + ZWJ(U+200D) + 👩 + ZWJ + 👧 + ZWJ + 👦
// 7 个码点拼成一个视觉家庭
const family = '👨‍👩‍👧‍👦'
console.log('家庭 emoji 码点数:', [...family].length) // 7
console.log('码元数:', family.length)                  // 11
console.log('码点序列:', [...family].map(c => c.codePointAt(0).toString(16)))
// ['1f468', '200d', '1f469', '200d', '1f467', '200d', '1f466']

// —— 变体选择符 ——

console.log('\n=== 变体选择符 ===')

// 普通太阳符号
console.log('☀ 的码点:', '☀'.codePointAt(0)?.toString(16)) // 2600

// 加上 VS16（U+FE0F），切换 emoji 风格
const sunEmoji = '☀️'
console.log('☀️ 的码点数:', [...sunEmoji].length)  // 2
console.log('☀️ 的码点序列:', [...sunEmoji].map(c => c.codePointAt(0).toString(16)))
// ['2600', 'fe0f']

// 对比：普通 ☀ 是 1 个码点，☀️ 是 2 个码点
console.log("'☀'.length:", '☀'.length)           // 1
console.log("'☀️'.length:", '☀️'.length)         // 2
