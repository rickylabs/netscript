# Context Pack: W2-B #1329 versioned stream SSE envelope

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w2-b-1329` |
| Branch         | `fix/streams-versioned-sse-envelope`            |
| Current phase  | `impl — S6 TC-14 diagnosis`                     |
| Archetype      | `3 — Runtime/Behavior`                          |
| Scope overlays | `frontend`, `service`, `docs`                   |

## Current State

S1–S5 are implemented and every cheaper gate is green. The granted serialized runtime ran once and
failed 74/75 at TC-14. Before any behavior repair, the trace validator now prints the selected
producer trace id, consumer trace/span ids, every link trace/span id, and link count, with a distinct
zero-link diagnosis. Focused diagnostic gates are green. Runtime diagnosis is next; no selector or
product propagation behavior has been changed.

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

- Reproduce TC-14 through the retained generated workspace and classify gate selection versus real
  product non-propagation from the new identity output.

## Next Steps

1. Commit/push/comment the diagnostics-only slice.
2. Run a targeted owned AppHost diagnostic, not `scaffold.runtime`, and report classification before repair.
3. Request a new serialized token only after an authorized repair exists.

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
| Runtime     | **failed** | Aggregate 74 passed, 1 failed: TC-14 W3C link/producer trace equality. |
| Consumer    | green | Generated service and exact documented native example executed successfully. |

## Open Questions

- Why the live SSE change's traceparent links outside the actual Flow-B producer trace; this is the
  single observed blocker and was not diagnosed or repaired after the one-pass failure.

## Drift and Debt

- Drift: repository shared-brief file absent; inlined exact contract used. Historical hold
  superseded.
- Debt: preserve exact AP-13 warning and connector-convergence entries; create no new debt.

## Commits

- See the draft PR commit list + per-slice PR comments.
