---
name: my-git-commit-helper
description: Git 提交助手，帮助生成规范的 commit message。当用户要求"写commit"、"提交信息"、"commit message"时自动触发。
---

# Git Commit Helper

根据当前代码变更，生成符合 Conventional Commits 规范的提交信息。

## 规范格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type 类型

| Type | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 bug |
| docs | 文档变更 |
| style | 代码格式（不影响逻辑） |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试相关 |
| chore | 构建/工具变更 |

## 工作流程

1. 运行 `git diff --staged` 查看暂存的变更
2. 分析变更内容，判断 type 和 scope
3. 用中文撰写简洁的 subject（不超过 50 字符）
4. 如有必要，在 body 中补充说明
5. 输出完整的 commit message 供用户确认
