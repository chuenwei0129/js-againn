// null 之六：JSON 为什么只认 null
// 运行：node 06-json.js
//
// 对应文章「JSON 为什么只认 null？」一节：
// JSON 是跨语言数据交换协议，只能传输「值」，不能传输「状态」
// null 是可传输的空值，undefined 是引擎内部状态

console.log('=== 1. JSON.stringify 的输入 ===\n')

// null 本身序列化为 "null"
console.log('JSON.stringify(null)      →', JSON.stringify(null))      // "null"
// undefined 甚至不返回字符串
console.log('JSON.stringify(undefined) →', JSON.stringify(undefined)) // undefined（返回值不是字符串）


console.log('\n=== 2. 对象属性中的 undefined 被忽略 ===\n')

console.log('JSON.stringify({a:undefined, b:null}) →', JSON.stringify({ a: undefined, b: null }))  // '{"b":null}'
// 对象的 undefined 属性被直接忽略，null 保留


console.log('\n=== 3. 数组中的 undefined 被替换为 null ===\n')

console.log('JSON.stringify([1, undefined, 3]) →', JSON.stringify([1, undefined, 3]))  // '[1,null,3]'
// 数组的 undefined 被替换为 null（位置不能省略），null 保持


console.log('\n=== 4. JSON.parse 不能还原 undefined ===\n')

console.log('JSON.parse("null") →', JSON.parse('null'))  // null
// JSON 没有 undefined 字面量，parse 也无法产生 undefined
try {
  JSON.parse('undefined')
} catch (e) {
  console.log('JSON.parse("undefined") →', e.constructor.name)  // SyntaxError
}


console.log('\n=== 本节要点 ===\n')

// undefined 不是数据，是状态——JSON 无法传输状态，只能传输值
// 三种行为同义：对象属性忽略、数组替换为 null、顶层返回 undefined
// null 是可序列化、可跨网络、可被其他语言理解的空值
