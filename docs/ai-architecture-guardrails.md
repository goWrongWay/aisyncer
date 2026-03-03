# AI Architecture Guardrails

This document defines how we collaborate with AI to keep the codebase extensible and safe.

## Goals

- New capabilities should extend existing architecture with minimal risk.
- Missing wiring should fail at compile time whenever possible.
- Feature additions should preserve existing behavior by default.

## Non-Negotiable Rules

1. Interface-first:
   - Define/adjust types before writing implementation.
   - Do not start with imperative business logic.
2. Existing-architecture-first:
   - Follow current extension points (`ResourceConfig`, adapters, CLI command wiring).
   - Do not introduce a new orchestration pattern unless explicitly requested.
3. No branching by resource type in core loops:
   - Avoid broad copy-paste branching. Keep logic centralized and reusable.
4. Compile-time completeness:
   - Use `satisfies Record<...>` and discriminated unions to catch missing handlers.
5. Self-review before merge:
   - Reviewer (human or AI) must answer: "Can a new resource be added without touching core orchestrators?"

## AI Prompt Templates

### Interface-First Prompt

```md
Implement <feature>. First output only TypeScript types/interfaces.
Constraints:
- Missing module wiring must fail at compile time.
- Use existing project extension points unless a new pattern is explicitly requested.
- No implementation yet.
```

### Scale Prompt

```md
Design for +10 future resource types while keeping current architecture style.
Core orchestration should not require broad rewrites for each new resource.
```

### Self-Review Prompt

```md
Review your solution as a strict architect:
1) Where can future contributors forget to wire new resources?
2) Which missing wiring currently compiles?
3) Refactor to eliminate both risks.
```

## PR Acceptance Criteria

- Changes follow existing architecture conventions from `CLAUDE.md`.
- Existing tests pass.
- If `package.json` changed, `package-lock.json` is included.
- If one README language changed, the other was synchronized.
- Platform path behavior remains correct:
  - Claude rules are not written to `.claude/rules`
  - Windsurf rules are written to `.windsurf/rules/<id>.md`
- No unintended behavior changes in existing commands.
