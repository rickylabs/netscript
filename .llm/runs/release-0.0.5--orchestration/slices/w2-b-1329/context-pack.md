# Context Pack: W2-B #1329 versioned stream SSE envelope

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w2-b-1329` |
| Branch         | `fix/streams-versioned-sse-envelope`            |
| Current phase  | `plan-eval`                                     |
| Archetype      | `3 — Runtime/Behavior`                          |
| Scope overlays | `frontend`, `service`, `docs`                   |

## Current State

Research and the contract-first Design checkpoint are complete against clean base `c383b2e84`. The
contract is locked in `plan.md`: upstream wire names remain exactly `data/control`; the single v1
authority also defines validated `heartbeat/error` consumer outcomes, per-write correlation and W3C
context, control-committed replay, and non-advancing malformed-frame behavior. Implementation is
hard-stopped pending a fresh opposite-family PLAN-EVAL.

## Completed

- Required skills and harness/doctrine/profile/overlay/gate references read in order.
- Issue #1329 body and comment read in full; current code and upstream pinned protocol re-verified.
- Baseline package/generator/Fresh tests run green.
- JSR/doc baseline captured: five private-type refs and one slow-type warning are owned hidden
  scope.
- Exact AP-13 and streams connector-convergence debts cited without generalization.

## In Progress

- S0 plan commit, draft PR bootstrap, and separate PLAN-EVAL request.

## Next Steps

1. Receive separate native Claude/Fable 5 medium PLAN-EVAL `PASS` in `plan-eval.md`.
2. Implement S1 contract authority only, run its focused gates, then commit/push/comment.
3. Continue S2–S5 with one slice at a time; request serialized gate only when otherwise green.
4. Request orchestrator-launched separate IMPL-EVAL after terminal evidence.

## Key Decisions

| Decision                                            | Source      | Notes                                                    |
| --------------------------------------------------- | ----------- | -------------------------------------------------------- |
| One v1 authority, no parallel tables                | plan D1/D10 | Core owns convention; service/generator/docs consume it. |
| Wire `data/control`; outcomes add `heartbeat/error` | plan D2/D5  | Honest to upstream and exhaustive for consumers.         |
| Control commits replay offset                       | plan D6     | Disconnect-before-control replays at least once.         |
| Correlation explicit or entity key fallback         | plan D3/D4  | Stable for upsert/delete/replay and TC-7.                |

## Files Changed

| Path                    | Status  | Notes                                           |
| ----------------------- | ------- | ----------------------------------------------- |
| slice `supervisor.md`   | changed | Dispatch identity and current evaluator routes. |
| slice `research.md`     | new     | Current evidence and JSR scan.                  |
| slice `plan.md`         | new     | Locked decisions, risks, gates, slices.         |
| slice `worklog.md`      | new     | Design checkpoint and baseline evidence.        |
| slice `context-pack.md` | new     | Resumable state.                                |
| slice `drift.md`        | new     | Missing shared brief and baseline differences.  |

## Gates

| Gate family | Current status             | Evidence                                                           |
| ----------- | -------------------------- | ------------------------------------------------------------------ |
| Static      | baseline mixed             | 17 targeted tests pass; doc lint baseline red (5).                 |
| Fitness     | pending                    | AP-13 exact debt accepted; full gates after implementation.        |
| Runtime     | not run                    | requires implementation and isolated Aspire.                       |
| Consumer    | baseline defect reproduced | official example is wrong; generated helper lacks contract parser. |

## Open Questions

- None that may force implementation rework; PLAN-EVAL may challenge locked decisions before code.

## Drift and Debt

- Drift: repository shared-brief file absent; inlined exact contract used. Historical hold
  superseded.
- Debt: preserve exact AP-13 warning and connector-convergence entries; create no new debt.

## Commits

- See the draft PR commit list + per-slice PR comments.
