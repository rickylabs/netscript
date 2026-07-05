# Phase Group Registry: beta5-impl--supervisor

## Run Metadata

| Field | Value |
| ----- | ----- |
| Supervisor run ID | `beta5-impl--supervisor` |
| Integration branch | `chore/305-doctrine-quickwin` |
| Base branch | `main` |

## Status Legend

| Status | Meaning |
| ------ | ------- |
| `planned` | In the map, not started |
| `active` | Group branch/worktree launched; implementation in progress |
| `plan-evaluating` | Handed to a separate PLAN-EVAL session |
| `evaluating` | Handed to a separate IMPL-EVAL session |
| `merged` | Evaluator `PASS` or accepted debt |
| `blocked` | Waiting on a dependency or a user decision |
| `rescope` | Under rescope |

## Group QW — issue #305 early quick-win

| Field | Value |
| ----- | ----- |
| Group branch | `chore/305-doctrine-quickwin` |
| Nested run ID | `beta5-impl--supervisor` |
| Archetype(s) | Archetype 6 for checker tooling + `SCOPE-docs.md` |
| Status | `plan-evaluating` |
| Merge commit | `—` |

### Pre-conditions

- Branch starts from `origin/main` `1c1759908e99c68a3bb0cccfd7a35aeafd8d40e0`.
- Draft PR remains partial for issue #305 and uses `Refs #305`.

### Inherited debt

- Existing package architecture debt remains out of scope except targeted AP/F ref trust updates.

### Phase 0 reading

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-doctrine/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/rtk/SKILL.md`
- `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`
- `.llm/harness/evaluator/anti-pattern-catalog.md`

### Surfaces touched

- `.llm/tools/fitness/check-doctrine.ts`
- `docs/architecture/doctrine/*.md`
- `.llm/harness/debt/arch-debt.md`
- `.llm/harness/evaluator/anti-pattern-catalog.md`

### Success criteria

- Stale `@netscript/shared` Result misfire is gone.
- `rg "phase-0-research" docs/architecture/doctrine` returns zero hits.
- AP/F migration map exists and targeted harness refs are reconciled.
- Requested validation commands are run and posted to the PR.

### Notes

- Full doctrine v2 rewrite is out of scope.

---

## Summary Table

| Group | Status | Depends on | Surfaces | Merge commit |
| ----- | ------ | ---------- | -------- | ------------ |
| `QW` | `plan-evaluating` | none | doctrine docs, checker, harness refs | `—` |

## Base-Sync Log

| Date | Base sha merged | Result | Notes |
| ---- | --------------- | ------ | ----- |
| 2026-07-06 | `1c1759908e99c68a3bb0cccfd7a35aeafd8d40e0` | clean | Branch cut at current `origin/main`. |
