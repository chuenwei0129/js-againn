// Symbol.toPrimitive 类型转换
// 运行：node 03-toPrimitive.js

console.log('=== 1. 自定义类型转换 ===\n')

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


console.log('\n=== 2. 实战：温度对象 ===\n')

class Temperature {
  constructor(celsius) {
    this.celsius = celsius
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'string') {
      return `${this.celsius}°C`
    }
    return this.celsius
  }
}

const temp = new Temperature(100)
console.log(`水的沸点: ${temp}`)  // "水的沸点: 100°C"
console.log('温度值:', +temp)  // 100
console.log('比较:', temp > 50)  // true


console.log('\n=== 3. 对比 valueOf 和 toString ===\n')

const obj2 = {
  toString() { return 'from toString' },
  valueOf() { return 42 },
  [Symbol.toPrimitive](hint) {
    return hint === 'string' ? 'from toPrimitive' : 99
  }
}

console.log('String(obj2):', String(obj2))  // "from toPrimitive"
console.log('+obj2:', +obj2)  // 99


console.log('\n=== 4. 没有 Symbol.toPrimitive 时的行为 ===\n')

const obj3 = {
  toString() { return '42' },
  valueOf() { return 100 }
}

console.log('String(obj3):', String(obj3))  // "42" (优先 toString)
console.log('+obj3:', +obj3)  // 100 (优先 valueOf)
