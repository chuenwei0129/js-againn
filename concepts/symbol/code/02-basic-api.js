// Symbol 之二：基础 API 速查
// 运行：node 02-basic-api.js
//
// 对应文章附录「Symbol 基础 API」一节：
// 创建 / description / Symbol.for() 共享 / 作为属性 key / 枚举行为 / 隐式转换

console.log('=== 1. 创建 Symbol：唯一性 ===\n')

const a = Symbol('foo')
const b = Symbol('foo')
console.log('a === b:', a === b)  // false
console.log('a.description:', a.description)  // "foo"
console.log('String(a):', String(a))  // "Symbol(foo)"

// 描述字符串只是给人看的调试信息，不参与 identity
// Symbol 不是构造函数，不能 new（new Symbol() → TypeError）


console.log('\n=== 2. Symbol.for()：共享 Symbol ===\n')

const s1 = Symbol.for('shared')
const s2 = Symbol.for('shared')
console.log('s1 === s2:', s1 === s2)  // true

const s3 = Symbol('not-shared')
const s4 = Symbol('not-shared')
console.log('s3 === s4:', s3 === s4)  // false

console.log('Symbol.keyFor(s1):', Symbol.keyFor(s1))  // "shared"
console.log('Symbol.keyFor(s3):', Symbol.keyFor(s3))  // undefined

// Symbol.for() 查全局 Symbol 注册表，相同 key 总返回同一个值
// 普通业务场景优先用 Symbol()，跨模块共享协议才用 Symbol.for()


console.log('\n=== 3. Symbol 作为属性 Key ===\n')

const id = Symbol('id')
const user = {
  [id]: 123,
  name: 'seven'
}

console.log('user[id]:', user[id])  // 123
console.log('user.id:', user.id)  // undefined（访问的是字符串 "id"，不是 Symbol）
console.log('user["id"]:', user["id"])  // undefined

// 必须用中括号访问，user.id 等价于 user["id"]，访问的是字符串 key


console.log('\n=== 4. Symbol 属性默认不参与普通枚举 ===\n')

console.log('Object.keys(user):', Object.keys(user))  // ["name"]
console.log('for...in:')
for (const key in user) {
  console.log('  ', key)  // 只输出 "name"
}
console.log('JSON.stringify(user):', JSON.stringify(user))  // {"name":"seven"}

// 但 Symbol 属性不是隐藏属性
console.log('Object.getOwnPropertySymbols(user):', Object.getOwnPropertySymbols(user))
console.log('Reflect.ownKeys(user):', Reflect.ownKeys(user))


console.log('\n=== 5. Symbol 不允许隐式转换 ===\n')

try { +Symbol(); } catch (e) { console.log('+Symbol() →', e.constructor.name) }  // TypeError
try { '' + Symbol(); } catch (e) { console.log('"" + Symbol() →', e.constructor.name) }  // TypeError

// 显式转换可以
console.log('String(Symbol("foo")):', String(Symbol('foo')))  // "Symbol(foo)"
