# Contributing

## Branch And PR Model

- Never commit directly to `main`.
- Use topic branches such as:
  - `feat/<topic>`
  - `fix/<topic>`
  - `chore/<topic>`
  - `codex/<topic>`
- Open PRs into `main`.

## Commit And PR Title Convention

Use conventional format:

```text
<type>(<scope>): <Summary>
```

Examples:

```text
feat(core): Add rules sync planning
fix(adapter): Align Windsurf rules path
docs(readme): Add import example repository
chore(release): Bump version to 0.2.1
```

Allowed types:
- `feat`, `fix`, `perf`, `test`, `docs`, `refactor`, `build`, `ci`, `chore`, `revert`

Rules:
- Summary starts with a capital letter
- No trailing period
- Keep subject concise and imperative

## Required Validation Before Commit

Run all of these locally:

```bash
npm run typecheck
npm run lint
npm test
```

## Collaboration Guardrails (Human + AI)

1. Read order for AI tools:
   - `CLAUDE.md`
   - `docs/ai-architecture-guardrails.md`
2. One concern per PR. Do not mix unrelated refactors/features/docs.
3. If `package.json` changes, include `package-lock.json` in the same PR.
4. Keep bilingual docs synchronized:
   - If `README.md` changes, update `README.zh-CN.md` in the same PR.
   - If `README.zh-CN.md` changes, update `README.md` in the same PR.
5. Preserve platform-native behavior:
   - Claude: no `.claude/rules` target (rules stay in `CLAUDE.md`).
   - Windsurf rules: `.windsurf/rules/<id>.md` (flat file layout).
6. Behavior changes must be explicitly documented in PR description.

## Code Quality Rules

1. No copy-paste modules: extract shared logic when adding resource/platform support.
2. Wire up CLI commands for any user-facing capability.
3. Preserve existing behavior unless change is intentional and documented.
4. Keep tests close to integration behavior (not schema-only tests for sync changes).
5. TypeScript strictness:
   - ESM with `.js` import extensions
   - Prefer `unknown` + narrowing over `any`
