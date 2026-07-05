# Context Pack: issue #305 doctrine quick-win

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta5-impl--supervisor` |
| Branch | `chore/305-doctrine-quickwin` |
| Current phase | `impl-eval` |
| Archetype | Archetype 6 for checker tooling; N/A for docs-only files |
| Scope overlays | `SCOPE-docs.md` |

## Current State

The branch starts at `origin/main` `1c1759908e99c68a3bb0cccfd7a35aeafd8d40e0` with no upstream.
The quick-win findings reproduce: stale `@netscript/shared` Result guidance, dead
`phase-0-research` doctrine references, and AP/F ref drift between checker/harness debt/doctrine.

## Completed

- Required skills and harness workflow docs read.
- Current-tree research and plan/design artifacts created.
- PLAN-EVAL passed in a separate session.
- S1 checker reconciliation implemented; `.llm/tools` Deno check passed.
- S2 dead doctrine research links removed; doctrine grep has zero `phase-0-research` hits.
- S3 ref migration map added and linked from evaluator/debt docs.
- S4 final validation passed; branch is ready for separate IMPL-EVAL.

## In Progress

- Implementation slices may begin after PLAN-EVAL `PASS`.

## Next Steps

1. Commit/push S4 validation artifacts and update PR body.
2. Run separate IMPL-EVAL.
3. Post `SLICE-COMPLETE`.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| `Refs #305`, not closing keyword | User prompt / `netscript-pr` | Full doctrine v2 rewrite remains. |
| Canonical AP/F refs are AP-1..AP-25 and F-1..F-19 | doctrine file 09 | Checker comments/refs must align. |
| Result guidance becomes inline-contract warning | plan LD-1 | No `@netscript/shared` package requirement. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/beta5-impl--supervisor/` | new | Harness run artifacts. |
| `.llm/runs/beta5-impl--supervisor/plan-eval.md` | new | Separate evaluator verdict `PASS`. |
| `.llm/tools/fitness/check-doctrine.ts` | changed | Stale `@netscript/shared` Result rule retired; AP/F refs reconciled. |
| `docs/architecture/doctrine/01-thesis-and-axioms.md` | changed | Removed dead phase-0 citation references. |
| `docs/architecture/doctrine/04-modules-and-helpers.md` | changed | Removed dead phase-0 citation references. |
| `docs/architecture/doctrine/ref-migration-map.md` | new | Old-to-current AP/F map. |
| `.llm/harness/evaluator/anti-pattern-catalog.md` | changed | Reference trust note links to migration map. |
| `.llm/harness/debt/arch-debt.md` | changed | Reference trust note links to migration map. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS for `.llm/tools` | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` |
| Fitness | PASS with existing warnings | Before and after `rtk proxy deno task arch:check` exited 0; after-run has reconciled refs and no stale shared Result rule. |
| Runtime | N/A | No runtime changes. |
| Consumer | N/A | No package public exports changed. |

## Open Questions

- None currently blocking.

## Drift and Debt

- Drift: run dir absent at start; recorded.
- Debt: targeted debt ref reconciliation planned; no new package debt intended.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
