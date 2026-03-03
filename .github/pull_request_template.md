## Summary

<!-- What changed and why -->

## Type Of Change

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] Test

## Architecture Checklist

- [ ] I used interface-first design (types/contracts before logic).
- [ ] I avoided resource-type branching in core orchestrators.
- [ ] Extension points use registration/strategy style (when applicable).
- [ ] New resource support can be added without editing core sync loops.
- [ ] Existing behavior changes are intentional and documented.

## Registry Checklist (If Resource Logic Changed)

- [ ] Registry entries are complete for every supported resource type.
- [ ] Compile-time typing catches missing handlers (`satisfies Record<...>` or equivalent).

## Validation

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`

## Notes For Reviewers

<!-- Risks, edge cases, migration impact -->
