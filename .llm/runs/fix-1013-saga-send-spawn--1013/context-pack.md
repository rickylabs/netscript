# Context Pack: saga send/spawn correction (#1013)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1013-saga-send-spawn--1013` |
| Branch | `fix/1013-saga-send-spawn` |
| Current phase | `impl` |
| Archetype | `5 - Plugin Package` with sibling runtime rules |
| Scope overlays | `docs` |

## Current State

Research and contract-first design are complete against `origin/main` at `ab0fa13fe`. #1042 already
selected correction; #1075 now recursively dispatches handler effects, exposing the remaining
tutorial sends as loud `SAGA_NOT_FOUND` failures. The owner waived the credential-blocked
PLAN-EVAL on the record, and implementation is proceeding with slice 1.

## Completed

- Required skills, doctrine, harness profiles, issue #1013, PR #1042, and PR #1075 read.
- Real `send`/`spawn`/trigger/worker paths traced.
- JSR/public-surface baseline scanned.
- Design checkpoint and three ordered slices written.
- Local formal evaluator canary attempted and recorded as credential-blocked.
- Planning slice `0fa339144` pushed and draft PR #1091 opened with `Closes #1013`.
- Opposite-family owner reviewer explicitly waived PLAN-EVAL; waiver recorded in `drift.md`.
- Slice 1 regression proved red on baseline product behavior: `assertThrows` failed because
  `spawn()` returned normally.

## In Progress

- Slice 1 sign-off commit and PR evidence comment.

## Next Steps

1. Commit, push, and comment slice 1 evidence.
2. Continue to the storefront docs and cross-plugin integration slice.
3. Prove the slice 2 regression test red against `ab0fa13fe` before changing its production/docs
   dependencies.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Correct contract, do not implement worker-send/spawn | #1042 + current code | Existing explicit trigger-worker boundary is canonical. |
| `spawn()` throws at construction and returns `never` | user rule + plan D3 | Bridge still rejects injected wire effects. |
| Tutorial integration crosses trigger queue and worker registry | acceptance criterion | Queue-only assertion is insufficient. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1013-saga-send-spawn--1013/*` | new | Harness planning artifacts only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline recorded | focused `deno doc`; full doc-lint baseline |
| Fitness | baseline recorded | JSR audit with attributed warnings |
| Runtime | research only | empirical code trace and #1075 diff |
| Consumer | baseline FAIL | tutorial emits orphan saga messages and lacks actual path test |

Slice 1 is green: saga-core package `68 passed / 0 failed / 2 ignored`; scoped check/lint/fmt have
zero findings; quality scan is clean; doctrine roots report `FAIL=0`; focused public docs render
`spawn(...): never`; opposite-family slice re-review returned `PASS`.

## Open Questions

- None for implementation. IMPL-EVAL transport remains an end-of-run risk and is not waived.

## Drift and Debt

- Drift: #1075 changed the failure mode; local evaluator route is credential-blocked; the owner
  waived PLAN-EVAL only.
- Debt: no new entry proposed; existing saga runtime/cardinality and adapter debts are untouched.

## Commits

- See the draft PR's commit list + per-slice PR comments.
