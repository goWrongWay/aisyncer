# Contributing

## Commit Convention

Use **type: description** format. Keep it short (< 72 chars).

```
feat: add pull command for updating skills from remote
fix: handle empty frontmatter without crashing
docs: update sync examples in README
test: add hash tests for metadata changes
refactor: extract adapter factory from base module
chore: upgrade vitest to v3
```

### Types

| Type | When |
|------|------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `refactor` | Code change that doesn't fix a bug or add a feature |
| `chore` | Dependencies, CI, build config, tooling |

### Rules

- One logical change per commit
- Tests must pass before pushing (`npm test`)
- Run `npm run typecheck && npm run lint` before opening a PR

## Branch Convention

- `main` — stable, always passes CI
- Feature branches: `feat/description` or `fix/description`
- PR into `main`, squash merge preferred

## Code Style

- TypeScript strict mode, ESM imports with `.js` extensions
- Zod for all runtime validation
- No `any` — use `unknown` and narrow
- Tests live in `tests/` mirroring `src/` module names

## Code Quality Rules

These rules were established after reviewing PR contributions. Follow them to keep the codebase maintainable.

1. **No copy-paste modules** — When adding a new resource type (e.g., rules alongside skills), extract shared logic into generic/parameterized functions. Do not duplicate entire modules with only type differences.
2. **Wire up all CLI commands** — Every new feature must be accessible from the CLI. If you add a function like `validateRulesDir()`, also update the `validate` command to call it.
3. **Preserve existing behavior** — Don't change existing command behavior (e.g., early exit conditions, error messages) as a side effect of adding new features. Behavioral changes should be intentional and called out in the PR description.
4. **Keep lock file in sync** — Run `npm install` after changing `package.json` to keep `package-lock.json` consistent.
5. **One concern per PR** — Don't mix unrelated changes (e.g., package rename + new feature) in a single PR.
6. **Complete test coverage** — New sync/integration logic must have integration tests, not just unit tests for schema/parser. Follow the existing `fs.mkdtempSync()` + cleanup pattern in `tests/`.
