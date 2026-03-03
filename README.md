# aisyncer

CLI tool for syncing AI skills, rules, and configs across Claude and Windsurf.

**The problem:** You use Claude Code and Windsurf (maybe more tools tomorrow). Each has its own skills directory, its own format quirks, its own way of doing things. You end up copy-pasting markdown files between `.claude/skills/` and `.windsurf/skills/`, hoping you didn't forget one. It gets old fast.

**The solution:** Maintain one canonical source (`.my-ai/`), sync everywhere.

```
.my-ai/skills/  ──→  .claude/skills/
                    ──→  .windsurf/skills/

.my-ai/rules/   ──→  .claude/rules/
                    ──→  .windsurf/rules/
```

- One format, one source of truth
- One-way sync — platform dirs are always derived, never edited
- Dry-run by default — see what would happen before writing anything
- Pull skills from any GitHub repo

## Install

```bash
npm install -g aisyncer
```

Or run without installing:

```bash
npx aisyncer <command>
```

Requires Node.js 20+.

## Quick Start

```bash
# 1. Initialize — creates .my-ai/ with an example skill (and optionally rules)
aisyncer init
aisyncer init --with-rules

# 2. Validate — check all skills (and rules) are well-formed
aisyncer validate
aisyncer validate --with-rules

# 3. Preview — see what sync would do (dry-run, no writes)
aisyncer sync --to claude,windsurf
aisyncer sync --to claude,windsurf --sync-rules

# 4. Apply — actually write to platform directories
aisyncer sync --to claude,windsurf --sync-rules --write
```

That's it. Skills and rules, four commands, no config files, no databases.

## Commands

### `aisyncer init`

Create a `.my-ai/` directory with an example skill (and optionally an example rule).

```bash
aisyncer init
aisyncer init --with-rules
```

Or import skills from a GitHub repository:

```bash
# All of these work — paste whatever you have
aisyncer init --from github:owner/repo
aisyncer init --from github:owner/repo#branch
aisyncer init --from https://github.com/owner/repo
aisyncer init --from https://github.com/owner/repo.git
```

The remote repository must follow this structure:

```
skills/
  my-skill/
    SKILL.md
  another-skill/
    SKILL.md
```

For private repositories, set `GITHUB_TOKEN`:

```bash
export GITHUB_TOKEN=ghp_xxx
aisyncer init --from github:owner/private-repo
```

> No git clone. We use the GitHub REST API to fetch only `skills/*/SKILL.md` files.

### `aisyncer validate`

Validate all skills in `.my-ai/skills/` (and optionally rules in `.my-ai/rules/`).

```bash
aisyncer validate
aisyncer validate --with-rules
```

What it checks:
- `schemaVersion` must be `1`
- `id` must be lowercase alphanumeric with hyphens (`/^[a-z0-9-]+$/`)
- `name`, `description`, `content` must be non-empty (whitespace-only is rejected)
- Directory name must match the skill's `id`
- No duplicate IDs across skills

Exits with non-zero code on failure — safe to use in CI.

### `aisyncer sync`

Sync skills (and optionally rules) from `.my-ai/` to platform directories.

```bash
# Dry-run (default) — shows what would happen, writes nothing
aisyncer sync --to claude
aisyncer sync --to windsurf
aisyncer sync --to claude,windsurf

# Include rules
aisyncer sync --to claude,windsurf --sync-rules

# Actually write files
aisyncer sync --to claude,windsurf --sync-rules --write

# Custom output directory for Claude
aisyncer sync --to claude --claude-dir ./custom-path --write
```

Sync logic per resource:

| Condition | Action |
|-----------|--------|
| Target does not exist | **ADD** — write the file |
| Target exists, hash matches | **SKIP** — no changes needed |
| Target exists, hash differs | **OVERWRITE** — replace with canonical version |

The hash covers `name`, `description`, `allowedTools`, `metadata`, and `content` — so renaming a skill or changing its tags will trigger an overwrite, not just content edits.

Output directories:
- Claude: `.claude/skills/<id>/SKILL.md`, `.claude/rules/<id>/RULE.md`
- Windsurf: `.windsurf/skills/<id>/SKILL.md`, `.windsurf/rules/<id>/RULE.md`

## Skill Format

Skills are `SKILL.md` files — YAML frontmatter + markdown body:

