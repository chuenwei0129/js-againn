// undefined 之一：Binding System —— 值还没来
// 运行：node 01-binding.js

console.log('=== 1. var：binding 已创建，值未到达 ===\n')

// hoisting 只是表象；底下的事实是 binding 已存在，用 undefined 填充窗口期
console.log('var x（后置声明）  →', x)   // undefined
var x = 1
console.log('var x = 1 之后     →', x)   // 1


console.log('\n=== 2. let/const：binding exists ≠ readable ===\n')

// binding 已存在但未初始化 → 读取抛 ReferenceError（TDZ）
try {
  console.log(a)
} catch (e) {
  console.log('let a（TDZ 内读取）→', e.constructor.name)   // ReferenceError
}
let a = 1
console.log('let a = 1 之后     →', a)   // 1

let b   // 初始化为 undefined
console.log('let b（无赋值）     →', b)   // undefined — TDZ 过后，缺席重新编码为 undefined


console.log('\n=== 3. 函数参数：binding 已创建，未传则填 undefined ===\n')

function greet(name) {
  return name
}
console.log('greet()            →', greet())   // undefined — 参数 binding 已创建，调用者没传
console.log('greet("初七")      →', greet('初七'))   // "初七"


console.log('\n=== 本节要点 ===\n')

// var / let / const / 参数：binding 创建后值未到达 → 引擎用 undefined 填充
// TDZ 改变的不是 undefined，而是「binding exists ≠ readable」
// 初始化之后，缺席仍被编码成 undefined
