// null 之一：为什么 JavaScript 需要两种「空」
// 运行：node 01-essence.js
//
// 对应文章「为什么 JavaScript 需要两种"空"？」一节：
// undefined = 系统发现的缺失（引擎自动填充）
// null = 人为声明的空值（程序员主动写下）

console.log('=== 1. 引擎填的缺席 vs 程序员写的空 ===\n')

let missing          // 程序员什么都没做，引擎赋予 undefined
let empty = null     // 程序员主动写下一个空值

console.log('let missing       →', missing)      // undefined
console.log('let empty = null  →', empty)        // null

// 动态语言缺少静态类型系统提前消除歧义，只能保留两种「空」在运行时区分：
// undefined — 系统不知道这里本该有什么
// null      — 程序员确认这里本该有值，但目前为空


console.log('\n=== 2. 两种「空」的核心语义 ===\n')

// 查询函数：查过了，确认没有 → 用 null
function findUser(id) {
  return null  // 我找过了，没有
}

const result = findUser(1)
console.log('findUser(1) →', result)  // null（明确查过，没有结果）

let temp
console.log('temp →', temp)  // undefined（还没赋值，引擎的缺失信号）


console.log('\n=== 本节要点 ===\n')

// undefined 是运行时发现的缺失，null 是程序员主动声明的空值
// 这种区分贯穿整个抽象操作体系，不是某几个 API 的偶然行为
