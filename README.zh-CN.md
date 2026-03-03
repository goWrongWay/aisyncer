# aisyncer

[English](./README.md) | [中文](./README.zh-CN.md)

[![npm version](https://img.shields.io/npm/v/aisyncer.svg)](https://www.npmjs.com/package/aisyncer)
[npm package](https://www.npmjs.com/package/aisyncer)

用于在 Claude 和 Windsurf 之间同步 AI skills 与规则（rules）的 CLI 工具。

## 这个工具解决什么问题

你可能同时在用 Claude Code 和 Windsurf。它们各自有自己的目录结构与约定，手工复制很容易漏文件或版本不一致。

`aisyncer` 的做法是：

- 只维护一个规范源目录：`.my-ai/`
- 单向同步到目标平台目录
- 默认 dry-run，先看变更再写入

```text
.my-ai/skills/  ──→  .claude/skills/
                 ──→  .windsurf/skills/

.my-ai/rules/   ──→  .windsurf/rules/<id>.md
                 ──→  (Claude 使用 CLAUDE.md，不写 .claude/rules)
```

## 安装

```bash
npm install -g aisyncer
```

或不安装直接运行：

```bash
npx aisyncer <command>
```

需要 Node.js 20+。

## 快速开始

```bash
# 1) 初始化（创建 .my-ai，附带示例 skill，可选示例 rule）
aisyncer init
aisyncer init --with-rules

# 2) 校验
aisyncer validate
aisyncer validate --with-rules

# 3) 预览同步（默认 dry-run）
aisyncer sync --to claude,windsurf
aisyncer sync --to claude,windsurf --sync-rules

# 4) 实际写入
aisyncer sync --to claude,windsurf --sync-rules --write
```

> `--sync-rules` 只会同步到 Windsurf。Claude 目标会显示 skip 提示。

## 命令说明

### `aisyncer init`

初始化 `.my-ai/`，写入示例 skill（可选示例 rule）：

```bash
aisyncer init
aisyncer init --with-rules
```

也可以从 GitHub 导入 skills/rules：

```bash
aisyncer init --from github:owner/repo
aisyncer init --from github:owner/repo#branch
aisyncer init --from https://github.com/owner/repo
aisyncer init --from https://github.com/owner/repo.git
```

远程仓库结构（`rules/` 可选）：

```text
skills/                 # 必需
  my-skill/
    SKILL.md
rules/                  # 可选，自动识别
  my-rule/
    RULE.md
```

私有仓库请设置 `GITHUB_TOKEN`：

```bash
export GITHUB_TOKEN=ghp_xxx
aisyncer init --from github:owner/private-repo
```

### `aisyncer validate`

校验 `.my-ai/skills/`（可选 `.my-ai/rules/`）：

```bash
aisyncer validate
aisyncer validate --with-rules
```

校验项包括：

- `schemaVersion` 必须为 `1`
- `id` 必须匹配 `/^[a-z0-9-]+$/`
- `name` / `description` / `content` 不可为空
- 目录名必须与资源 `id` 一致
- 不允许重复 `id`

失败时返回非 0 退出码，可用于 CI。

### `aisyncer sync`

从 `.my-ai/` 同步到平台目录：

```bash
# dry-run
aisyncer sync --to claude
aisyncer sync --to windsurf
aisyncer sync --to claude,windsurf

# 带 rules（仅 Windsurf）
aisyncer sync --to claude,windsurf --sync-rules

# 实际写入
aisyncer sync --to claude,windsurf --sync-rules --write

# 自定义 Claude 输出目录
aisyncer sync --to claude --claude-dir ./custom-path --write
```

rules 同步行为：

- Windsurf：写入 `.windsurf/rules/<id>.md`
- Claude：跳过（Claude 使用 `CLAUDE.md`）

输出目录：

- Claude：`.claude/skills/<id>/SKILL.md`
- Windsurf：`.windsurf/skills/<id>/SKILL.md` 与 `.windsurf/rules/<id>.md`

## Skill / Rule 文件格式

Skill 使用 `SKILL.md`，Rule 使用 `RULE.md`，都采用：

- YAML frontmatter
- Markdown 正文

Skill 额外支持 `allowedTools`；Rule 不包含该字段。

## 目录结构示例

```text
your-project/
  .my-ai/                # 你维护的唯一规范源
    skills/
      code-review/
        SKILL.md
    rules/
      code-style/
        RULE.md

  .claude/               # aisyncer 生成
    skills/
      code-review/
        SKILL.md
  CLAUDE.md              # Claude 指令入口（不使用 .claude/rules）

  .windsurf/             # aisyncer 生成
    skills/
      code-review/
        SKILL.md
    rules/
      code-style.md
```

## 设计原则

### 单一事实来源

只编辑 `.my-ai/`。平台目录都是派生结果。

### 单向同步

仅支持 `.my-ai/ → 平台目录`，不支持反向回写或双向合并。

### 默认安全

`sync` 默认 dry-run，只有加 `--write` 才会落盘。

### 无锁定

文件本质是 Markdown + YAML，不绑定数据库或私有格式。

## 团队共享（GitHub）

可维护一个公共 skills/rules 仓库，然后成员执行：

```bash
aisyncer init --from github:my-org/ai-config
```

工具会通过 GitHub API 拉取内容到 `.my-ai/`，再由 `sync` 分发到各平台。

可直接参考的示例仓库：

- https://github.com/goWrongWay/skills-repo

可以直接导入体验：

```bash
aisyncer init --from github:goWrongWay/skills-repo
```

## Roadmap

- v0.2：Rules（已完成）
- v0.3：Memory
- v0.4：Workflows

## License

MIT
