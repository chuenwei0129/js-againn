// undefined 之六：彩蛋 —— undefined 不是保留字 + void 为谁而生
// 运行：node 06-reservedword-and-void.js
//
// 对应文章两个彩蛋：
// 彩蛋一：undefined 不是保留字，是 Identifier，可被局部遮蔽
// 彩蛋二：void 最初为 javascript: 协议而生，泛化为「执行表达式但丢弃结果」

console.log('=== 1. undefined 不是保留字，是 Identifier ===\n')

// null 是 Literal（保留字），undefined 是 Identifier，靠 globalThis.undefined 全局属性提供
{
  const undefined = 123
  console.log('块内 undefined          →', undefined)          // 123
  console.log('块内 typeof undefined   →', typeof undefined)   // "number" — 先名字解析（拿到 123）再 typeof
}


console.log('\n=== 2. 全局 undefined 被锁死（ES5 起）===\n')

// globalThis.undefined 仍是那个 primitive
// ES5 把 writable 和 configurable 都设为 false，行为上越来越像保留字，语法上始终不是
console.log('全局 undefined          →', undefined)           // undefined
console.log('globalThis.undefined    →', globalThis.undefined)   // undefined


console.log('\n=== 3. void 0：永远可靠的取值出口 ===\n')

// 不受局部遮蔽影响，历史上很多库用 void 0 取代 undefined
console.log('void 0                  →', void 0)              // undefined


console.log('\n=== 4. void 的语义：把结果重编码为缺席 ===\n')

console.log('1 + 2                   →', 1 + 2)               // 3
console.log('void (1 + 2)            →', void (1 + 2))        // undefined — 把 3 扔掉

// void 不是「获取 undefined」，而是「我知道有结果，但主动抹成缺席」
// undefined 负责表示缺席，void 负责制造缺席，两者互补


console.log('\n=== 本节要点 ===\n')

// undefined 语法上是 Identifier，可被局部遮蔽；可靠取值用 void 0
// void 最初为 javascript: 协议（防表达式结果覆盖页面），语义泛化为「丢弃结果，返回 undefined」
// 制造缺席这件事，从浏览器时代到今天一脉相承
