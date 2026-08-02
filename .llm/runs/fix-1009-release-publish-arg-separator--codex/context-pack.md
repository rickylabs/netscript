# Context Pack: release task argument-separator tolerance

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1009-release-publish-arg-separator--codex` |
| Branch | `fix/1009-release-publish-arg-separator` |
| Current phase | `close` |
| Archetype | `6 — CLI / Tooling` (contract/gate subset) |
| Scope overlays | `none` |

## Current State

The branch was clean at baseline `3ab64720f`. Research independently confirms the reported narrow
cause and AC4 sweep. The before probe fails at `github-release.ts` parsing the forwarded bare
separator. An unauthorized closed-model `plan-eval.md` was rejected and demoted to
`supervisor-advisory-review.md`. The OpenHands Qwen evaluator posted a formal PASS; its missing
artifact was initially transcribed, then superseded by the evaluator-authored `plan-eval.md` in
`28f2a5aea`. Both implementation slices are complete, the scoped validation is green, and the
evaluator-authored IMPL-EVAL at `079e84360` is PASS.

## Completed

- Required skills and harness references read.
- GitHub token health confirmed.
- Parser/task/test survey and exact before probe completed.
- Two-slice plan and Design checkpoint recorded.
- Formal open-model PLAN-EVAL PASS recorded.
- Slice 1 focused test passed 15/15 and independent `review_codex_light` review passed.
- Slice 2 focused test and the complete requested suite passed 38/38.
- The exact after probe reached the green-canary gate without `Unknown argument: --`.
- Separate OpenHands Qwen IMPL-EVAL passed and committed `evaluate.md`.

## In Progress

- Final acceptance-evidence mapping and PR lifecycle transition.

## Next Steps

1. Add exact issue acceptance-evidence mapping to PR #1040.
2. Check the completed DoD, set `status:ready-merge`, and make the PR ready for review.

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
| `.llm/tools/release/preflight-text-imports.ts` | changed | Skip a bare task separator. |
| `.llm/tools/release/preflight-text-imports_test.ts` | changed | Exercise forwarded separator through the entry point. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Four-file check, release fmt/lint, and focused suite 38/38. |
| Fitness | plan PASS | OpenHands Qwen verdict comment and evaluator-authored `plan-eval.md`. |
| Runtime | PASS | Exact after probe reached the canary gate, beyond argument parsing. |
| Consumer | PASS | Document-derived parser test and task subprocess test. |
| IMPL-EVAL | PASS | Evaluator-authored `evaluate.md` at `079e84360`. |

## Open Questions

- None.

## Drift and Debt

- Drift: local evaluator credential absence, the rejected closed-model artifact, and the
  supervisor's conceded lane misclassification are recorded; cause/scope has no drift.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
