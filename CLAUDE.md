# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库概述

本仓库是 **Claude Code Desktop (cc-desktop)** 统一组件市场的远程注册表。包含三类组件：Skills（技能）、Prompts（提示词）、Agents（智能体），以及一个能力清单文件。

cc-desktop 通过 `{registryUrl}/index.json` 发现和安装组件。用户在 cc-desktop「全局设置 → 组件市场 → 仓库地址」中填入本仓库 Raw URL 即可使用。

## 关键文件

- `index.json` — 唯一注册表入口，cc-desktop 据此发现所有组件
- `agent-capabilities.json` — 能力清单，将组件（含第三方插件）按功能分类，供 cc-desktop 展示"能力卡片"
- `skills/{skill-id}/SKILL.md` — Skill 主文件（每个 Skill 一个目录）
- `prompts/{prompt-id}.md` — Prompt 文件（纯文本，无 frontmatter）
- `agents/{agent-id}.md` — Agent 文件（必须含 YAML frontmatter）

## 一致性规则（修改时必须遵守）

1. **index.json 与文件必须同步**：添加/删除组件文件时，必须同步更新 index.json 中的对应条目
2. **版本号必须递增**：修改组件内容后必须递增 index.json 中该组件的 `version`，否则 cc-desktop 不会提示更新
3. **更新顶层时间戳**：修改 index.json 中任何组件后，更新顶层 `updatedAt`
4. **ID = 文件路径**：组件 `id` 直接决定文件位置。ID 只允许 `[a-z0-9-]`
5. **name 一致性**：Skill 的 frontmatter `name` = 目录名；Agent 的 frontmatter `name` = 文件名（不含 `.md`）
6. **agent-capabilities.json 同步**：添加新组件时，评估是否需要在 agent-capabilities.json 中添加对应能力条目

## index.json 结构

```json
{
  "version": 1,
  "name": "仓库显示名称",
  "updatedAt": "ISO 8601 时间",
  "skills": [],
  "prompts": [],
  "agents": []
}
```

每个组件条目必填字段：`id`、`version`。可选：`name`、`description`、`author`、`tags`。

Skills 额外支持 `files`（默认 `["SKILL.md"]`）和 `updatedAt`。Prompts/Agents 额外支持 `file`（默认 `{id}.md`）。

## 三类组件的格式差异

### Skills — 目录 + YAML frontmatter

```
skills/{skill-id}/SKILL.md
```

必须包含 YAML frontmatter（`name` + `description`）。`description` 决定 Claude 何时自动触发。正文是被调用时的完整系统提示。可通过 index.json `files` 数组声明附加文件。

### Prompts — 单文件，纯文本

```
prompts/{prompt-id}.md
```

纯 Markdown，**不需要** YAML frontmatter。全部内容即为提示词模板。文件不能为空。`name` 由 index.json 定义。

### Agents — 单文件 + YAML frontmatter

```
agents/{agent-id}.md
```

必须包含 YAML frontmatter（`name` + `description`，可选 `color`）。`color` 可选值：`blue`、`ocean`、`forest`、`violet`、`ember`、`red`、`gray`。正文是 Agent 被调用时的系统提示。

## agent-capabilities.json 能力清单规范

为 cc-desktop 的 **Agent 模式** 提供能力清单。Agent 模式下，cc-desktop 读取此文件，将所有可用能力（本仓库组件 + 第三方插件）按功能分类展示为"能力卡片"，供用户一键启用。

### 顶层结构

```json
{
  "version": "1.1",
  "capabilities": []
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version` | string | 是 | 能力清单格式版本，当前为 `"1.1"`（一能力一组件模型） |
| `capabilities` | array | 是 | 能力条目数组 |

### 能力条目字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 能力唯一标识，同一文件内不可重复 |
| `name` | string | 是 | 显示名称，展示在能力卡片上 |
| `description` | string | 是 | 能力描述，展示在卡片副标题 |
| `icon` | string | 是 | 图标名。可选值：`search`、`check`、`git`、`code`、`star`、`fileText`、`plugin` |
| `type` | string | 是 | 组件类型：`skill`、`agent`、`plugin` |
| `componentId` | string | 是 | 关联的组件标识（见下方说明） |
| `category` | string | 是 | 功能分类（见下方说明） |

### componentId 格式

- **本仓库组件**（skill/agent）：直接使用 index.json 中的 `id`，如 `"my-code-review"`
- **第三方插件**（plugin）：格式为 `{pluginId}@{marketplace}`，如 `"serena@claude-plugins-official"`

当前出现的 marketplace 标识：`claude-plugins-official`、`claude-code-plugins`、`anthropic-agent-skills`、`superpowers-marketplace`。

### category 分类

| 分类 | 说明 |
|------|------|
| `code-review` | 代码审查相关 |
| `test-automation` | 测试自动化 |
| `git-workflow` | Git 工作流 |
| `code-intelligence` | 代码智能（LSP、语义搜索） |
| `code-quality` | 代码质量与优化 |
| `documentation` | 文档相关 |
| `developer-tools` | 开发者工具 |

添加新分类时保持 kebab-case 命名风格。

### 核心设计原则

**一能力一组件（v1.1）**：每个能力条目只关联一个具体组件，不做聚合。同一功能领域的不同实现（如 skill、agent、plugin）各自有独立的能力条目，通过 `category` 归类。

## 常用操作命令

添加新组件后提交：
```bash
git add skills/new-skill index.json && git commit -m "feat: 添加 new-skill"
git add prompts/new-prompt.md index.json && git commit -m "feat: 添加 new-prompt"
git add agents/new-agent.md index.json && git commit -m "feat: 添加 new-agent"
```

Commit message 风格：`feat: 添加 xxx`、`fix: 修复 xxx`、`docs: 更新 xxx`。
