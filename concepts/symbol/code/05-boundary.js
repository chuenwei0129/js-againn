// Symbol 之五：边界 —— Symbol 不是协议本身 + TS vs Java interface
// 运行：node 05-boundary.js
//
// 对应文章「一个容易混淆的边界」+ 附录「TypeScript 的 interface 和 Java 的 interface 不是一回事」：
// Symbol.iterator 只是协议入口标识，协议本身长什么样靠规范对结构的规定
// TS interface 是 structural typing（编译期 duck typing），解决不了 runtime 能力检测

console.log('=== 1. Symbol.iterator 是入口，不是协议本身 ===\n')

// 协议分两层：
// Iterable Protocol（对象怎么暴露迭代入口）— Symbol.iterator 参与定位入口
// Iterator Protocol（迭代器怎么吐值）— 完全靠规范对结构的规定，跟 Symbol 无关

// 错误的协议入口：返回的不是对象，违反 Iterator Protocol
const broken = {
  [Symbol.iterator]() {
    return null  // 不是 { next() {...} } 结构
  }
}
try {
  for (const x of broken) { console.log(x) }
} catch (e) {
  console.log('返回 null 的迭代器 →', e.constructor.name + ': ' + e.message)  // TypeError
}

// 正确的协议入口 + 正确的结构契约
const ok = {
  [Symbol.iterator]() {
    let i = 0
    return {
      next() {
        return i < 3 ? { value: i++, done: false } : { done: true }
      }
    }
  }
}
console.log('结构正确的迭代器 →', [...ok])  // [0, 1, 2]


console.log('\n=== 2. 协议入口 vs 结构契约：两层分开 ===\n')

// Symbol.iterator 解决的是「入口怎么稳定定位、不撞名」
// 协议本身的结构（必须有 next()、next() 必须返回 {done, value}）是另一回事

const noNext = {
  [Symbol.iterator]() {
    return {}  // 有入口，但对象没有 next() 方法
  }
}
try {
  [...noNext]
} catch (e) {
  console.log('有入口但没 next() →', e.constructor.name)  // TypeError
}


console.log('\n=== 3. TypeScript interface 是 structural typing（编译期）===\n')

// 模拟 TS 的 structural check（运行时用 JS 表达其思想）：
// TS 不看 implements 声明，只看结构是否匹配——把 duck typing 搬到编译期
// 但代码跑起来后没有编译器，runtime 仍需一个稳定标识符去对象上找协议入口

// 这正是 Symbol 存在的理由：interface 路线解决不了 runtime 能力检测
// TS 的 interface 像「门卫」，下班（编译完）就没人查了
// JS 运行时像「门禁卡」，必须当场刷卡——Symbol.iterator 就是那张官方门禁卡


console.log('\n=== 4. 字符串门禁卡 vs Symbol 门禁卡 ===\n')

// 字符串卡：容易伪造/撞车
const fakeCard = { iterator: () => {} }
console.log("typeof fakeCard.iterator      →", typeof fakeCard.iterator)  // function — 会被误判

// Symbol 卡：官方定义、身份唯一、稳定可识别
const realCard = { [Symbol.iterator]: () => {} }
console.log("typeof realCard[Symbol.iterator] →", typeof realCard[Symbol.iterator])  // function — 真正的协议入口
console.log('fakeCard 有 Symbol.iterator 吗 →', Symbol.iterator in fakeCard)  // false
console.log('realCard 有 Symbol.iterator 吗 →', Symbol.iterator in realCard)  // true


console.log('\n=== 本节要点 ===\n')

// Symbol.iterator 只是入口标识；协议结构契约靠规范规定，跟 Symbol 无关
// TS interface 是编译期 structural typing，解决不了 runtime 能力检测
// runtime 需要稳定、唯一、不可伪造的标识符去对象上找协议入口——这正是 Symbol
