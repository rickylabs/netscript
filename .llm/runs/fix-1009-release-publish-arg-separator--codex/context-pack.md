# Context Pack: release task argument-separator tolerance

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1009-release-publish-arg-separator--codex` |
| Branch | `fix/1009-release-publish-arg-separator` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` (contract/gate subset) |
| Scope overlays | `none` |

## Current State

The branch was clean at baseline `3ab64720f`. Research independently confirms the reported narrow
cause and AC4 sweep. The before probe fails at `github-release.ts` parsing the forwarded bare
separator. An unauthorized closed-model `plan-eval.md` was rejected and demoted to
`supervisor-advisory-review.md`; the canonical verdict slot is empty pending the cloud OpenHands
Qwen evaluator. No source implementation has started.

## Completed

- Required skills and harness references read.
- GitHub token health confirmed.
- Parser/task/test survey and exact before probe completed.
- Two-slice plan and Design checkpoint recorded.

## In Progress

- Draft PR #1040 is open; wait for the already-dispatched cloud OpenHands PLAN-EVAL. Do not
  re-dispatch or implement while the canonical verdict slot is empty.

## Next Steps

1. Obtain separate-session `plan-eval.md` PASS.
2. Implement publish parser plus doc-derived test; validate, review, commit, push, comment.
3. Implement preflight tolerance/test; run full scoped validation and after probe.
4. Obtain separate-session IMPL-EVAL PASS and finalize PR evidence/status.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Bare `--` is skipped anywhere; other unknown args still throw. | sibling parsers / issue scope | No general guard weakening. |
| Publish usage lines are the test input source. | AC3 | Prevents doc/parser drift. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1009-release-publish-arg-separator--codex/` | new | Harness bootstrap/plan only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | Runs after implementation. |
| Fitness | plan pending | PLAN-EVAL not yet run. |
| Runtime | baseline fail captured | Exact before probe. |
| Consumer | pending | Document-derived parser test. |

## Open Questions

- None.

## Drift and Debt

- Drift: local evaluator credential absence, the rejected closed-model artifact, and the
  supervisor's conceded lane misclassification are recorded; cause/scope has no drift.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
