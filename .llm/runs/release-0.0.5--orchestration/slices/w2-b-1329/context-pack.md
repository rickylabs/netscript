# Context Pack: W2-B #1329 versioned stream SSE envelope

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w2-b-1329` |
| Branch         | `fix/streams-versioned-sse-envelope`            |
| Current phase  | `impl-eval handoff — owner-approved row-6 split` |
| Archetype      | `3 — Runtime/Behavior`                          |
| Scope overlays | `frontend`, `service`, `docs`                   |

## Current State

S1–S5 are implemented and every cheaper gate is green. Runtime diagnostics empirically proved that
completed workers executions are not published to the durable stream; the product gap is filed as
#1398 in 0.0.6. Owner ruling closes #1329 on seven proven rows with row 6 explicitly split to #1398.
TC-14 and its missing/divergent context tests remain as the follow-up acceptance gate.

## Completed

- Required skills and harness/doctrine/profile/overlay/gate references read in order.
- Issue #1329 body and comment read in full; current code and upstream pinned protocol re-verified.
- Baseline package/generator/Fresh tests run green.
- JSR/doc baseline captured: five private-type refs and one slow-type warning are owned hidden
  scope.
- Exact AP-13 and streams connector-convergence debts cited without generalization.
- Separate Claude/Fable 5 medium PLAN-EVAL passed; F1/F2 are folded into the run design.
- S1 contract, runtime schemas, parser, reducer, named EventSource binding, and six focused tests
  implemented.
- S1 focused tests, package test suite, scoped check/lint/fmt, direct entry checks, and full export
  doc lint are green.
- S2 package and real-server conformance tests pass; scoped wrappers, `quality:gate`, `arch:check`,
  full export doc lint, and package publish dry-run are green.
- S3 focused tests, generated type fixture, docs links/accuracy, and Fresh publish dry-run pass.
  The Fresh streams entrypoint retains exactly its 11 pre-existing doc diagnostics; new SSE files
  add zero. This baseline is recorded in `drift.md`, not generalized into connector cleanup.

## In Progress

- Await separate orchestrator-launched Claude/Fable 5 IMPL-EVAL on PR #1395.

## Next Steps

1. Commit/push/comment the owner disposition and final evidence.
2. Move PR and issue to `status:impl-eval`.
3. Stop; the orchestrator launches the separate evaluator.

## Key Decisions

| Decision                                            | Source      | Notes                                                    |
| --------------------------------------------------- | ----------- | -------------------------------------------------------- |
| One v1 authority, no parallel tables                | plan D1/D10 | Core owns convention; service/generator/docs consume it. |
| Wire `data/control`; outcomes add `heartbeat/error` | plan D2/D5  | Honest to upstream and exhaustive for consumers.         |
| Control commits replay offset                       | plan D6     | Disconnect-before-control replays at least once.         |
| Correlation explicit or entity key fallback         | plan D3/D4  | Stable for upsert/delete/replay and TC-7.                |
| Replay retains cursor plus terminal marker          | PLAN-EVAL F1 | Offset remains today's only resume parameter.            |
| Offset is opaque and never parsed                   | PLAN-EVAL F1 | W3-A stores/replaces server tokens verbatim.              |
| Deno AppHost consumer hosts the final OTEL span     | PLAN-EVAL F2 | Browser proof remains separate from OTLP trace export.    |

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
| Static      | green | Final focused suite 28/28; 114-file wrappers; doc/publish/quality/docs gates green. |
| Fitness     | green with exact accepted debts | AP-13 warning and connector convergence remain unchanged. |
| Runtime     | attributable split | Generated consumer/example evidence passes; missing execution publication is filed as #1398 and row 6 is explicitly split by owner ruling. |
| Consumer    | green | Generated service and exact documented native example executed successfully. |

## Open Questions

- None within #1329. #1398 owns execution publication and end-to-end TC-14 proof.

## Drift and Debt

- Drift: repository shared-brief file absent; inlined exact contract used. Historical hold
  superseded.
- Debt: preserve exact AP-13 warning and connector-convergence entries; create no new debt.

## Commits

- See the draft PR commit list + per-slice PR comments.
