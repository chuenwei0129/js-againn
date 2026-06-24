// 05-normalization.js — Unicode 规范化
// 同一个字符可能对应不同码点序列
// normalize() 统一表示为同一形式

// —— é 的两种写法 ——

console.log('=== é 的两种写法 ===')

// 预组合形式：U+00E9（一个码点到位）
const composed = 'é'
console.log('composed（NFC）:', composed)
console.log('composed.length:', composed.length)      // 1
console.log('composed codePointAt(0):', composed.codePointAt(0)?.toString(16)) // e9

// 分解形式：e (U+0065) + 锐音符 (U+0301)
const decomposed = 'é'
console.log('decomposed（NFD）:', decomposed)
console.log('decomposed.length:', decomposed.length)  // 2
console.log('码点序列:', [...decomposed].map(c => c.codePointAt(0)?.toString(16)))
// ['65', '301']

// 肉眼完全一样，但 === 不相等
console.log("composed === decomposed:", composed === decomposed) // false

// —— normalize() 统一 ——

console.log('\n=== normalize ===')

// NFC（默认）：尽可能组合成单码点
console.log("decomposed.normalize('NFC') === composed:", decomposed.normalize('NFC') === composed)
// true

// NFD：尽可能拆成基字符 + 组合符号
console.log("composed.normalize('NFD') === decomposed:", composed.normalize('NFD') === decomposed)
// true

// —— 实际应用：去重和查找 ——

console.log('\n=== 去重 ===')

const words = ['café', 'café', 'café', '咖啡']
const normalized = words.map(w => w.normalize('NFC'))
const unique = [...new Set(normalized)]
console.log('去重前数量:', words.length)      // 4
console.log('去重后数量:', unique.length)     // 2（两种 café 和 café 合并为同一）
console.log('去重结果:', unique)

// —— NFKC / NFKD：兼容性分解 ——

console.log('\n=== NFKC / NFKD（兼容性分解）===')

// NFC/NFD 只改变组合方式，不改变语义
// NFKC/NFKD 会替换兼容性字符——可能改变文本含义

const samples = [
  '①',   // ① — circled one
  '㎜',   // ㎜ — square mm
  'Ａ',   // Ａ — fullwidth A
  '²',   // ² — superscript 2
]

samples.forEach(s => {
  console.log(`"${s}" (U+${s.charCodeAt(0).toString(16).toUpperCase()}) → NFC: "${s.normalize('NFC')}", NFKC: "${s.normalize('NFKC')}"`)
})
// ① → ① (NFC), 1 (NFKC)
// ㎜ → ㎜ (NFC), mm (NFKC)
// Ａ → Ａ (NFC), A (NFKC)

// —— 注意边界：全角和半角不通过 normalize 处理 ——
console.log("\n全角Ａ vs 半角A — normalize 不合并:")
console.log("'Ａ'.normalize('NFC') === 'A':", 'Ａ'.normalize('NFC') === 'A') // false
