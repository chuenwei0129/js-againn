// undefined 之五：null vs undefined —— 程序员说的没有
// 运行：node 05-null-vs-undefined.js
//
// 对应文章「但我还想再聊一点」一节：
// undefined 是引擎说的没有（运行时缺席的被动产物）
// null 是程序员说的没有（主动语义）

console.log('=== 1. 引擎填的 vs 程序员写的 ===\n')

let engineMissing           // undefined — 引擎填的缺席
let humanEmpty = null       // null — 程序员的主动语义
console.log('let engineMissing      →', engineMissing)      // undefined
console.log('let humanEmpty = null  →', humanEmpty)         // null


console.log('\n=== 2. typeof：null 的历史 Bug ===\n')

console.log('typeof engineMissing   →', typeof engineMissing)    // "undefined"
console.log('typeof humanEmpty      →', typeof humanEmpty)       // "object"（历史 Bug）


console.log('\n=== 3. ToNumber：可计算 vs 不可计算 ===\n')

console.log('Number(undefined)      →', Number(undefined))       // NaN — 不可计算
console.log('Number(null)           →', Number(null))            // 0   — 可计算


console.log('\n=== 4. 查询函数的返回约定 ===\n')

// DOM API：查找已完成，结果为空 → null
// 属性访问：根本没找到这个属性 → undefined
function findUser(id) {
  // 查过了，确认没有 → 用 null（我找过了，没有）
  return null
}
const obj = {}
console.log('findUser(999)          →', findUser(999))           // null
console.log('obj.foo（属性不存在）  →', obj.foo)                 // undefined


console.log('\n=== 5. JSON：undefined 丢弃，null 保留 ===\n')

console.log('JSON.stringify({a:undefined, b:null}) →', JSON.stringify({ a: undefined, b: null }))   // '{"b":null}'
console.log('JSON.stringify([undefined, null])     →', JSON.stringify([undefined, null]))           // '[null,null]'


console.log('\n=== 本节要点 ===\n')

// undefined = 运行时缺席的被动产物，JSON 无法表达就省略
// null = 显式数据，保留
// 默认值机制沿用这条线：null 不触发回退（我拿到了，只是空的），undefined 触发回退（我没拿到，可以补救）
