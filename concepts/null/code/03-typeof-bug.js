// null 之三：typeof null —— 一个永远修不掉的历史 Bug
// 运行：node 03-typeof-bug.js
//
// 对应文章「typeof null：一个永远修不掉的历史 Bug」一节：
// typeof null 返回 "object" 是实现事故（类型标签 0 撞车），不是设计意图

console.log('=== 1. typeof null 返回 "object" ===\n')

console.log('typeof null      →', typeof null)       // "object" — 历史 Bug
console.log('typeof undefined →', typeof undefined)   // "undefined"
console.log('typeof 0         →', typeof 0)           // "number"


console.log('\n=== 2. null 根本不是对象 ===\n')

// null 没有属性、方法、原型——对它取属性直接报错
try {
  null.foo
} catch (e) {
  console.log('null.foo →', e.constructor.name + ': ' + e.message)  // TypeError
}


console.log('\n=== 3. 规范真相：Type(null) = Null ===\n')

// 规范内部抽象操作 Type(x) 定义值的真实类型
// Type(null) = Null，与 Object、Number、String 同级——null 从来不是对象
// typeof null = "object" 是早期引擎类型标签 0 撞车的历史事故

// 曾提议修复为 typeof null === 'null'，因兼容性被拒绝：
// 海量代码依赖 typeof value === 'object'，贸然修复风险大于收益


console.log('\n=== 本节要点 ===\n')

// Type(null) = Null（规范真相，独立类型，§6.1.1）
// typeof null = "object"（实现事故，类型标签 0 撞车）
// 两者位于 ECMAScript 不同抽象层级，并不矛盾
