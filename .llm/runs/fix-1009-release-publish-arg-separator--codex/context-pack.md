# Context Pack: release task argument-separator tolerance

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1009-release-publish-arg-separator--codex` |
| Branch | `fix/1009-release-publish-arg-separator` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` (contract/gate subset) |
| Scope overlays | `none` |

## Current State

The branch was clean at baseline `3ab64720f`. Research independently confirms the reported narrow
cause and AC4 sweep. The before probe fails at `github-release.ts` parsing the forwarded bare
separator. An unauthorized closed-model `plan-eval.md` was rejected and demoted to
`supervisor-advisory-review.md`. The OpenHands Qwen evaluator posted a formal PASS; its missing
artifact is transcribed verbatim in `plan-eval.md` with a checkable provenance pointer. Slice 1 is
implemented, substantively reviewed, and focused-test green.

## Completed

- Required skills and harness references read.
- GitHub token health confirmed.
- Parser/task/test survey and exact before probe completed.
- Two-slice plan and Design checkpoint recorded.
- Formal open-model PLAN-EVAL PASS recorded.
- Slice 1 focused test passed 15/15 and supervisor review passed.

## In Progress

- Sign off and push Slice 1, then begin Slice 2.

## Next Steps

1. Commit/push/comment Slice 1.
2. Implement preflight tolerance/test; run full scoped validation and after probe.
3. Obtain separate-session IMPL-EVAL PASS and finalize PR evidence/status.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Bare `--` is skipped anywhere; other unknown args still throw. | sibling parsers / issue scope | No general guard weakening. |
| Publish usage lines are the test input source. | AC3 | Prevents doc/parser drift. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1009-release-publish-arg-separator--codex/` | new | Harness bootstrap/plan only. |
| `.llm/tools/release/github-release.ts` | changed | Skip bare `--` anywhere in argv. |
| `.llm/tools/release/github-release_test.ts` | changed | Parse every documented publish Usage invocation. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Slice 1 focused PASS | `github-release_test.ts`: 15 passed, 0 failed. |
| Fitness | plan PASS | OpenHands Qwen verdict comment and transcribed `plan-eval.md`. |
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
