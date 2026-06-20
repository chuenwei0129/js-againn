// undefined 之四：默认值机制 —— 统一编码的回报
// 运行：node 04-defaults.js
//
// 对应文章「默认值机制」一节：判断的是「缺席」(undefined)，不是假值
// 正因为所有缺席统一编码成 undefined，默认参数 / ?? / 解构默认值只需一条规则

console.log('=== 1. 解构默认值：只响应 undefined ===\n')

const { a = 1 } = {}           // {}.a 是 undefined → 启动默认值
const { b = 1 } = { b: null }  // null 不是缺席 → 保留
console.log('const {a=1} = {}       →', a)   // 1
console.log('const {b=1} = {b:null} →', b)   // null


console.log('\n=== 2. 函数参数默认值：只对 undefined 生效 ===\n')

function f(x = 1) { return x }
console.log('f(undefined)           →', f(undefined))   // 1   — undefined 触发默认
console.log('f(null)                →', f(null))        // null — null 保留


console.log('\n=== 3. ?? 基于 IsNullOrUndefined，不是 ToBoolean ===\n')

console.log('0 ?? "default"         →', 0 ?? 'default')          // 0   — 0 是合法值
console.log('"" ?? "default"        →', '' ?? 'default')         // ""  — 空串是合法值
console.log('false ?? "default"     →', false ?? 'default')      // false — 布尔假值也是合法值
console.log('null ?? "default"      →', null ?? 'default')       // "default"
console.log('undefined ?? "default" →', undefined ?? 'default')  // "default"


console.log('\n=== 4. ?? vs ||：空值与假值的分界 ===\n')

const values = [0, '', false, null, undefined]
console.log('falsy values 通过 ||:')
values.forEach(v => console.log(`  ${String(v).padEnd(12)} || "ok" →`, v || 'ok'))
console.log('falsy values 通过 ??:')
values.forEach(v => console.log(`  ${String(v).padEnd(12)} ?? "ok" →`, v ?? 'ok'))


console.log('\n=== 本节要点 ===\n')

// || 基于 ToBoolean：所有 falsy 被替换
// ?? 基于 IsNullOrUndefined：只替换 null/undefined
// 默认值机制判断的是「缺席」，统一编码成 undefined 让一条规则覆盖所有场景
