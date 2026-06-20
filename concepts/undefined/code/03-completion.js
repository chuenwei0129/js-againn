// undefined 之三：Completion System —— 值没产生
// 运行：node 03-completion.js

console.log('=== 1. 函数无返回：Completion 经 UpdateEmpty ===\n')

function f() {}
console.log('f()                  →', f())   // undefined — 函数体 [[Value]] = empty，UpdateEmpty 换成 undefined


console.log('\n=== 2. return; 不经 UpdateEmpty ===\n')

function g() { return; }
console.log('g()（return;）       →', g())   // undefined — 直接写 {Type:"return", Value:undefined}

// f() 和 g() 结果都是 undefined，但 Completion [[Type]] 不同：normal vs return


console.log('\n=== 3. 返回真实值：不涉及 empty ===\n')

function h() { return 42; }
console.log('h()                  →', h())   // 42 — [[Value]] 不是 empty，不经 UpdateEmpty 补值


console.log('\n=== 4. eval：语句 Completion 暴露给用户代码 ===\n')

console.log('eval("var x = 1;")   →', eval('var x = 1;'))   // undefined — var 语句不产出值，[[Value]] = empty


console.log('\n=== 5. void：把结果重编码为缺席 ===\n')

console.log('1 + 2                →', 1 + 2)            // 3
console.log('void (1 + 2)         →', void (1 + 2))     // undefined — void 把 3 扔掉

// void 不是「获取 undefined」，而是「我知道有结果，但主动抹成缺席」
// undefined 负责表示缺席，void 负责制造缺席


console.log('\n=== 本节要点 ===\n')

// 每段代码求值返回一个 Completion Record：[[Type]] + [[Value]] + [[Target]]
// 不产出值的语句 [[Value]] = empty（规范内部占位符，不是 undefined）
// UpdateEmpty：[[Value]] 为 empty → 换成 undefined；empty ≠ undefined
