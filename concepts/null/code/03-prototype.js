// null 作为原型链终点 + Object.create(null)
// 运行：node 03-prototype.js

console.log('=== 1. 原型链终点是 null ===\n')

// Object.prototype 的原型是 null——主动终止
const proto = Object.getPrototypeOf(Object.prototype)
console.log('Object.getPrototypeOf(Object.prototype) →', proto)  // null

// 普通对象的原型链
const obj = {}
console.log('obj.__proto__             →', Object.getPrototypeOf(obj))             // Object.prototype
console.log('obj.__proto__.__proto__   →', Object.getPrototypeOf(Object.getPrototypeOf(obj)))  // null


console.log('\n=== 2. Object.create(null)：创建纯净对象 ===\n')

const dict = Object.create(null)

// 没有任何继承属性
console.log('dict.toString       →', dict.toString)        // undefined
console.log('dict.hasOwnProperty →', dict.hasOwnProperty)  // undefined
console.log('dict.valueOf        →', dict.valueOf)         // undefined
console.log('typeof dict         →', typeof dict)          // "object"

// 可以正常存取属性
dict.name = 'test'
console.log('dict.name           →', dict.name)            // "test"


console.log('\n=== 3. 对比普通对象 ===\n')

const normal = {}

console.log('normal.toString       →', typeof normal.toString)        // "function"（继承来的）
console.log('normal.hasOwnProperty →', typeof normal.hasOwnProperty)  // "function"


console.log('\n=== 4. 安全用法：纯字典 ===\n')

// Object.create(null) 的核心价值：安全，不是性能

// 危险：普通对象可能受原型污染影响
const unsafeMap = {}
// 如果有恶意代码执行：Object.prototype.__proto__ = 'evil'
// unsafeMap 可能被污染

// 安全：Object.create(null) 切断了原型链
const safeMap = Object.create(null)
safeMap.__proto__ = 'evil'  // 只是一个普通属性，不影响原型
safeMap['key'] = 'value'

console.log('safeMap.__proto__ →', safeMap.__proto__)  // 'evil'（普通属性）
console.log('safeMap["key"]   →', safeMap['key'])      // 'value'


console.log('\n=== 5. Object.create(null) vs {} 的遍历 ===\n')

const pureDict = Object.create(null)
pureDict.a = 1
pureDict.b = 2

const normalObj = { a: 1, b: 2 }

// for...in 行为对比
console.log('pureDict for...in keys:', Object.keys(pureDict))    // ['a', 'b']
console.log('normalObj for...in keys:', Object.keys(normalObj))  // ['a', 'b']

// 原型链断裂的本质体现
console.log('pureDict instanceof Object →', pureDict instanceof Object)  // false!
console.log('normalObj instanceof Object →', normalObj instanceof Object) // true
