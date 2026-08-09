# Worklog: W3-A #1326 durable producer reconnect

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w3-a-1326` |
| Branch         | `fix/streams-durable-producer-reconnect`        |
| Archetype      | `3 — Runtime/Behavior`                          |
| Scope overlays | none; Aspire runtime validation required        |

## Design

Recorded before any product implementation file was created.

### Public Surface

- `DurableStreamProducerOptions` — adds finite reconnect/buffer policy plus optional clock/random
  seams without exposing the concrete adapter.
- `DurableStreamProducer.state` / `isReady` / `waitUntilReady()` — current and next-ready
  observation across repeated outage/recovery cycles.
- `DurableStreamProducer.upsert()` / `delete()` — return `StreamWriteReceiptV1`; existing callers
  may continue ignoring the return value.
- `DurableStreamProducer.flush()` — waits through the call's accepted-write watermark.
- `DurableStreamProducer.stop()` — immediate local cancellation without remote EOF.
- `DurableStreamProducer.close()` — graceful drain and acknowledged remote terminal close.
- Root `@netscript/plugin-streams-core` types: lifecycle/state, reconnect/buffer policy,
  receipt/outcome/reasons, readiness options, and clock/random ports. No new export subpath.

### Domain Vocabulary

- `StreamProducerLifecycleV1` —
  `connecting | ready | backoff | reconnecting | stopping | stopped |
  failed` discriminated states
  with attempt, buffer, and error metadata.
- `StreamProducerReconnectPolicyV1` — finite attempt/delay/backoff/jitter contract.
- `StreamProducerBufferPolicyV1` — count and UTF-8 byte ceilings with fixed reject-newest overflow.
- `StreamWriteReceiptV1` — immutable acceptance plus asynchronous completion.
- `StreamWriteOutcomeV1` — `delivered | rejected | cancelled | delivery-unknown` with typed reason.
- `StreamProducerTransportRequest` — exact serialized bytes plus producer epoch/sequence and
  correlation/trace identity retained until acknowledgement.
- Delivery guarantee — FIFO, at-least-once retry of the same idempotent tuple; acknowledged
  duplicate is delivered, exhausted/aborted active request is explicitly delivery-unknown.

### Ports

- `StreamProducerTransportPort` — narrow create/append/terminal-close protocol seam; real adapter
  owns fetch and upstream header/status translation, fakes force every branch.
- `StreamProducerClockPort` — abortable sleep for backoff; real timer stays at the adapter edge.
- `StreamProducerRandomPort` — deterministic jitter input; real randomness stays at the edge.
- `StreamsTracerPort` / `MeterPort` — existing structured telemetry seams extended only as needed
  for long-lived span events and metrics.

### Constants

- `STREAM_PRODUCER_LIFECYCLE_STATES_V1` — the seven legal states above.
- `DEFAULT_STREAM_PRODUCER_RECONNECT_POLICY_V1` — 8 attempts, 100ms initial, ×2, 5s cap, 0.2 jitter.
- `DEFAULT_STREAM_PRODUCER_BUFFER_POLICY_V1` — 256 events, 1 MiB UTF-8, reject-newest.
- Producer span event names — `buffered`, `connect.attempt`, `backoff`, `reconnecting`, `recovered`,
  `delivered`, `rejected`, `dropped`, `cancelled`, `delivery_unknown`.
- Producer metrics — state transitions, buffered current/total, retries, recovered, rejected,
  explicitly dropped accepted writes, and delivery-unknown.

### Lifecycle and Legal Transitions

```text
connecting -> ready | backoff | failed | stopping
ready -> backoff | stopping | failed
backoff -> reconnecting | stopping | failed
reconnecting -> ready | backoff | stopping | failed
stopping -> stopped
failed -> stopping -> stopped
stopped -> (terminal)
```

`waitUntilReady` observes only transitions into `ready`; it never treats buffered work as ready.
Retry exhaustion is `failed`, not a dormant reconnect promise. `close()` succeeds only after remote
terminal acknowledgement; `stop()` never claims or sends `streamClosed`.

### Concurrency and Ordering

- One supervisor loop owns mutable state and drains one FIFO head at a time.
- Synchronous writes only validate/serialize/enqueue and return a receipt; they do not run
  transport.
- Count/byte reservation happens atomically before enqueue; release happens exactly once on receipt
  settlement.
- `flush` captures a monotonic local acceptance watermark; it does not wait for later writes.
- The upstream producer sequence advances only after accepted/duplicate acknowledgement.

### Correlation and Telemetry

- A write captures correlation/message identity and opens `stream.publish` once at acceptance.
- Its injected `traceparent`/`tracestate` are serialized into the W2-B v1 event before buffering.
- Every retry uses the exact event bytes and tuple. Span events and metrics record transition,
  attempt, delay, outcome, and reason without payload/high-cardinality values.
- The write span ends only when its receipt settles, so one trace id spans outage and recovery.

### Commit Slices

| #  | Slice                                  | Gate                                                               | Files                                            |
| -- | -------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| S0 | Plan-gated research/design             | Separate PLAN-EVAL PASS                                            | Slice artifacts only                             |
| S1 | Contract + classified committed REDs   | 4 behavioral REDs; 4 isolated API-absence REDs; scoped check green | Domain/new ports/exports/README + tests/fixtures |
| S2 | Port+class, supervisor, all RED green  | 8 behavioral tests + real server duplicate/order test              | Existing port/application/adapters/tests         |
| S3 | Structured OTEL + exact AP-13 closure  | Telemetry; scoped quality/doctrine; manual F-14 `PENDING_SCRIPT`   | Telemetry files + debt row                       |
| S4 | Consumer/JSR compatibility             | Wrappers, doc lint, JSR/raw publish, full publish dry-run          | Public/testing/downstream/doc files              |
| S5 | Real Aspire outage and correlated OTEL | Focused runtime gate + leak bracketing                             | Streams probe + CLI E2E gate/evidence            |
| S6 | Handoff/request                        | Review threads + committed gate request                            | Run/PR artifacts                                 |
| S7 | Granted serialized smoke               | Exact one-pass scaffold.runtime exit 0                             | Evidence only                                    |

### Deferred Scope

- Batching/throughput tuning; consumer reconnect; connector convergence; generic topic transport;
  #1398 execution publication and deferred consumer/traces gates.

### Contributor Path

Change public semantics in `producer-contract-v1.ts`, add a forced transition to the fake transport
suite, implement policy in the supervisor, translate only upstream protocol details in the durable
streams adapter, then add span/metric evidence through streams instrumentation. Never add policy to
the adapter or fetch/timers to the supervisor.

## Progress Log

| Time       | Slice | Step               | Notes                                                                                                                              |
| ---------- | ----- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-09 | S0    | Bootstrap/research | Clean exact base verified; live issue and W2-B contract read; doctrine/debts/JSR surface re-baselined.                             |
| 2026-08-09 | S0    | Diagnostic RED     | Initial outage then server-online desired behavior exited 1 and showed the false reconnect warning plus skipped write.             |
| 2026-08-09 | S0    | Design checkpoint  | Contract, state, delivery, buffer, shutdown, transport, telemetry, and ordered slices locked. No product file changed.             |
| 2026-08-09 | S0    | PLAN-EVAL request  | Awaiting orchestrator-launched separate Claude/Fable 5 medium verdict; implementation hard stop active.                            |
| 2026-08-09 | S0    | Draft PR handoff   | Draft PR #1402 targets `main` at plan-only head `6bb6b3961`; labeled `status:plan-eval`.                                           |
| 2026-08-09 | S0    | PLAN-EVAL cycle 1  | `FAIL_PLAN`: repair RED classification/port compile mechanics, package-scoped fitness proof, and finding 7 wording.                |
| 2026-08-09 | S0    | Plan repair        | F1–F3 repaired without product edits; cycle 2 requested. Evaluator artifact was not visible locally at repair time.                |
| 2026-08-09 | S0    | PLAN-EVAL cycle 2  | `FAIL_PLAN`: F1–F3 confirmed repaired; F4 found intentionally broken fixtures inside scoped/CI check roots.                        |
| 2026-08-09 | S0    | Owner escalation   | Owner ratified cycle 3 on the recommended run-dir fixture relocation; no product implementation authorized.                        |
| 2026-08-09 | S0    | Plan repair        | F4 repaired: negative fixtures locked under the slice run dir; direct checks updated; wrappers need no exclusion.                  |
| 2026-08-09 | S0    | PLAN-EVAL cycle 3  | `PASS`: all eight Plan-Gate boxes checked; implementation authorized by separate Claude/Fable evaluator.                           |
| 2026-08-09 | S1    | Contract first     | Added standalone lifecycle/policy/buffer/receipt/failure types and clock/random/transport ports; existing producer port unchanged. |
| 2026-08-09 | S1    | Classified REDs    | Four behavioral assertion failures and four single-symbol API-absence failures recorded separately below.                          |
| 2026-08-09 | S1    | Wrapper correction | Duplicate explicit `--unstable-kv` exited 1 before checking; wrapper-owned flag plus `--no-lock` exited 0.                         |
| 2026-08-09 | S2    | Finite supervisor  | Widened port and producer atomically; exact-body/tuple transport, bounded FIFO/retry, readiness, receipts, stop, and close are implemented. |
| 2026-08-09 | S2    | Eight GREENs       | Four original runtime REDs and four API-absence replacements now pass as eight behavioral tests; removed the run-dir negative fixtures. |
| 2026-08-09 | S2    | Protocol proof     | Reference server accepts a new tuple, reports its exact replay as duplicate, rejects a gap, and reads back exactly one event.     |
| 2026-08-09 | S3    | Correlated OTEL    | Publish span stays open through buffered/retry/recovered events and ends only with the receipt; exact replay retains one trace ID. |
| 2026-08-09 | S3    | Honest metrics     | Observable queue values and counters distinguish delivered, rejected, accepted-write cancellation, retry, recovery, unknown, and state transitions. |
| 2026-08-09 | S3    | Doctrine repair    | Initial scoped doctrine found the new supervisor at 697 lines; split queue/contract/support reasons until final scoped check had zero WARN. |
| 2026-08-09 | S3    | AP-13 disposition  | Manual F-14 found one documentation-only console example and zero executable uses; exact producer debt row closed, no generalized closure. |
| 2026-08-09 | S4    | Consumer audit     | Direct checking found the sagas handwritten void fake incompatible; it now uses `MemoryStreamProducer`, and auth/sagas/workers tests pass 8/8. |
| 2026-08-09 | S4    | Detached types     | A no-workspace config type-checks receipt, state, readiness, flush, and stop through public root/testing subpaths; raw exit 0. |
| 2026-08-09 | S4    | Publish surface    | Full export docs, JSR helper, raw package dry-run, and workspace publish dry-run completed without lock or manifest churn. |

## Decisions

See `plan.md` D1–D16. No open decision would force implementation rework.

## Drift

| Drift                                                                        | Severity    | Logged in drift.md |
| ---------------------------------------------------------------------------- | ----------- | ------------------ |
| Historical preparation identity/evaluator differs from live dispatch         | minor       | yes                |
| Upstream append declaration advertises producer fields that runtime ignores  | significant | yes                |
| JSR helper counts banner as one slow-type warning while raw dry-run is clean | minor       | yes                |

## Gate Results

### Static Gates

| Gate                                | Command or check                                                  | Result       | Notes                                                     |
| ----------------------------------- | ----------------------------------------------------------------- | ------------ | --------------------------------------------------------- |
| Baseline focused tests              | producer + service producer test files                            | PASS, exit 0 | 5 passed; no reconnect behavior.                          |
| Initial desired-behavior diagnostic | inline `deno eval` initial-offline → online → write → flush       | RED, exit 1  | Product failure: latched initial error; write skipped.    |
| Full export doc lint                | `deno task doc:lint --root packages/plugin-streams-core --pretty` | PASS, exit 0 | Combined diagnostics 0.                                   |
| Raw package publish dry-run         | `deno publish --dry-run --allow-dirty --no-check`                 | PASS, exit 0 | Success, intended files, no real slow-type diagnostic.    |
| S1 full export doc lint             | `deno task doc:lint --root packages/plugin-streams-core --pretty` | PASS, exit 0 | Combined diagnostics 0 after new public contract exports. |
| S2 full core tests                  | `deno test --no-lock --allow-all packages/plugin-streams-core/tests/` | PASS, exit 0 | 26 passed, 0 failed; includes all eight reconnect/contract behaviors. |
| S2 transport + reference server     | two focused adapter/server test files                            | PASS, exit 0 | 3 passed; exact tuple/body, classifications, duplicate and gap semantics. |
| S2 scoped check                     | package plus reference-server test, `--deno-arg --no-lock`      | PASS, exit 0 | 38 files, one batch, zero failed batches or diagnostics.  |
| S2 scoped lint                      | package plus reference-server test                              | PASS, exit 0 | 38 files, zero findings.                                  |
| S2 scoped format                    | package plus reference-server test                              | PASS, exit 0 | 38 files, zero findings.                                  |
| S3 telemetry tests                  | full `packages/plugin-streams-core/tests/`                       | PASS, exit 0 | 28 passed, 0 failed; one span/trace across retry and distinct terminal metrics. |
| S3 scoped check                     | core wrapper with `--deno-arg --no-lock`                        | PASS, exit 0 | 42 files, zero failed batches or diagnostics.             |
| S3 scoped lint                      | core wrapper                                                     | PASS, exit 0 | 42 files, zero findings after type-only import repair.    |
| S3 scoped format                    | core wrapper                                                     | PASS, exit 0 | 42 files, zero findings after mechanical formatting.      |
| S3 full export doc lint             | `deno task doc:lint --root packages/plugin-streams-core --pretty` | PASS, exit 0 | Combined diagnostics 0 after public local meter types.    |
| S4 detached consumer                | isolated `deno check --config ...producer-consumer-deno.json`   | PASS, exit 0 | No workspace; public root/testing APIs preserve explicit receipt/lifecycle types. |
| S4 direct consumers                 | auth + sagas + workers focused test files                        | PASS, exit 0 | 8 passed, 0 failed; streams/triggers producer modules also type-check. |
| S4 scoped check                     | core plus sagas compatibility test, `--no-lock`                 | PASS, exit 0 | 44 files, zero failed batches or diagnostics.             |
| S4 scoped lint                      | core plus sagas compatibility test                              | PASS, exit 0 | 44 files, zero findings after type-only fixture import.   |
| S4 scoped format                    | core plus sagas compatibility test                              | PASS, exit 0 | 44 files, zero findings.                                  |
| S4 JSR audit helper                 | `audit-jsr-package.ts --root packages/plugin-streams-core`      | PASS, exit 0 | One known false banner-count warning; raw authority below is clean. |
| S4 raw package publish              | `deno publish --dry-run --allow-dirty --no-check`                | PASS, exit 0 | 43 intended files; no actual slow-type diagnostic.        |
| S4 workspace publish                | `deno task publish:dry-run`                                     | PASS, exit 0 | Entire workspace simulation completed successfully.       |

### S1 RED evidence

| Behavior            | Class                      | Raw exit | Decisive failure                                                                                                                                                |
| ------------------- | -------------------------- | -------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial outage      | `BEHAVIORAL`               |        1 | Runtime assertion: “initial outage must not remain latched after the server becomes available”; no TypeScript diagnostic.                                       |
| Mid-session outage  | `BEHAVIORAL`               |        1 | Runtime assertion: “mid-session batch failure must retain the failed in-flight write”; actual read-back omitted only `during-outage`; no TypeScript diagnostic. |
| Recovery            | `BEHAVIORAL`               |        1 | Runtime assertion: “recovery must deliver the write that was accepted while connecting”; actual read-back empty; no TypeScript diagnostic.                      |
| FIFO ordering       | `BEHAVIORAL`               |        1 | Runtime assertion: “FIFO must retain the exact order of writes across reconnect”; actual read-back omitted `two` and `three`; no TypeScript diagnostic.         |
| Count overflow      | `COMPILE_TIME_API_ABSENCE` |        1 | Only TS2339: `accepted` does not exist on the current void result.                                                                                              |
| Byte overflow       | `COMPILE_TIME_API_ABSENCE` |        1 | Only TS2339: `completion` does not exist on the current void result.                                                                                            |
| Stop during backoff | `COMPILE_TIME_API_ABSENCE` |        1 | Only TS2339: `stop` does not exist on `DurableStreamProducer`.                                                                                                  |
| Readiness           | `COMPILE_TIME_API_ABSENCE` |        1 | Only TS2339: `waitUntilReady` does not exist on `DurableStreamProducer`.                                                                                        |

All eight commands ran separately. The four behavioral commands used default `deno test`
type-checking; none accepted a TypeScript diagnostic. The four compile-time fixtures live only under
the slice run directory and each emitted exactly its named missing-symbol diagnostic.

### Fitness Gates

| Gate                   | Result                  | Evidence      | Notes                                                                                              |
| ---------------------- | ----------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| F-1..F-19              | NOT_RUN                 | Planned S2–S4 | AP-13 exact producer debt currently accepted.                                                      |
| JSR surface scan       | PASS with helper caveat | `research.md` | Helper warns on banner; raw dry-run authority is green.                                            |
| Package quality scan   | PASS, exit 0            | S3 decisive  | Package source scanned directly: zero findings and zero allowances.                                |
| Package doctrine check | PASS, exit 0            | S3 decisive  | Final package-scoped result: FAIL=0 WARN=0 INFO=1; INFO is pre-existing missing architecture doc.  |
| F-14 manual scan       | PASS, exit 0            | `PENDING_SCRIPT` manual | One comment-only diagnostics example; zero executable `console.*`; #1403 owns automation. |
| Aggregate `quality:gate` / `arch:check` | PASS, exit 0 each | Non-decisive | Required aggregates ran, but configured roots omit this package; #1403 owns that gap.      |

### S1 compile safety

| Command                                                                                   | Raw exit | Result                                                                                                                        |
| ----------------------------------------------------------------------------------------- | -------: | ----------------------------------------------------------------------------------------------------------------------------- |
| Scoped wrapper with both wrapper-owned and explicit `--unstable-kv`                       |        1 | Invalid invocation: Deno rejects the duplicate flag before checking; not product evidence.                                    |
| `run-deno-check.ts --root packages/plugin-streams-core --ext ts,tsx --deno-arg --no-lock` |        0 | 31 files selected, one batch, zero failed batches and diagnostics; effective command is `deno check --unstable-kv --no-lock`. |

### Runtime Gates

| Gate                              | Result  | Evidence            | Notes                                                 |
| --------------------------------- | ------- | ------------------- | ----------------------------------------------------- |
| Focused Aspire producer reconnect | NOT_RUN | Planned S5          | Must bracket with leak-check and exact owned cleanup. |
| `scaffold.runtime`                | NOT_RUN | Token not requested | Do not run before cheaper gates and grant.            |

### Consumer Gates

| Consumer                  | Result  | Evidence   | Notes                                             |
| ------------------------- | ------- | ---------- | ------------------------------------------------- |
| Existing producer callers | NOT_RUN | Planned S4 | Return-value addition intended source-compatible. |
| Deferred #1398 gates      | N/A     | Boundary   | Remain deferred; not evidence for this slice.     |

## Handoff Notes

- PLAN-EVAL should inspect D7/D8 first: exact tuple replay and terminal delivery-unknown are the
  core honesty mechanism.
- Verify the raw upstream limitation in `research.md` findings 4–7 rather than assuming
  `IdempotentProducer.onError` retains writes.
- PLAN-EVAL cycle 2 confirmed the eight-result split, S1/S2 port compile story, F2, and F3. Cycle 3
  is owner-ratified solely to verify that intentionally broken fixtures live outside package/CI
  wrapper roots and are reached only by their direct negative commands.
- Treat package-scoped quality/doctrine commands as decisive. Mandatory aggregate gates still run,
  but their omission of `plugin-streams-core` is disclosed and tracked by #1403.
- No product implementation may begin until `plan-eval.md` records `PASS` from the separate session.
- Draft PR: https://github.com/rickylabs/netscript/pull/1402. GitHub auto-close syntax remains
  intentionally absent until every live #1326 acceptance row is truthfully evidenced.
