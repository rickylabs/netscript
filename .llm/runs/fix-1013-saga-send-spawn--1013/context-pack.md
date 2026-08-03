# Context Pack: saga send/spawn correction (#1013)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1013-saga-send-spawn--1013` |
| Branch | `fix/1013-saga-send-spawn` |
| Current phase | `plan-eval` |
| Archetype | `5 - Plugin Package` with sibling runtime rules |
| Scope overlays | `docs` |

## Current State

Research and contract-first design are complete against `origin/main` at `ab0fa13fe`. #1042 already
selected correction; #1075 now recursively dispatches handler effects, exposing the remaining
tutorial sends as loud `SAGA_NOT_FOUND` failures. Product implementation is paused at the Plan-Gate.

## Completed

- Required skills, doctrine, harness profiles, issue #1013, PR #1042, and PR #1075 read.
- Real `send`/`spawn`/trigger/worker paths traced.
- JSR/public-surface baseline scanned.
- Design checkpoint and three ordered slices written.
- Local formal evaluator canary attempted and recorded as credential-blocked.

## In Progress

- Bootstrap commit, draft PR creation, and PLAN-EVAL unblock.

## Next Steps

1. Commit/push the run bootstrap and open the draft PR with `Closes #1013`.
2. Obtain a separate Qwen PLAN-EVAL `PASS`, or an explicit owner waiver in writing.
3. Only then implement slice 1 and prove its regression red on `ab0fa13fe`.

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

## Open Questions

- Blocking: restore the local open-model evaluator credential or explicitly waive PLAN-EVAL.

## Drift and Debt

- Drift: #1075 changed the failure mode; local evaluator route is credential-blocked.
- Debt: no new entry proposed; existing saga runtime/cardinality and adapter debts are untouched.

## Commits

- See the draft PR's commit list + per-slice PR comments.
