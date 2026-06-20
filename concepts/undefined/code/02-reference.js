// undefined 之二：Reference System —— 值找不到
// 运行：node 02-reference.js

console.log('=== 1. 属性访问：[[Get]] 查找失败 ===\n')

const obj = {}
console.log('obj.foo              →', obj.foo)        // undefined — HasProperty 为 false
console.log("'foo' in obj         →", 'foo' in obj)   // false — 连属性都没有


console.log('\n=== 2. obj.foo 安全，obj.foo.bar 抛错 ===\n')

try {
  obj.foo.bar   // 第一步 obj.foo → undefined，第二步 undefined.bar → TypeError
} catch (e) {
  console.log('obj.foo.bar          →', e.constructor.name)   // TypeError
}

// 可选链：承认 property miss 会产生 undefined，让缺席安全传播
console.log('obj.foo?.bar         →', obj.foo?.bar)   // undefined — 不创造 undefined，只让它流动


console.log('\n=== 3. 数组空洞：HasProperty 为 false ===\n')

const holey = [1, , 3]
const filled = [1, undefined, 3]
console.log('holey[1]             →', holey[1])       // undefined
console.log('filled[1]            →', filled[1])      // undefined
console.log('1 in holey           →', 1 in holey)     // false — 空洞连属性都没有
console.log('1 in filled          →', 1 in filled)    // true  — 真有值为 undefined 的属性


console.log('\n=== 4. typeof：唯一允许 unresolvable Reference 安静失败 ===\n')

console.log('typeof a             →', typeof a)       // 'undefined' — a 从未声明，不报错
try {
  console.log(a)   // 普通 ResolveBinding 失败 → ReferenceError
} catch (e) {
  console.log('a（直接访问）        →', e.constructor.name)   // ReferenceError
}

// Web 兼容：海量代码依赖 if (typeof Promise !== 'undefined') 做特性检测
console.log('typeof Promise       →', typeof Promise) // 'function'


console.log('\n=== 本节要点 ===\n')

// 属性访问 / 数组读取走同一条路径：HasProperty 为 false → 返回 undefined
// typeof 拿到 unresolvable Reference 不抛异常，直接返回 "undefined"
