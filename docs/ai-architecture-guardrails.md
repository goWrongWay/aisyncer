# AI Architecture Guardrails

This document defines how we collaborate with AI to keep the codebase extensible and safe.

## Goals

- New resource types should be added via registration, not core flow edits.
- Missing wiring should fail at compile time whenever possible.
- Feature additions should preserve existing behavior by default.

## Non-Negotiable Rules

1. Interface-first:
   - Define/adjust types before writing implementation.
   - Do not start with imperative business logic.
2. Registry-first for extensible domains:
   - If logic is expected to scale across resource types, add a registry contract.
   - New resources should be registered in one place.
3. No branching by resource type in core loops:
   - Avoid `if/else` or `switch` in orchestration paths when registry dispatch can be used.
4. Compile-time completeness:
   - Use `satisfies Record<...>` and discriminated unions to catch missing handlers.
5. Self-review before merge:
   - Reviewer (human or AI) must answer: "Can a new resource be added without touching core orchestrators?"

## Suggested Registry Contract (Template)

```ts
export type ResourceType = "skills" | "rules";

export interface ResourceModule<T> {
  type: ResourceType;
  loadCanonical: (dir: string) => T[];
  validateDir: (dir: string) => ValidationResult[];
  plan: (items: T[], adapter: PlatformAdapter) => ResourceSyncAction[];
  execute: (items: T[], actions: ResourceSyncAction[], adapter: PlatformAdapter) => void;
}

export const resourceRegistry = {
  skills: skillsModule,
  rules: rulesModule,
} satisfies Record<ResourceType, ResourceModule<unknown>>;
```

## AI Prompt Templates

### Interface-First Prompt

```md
Implement <feature>. First output only TypeScript types/interfaces.
Constraints:
- Missing module wiring must fail at compile time.
- Use registry-based dispatch for scalable resource types.
- No implementation yet.
```

### Scale Prompt

```md
Design for +10 future resource types.
Core orchestrators must not change when adding one new resource.
Only a single registration point may be edited for extension.
```

### Self-Review Prompt

```md
Review your solution as a strict architect:
1) Where can future contributors forget to wire new resources?
2) Which missing wiring currently compiles?
3) Refactor to eliminate both risks.
```

## PR Acceptance Criteria

- A new resource type can be added with:
  - New module implementation, and
  - One registry registration change.
- Existing tests pass.
- No unintended behavior changes in existing commands.
