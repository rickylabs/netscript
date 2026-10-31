# Plan & Design — READY FOR REVIEW

Deliver only #1366 box 6. PLAN-EVAL is required by the owner before implementation.

## Locked decisions

1. Extend ChildHealthMonitor with optional health options for a configurable crash-loop threshold, retaining the clock constructor and all default behavior. Default remains 3 restarts in 60 seconds, inclusive. Preserve workers' in-process restart budget unchanged.
2. Add a synchronous ChildRestartHistoryPort and bounded ChildRestartHistory domain record (active, processId, failed, restart count, recent timestamps, latch). A shared FileChildRestartHistory adapter validates small records and replaces files atomically. Only lifecycle transitions and latch recovery write; HTTP polling does not read disk. Persist before runtime admission. No raw fatal errors are stored. A missing record is the first boot; a corrupt/unwritable record fails closed instead of resetting to green.
3. An explicit monitor process-tracking method loads history once: a recorded fatal failure always counts one restart; an active prior process with a different OS processId also counts one restart. Same-process healthy watch reloads do not count. Graceful stop marks inactive; abrupt OS termination retains active. processId is supplied by the transport so the monitor stays free of Deno IO. Latch and restart count survive replacement; a fresh process cannot count downtime as clean running. Recovery still requires a complete uninterrupted ready window in the current process. Timestamp arrays are bounded by the configured threshold.
4. Extend runChildHealthProcess with a backwards-compatible third options argument supporting an injected monitor and history path. Attach process history before bootstrap. Generated sagas/triggers glue opts into separate .data/child-health/<plugin>.json records, resolved relative to the child's existing project working directory. The specialized triggers monitor must also be the transport's monitor, preserving file-watch metadata. Workers does not opt into process history: the owner explicitly scopes this leaf to “Add cross-process crash-loop detection for the sagas and triggers background children” and “#2482 ... keep its behaviour.” The existing workers monitor/supervisor tests are preservation gates. This PR proves box 6 only for sagas/triggers and makes no new cross-process workers claim. Any additional worker process-scope acceptance belongs to the coordinator; it must not expand this owner-locked leaf.
5. One health-history file has one process owner, matching the existing single health listener per generated background resource. Replicas must configure distinct paths. State survives OS restarts within the same project filesystem; distributed replica tracking is deferred. Atomic replacement prevents partial readers after a process crash; use fixed bounded permissions and fail closed on invalid state. Storage failure during a request or runtime transition must yield unhealthy/terminate, never a false green.
6. Keep lastFatalError redaction and timestamp unchanged (coordinator's box-4 decision). Dashboard and installed-consumer proof are outside this leaf.

## Slices and gates

- S0: commit this plan/run record and open a draft PR; gate: complete design checkpoint, independent PLAN-EVAL before code.
- S1: shared contract/port/adapter/monitor + transport options, sagas/triggers glue, subprocess regression tests and health docs; files in declared supervisor surface plus glue stubs and canonical generated carriers. Gates: structured test/check/lint/fmt wrappers; affected monitor/transport/plugin runtime health and workers budget tests; negative control disables history detection and must fail both plugin crash-loop assertions; doctrine scan, doc lint, generated health/docs/publish freshness. Independent review before sign-off commit, push and report.
- S2 if needed: evaluator/CI corrections and updated run evidence with the same scoped gates. Never rebase or force push. Final review pins exact pushed head after marking ready.

## Proof

Launch distinct OS children from generated sagas/triggers glue with deterministic failing registry/dependency setup. Retain the history path across three restarts (four process starts). Assert third restart reaches crash-looping and HTTP 503 within the default window, lower restart counts remain failed, restartCount increments across processes. Healthy one-restart-then-stable child stays ready; graceful shutdown does not count as crash. Kill ready children abruptly to prove active-marker detection. Verify custom threshold, boundary, recovery after full live ready window, corrupt records and per-resource isolation with focused monitor/adapter tests. Remove detector hook temporarily and rerun the two regression cases; record red results then restore byte-for-byte and rerun green.

Additionally launch both real generated glue modules with --watch: a failing registry causes exit 1 in each isolate; modifying that same imported registry triggers another failed run and reaches crash-looping by the third restart. Reload a healthy registry at least three times in the same watcher OS process and require ready with restartCount zero. Count successful boot replacing a recorded failed isolate as one restart even if processId matches. Failure-marker persistence is mandatory before final health exit. Never mark fatal timer drain as a clean stop.

## Risks and mitigations

- Triggers snapshot bypasses default monitor: inject the same specialized monitor into transport.
- Saga shutdown can overwrite failed state: capture fatal snapshot/latch before stop and use retained failure payload.
- Filesystem failure: fail closed, no silently empty history; bounded and validated record; atomic rename.
- False positives on clean restart: clear active marker only after clean drain; keep crash latch until live recovery.
- Working-directory collisions: plugin-specific paths and documented one-owner scope.
- New exports / generated carriers: explicit type annotations, doc lint and canonical regeneration/freshness checks.

Open-decision sweep: none that force rework. Distributed replicas and filesystem loss are safe to defer and documented. Local full scaffold.runtime is explicitly forbidden; required CI verdict is requested in READY, coordinator applies e2e-cli-gate. Other CI is inspected once at final head; no waiting loop. Do not merge or close #1366.
