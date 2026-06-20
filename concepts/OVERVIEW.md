# js-againn 知识库结构

## 概念文件夹标准结构（简化版）

```
concepts/<concept-name>/
├── article.md         ← 核心理论文章（学习用）
├── cheatsheet.md      ← 速查卡（复习用）
├── code/              ← 代码示例（分开存放）
│   ├── 01-basic.js
│   ├── 02-iterator.js
│   ├── 03-xxx.js
│   └── ...
└── quiz.md            ← 自测题（检验用）
```

## 已完成

### Symbol ✅
- 文章：从多态到运行时协议
- 速查卡：核心概念 + API + 3 个核心问题
- 代码：4 个文件，覆盖所有 Well-known Symbols
- 自测题：10 道

## 待创建

1. Iterator & Generator
2. Promise
3. Closure
4. Prototype
5. Proxy & Reflect
6. Type System

## 复习流程

### 首次学习（1 小时）
1. 读 `article.md`（30 分钟）
2. 跑 `code/` 文件夹（15 分钟）
3. 做 `quiz.md` 自测题（15 分钟）

### 复习（2-15 分钟）
1. 看 `cheatsheet.md` 的"3 个核心问题"（2 分钟）
2. 答不上来？→ 跑 `code/` 文件夹（5 分钟）
3. 还不确定？→ 看 `article.md` 对应章节（10 分钟）

## 文件位置

所有概念文章：`/concepts/<concept-name>/`
速查卡：`/concepts/<concept-name>/cheatsheet.md`
代码示例：`/concepts/<concept-name>/code/`
自测题：`/concepts/<concept-name>/quiz.md`
