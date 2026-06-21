// null 之四：== 中的特权 —— 唯一拥有专属分支的值
// 运行：node 04-equality.js
//
// 对应文章「null 在 == 中的特权」一节：
// Abstract Equality 为 null/undefined 设专属分支（Step 2/3），不等于任何其他值

console.log('=== 1. Abstract Equality (==)：null 的专属特权 ===\n')

// null 和 undefined 互相相等（专属分支，Step 2/3 直接返回）
console.log('null == undefined      →', null == undefined)       // true
console.log('undefined == null      →', undefined == null)       // true

// 但 null 不等于任何其他值（不走通用转换路径）
console.log('null == 0              →', null == 0)               // false
console.log('null == false          →', null == false)           // false
console.log('null == ""             →', null == "")              // false
console.log('null == "null"         →', null == "null")          // false
console.log('undefined == 0         →', undefined == 0)          // false
console.log('undefined == false     →', undefined == false)      // false


console.log('\n=== 2. Strict Equality (===)：无特权 ===\n')

console.log('null === null          →', null === null)           // true
console.log('undefined === undefined →', undefined === undefined) // true
console.log('null === undefined     →', null === undefined)      // false（类型不同）


console.log('\n=== 3. Object.is：SameValue 算法，同样无特权 ===\n')

console.log('Object.is(null, null)           →', Object.is(null, null))           // true
console.log('Object.is(undefined, undefined) →', Object.is(undefined, undefined)) // true
console.log('Object.is(null, undefined)      →', Object.is(null, undefined))      // false


console.log('\n=== 4. 对比：其他 falsy 值在 == 中的隐式转换 ===\n')

// 这些值都会走 ToNumber/ToBoolean 转换链
console.log('0 == false     →', 0 == false)       // true（false → 0）
console.log('"" == false    →', "" == false)       // true（双方 → 0）
console.log('"1" == true    →', "1" == true)       // true（true → 1, "1" → 1）
console.log('[] == false    →', [] == false)       // true（[] → "" → 0, false → 0）

// null 和 undefined 拒绝参与这套规则
console.log('null == false  →', null == false)     // false（专属分支不命中；false 先经 Step 10 ToNumber→0，递归 null==0 仍落至 Return false）
console.log('null == 0      →', null == 0)         // false
console.log('null == ""     →', null == "")        // false


console.log('\n=== 5. 实际陷阱 ===\n')

// 用 == 判断 null/undefined 可以，但要注意边界
function isNil(value) {
  return value == null  // 等价于 value === null || value === undefined
}

console.log('isNil(null)      →', isNil(null))        // true
console.log('isNil(undefined) →', isNil(undefined))    // true
console.log('isNil(0)         →', isNil(0))            // false
console.log('isNil("")        →', isNil(""))           // false
console.log('isNil(false)     →', isNil(false))        // false
