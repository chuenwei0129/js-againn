# js-againn 知识库结构

## 概念文件夹标准结构

```
concepts/<concept-name>/
├── articles/          ← 核心理论文章（学习用）
│   ├── 01-xxx.md
│   ├── 02-xxx.md
│   └── ...
├── cheatsheet.md      ← 速查卡（复习用）
├── code/              ← 代码示例（分开存放）
│   ├── 01-basic.js
│   ├── 02-iterator.js
│   ├── 03-xxx.js
│   └── ...
└── quiz.md            ← 自测题（检验用）
```

## 已完成

### Null ✅
- 文章：JavaScript null 的本质——"有意的空"如何成为语言基石（`articles/01-null-essence.md`）
- 速查卡：核心概念 + 抽象操作表 + JSON + TypeScript + 3 个核心问题
- 代码：7 个文件，按文章小节切分（essence / ToNumber / typeof Bug / 相等 / 原型 / JSON / nullish 操作符）
- 自测题：14 道（含 TypeScript 与生态实践）

### Symbol ✅
- 文章：从多态到运行时协议（`articles/01-why-symbol.md`）
- 速查卡：核心概念 + API + 3 个核心问题
- 代码：5 个文件，按文章小节切分（为何发明 / 基础 API / 迭代协议 / Runtime Hooks / 边界）
- 自测题：10 道

### Undefined ✅
- 文章：为什么 JavaScript 会有 undefined——ECMAScript 对运行时缺席的统一编码（`articles/01-why-undefined.md`）
- 速查卡：三套缺席系统表 + 抽象操作对照 + undefined vs null + 3 个核心问题
- 代码：6 个文件，按文章小节切分（Binding / Reference / Completion / 默认值 / null 对比 / 保留字与 void）
- 自测题：11 道

## 待创建

1. Iterator & Generator
2. Promise
3. Closure
4. Prototype
5. Proxy & Reflect
6. Type System

## 复习流程

### 首次学习（1 小时）
1. 读 `articles/` 文章（30 分钟）
2. 跑 `code/` 文件夹（15 分钟）
3. 做 `quiz.md` 自测题（15 分钟）

### 复习（2-15 分钟）
1. 看 `cheatsheet.md` 的"3 个核心问题"（2 分钟）
2. 答不上来？→ 跑 `code/` 文件夹（5 分钟）
3. 还不确定？→ 看 `articles/` 对应文章（10 分钟）

## 文件位置

所有概念文章：`/concepts/<concept-name>/articles/`
速查卡：`/concepts/<concept-name>/cheatsheet.md`
代码示例：`/concepts/<concept-name>/code/`
自测题：`/concepts/<concept-name>/quiz.md`
