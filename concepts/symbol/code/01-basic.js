// Symbol 基础特性
// 运行：node 01-basic.js

console.log('=== 1. Symbol 唯一性 ===\n')

const a = Symbol('foo')
const b = Symbol('foo')
console.log('a === b:', a === b)  // false
console.log('a.description:', a.description)  // "foo"
console.log('String(a):', String(a))  // "Symbol(foo)"


console.log('\n=== 2. Symbol 作为属性 Key ===\n')

const id = Symbol('id')
const user = {
  [id]: 123,
  name: 'seven'
}

console.log('user[id]:', user[id])  // 123
console.log('user.id:', user.id)  // undefined
console.log('user["id"]:', user["id"])  // undefined


console.log('\n=== 3. Symbol 属性枚举行为 ===\n')

console.log('Object.keys(user):', Object.keys(user))  // ["name"]
console.log('for...in:')
for (const key in user) {
  console.log('  ', key)  // 只输出 "name"
}
console.log('JSON.stringify(user):', JSON.stringify(user))  // {"name":"seven"}


console.log('\n=== 4. 获取 Symbol 属性 ===\n')

console.log('Object.getOwnPropertySymbols(user):', Object.getOwnPropertySymbols(user))
console.log('Reflect.ownKeys(user):', Reflect.ownKeys(user))


console.log('\n=== 5. Symbol.for() vs Symbol() ===\n')

const s1 = Symbol.for('shared')
const s2 = Symbol.for('shared')
console.log('s1 === s2:', s1 === s2)  // true

const s3 = Symbol('not-shared')
const s4 = Symbol('not-shared')
console.log('s3 === s4:', s3 === s4)  // false

console.log('Symbol.keyFor(s1):', Symbol.keyFor(s1))  // "shared"
console.log('Symbol.keyFor(s3):', Symbol.keyFor(s3))  // undefined
