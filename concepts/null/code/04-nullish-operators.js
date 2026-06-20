// 现代 nullish 操作符：?? 、?. 和参数默认值
// 运行：node 04-nullish-operators.js

console.log('=== 1. || vs ??：关键区别 ===\n')

// || 基于 ToBoolean，所有 falsy 值都被"吃掉"
console.log('--- || (ToBoolean) ---')
console.log('0 || "default"     →', 0 || 'default')       // "default"  ← 误伤！
console.log('"" || "default"    →', '' || 'default')       // "default"  ← 误伤！
console.log('false || "default" →', false || 'default')    // "default"
console.log('null || "default"  →', null || 'default')     // "default"

console.log()

// ?? 基于 IsNullOrUndefined，只判断 null/undefined
console.log('--- ?? (IsNullOrUndefined) ---')
console.log('0 ?? "default"     →', 0 ?? 'default')       // 0        ← 正确保留
console.log('"" ?? "default"    →', '' ?? 'default')       // ""       ← 正确保留
console.log('false ?? "default" →', false ?? 'default')    // false    ← 正确保留
console.log('null ?? "default"  →', null ?? 'default')     // "default"


console.log('\n=== 2. ?. 可选链：安全穿透 ===\n')

const user = {
  name: 'Alice',
  address: { city: 'Beijing' }
}

const nullUser = null

console.log('user.address.city       →', user.address.city)         // "Beijing"
console.log('user?.address?.city     →', user?.address?.city)       // "Beijing"
console.log('nullUser?.address?.city →', nullUser?.address?.city)   // undefined

try {
  nullUser.address.city
} catch (e) {
  console.log('nullUser.address.city   →', e.constructor.name)      // TypeError
}


console.log('\n=== 3. ?. + ?? 组合 ===\n')

const config = { db: { host: 'localhost' } }

const port = config?.db?.port ?? 3306
const host = config?.db?.host ?? '127.0.0.1'

console.log('config.db.port →', port)   // 3306（没有配置，用默认值）
console.log('config.db.host →', host)   // "localhost"（有配置，保留）


console.log('\n=== 4. 函数参数默认值：只对 undefined 生效 ===\n')

function greet(name = 'Guest') {
  return `Hello, ${name}`
}

console.log('greet(undefined) →', greet(undefined))  // "Hello, Guest" — 等于没传
console.log('greet(null)      →', greet(null))       // "Hello, null"  — 明确传了空值
console.log('greet()          →', greet())            // "Hello, Guest" — 没传参数


console.log('\n=== 5. 三种机制的本质 ===\n')

// ?? 第一次把"空值"从"假值"中独立出来
// ?. 让 nullish 值在属性访问中安全短路
// 参数默认值只响应 undefined（引擎的缺失信号）

// 它们共同承认了一个事实：null/undefined 确实和其他 falsy 值不同

const values = [0, '', false, null, undefined]

console.log('falsy values 通过 ||:')
values.forEach(v => console.log(`  ${String(v).padEnd(12)} || "ok" →`, v || 'ok'))

console.log('falsy values 通过 ??:')
values.forEach(v => console.log(`  ${String(v).padEnd(12)} ?? "ok" →`, v ?? 'ok'))
