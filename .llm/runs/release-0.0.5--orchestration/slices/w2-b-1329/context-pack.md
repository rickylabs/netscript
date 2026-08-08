# Context Pack: W2-B #1329 versioned stream SSE envelope

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w2-b-1329` |
| Branch         | `fix/streams-versioned-sse-envelope`            |
| Current phase  | `impl — S3`                                     |
| Archetype      | `3 — Runtime/Behavior`                          |
| Scope overlays | `frontend`, `service`, `docs`                   |

## Current State

PLAN-EVAL passed and S1 implements the exported `@netscript/plugin-streams-core/sse` authority.
Upstream wire names remain exactly `data/control`; validated outcomes add `heartbeat/error`.
Replay state includes the last committed opaque offset, optional observed cursor, terminal marker,
and pending batches. Full export-map doc lint is now zero after replacing five private telemetry
type references with explicit package-owned ports. S2 adds per-write correlation/message context,
W3C tracestate emission, and real-server/proxy conformance against the same authority. S3 adds the
Fresh native helper, generated Fresh 2.x island, and copy-exact official example.

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

- Final S3 framework gates, commit/push/PR comment, then isolated runtime/OTEL evidence in S4.

## Next Steps

1. Commit/push/comment S3.
2. Capture S4 real generated-service/browser behavior and Deno AppHost consumer OTEL span.
3. Complete S5 gates; request serialized gate only when otherwise green.
4. Request orchestrator-launched separate IMPL-EVAL after terminal evidence.

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
| Static      | S1 green                   | 15 package tests; scoped check/lint/fmt; doc lint 0.                |
| Fitness     | pending                    | AP-13 exact debt accepted; full gates after implementation.        |
| Runtime     | not run                    | requires implementation and isolated Aspire.                       |
| Consumer    | baseline defect reproduced | official example is wrong; generated helper lacks contract parser. |

## Open Questions

- None that may force S1 rework; the full `plan-eval.md` is imported and F1/F2 are resolved.

## Drift and Debt

- Drift: repository shared-brief file absent; inlined exact contract used. Historical hold
  superseded.
- Debt: preserve exact AP-13 warning and connector-convergence entries; create no new debt.

## Commits

- See the draft PR commit list + per-slice PR comments.
