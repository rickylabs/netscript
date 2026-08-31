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

S1 is committed/pushed and PR #1830 is open. The supervisor explicitly authorized the mandatory
generated barrel. Both source fixes, the generated projection, and final evidence are ready for the
GREEN commit; every selected gate passes.

## Completed

- Harness bootstrap, research, plan, design checkpoint, and PLAN-EVAL N/A assessment.
- Confirmed live lines and full `skills/` sweep count.
- Captured RED: both manifest paths reported, 0 passed / 1 failed, exit 1.
- Committed/pushed S1 as `d338145da`; opened draft PR #1830 with required labels and milestone.
- Repaired both source references; GREEN rc=0 and full shipped-body match count is 0.
- Mirror sync/check passed (18 skills / 22 files, both rc=0) with no tracked mirror diff.
- Generated the barrel with the checked-in task; inspection found only the two propagated strings
  and deterministic bundle hash.
- Scoped check/lint/fmt pass after focused formatting of the new regression test.
- Final captured exits: asset check 0, focused test 0, mirror sync 0, mirror check 0, lock diff 0;
  shipped-body sweep has 0 matches (`rg` no-match exit 1).

## In Progress

- Commit/push S2, update PR #1830, then stop for supervisor-dispatched IMPL-EVAL.

## Next Steps

1. Commit/push S2 and update PR #1830, including its shared-carrier declaration.
2. Stop for supervisor-dispatched IMPL-EVAL.

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
| Static | PASS | Focused GREEN, scoped check/lint/fmt, and lock diff pass. |
| Fitness | PASS | Asset check and mirror sync/check pass; generated diff inspection is clean. |
| Runtime | N/A | No runtime changes. |
| Consumer | pending | Canonical-path invariant. |

## Open Questions

- None.

## Drift and Debt

- Drift: baseline advanced; PR #1759 shares the generated barrel and coordinator owns ordering.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
