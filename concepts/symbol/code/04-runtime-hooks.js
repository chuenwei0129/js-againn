// Symbol 之四：Runtime Hooks —— 用户对象参与语言行为决策
// 运行：node 04-runtime-hooks.js
//
// 对应文章「Runtime Hooks」一节：
// 把原本由语言内部决定的行为，通过协议入口开放给用户对象
// toPrimitive / hasInstance / match / toStringTag / isConcatSpreadable / species

console.log('=== 1. Symbol.toPrimitive：对象如何参与 +obj ===\n')

const obj1 = {
  [Symbol.toPrimitive](hint) {
    console.log(`  hint: ${hint}`)
    if (hint === 'number') return 42
    if (hint === 'string') return 'hello'
    return 'default value'
  }
}

console.log('数字上下文 (+obj1):', +obj1)  // 42
console.log('字符串上下文 (`${obj1}`):', `${obj1}`)  // "hello"
console.log('默认 (obj1 + ""):', obj1 + "")  // "default value"

// runtime 检查 obj[Symbol.toPrimitive]，把「如何转换为原始值」的决策权交给对象


console.log('\n=== 2. Symbol.hasInstance：改写 instanceof ===\n')

class EvenNumber {
  static [Symbol.hasInstance](value) {
    return typeof value === 'number' && value % 2 === 0
  }
}

console.log('2 instanceof EvenNumber:', 2 instanceof EvenNumber)  // true
console.log('3 instanceof EvenNumber:', 3 instanceof EvenNumber)  // false
console.log('"2" instanceof EvenNumber:', "2" instanceof EvenNumber)  // false

// runtime 检查 Ctor[Symbol.hasInstance]，连 instanceof 的判定都变成可插拔


console.log('\n=== 3. Symbol.match：正则匹配也能被 hook ===\n')

class CustomMatcher {
  [Symbol.match](str) {
    return str.includes('hello') ? ['found hello'] : null
  }
}

console.log('hello world'.match(new CustomMatcher()))  // ['found hello']
console.log('bye world'.match(new CustomMatcher()))  // null

// String.prototype.match 检查对象有没有 Symbol.match，有就接入 match 语言行为


console.log('\n=== 4. Symbol.toStringTag：自定义类型标签 ===\n')

class MyCollection {
  get [Symbol.toStringTag]() {
    return 'MyCollection'
  }
}

const collection = new MyCollection()
console.log('Object.prototype.toString:', Object.prototype.toString.call(collection))  // "[object MyCollection]"


console.log('\n=== 5. Symbol.isConcatSpreadable：控制 concat 展开 ===\n')

const arr1 = [1, 2, 3]
const arr2 = [4, 5, 6]
arr2[Symbol.isConcatSpreadable] = false

console.log('arr1.concat(arr2):', arr1.concat(arr2))  // [1, 2, 3, [4, 5, 6]]


console.log('\n=== 6. Symbol.species：控制派生对象构造 ===\n')

class MyArray extends Array {
  static get [Symbol.species]() {
    return Array  // 不使用 MyArray，使用原生 Array
  }
}

const myArr = new MyArray(1, 2, 3)
const mapped = myArr.map(x => x * 2)
console.log('myArr instanceof MyArray:', myArr instanceof MyArray)  // true
console.log('mapped instanceof MyArray:', mapped instanceof MyArray)  // false
console.log('mapped instanceof Array:', mapped instanceof Array)  // true


console.log('\n=== 7. 综合：自定义集合类 ===\n')

class UniqueSet {
  #items = new Map()

  add(item) {
    this.#items.set(item, true)
    return this
  }

  get size() {
    return this.#items.size
  }

  [Symbol.iterator]() {
    return this.#items.keys()
  }

  get [Symbol.toStringTag]() {
    return 'UniqueSet'
  }
}

const set = new UniqueSet()
set.add(1).add(2).add(3).add(1)

console.log('size:', set.size)  // 3
console.log('展开:', [...set])  // [1, 2, 3]
console.log('toString:', Object.prototype.toString.call(set))  // "[object UniqueSet]"
