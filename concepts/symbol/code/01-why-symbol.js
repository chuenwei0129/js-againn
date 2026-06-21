// Symbol 之一：为什么 JavaScript 必须发明 Symbol
// 运行：node 01-why-symbol.js
//
// 对应文章前半段论证（多态 / duck typing / 开放对象模型 / 核心矛盾）：
// JavaScript 用 duck typing，runtime 自己也要检测对象能力
// 但字符串 key 和业务字段共享命名空间，协议入口会和业务字段撞车
// Symbol 提供独立命名空间，让 runtime 能稳定识别协议入口又不撞名

console.log('=== 1. duck typing：不看「你是谁」，只看「你能做什么」===\n')

// 不需要 interface / implements，调用方只依赖行为
function letItMove(animal) {
  return animal.move()
}

const cat = { move() { return '猫在跑' } }
const bird = { move() { return '鸟在飞' } }

console.log('cat.move  →', letItMove(cat))   // 猫在跑
console.log('bird.move →', letItMove(bird))  // 鸟在飞

// 用户代码的 duck typing 很好用，直到 runtime 自己也要检测能力
// 比如 for...of：runtime 必须判断「这个对象能不能迭代」


console.log('\n=== 2. 字符串 key 的致命问题：协议入口会撞车 ===\n')

// 假设用字符串 'iterator' 作为迭代协议入口
const obj = {
  // 业务字段恰好也叫 iterator
  iterator: '我是业务数据，不是迭代器',
}

console.log('obj.iterator        →', obj.iterator)   // "我是业务数据..."
console.log("typeof obj.iterator →", typeof obj.iterator)  // "string"

// runtime 若靠 typeof obj.iterator === 'function' 判断迭代能力
// 就会把这个业务字段误判为协议入口——这正是核心矛盾：
// runtime protocol 和业务字段共享同一个字符串命名空间


console.log('\n=== 3. Symbol 解决：独立命名空间，永不撞车 ===\n')

// 同样的「iterator」语义，用 Symbol 就是协议入口，和字符串 key 互不干扰
const symObj = {
  [Symbol.iterator]: '理论上这里该是函数，但和字符串 key 不冲突',
  iterator: '业务数据',
}

console.log('symObj.iterator             →', symObj.iterator)              // 业务数据
console.log("typeof symObj.iterator      →", typeof symObj.iterator)       // string
console.log('symObj[Symbol.iterator]     →', symObj[Symbol.iterator])      // 协议入口（Symbol key）
console.log("typeof symObj[Symbol.iterator] →", typeof symObj[Symbol.iterator])  // string


console.log('\n=== 4. 唯一性：每次 Symbol() 都是新值 ===\n')

console.log('Symbol("id") === Symbol("id") →', Symbol('id') === Symbol('id'))  // false
// identity 就是这个值本身，不是描述字符串
// 协议入口用 Well-known Symbol（如 Symbol.iterator）保证全局唯一稳定


console.log('\n=== 5. 真正的迭代协议：runtime 检查 Symbol.iterator ===\n')

const iterable = {
  *[Symbol.iterator]() {
    yield 1
    yield 2
  },
}

console.log('Array.isArray(iterable)        →', Array.isArray(iterable))           // false
console.log("typeof iterable[Symbol.iterator] →", typeof iterable[Symbol.iterator])  // function
console.log('[...iterable]                  →', [...iterable])                    // [1, 2]

// runtime 不关心 obj 是不是 Array，只检查 obj[Symbol.iterator] 是否存在且是函数
// 这就是语言级 duck typing——runtime 在运行时做能力检查


console.log('\n=== 本节要点 ===\n')

// JavaScript 靠 duck typing，runtime 也要检测对象能力
// 字符串 key 和业务字段共享命名空间 → 协议入口会撞车
// Symbol 提供独立命名空间 + 唯一性，让协议入口稳定可识别又不撞名
