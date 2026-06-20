# Symbol 速查卡

## 核心概念

Symbol = 唯一标识符 + 独立命名空间 → 运行时协议机制

## 三个特性

1. **唯一性** — `Symbol() !== Symbol()`
2. **独立空间** — 不和字符串冲突
3. **默认隐藏** — `Object.keys()` 拿不到

## 常用 API

```javascript
Symbol('desc')           // 创建唯一 Symbol
Symbol.for('key')        // 创建共享 Symbol
s.description            // 读取描述
obj[s] = 123             // 作为属性 key
Reflect.ownKeys(obj)     // 获取所有 key（含 Symbol）
String(s)                // "Symbol(desc)"
```

## Well-known Symbols

| Symbol | 用途 |
|--------|------|
| Symbol.iterator | for...of、展开运算符 |
| Symbol.toPrimitive | 类型转换 |
| Symbol.hasInstance | instanceof |
| Symbol.match | 正则匹配 |
| Symbol.toStringTag | 类型标签 |
| Symbol.isConcatSpreadable | concat 展开 |
| Symbol.species | 派生构造函数 |
| Symbol.dispose | 资源释放 |

## 3 个核心问题（2 分钟自测）

1. **Symbol 解决什么问题？**  
   字符串 key 会和业务字段冲突，Symbol 提供独立命名空间

2. **Symbol.iterator 怎么工作？**  
   对象实现 `[Symbol.iterator]()`，返回 `{next: () => ({value, done})}`

3. **Symbol 属性为什么不出现在 Object.keys()？**  
   它是运行时钩子，不是业务数据

**答不上来？** → 跑 `code/` 或看 `articles/`
