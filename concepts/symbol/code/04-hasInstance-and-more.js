// Symbol.hasInstance 和其他 Well-known Symbols
// 运行：node 04-hasInstance-and-more.js

console.log('=== 1. Symbol.hasInstance 自定义 instanceof ===\n')

class EvenNumber {
  static [Symbol.hasInstance](value) {
    return typeof value === 'number' && value % 2 === 0
  }
}

console.log('2 instanceof EvenNumber:', 2 instanceof EvenNumber)  // true
console.log('3 instanceof EvenNumber:', 3 instanceof EvenNumber)  // false
console.log('"2" instanceof EvenNumber:', "2" instanceof EvenNumber)  // false


console.log('\n=== 2. Symbol.match 自定义正则匹配 ===\n')

class CustomMatcher {
  [Symbol.match](str) {
    return str.includes('hello') ? ['found hello'] : null
  }
}

console.log('hello world'.match(new CustomMatcher()))  // ['found hello']
console.log('bye world'.match(new CustomMatcher()))  // null


console.log('\n=== 3. Symbol.toStringTag 自定义类型标签 ===\n')

class MyCollection {
  get [Symbol.toStringTag]() {
    return 'MyCollection'
  }
}

const collection = new MyCollection()
console.log('Object.prototype.toString:', Object.prototype.toString.call(collection))


console.log('\n=== 4. Symbol.isConcatSpreadable 控制 concat 行为 ===\n')

const arr1 = [1, 2, 3]
const arr2 = [4, 5, 6]
arr2[Symbol.isConcatSpreadable] = false

console.log('arr1.concat(arr2):', arr1.concat(arr2))  // [1, 2, 3, [4, 5, 6]]


console.log('\n=== 5. Symbol.species 控制派生对象 ===\n')

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


console.log('\n=== 6. 综合实战：自定义集合类 ===\n')

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
