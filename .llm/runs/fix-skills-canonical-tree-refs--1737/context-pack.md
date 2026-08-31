# Context Pack: canonical shipped skill references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-skills-canonical-tree-refs--1737` |
| Branch | `fix/skills-canonical-tree-refs` |
| Current phase | `implement` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | none |

## Current State

Re-baselined at `eaea940b`. Exactly two shipped skill bodies reference the derived Claude tree. The
first slice added a manifest-driven regression test and demonstrated RED (`rc=1`) before source edits.

## Completed

- Harness bootstrap, research, plan, design checkpoint, and PLAN-EVAL N/A assessment.
- Confirmed live lines and full `skills/` sweep count.
- Captured RED: both manifest paths reported, 0 passed / 1 failed, exit 1.

## In Progress

- S1: commit and push the failing regression test.

## Next Steps

1. Capture RED and commit/push S1.
2. Open the draft PR with `Closes #1737`, taxonomy, and milestone 0.0.7.
3. Replace both source references, regenerate/check mirrors, capture GREEN/static/lock evidence.
4. Commit/push S2 and stop for supervisor-dispatched IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Root `skills/` is the shipped source bundle. | Manifest and CLI asset generator | Installed into canonical `.agents/skills/` at runtime. |
| Scan all manifest-listed skill bodies. | Plan L1 | Prevents recurrence in any shipped skill. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `skills/canonical-tree-references_test.ts` | new | Regression invariant. |
| `.llm/runs/fix-skills-canonical-tree-refs--1737/*` | new | Harness artifacts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | RED captured | Focused test rc=1 with both expected offenders. |
| Fitness | RED captured | Canonical ownership invariant fails before repair. |
| Runtime | N/A | No runtime changes. |
| Consumer | pending | Canonical-path invariant. |

## Open Questions

- None.

## Drift and Debt

- Drift: baseline advanced per supervisor reset; recorded.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
