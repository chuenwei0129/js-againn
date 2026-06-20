# Issue tracker: Local Markdown

这个 repo 的 issues 和 PRDs 作为 markdown 文件存放在 `.scratch/` 中。

## Conventions

- 每个 feature 一个目录：`.scratch/<feature-slug>/`
- PRD 是 `.scratch/<feature-slug>/PRD.md`
- Implementation issues 是 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号
- Triage state 记录为每个 issue file 顶部附近的 `Status:` 行（role 字符串见 `triage-labels.md`）
- Comments 和 conversation history 追加到文件底部的 `## Comments` heading 下

## When a skill says "publish to the issue tracker"

在 `.scratch/<feature-slug>/` 下创建新文件（必要时创建目录）。

## When a skill says "fetch the relevant ticket"

读取引用路径处的文件。用户通常会直接传入路径或 issue number。

## 文件模板

### Issue 文件模板

```markdown
---
Status: needs-triage
Created: YYYY-MM-DD
---

# Issue Title

描述问题或任务...

## Comments

（对话历史追加在这里）
```

### PRD 文件模板

```markdown
---
Status: draft
Created: YYYY-MM-DD
---

# PRD: Feature Name

## 问题陈述

## 解决方案

## 用户故事

## 验收标准

## Comments

（对话历史追加在这里）
```
