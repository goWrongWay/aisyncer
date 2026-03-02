# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run typecheck      # Type check without emitting
npm run lint           # ESLint (flat config, ESLint 9)
npm run lint -- --fix  # Auto-fix lint issues
npm test               # Run all tests (vitest run)
npm run test:watch     # Watch mode

# Run a single test file
npx vitest run tests/parser.test.ts

# Run tests matching a pattern
npx vitest run --grep "plans ADD"
```

## Architecture

One-way sync tool: `.my-skills/skills/<id>/SKILL.md` → platform directories (`.claude/skills/`, `.windsurf/skills/`).

### Data flow

```
SKILL.md file
  → parseSkill() [gray-matter: frontmatter + markdown]
  → validateSkill() [zod schema]
  → hashSkill() [SHA-256 of name+description+allowedTools+metadata+content]
  → planSync() [compare hash with target → ADD/SKIP/OVERWRITE]
  → executeSync() [write via PlatformAdapter]
```

### Module relationships

- **`core/schema.ts`** — `SkillSpecSchema` (zod), `validateSkill()`, `SkillSpec` type. Name/description are trimmed before validation.
- **`core/parser.ts`** — `parseSkill()` (SKILL.md → SkillSpec), `emitSkill()` (SkillSpec → SKILL.md). Uses `gray-matter` + `yaml` package.
- **`core/hash.ts`** — `hashSkill()` hashes a JSON of `{name, description, allowedTools, metadata, content}`. Intentionally excludes `id` and `schemaVersion`.
- **`core/validator.ts`** — `validateSkillsDir()` scans a directory, checks schema + dir-name-matches-id + no duplicate IDs.
- **`core/sync.ts`** — `loadCanonicalSkills()` silently skips invalid files (try-catch). `planSync()` returns actions without writing. `executeSync()` writes ADD/OVERWRITE only.
- **`adapters/base.ts`** — `PlatformAdapter` interface + `createAdapter()` factory. `readSkill()` validates parsed result and returns `null` for corrupt files.
- **`adapters/claude.ts`** / **`windsurf.ts`** — Thin wrappers calling `createAdapter()` with platform-specific base dir.
- **`github/fetch.ts`** — `parseGitHubSource()` handles `github:owner/repo`, `github:owner/repo.git`, full URLs. `fetchSkillsFromGitHub()` uses tree API + blob API, no git clone. Falls back from `main` to `master`.
- **`cli/commands/`** — `init` (local + GitHub), `validate`, `sync` (dry-run default, `--write` to apply).

## Key conventions

- ESM throughout: `"type": "module"`, all imports use `.js` extensions
- Zod for runtime validation with `.transform(trim).pipe(min(1))` pattern for name/description
- Tests use `fs.mkdtempSync()` + cleanup in `afterEach()`, fixtures in `tests/fixtures/`
- Corrupt SKILL.md in target → `readSkill()` returns `null` → treated as ADD (self-healing)
- `emitSkill()` uses `yaml.stringify(..., { lineWidth: 0 })` to avoid line wrapping
