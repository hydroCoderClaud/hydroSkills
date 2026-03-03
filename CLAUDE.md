# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库概述

本仓库是 **Claude Code Desktop (cc-desktop)** 统一组件市场的远程注册表。包含四类组件：Skills（技能）、Prompts（提示词）、Agents（智能体）、MCPs（MCP 配置模板），以及一个能力清单文件。

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
7. **MCP id = 服务器名**：MCP 条目的 `id` 字段**必须**与配置文件（`.mcp.json`）中 `mcpServers` 的 JSON key（服务器名）保持一致。cc-desktop 通过 `item.id` 查找已安装状态，若不一致则已安装检测失效。例如：`id: "context7"` → 配置文件中必须有 `{ "context7": { ... } }`

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

Skills 额外支持 `files`（默认 `["SKILL.md"]`）和 `updatedAt`。Prompts/Agents 额外支持 `file`（默认 `{id}.md`）。MCPs 额外支持 `files`（默认 `["{id}.mcp.json"]`）。

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

### MCPs — 单 JSON 文件

```
mcps/{mcp-id}/{mcp-id}.mcp.json
```

纯 JSON，格式为 `{ "服务器名": { "command": "...", "args": [...] } }`。**不使用 `mcpServers` 包装层**（`mcpServers` 包装是 `~/.claude.json` 的格式，市场分发文件使用平铺格式）。**服务器名必须与 index.json 中的 `id` 字段完全一致**（见一致性规则第 7 条）。可通过 index.json `files` 数组声明多个文件，cc-desktop 以 `files[0]` 为主配置文件。

## MCP 编写规范

### 配置文件格式

市场 MCP 配置文件使用**平铺格式**，顶层 key 即为服务器名：

```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  }
}
```

**禁止**使用 `mcpServers` 包装层：

```json
// ❌ 错误 — mcpServers 包装是 ~/.claude.json 的格式
{
  "mcpServers": {
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp"] }
  }
}
```

### 服务器配置字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `command` | string | 与 `url` 二选一 | 可执行文件，如 `npx`、`node`、`python` |
| `args` | string[] | 否 | 命令行参数数组 |
| `env` | object | 否 | 环境变量键值对，敏感值用占位符 |
| `url` | string | 与 `command` 二选一 | SSE/HTTP 服务地址 |
| `type` | string | 否 | 传输类型：`stdio`（默认）或 `sse` |
| `tools` | string[] | 否 | **自定义扩展字段**，见下方说明 |

### tools 字段（自定义扩展）

`tools` 是本注册表的**自定义扩展字段**，不属于 Claude Code CLI 的标准 MCP 配置。cc-desktop 安装 MCP 时会读取此字段，自动将工具权限写入 `~/.claude/settings.json` 的 `permissions.allow`，免去用户手动授权。写入 `~/.claude.json` 时会自动剔除该字段，不影响 CLI 解析。

**权限格式**：`mcp__<serverName>__<toolName>`

**示例**：

```json
{
  "mcp-image": {
    "command": "npx",
    "args": ["-y", "mcp-image"],
    "env": {
      "GEMINI_API_KEY": "your-gemini-api-key-here"
    },
    "tools": ["generate_image"]
  }
}
```

安装后，`~/.claude/settings.json` 中自动添加 `"mcp__mcp-image__generate_image"`。卸载时按前缀 `mcp__mcp-image__` 自动清理。

**如何获取工具名称**：

1. **MCP Inspector**（推荐）：`npx @modelcontextprotocol/inspector`，连接到 MCP 服务器后界面直接列出所有工具名
2. **Claude Code CLI**：在已安装该 MCP 的项目中执行 `/mcp`，查看工具列表
3. **查看源码或官方文档**：如 npm 包的 README 通常会列出所有工具
4. **查看已授权记录**：`~/.claude/settings.json` 的 `permissions.allow` 中已授权的条目可直接提取工具名

**编写要求**：`tools` 数组应尽量填写完整，覆盖该 MCP 暴露的所有工具，确保用户安装后无需逐个手动授权。

### 两种传输类型

**stdio 类型**（本地进程，最常见）：

```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  }
}
```

**SSE/HTTP 类型**（远程服务）：

```json
{
  "my-remote-server": {
    "url": "https://example.com/mcp/sse",
    "type": "sse"
  }
}
```

