// null 基础：null vs undefined 的核心区别
// 运行：node 01-basic.js

console.log('=== 1. 声明与赋值 ===\n')

let a
let b = null

console.log('let a          →', a)           // undefined（引擎赋值）
console.log('let b = null   →', b)           // null（程序员赋值）


console.log('\n=== 2. typeof ===\n')

console.log('typeof null      →', typeof null)       // "object" — 历史 Bug
console.log('typeof undefined →', typeof undefined)   // "undefined"
console.log('typeof 0         →', typeof 0)           // "number"
console.log('typeof ""        →', typeof "")          // "string"


console.log('\n=== 3. typeof null 为什么是 Bug？ ===\n')

// 规范真相：Type(null) = Null（独立类型，和 Object 平级）
// 实现事故：类型标签 0 撞车，typeof 误判为 'object'

// null 不是对象——访问属性直接报错
try {
  null.foo
} catch (e) {
  console.log('null.foo →', e.constructor.name + ': ' + e.message)
}


console.log('\n=== 4. ToBoolean：统一 ===\n')

console.log('Boolean(null)      →', Boolean(null))       // false
console.log('Boolean(undefined) →', Boolean(undefined))   // false
console.log('Boolean(0)         →', Boolean(0))           // false
console.log('Boolean("")        →', Boolean(""))          // false


console.log('\n=== 5. ToNumber：分裂 ===\n')

console.log('Number(null)      →', Number(null))       // 0
console.log('Number(undefined) →', Number(undefined))   // NaN
console.log('1 + null          →', 1 + null)            // 1
console.log('1 + undefined     →', 1 + undefined)       // NaN
console.log('5 * null          →', 5 * null)            // 0


console.log('\n=== 6. ToObject：统一报错 ===\n')

try { Object(null) } catch (e) {
  console.log('Object(null) →', e.constructor.name)
}
try { Object(undefined) } catch (e) {
  console.log('Object(undefined) →', e.constructor.name)
}


console.log('\n=== 7. 两种"空"的核心语义 ===\n')

// undefined = 系统发现的缺失（"我不知道这里应该有什么"）
// null      = 程序员声明的空值（"我知道这里应该有值，确认没有"）

function findUser(id) {
  // 假设查不到用户
  return null  // 查过了，确认没有 → 用 null
}

const result = findUser(1)
console.log('findUser(1) →', result)  // null

let temp
console.log('temp →', temp)  // undefined（还没赋值）
