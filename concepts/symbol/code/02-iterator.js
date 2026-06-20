// Symbol.iterator 迭代协议
// 运行：node 02-iterator.js

console.log('=== 1. 自定义可迭代对象：数字范围 ===\n')

const range = {
  from: 1,
  to: 5,

  [Symbol.iterator]() {
    let current = this.from
    const last = this.to

    return {
      next() {
        if (current <= last) {
          return { value: current++, done: false }
        }
        return { done: true }
      }
    }
  }
}

console.log('展开运算符:', [...range])  // [1, 2, 3, 4, 5]
console.log('for...of:')
for (const num of range) {
  console.log(' ', num)
}


console.log('\n=== 2. Runtime 检查逻辑 ===\n')

console.log('typeof range[Symbol.iterator]:', typeof range[Symbol.iterator])  // "function"
console.log('Array.isArray(range):', Array.isArray(range))  // false


console.log('\n=== 3. 普通对象不可迭代 ===\n')

const plainObj = { a: 1, b: 2 }
try {
  for (const x of plainObj) {
    console.log(x)
  }
} catch (e) {
  console.log('错误:', e.message)  // plainObj is not iterable
}


console.log('\n=== 4. 字符串可迭代 ===\n')

const str = 'hello'
console.log('展开字符串:', [...str])  // ['h', 'e', 'l', 'l', 'o']


console.log('\n=== 5. 实战：链表迭代器 ===\n')

class ListNode {
  constructor(value, next = null) {
    this.value = value
    this.next = next
  }

  [Symbol.iterator]() {
    let current = this
    return {
      next() {
        if (current) {
          const value = current.value
          current = current.next
          return { value, done: false }
        }
        return { done: true }
      }
    }
  }
}

const linkedList = new ListNode(1, new ListNode(2, new ListNode(3)))
console.log('链表值:', [...linkedList])  // [1, 2, 3]
console.log('Array.from:', Array.from(linkedList))  // [1, 2, 3]
