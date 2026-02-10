# CLAUDE.md — HydroSkills 组件仓库规范

本仓库是 **Claude Code Desktop (cc-desktop)** 统一组件市场的远程注册表。
用户在 cc-desktop「全局设置 → 组件市场 → 仓库地址」中填入本仓库的 Raw URL 后，即可在应用内浏览、安装、更新三类组件。

## 仓库目录结构

```
hydroSkills/
├── CLAUDE.md          # 本规范文件
├── index.json         # 统一注册表（必须）
├── skills/            # Skills 组件目录
│   └── {skill-id}/    # 每个 Skill 一个目录
│       ├── SKILL.md   # 主文件（必须）
│       └── ...        # 可选附加文件
├── prompts/           # Prompts 组件目录
│   └── {prompt-id}.md # 每个 Prompt 一个 .md 文件
└── agents/            # Agents 组件目录
    └── {agent-id}.md  # 每个 Agent 一个 .md 文件
```

---

## index.json 注册表规范

`index.json` 是仓库的唯一入口，cc-desktop 通过 `{registryUrl}/index.json` 获取组件列表。

### 完整 Schema

```json
{
  "version": 1,
  "name": "仓库显示名称",
  "updatedAt": "2026-02-10T00:00:00Z",
  "skills": [
    {
      "id": "skill-id",
      "name": "显示名称",
      "description": "一句话描述",
      "version": "1.0.0",
      "author": "作者",
      "tags": ["tag1", "tag2"],
      "files": ["SKILL.md"],
      "updatedAt": "2026-02-10T00:00:00Z"
    }
  ],
  "prompts": [
    {
      "id": "prompt-id",
      "name": "显示名称",
      "description": "一句话描述",
      "version": "1.0.0",
      "author": "作者",
      "tags": ["tag1", "tag2"]
    }
  ],
  "agents": [
    {
      "id": "agent-id",
      "name": "显示名称",
      "description": "一句话描述",
      "version": "1.0.0",
      "author": "作者",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version` | number | 是 | 注册表格式版本，目前固定为 `1` |
| `name` | string | 否 | 仓库名称 |
| `updatedAt` | string | 否 | 最后更新时间（ISO 8601） |
| `skills` | array | 是 | Skills 列表（可为空数组 `[]`） |
| `prompts` | array | 否 | Prompts 列表（省略时视为 `[]`） |
| `agents` | array | 否 | Agents 列表（省略时视为 `[]`） |

### 组件条目通用字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | **是** | 唯一标识符，同时决定文件路径。只能使用 **小写字母、数字、连字符** |
| `name` | string | 否 | 市场中显示的名称，缺省时用 `id` |
| `description` | string | 否 | 一句话描述，显示在市场列表中 |
| `version` | string | **是** | 语义化版本号（如 `1.0.0`），cc-desktop 依据此字段检测更新 |
| `author` | string | 否 | 作者名 |
| `tags` | string[] | 否 | 标签数组，用于市场内搜索 |

### Skills 专有字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `files` | string[] | 否 | 需要下载的文件列表，默认 `["SKILL.md"]`。支持多文件 |
| `updatedAt` | string | 否 | 该 Skill 的最后更新时间 |

### Prompts / Agents 专有字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | string | 否 | 自定义文件名，默认 `{id}.md` |

---

## Skills 编写规范

### 存储方式

每个 Skill 是一个**目录**，位于 `skills/{skill-id}/`，至少包含 `SKILL.md`。

### 下载路径

```
{registryUrl}/skills/{skill-id}/{filename}
```

cc-desktop 会按 `files` 数组逐个下载文件，安装到用户本地 `~/.claude/commands/{skill-id}/` 目录。

### SKILL.md 格式

```markdown
---
name: skill-id
description: 技能描述，Claude 根据此描述决定何时自动触发。写明触发关键词。
---

# 技能标题

具体的系统提示内容...

## 使用方式

说明输入输出格式、步骤等...
```

**YAML Frontmatter 字段：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 技能 ID，与目录名一致 |
| `description` | 是 | 描述何时触发此技能，Claude 用此文本做匹配。建议包含中英文触发词 |

**编写要点：**

- frontmatter 的 `description` 很重要，Claude 据此决定是否自动调用该 Skill
- Markdown 正文是 Skill 被调用时的完整系统提示
- 可以在正文中定义输出格式、步骤、约束等
- 如需附加文件（模板、配置等），在 index.json 的 `files` 数组中声明

### 示例

```
skills/
└── my-code-review/
    └── SKILL.md
```

index.json 条目：
```json
{
  "id": "my-code-review",
  "name": "my-code-review",
  "description": "代码审查技能，分析代码质量并给出改进建议",
  "version": "1.0.0",
  "author": "HydroCoder",
  "tags": ["code", "review"],
  "files": ["SKILL.md"]
}
```

---

## Prompts 编写规范

### 存储方式

每个 Prompt 是一个**单独的 .md 文件**，位于 `prompts/{prompt-id}.md`。

### 下载路径

```
{registryUrl}/prompts/{prompt-id}.md
```

cc-desktop 下载后将内容存入 SQLite 数据库（prompts 表），作为提示词模板使用。

### 文件格式