### 环境变量处理

需要用户填写的敏感配置（API Key 等）使用占位符，并在 index.json `description` 中说明：

```json
{
  "my-server": {
    "command": "npx",
    "args": ["-y", "my-mcp-server"],
    "env": {
      "MY_API_KEY": "your-api-key-here"
    }
  }
}
```

### index.json 中的 MCP 条目

```json
{
  "id": "context7",
  "name": "Context7",
  "description": "为 LLM 提供最新的库文档和代码示例",
  "version": "1.0.0",
  "author": "Upstash",
  "tags": ["documentation", "context"],
  "files": ["context7.mcp.json"]
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 唯一标识，**必须**与配置文件中的服务器名一致（见一致性规则第 7 条） |
| `version` | 是 | 语义化版本号，格式 `x.y.z` |
| `name` | 否 | 显示名称（默认显示 `id`） |
| `description` | 否 | 功能描述，建议说明所需环境变量 |
| `files` | 否 | 配置文件列表，默认 `["{id}.mcp.json"]` |

### 目录结构

```
mcps/
└── context7/
    └── context7.mcp.json
```

文件名与 `id` 保持一致（`{id}.mcp.json`），除非有多文件需求时通过 `files` 字段显式声明。

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
| `icon` | string | 是 | 图标名。可选值：`search`、`check`、`git`、`code`、`star`、`fileText`、`plugin`、`folder`、`image` 等（参见 cc-desktop Icon 组件） |
| `type` | string | 是 | 组件类型：`skill`、`agent`、`plugin`、`mcp` |
| `componentId` | string | 是 | 关联的组件标识（见下方说明） |
| `category` | string | 是 | 功能分类标识（见下方说明） |
| `categoryName` | object | 是 | 分类的多语言显示名称，含 `zh-CN` 和 `en-US` 字段 |

### componentId 格式

- **本仓库组件**（skill/agent/mcp）：直接使用 index.json 中的 `id`，如 `"my-code-review"`、`"filesystem"`
- **第三方插件**（plugin）：格式为 `{pluginId}@{marketplace}`，如 `"serena@claude-plugins-official"`

当前出现的 marketplace 标识：`claude-plugins-official`、`claude-code-plugins`、`anthropic-agent-skills`、`superpowers-marketplace`。

### category 分类

| 分类 | categoryName (zh-CN) | categoryName (en-US) |
|------|------|------|
| `code-review` | 代码审查 | Code Review |
| `test-automation` | 测试自动化 | Test Automation |
| `git-workflow` | Git 工作流 | Git Workflow |
| `code-intelligence` | 代码智能 | Code Intelligence |
| `code-quality` | 代码质量 | Code Quality |
| `documentation` | 文档处理 | Documentation |
| `developer-tools` | 开发者工具 | Developer Tools |
| `creative` | 创意工具 | Creative Tools |
| `tools` | 实用工具 | Utility Tools |

添加新分类时：`category` 保持 kebab-case，`categoryName` 必须同时提供中英文。

### 核心设计原则

**一能力一组件（v1.1）**：每个能力条目只关联一个具体组件，不做聚合。同一功能领域的不同实现（如 skill、agent、plugin）各自有独立的能力条目，通过 `category` 归类。

## 常用操作命令

添加新组件后提交：
```bash
git add skills/new-skill index.json && git commit -m "feat: 添加 new-skill"
git add prompts/new-prompt.md index.json && git commit -m "feat: 添加 new-prompt"
git add agents/new-agent.md index.json && git commit -m "feat: 添加 new-agent"
git add mcps/new-mcp index.json && git commit -m "feat: 添加 new-mcp"
```

### 添加新 MCP 的完整步骤

1. 创建目录和配置文件：`mcps/{id}/{id}.mcp.json`
2. 填写服务器配置（command/args/env）
3. 用 MCP Inspector（`npx @modelcontextprotocol/inspector`）获取所有工具名，填入 `tools` 数组
4. 在 `index.json` 的 `mcps` 数组中添加条目（id/name/description/version/files）
5. 评估是否需要在 `agent-capabilities.json` 中添加能力条目（type: `"mcp"`）
6. 更新 `index.json` 顶层 `updatedAt` 时间戳

Commit message 风格：`feat: 添加 xxx`、`fix: 修复 xxx`、`docs: 更新 xxx`。
