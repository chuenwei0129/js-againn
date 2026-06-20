// null 之二：算术运算中的身份 —— 一个「可计算的空」
// 运行：node 02-tonumber.js
//
// 对应文章「null 在算术运算中的身份」一节：
// ToNumber 规则：null → 0（可计算），undefined → NaN（不可计算）

console.log('=== 1. ToNumber：null 可计算，undefined 不可计算 ===\n')

console.log('Number(null)      →', Number(null))       // 0
console.log('Number(undefined) →', Number(undefined))   // NaN

console.log('1 + null          →', 1 + null)            // 1
console.log('1 + undefined     →', 1 + undefined)       // NaN
console.log('5 * null          →', 5 * null)            // 0

// null 进入数值世界被视为可参与运算的空值（不会破坏计算的占位符）
// undefined 直接产生 NaN——连程序员都不知道本该是什么，参与计算没意义


console.log('\n=== 2. ToBoolean：两者统一为 false ===\n')

console.log('Boolean(null)      →', Boolean(null))       // false
console.log('Boolean(undefined) →', Boolean(undefined))   // false
console.log('Boolean(0)         →', Boolean(0))           // false

// 这也是为什么 || 无法区分 null 和 undefined（都走 ToBoolean）


console.log('\n=== 3. ToObject：对 null/undefined 取属性统一报错 ===\n')

// 注意：Object(null) / Object(undefined) 不报错（返回 {}），那是 Object() 函数的特殊处理
// 真正触发抽象操作 ToObject 抛 TypeError 的是对 null/undefined 取属性
try {
  null.foo
} catch (e) {
  console.log('null.foo        →', e.constructor.name)      // TypeError
}
try {
  undefined.bar
} catch (e) {
  console.log('undefined.bar   →', e.constructor.name)      // TypeError
}


console.log('\n=== 本节要点 ===\n')

// null 是可计算的空（ToNumber → 0），undefined 是不可计算的未知（ToNumber → NaN）
// ToBoolean 把两者统一（都 false），ToObject 把两者统一（取属性都报错）
// 这种「分裂 vs 统一」反映了语言设计的演化