Prompt 文件是**纯文本/Markdown**，不需要 YAML frontmatter。文件的全部内容即为提示词正文。

```markdown
请用简洁的中文解释以下代码的功能、核心逻辑和关键细节。

要求：
1. 先用一句话总结代码的整体作用
2. 分步骤说明核心逻辑
3. 指出潜在的边界情况或注意事项

代码：
```

**编写要点：**

- 文件内容就是用户在终端中使用的提示词模板
- 可以包含 Markdown 格式
- 建议在末尾留一个占位行（如 `代码：`），方便用户追加输入
- `name` 由 index.json 中定义，不在文件内声明
- 文件不能为空，cc-desktop 会拒绝安装空文件

### 示例

文件 `prompts/code-explain.md`：
```markdown
请用简洁的中文解释以下代码...
```

index.json 条目：
```json
{
  "id": "code-explain",
  "name": "代码解释器",
  "description": "用简洁中文解释代码的功能、核心逻辑和关键细节",
  "version": "1.0.0",
  "author": "HydroCoder",
  "tags": ["code", "explain"]
}
```

---

## Agents 编写规范

### 存储方式

每个 Agent 是一个**单独的 .md 文件**，位于 `agents/{agent-id}.md`。

### 下载路径

```
{registryUrl}/agents/{agent-id}.md
```

cc-desktop 下载后保存为 `~/.claude/agents/{agent-id}.md`，Claude 根据 Agent 的描述自动选择是否调用。

### 文件格式

Agent 文件**必须包含 YAML Frontmatter**，这是 Claude Code 识别 Agent 的标准格式。

```markdown
---
name: agent-id
description: Agent 功能描述
color: ocean
---

# Agent 标题

系统提示正文...
```

**YAML Frontmatter 字段：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | Agent ID，与文件名（不含 `.md`）一致 |
| `description` | 是 | 功能描述，Claude 据此决定何时自动调用 |
| `color` | 否 | 显示颜色，可选值：`blue`、`ocean`、`forest`、`violet`、`ember`、`red`、`gray` |

**编写要点：**

- frontmatter 的 `description` 决定 Claude 何时自动选择此 Agent
- Markdown 正文是 Agent 被调用时的系统提示
- 可以在正文中定义工作流程、输出格式、约束条件等
- `name` 必须与文件名一致（例如 `test-writer.md` → `name: test-writer`）
- 文件不能为空

### 示例

文件 `agents/test-writer.md`：
```markdown
---
name: test-writer
description: 测试用例编写专家，根据代码自动生成单元测试
color: forest
---

# 测试编写 Agent

你是一位测试工程专家...
```

index.json 条目：
```json
{
  "id": "test-writer",
  "name": "测试编写专家",
  "description": "根据代码自动生成全面的单元测试",
  "version": "1.0.0",
  "author": "HydroCoder",
  "tags": ["test", "unit-test"]
}
```

---

## 版本管理与更新

cc-desktop 通过对比 index.json 中的 `version` 字段与本地已安装的版本来检测更新。

**更新组件的步骤：**

1. 修改组件文件内容
2. 在 index.json 中**递增该组件的 `version`**（如 `1.0.0` → `1.1.0`）
3. 更新 index.json 顶层的 `updatedAt`
4. 提交并推送到远程仓库

**注意：** 如果只改了文件内容但没改 `version`，cc-desktop 不会提示用户更新。

---

## 快速操作参考

### 添加一个新 Skill

```bash
# 1. 创建目录和文件
mkdir -p skills/my-new-skill
# 2. 编写 SKILL.md（含 YAML frontmatter）
# 3. 在 index.json 的 skills 数组中添加条目
# 4. 提交推送
git add skills/my-new-skill index.json && git commit -m "feat: 添加 my-new-skill" && git push
```

### 添加一个新 Prompt

```bash
# 1. 创建文件
# 2. 编写 prompts/my-prompt.md（纯文本，无 frontmatter）
# 3. 在 index.json 的 prompts 数组中添加条目
# 4. 提交推送
git add prompts/my-prompt.md index.json && git commit -m "feat: 添加 my-prompt" && git push
```

### 添加一个新 Agent

```bash
# 1. 创建文件
# 2. 编写 agents/my-agent.md（含 YAML frontmatter）
# 3. 在 index.json 的 agents 数组中添加条目
# 4. 提交推送
git add agents/my-agent.md index.json && git commit -m "feat: 添加 my-agent" && git push
```

---

## ID 命名规则

所有组件的 `id` 统一遵循：

- 只使用 **小写字母、数字、连字符**（`[a-z0-9-]`）
- 不使用下划线、空格、大写字母
- 建议用连字符分隔单词（如 `code-review`、`api-doc-generator`）
- `id` 直接决定文件路径，修改后会被视为新组件

---

## 配合 cc-desktop 使用

1. 将本仓库推送到 GitHub（或任何支持 Raw URL 的 Git 托管）
2. 在 cc-desktop 中打开「全局设置 → 组件市场」
3. 填入仓库 Raw URL，如 `https://raw.githubusercontent.com/hydroCoderClaud/hydroSkills/main`
4. 打开任意 Tab（Skills / Prompts / Agents）点击商店图标即可浏览安装
