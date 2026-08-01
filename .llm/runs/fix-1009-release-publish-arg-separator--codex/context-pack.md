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

The clean branch equals `origin/main` at `3ab64720f`. Research independently confirms the reported
narrow cause and AC4 sweep. The before probe fails at `github-release.ts` parsing the forwarded
bare separator. The plan/design are ready for a separate PLAN-EVAL; no source implementation has
started.

## Completed

- Required skills and harness references read.
- GitHub token health confirmed.
- Parser/task/test survey and exact before probe completed.
- Two-slice plan and Design checkpoint recorded.

## In Progress

- Commit/push harness bootstrap, open draft PR, and run formal PLAN-EVAL.

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

- Drift: none; cause matches task prompt.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
