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
| 2026-08-09 | S5    | Real outage RED    | Exact Aspire resource stop left a reachable proxy request pending: no backoff within ten seconds, raw gate exit 1. |
| 2026-08-09 | S5    | Bounded request    | Added the missing finite per-request timeout to contract/port/adapter; hanging-request test and all 29 core tests pass. |
| 2026-08-09 | S5    | Correlated recovery | Focused reconnect gate exited 0: three buffered receipts recovered FIFO under one dashboard trace with actual forwarded OTLP metrics. |
| 2026-08-09 | S5    | Owned cleanup      | Foreground AppHost stopped; no owned survivors. Foreign Redis untouched; scratch workspace moved to recoverable trash. |
| 2026-08-09 | S6    | Cheaper gate closeout | JSR audit, workspace publish dry-run, both mandatory aggregates, and review-thread gate all exited 0 after S5. |
| 2026-08-09 | S6    | Runtime token handoff | `EXPENSIVE-GATE-REQUEST` recorded after every cheaper gate passed; `scaffold.runtime` remains unstarted pending a ledger grant. |
| 2026-08-09 | S7    | Serialized verdict | Ledger row 59 granted W3-A the idle token; exactly one full `scaffold.runtime` run exited 0 with passed=79 failed=0 skipped=2. |
| 2026-08-09 | S7    | Slice runtime proof | `behavior.streams.producer-reconnect` passed; stream install/readiness, aggregate plugin health, and owned AppHost cleanup also passed. |
| 2026-08-09 | S7    | Post-run ownership | Leak artifact has no W3-A-owned survivor; only foreign `redis-jfgcbtaf` remains and was left untouched. Review threads exited 0 with none unanswered. |

## Decisions

See `plan.md` D1–D16. No open decision would force implementation rework.

## Drift

