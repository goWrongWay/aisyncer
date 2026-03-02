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
