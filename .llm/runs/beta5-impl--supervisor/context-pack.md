# Context Pack: issue #305 doctrine quick-win

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta5-impl--supervisor` |
| Branch | `chore/305-doctrine-quickwin` |
| Current phase | `implement` |
| Archetype | Archetype 6 for checker tooling; N/A for docs-only files |
| Scope overlays | `SCOPE-docs.md` |

## Current State

The branch starts at `origin/main` `1c1759908e99c68a3bb0cccfd7a35aeafd8d40e0` with no upstream.
The quick-win findings reproduce: stale `@netscript/shared` Result guidance, dead
`phase-0-research` doctrine references, and AP/F ref drift between checker/harness debt/doctrine.

## Completed

- Required skills and harness workflow docs read.
- Current-tree research and plan/design artifacts created.

## In Progress

- Implementation slices may begin after PLAN-EVAL `PASS`.

## Next Steps

1. Commit/push PLAN-EVAL artifact.
2. Run baseline `deno task arch:check`.
3. Implement slices 1-3 and final validation.

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

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | pending | Planned `.llm/tools` wrapper check. |
| Fitness | pending | Planned before/after `deno task arch:check`. |
| Runtime | N/A | No runtime changes. |
| Consumer | N/A | No package public exports changed. |

## Open Questions

- None currently blocking.

## Drift and Debt

- Drift: run dir absent at start; recorded.
- Debt: targeted debt ref reconciliation planned; no new package debt intended.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
