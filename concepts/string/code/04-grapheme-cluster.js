// 04-grapheme-cluster.js — 字素簇层：人眼认知的字符
// Intl.Segmenter 工作在字素簇层
// 适用于字数统计、输入框限制、文本截断

// —— 基础用法 ——

console.log('=== 基本用法 ===')

const seg = new Intl.Segmenter('zh', { granularity: 'grapheme' })

// 简单字符
const simple = [...seg.segment('你好世界')]
console.log('"你好世界" 字素簇数:', simple.length) // 4
simple.forEach(s => console.log(' ', s.segment))

// 代理对——自动处理
const thumb = [...seg.segment('👍')]
console.log('"👍" 字素簇数:', thumb.length)         // 1
console.log('"👍" 各字素簇:', thumb.map(s => s.segment))

// —— 多码点组合不会被拆散 ——

console.log('\n=== 多码点组合 ===')

// 肤色修饰符——一个视觉字符
const skin = [...seg.segment('👍🏻')]
console.log('"👍🏻" 字素簇数:', skin.length)         // 1（不是 2）
console.log('"👍🏻" 各字素簇:', skin.map(s => s.segment))

// 国旗
const flag = [...seg.segment('🇨🇳')]
console.log('"🇨🇳" 字素簇数:', flag.length)          // 1
console.log('"🇨🇳" 各字素簇:', flag.map(s => s.segment))

// ZWJ 家庭
const family = [...seg.segment('👨‍👩‍👧‍👦')]
console.log('"👨‍👩‍👧‍👦" 字素簇数:', family.length)    // 1
console.log('"👨‍👩‍👧‍👦" 各字素簇:', family.map(s => s.segment))

// —— 混合字符串的精确分割 ——

console.log('\n=== 混合字符串分割 ===')

const mixed = 'A👍🏻BC🇨🇳D'
const clusters = [...seg.segment(mixed)]
console.log('混合字符串:', mixed)
console.log('字素簇数:', clusters.length)           // 6
console.log('分割结果:', clusters.map(s => s.segment))
// ['A', '👍🏻', 'B', 'C', '🇨🇳', 'D']

// 对比其他层的长度
console.log('\n各层长度对比:')
console.log('.length（码元层）:', mixed.length)         // 12
console.log('[...str].length（码点层）:', [...mixed].length) // 9
console.log('Intl.Segmenter（字素簇层）:', clusters.length)  // 6

// —— 实际应用：输入框字数统计 ——

console.log('\n=== 输入框字数统计 ===')

function countChars(str) {
  const seg = new Intl.Segmenter('zh', { granularity: 'grapheme' })
  return [...seg.segment(str)].length
}

const input = 'A👍🏻家庭👨‍👩‍👧‍👦🇨🇳'
console.log(`输入: "${input}"`)
console.log(`用 .length: ${input.length} — 不准（多算了代理对）`)
console.log(`用 [...str].length: ${[...input].length} — 不准（多算了组合码点）`)
console.log(`用 Segmenter: ${countChars(input)} — 精确（人眼看到的字数）`)