```markdown
---
schemaVersion: 1
id: code-review
name: Code Review
description: Thorough code review with security focus
allowedTools:
  - Read
  - Grep
  - Glob
metadata:
  version: 1.0.0
  tags:
    - review
    - security
---

# Code Review

You are a senior engineer performing a code review.

## Focus areas

- Security vulnerabilities (injection, XSS, auth bypass)
- Error handling and edge cases
- Performance implications
- Code clarity and maintainability

## Process

1. Read the changed files
2. Identify potential issues
3. Provide specific, actionable feedback with line references
```

### Schema Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schemaVersion` | `1` (literal) | Yes | Always `1` for now |
| `id` | string | Yes | Lowercase alphanumeric + hyphens |
| `name` | string | Yes | Human-readable name |
| `description` | string | Yes | Brief description |
| `allowedTools` | string[] | No | Tools this skill can use |
| `content` | string | Yes | Markdown body (after frontmatter) |
| `metadata.source` | string | No | Where this skill came from |
| `metadata.version` | string | No | Semantic version |
| `metadata.tags` | string[] | No | Tags for organization |

## Rule Format

Rules are `RULE.md` files — same YAML frontmatter + markdown body pattern as skills, but without `allowedTools`:

```markdown
---
schemaVersion: 1
id: code-style
name: Code Style
description: Enforce consistent code style conventions
metadata:
  version: 1.0.0
  tags:
    - style
    - conventions
---

# Code Style

Follow these code style conventions in all files.

## Naming

- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use UPPER_SNAKE_CASE for constants

## Formatting

- 2-space indentation
- No trailing whitespace
- Single quotes for strings
```

### Rule Schema Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schemaVersion` | `1` (literal) | Yes | Always `1` for now |
| `id` | string | Yes | Lowercase alphanumeric + hyphens |
| `name` | string | Yes | Human-readable name |
| `description` | string | Yes | Brief description |
| `content` | string | Yes | Markdown body (after frontmatter) |
| `metadata.source` | string | No | Where this rule came from |
| `metadata.version` | string | No | Semantic version |
| `metadata.tags` | string[] | No | Tags for organization |

## Directory Structure

```
your-project/
  .my-ai/              ← You manage this (canonical source)
    skills/
      code-review/
        SKILL.md
      commit-style/
        SKILL.md
    rules/
      code-style/
        RULE.md

  .claude/                 ← Generated by `aisyncer sync` (do not edit)
    skills/
      code-review/
        SKILL.md
    rules/
      code-style/
        RULE.md

  .windsurf/               ← Generated by `aisyncer sync` (do not edit)
    skills/
      code-review/
        SKILL.md
    rules/
      code-style/
        RULE.md
```

## Design Principles

### Single source of truth

`.my-ai/` is the only directory you should ever edit. Everything else is derived output. This avoids the classic "which copy is the latest?" problem.

### One-way sync only

Sync always flows from `.my-ai/` → platform directories. We intentionally don't support:
- Reading from `.claude/` back into `.my-ai/`
- Merging changes from platform directories
- Two-way sync

This keeps the mental model simple: edit in one place, sync everywhere.

### Dry-run by default

`aisyncer sync` shows you what *would* happen without changing anything. You must explicitly pass `--write` to modify files. No surprises.

### No magic, no lock-in

- Skills are just markdown files with YAML frontmatter — readable and editable by humans
- No database, no config server, no proprietary format
- If you stop using aisyncer, your `.my-ai/` directory is still perfectly usable

### Semantic hash for conflict detection

The sync hash covers all meaningful fields (name, description, allowedTools, metadata, content for skills; name, description, metadata, content for rules) — not just the markdown body. Changing a resource's description or tags will correctly trigger an overwrite on the next sync.

## Sharing Skills via GitHub

You can maintain a shared skills repository for your team:

```
my-org/ai-skills/
  skills/
    code-review/
      SKILL.md
    api-design/
      SKILL.md
    testing-strategy/
      SKILL.md
```

Team members pull skills with:

```bash
aisyncer init --from github:my-org/ai-skills
```

This fetches skills via the GitHub API (no clone needed) and writes them to `.my-ai/skills/`. From there, `aisyncer sync` distributes them to each platform.

## Roadmap

### v0.2 — Rules ✓

Sync rule files (`.claude/rules/`, `.windsurf/rules/`) with the same one-way model. Use `--with-rules` and `--sync-rules` flags.

### v0.3 — Memory

Sync memory/context files that persist across sessions.

### v0.4 — Workflows

Support workflow definitions (multi-step agent pipelines).

### Future

- `aisyncer pull` — update skills from a remote GitHub repo (post-init)
- `aisyncer diff` — show what changed between local and remote
- More platform adapters as the ecosystem evolves
- Shared team configs with org-level skill repos

## License

MIT
