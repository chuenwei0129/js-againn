// 06-encoding.js — 编码转换：UTF-16 ↔ UTF-8
// JS 内部用 UTF-16，外面世界用 UTF-8
// TextEncoder / TextDecoder 搭桥

// —— TextEncoder：UTF-16 → UTF-8 ——

console.log('=== TextEncoder: UTF-16 → UTF-8 ===')

const encoder = new TextEncoder()

// 简单字符
console.log("encoder.encode('A'):", encoder.encode('A'))
// Uint8Array(1) [65] — 1 字节

// 中文字符
console.log("encoder.encode('好'):", encoder.encode('好'))
// Uint8Array(3) [229, 165, 189] — 3 字节（U+597D 在 UTF-8 里占 3 字节）

// emoji（代理对）
console.log("encoder.encode('👍'):", encoder.encode('👍'))
// Uint8Array(4) [240, 159, 145, 141] — 4 字节

// 混合
console.log("encoder.encode('A好👍'):", encoder.encode('A好👍'))
// Uint8Array(8) [65, 229, 165, 189, 240, 159, 145, 141]

// 长度对比
const test = '你好'
console.log("'你好'.length（UTF-16 码元）:", test.length)           // 2
console.log("encode('你好').length（UTF-8 字节）:", encoder.encode(test).length) // 6

// —— TextDecoder：UTF-8 → UTF-16 ——

console.log('\n=== TextDecoder: UTF-8 → UTF-16 ===')

const decoder = new TextDecoder()

// 从 UTF-8 字节数组解码回字符串
const bytes = new Uint8Array([0xE4, 0xBD, 0xA0, 0xE5, 0xA5, 0xBD])
console.log("decode([0xE4, 0xBD, 0xA0, 0xE5, 0xA5, 0xBD]):", decoder.decode(bytes))
// '你好'

// emoji
const emojiBytes = new Uint8Array([0xF0, 0x9F, 0x91, 0x8D])
console.log("decode emoji:", decoder.decode(emojiBytes))
// '👍'

// —— 实际应用：精确计算 UTF-8 字节长度 ——

console.log('\n=== 实际应用 ===')

function utf8ByteLength(str) {
  return new TextEncoder().encode(str).length
}

const demo = 'A好👍'
console.log(`字符串: "${demo}"`)
console.log(`UTF-16 码元数（.length）: ${demo.length}`)          // 4
console.log(`UTF-8 字节数: ${utf8ByteLength(demo)}`)             // 8

// —— 编码错误处理 ——

console.log('\n=== 编码错误处理 ===')

// 非法 UTF-8 序列
const badBytes = new Uint8Array([0xFF, 0xFE, 0x00, 0x00])
try {
  console.log('默认模式:', decoder.decode(badBytes))
  // 默认输出 � 替换
} catch {
  console.log('默认模式不抛错，用 � 替换')
}

// 严格模式：抛错
const strictDecoder = new TextDecoder('utf-8', { fatal: true })
try {
  strictDecoder.decode(badBytes)
} catch (e) {
  console.log('fatal 模式抛错:', e.constructor.name)
}