| Drift                                                                        | Severity    | Logged in drift.md |
| ---------------------------------------------------------------------------- | ----------- | ------------------ |
| Historical preparation identity/evaluator differs from live dispatch         | minor       | yes                |
| Upstream append declaration advertises producer fields that runtime ignores  | significant | yes                |
| JSR helper counts banner as one slow-type warning while raw dry-run is clean | minor       | yes                |
| Real stopped-resource proxy requires a finite per-request timeout             | significant | yes                |
| Aspire 13.4 exposes traces but no metric query API                            | evidence narrowing | yes          |

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
| S5 focused tests                    | core + reconnect gate/registry/probe tests                      | PASS, exit 0 | 51 passed; hanging-request and OTLP-envelope assertions included. |
| S5 scoped check                     | core + CLI gate/registry + streams probe, `--no-lock`           | PASS, exit 0 | 113 files, zero failed batches or diagnostics.             |
| S5 scoped lint / format             | same 113-file selection                                        | PASS, exit 0 each | Zero findings.                                         |
| S5 full export doc lint             | `deno task doc:lint --root packages/plugin-streams-core --pretty` | PASS, exit 0 | Combined diagnostics 0.                                |
| S5 raw package publish              | package `deno publish --dry-run --allow-dirty --no-check`       | PASS, exit 0 | Public timeout contract publishable; no lock change.       |
| S6 JSR audit helper                 | `audit-jsr-package.ts --root packages/plugin-streams-core`      | PASS, exit 0 | 43 files and all four exports; only the known banner-count warning. |
| S6 workspace publish               | `deno task publish:dry-run`                                     | PASS, exit 0 | Entire workspace simulation completed successfully after S5. |
| S6 review threads                  | `agentic:review-threads --pr 1402 --pretty`                      | PASS, exit 0 | 0 threads, 0 unanswered.                                  |
| S7 serialized runtime              | exact one-pass `e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS, exit 0 | Full aggregate: passed=79 failed=0 skipped=2. Exactly one authorized run. |
| S7 final review threads            | `agentic:review-threads --pr 1402 --pretty`                      | PASS, exit 0 | 0 threads, 0 unanswered after the runtime verdict.        |

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
| F-1..F-19              | PASS, exit 0            | S3 decisive  | Package-scoped doctrine has FAIL=0 WARN=0; AP-13 producer row closed with structured telemetry.    |
| JSR surface scan       | PASS with helper caveat | `research.md` | Helper warns on banner; raw dry-run authority is green.                                            |
| Package quality scan   | PASS, exit 0            | S3 decisive  | Package source scanned directly: zero findings and zero allowances.                                |
| Package doctrine check | PASS, exit 0            | S3 decisive  | Final package-scoped result: FAIL=0 WARN=0 INFO=1; INFO is pre-existing missing architecture doc.  |
| F-14 manual scan       | PASS, exit 0            | `PENDING_SCRIPT` manual | One comment-only diagnostics example; zero executable `console.*`; #1403 owns automation. |
| Aggregate `quality:gate` / `arch:check` | PASS, exit 0 each | S6 non-decisive | Required aggregates reran after S5, but configured roots omit this package; #1403 owns that gap. |

### S1 compile safety

| Command                                                                                   | Raw exit | Result                                                                                                                        |
| ----------------------------------------------------------------------------------------- | -------: | ----------------------------------------------------------------------------------------------------------------------------- |
| Scoped wrapper with both wrapper-owned and explicit `--unstable-kv`                       |        1 | Invalid invocation: Deno rejects the duplicate flag before checking; not product evidence.                                    |
| `run-deno-check.ts --root packages/plugin-streams-core --ext ts,tsx --deno-arg --no-lock` |        0 | 31 files selected, one batch, zero failed batches and diagnostics; effective command is `deno check --unstable-kv --no-lock`. |

### Runtime Gates

| Gate                              | Result  | Evidence            | Notes                                                 |
| --------------------------------- | ------- | ------------------- | ----------------------------------------------------- |
| Focused Aspire producer reconnect | PASS, exit 0 | S5 isolated AppHost | Exact stop/backoff/restart, FIFO receipts, one dashboard trace, positive OTLP metrics. |
| `scaffold.runtime`                | PASS, exit 0 | S7 ledger row 59 | Exactly one run: passed=79 failed=0 skipped=2. |

### S7 named runtime verdicts

| Gate                                  | Verdict | Duration | Why it matters to W3-A |
| ------------------------------------- | ------- | -------: | ---------------------- |
| `scaffold.plugin.stream`              | PASS    |   355 ms | The generated runtime installs the official stream plugin containing this producer path. |
| `runtime.wait.streams`                | PASS    |   276 ms | The real stream service reached readiness before the reconnect fault injection. |
| `behavior.streams.producer-reconnect` | PASS    |  3907 ms | Decisive slice gate: exact resource outage/backoff/restart recovers all three FIFO receipts under one correlated trace with retry/recovery/delivery metrics. |
| `behavior.plugins-health`             | PASS    |  1036 ms | Aggregate installed-plugin health remains green after recovery. |
| `cleanup.aspire-stop`                 | PASS    |   964 ms | The suite's owned AppHost cleanup completed. |
| `behavior.otel.stream-consumer`       | SKIP    |     0 ms | Exact expected #1398 deferral; not W3-A evidence and not widened. |
| `behavior.otel.traces`                | SKIP    |     0 ms | Exact expected #1398 deferral; not W3-A evidence and not widened. |

No other gate skipped. The aggregate skip count is exactly two, matching the accepted #1398
boundary. The earlier focused S5 execution remains development evidence; this S7 row is the
serialized release verdict.

### Consumer Gates

| Consumer                  | Result  | Evidence   | Notes                                             |
| ------------------------- | ------- | ---------- | ------------------------------------------------- |
| Existing producer callers | PASS, exit 0 | S4 | Auth, sagas, and workers tests pass 8/8; streams/triggers producer modules type-check. |
| Deferred #1398 gates      | N/A     | Boundary   | Remain deferred; not evidence for this slice.     |

## Acceptance Mapping

All seven live #1326 acceptance rows are now truthfully evidenced:

- Initial and later failures enter the documented finite reconnect state: focused runtime tests
  and the real stopped-resource gate pass.
- Retry/backoff, cancellation, readiness, and shutdown are explicit in the public contract and
  separately tested.
- Count/byte bounds return explicit rejected receipts; accepted receipts settle as delivered,
  rejected, or delivery-unknown, so overflow and shutdown do not silently lose writes.
- Initial-offline recovery passes in both focused behavioral tests and the real Aspire proof.
- Initial outage, mid-session outage, recovery, FIFO, and stop during backoff each have distinct
  RED and GREEN evidence.
- One correlated publish trace spans buffering, retry, recovery, settlement, and delivery; actual
  OTLP metrics expose buffered, retry, recovered, rejected/unknown, and delivered outcomes.
- The false reconnect warning is removed; manual F-14 reports no executable producer console use.

## EXPENSIVE-GATE-REQUEST

Requested after S6 cheaper-gate completion. At request time the serialized token was held by W3-B2.
The suite remained unstarted until the orchestrator recorded and communicated W3-A's ledger grant.

## EXPENSIVE-GATE-RELEASE

The orchestrator granted W3-A ledger row 59. W3-A used the token for exactly one run, which exited
0 with `passed=79 failed=0 skipped=2`. Post-run leak-check and review-thread gates both exited 0;
the leak artifact reports no run-owned survivor. The token is released with this S7 handoff.

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
