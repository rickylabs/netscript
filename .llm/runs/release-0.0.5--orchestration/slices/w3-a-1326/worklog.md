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

| Time       | Slice | Step               | Notes                                                                                                                  |
| ---------- | ----- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 2026-08-09 | S0    | Bootstrap/research | Clean exact base verified; live issue and W2-B contract read; doctrine/debts/JSR surface re-baselined.                 |
| 2026-08-09 | S0    | Diagnostic RED     | Initial outage then server-online desired behavior exited 1 and showed the false reconnect warning plus skipped write. |
| 2026-08-09 | S0    | Design checkpoint  | Contract, state, delivery, buffer, shutdown, transport, telemetry, and ordered slices locked. No product file changed. |
| 2026-08-09 | S0    | PLAN-EVAL request  | Awaiting orchestrator-launched separate Claude/Fable 5 medium verdict; implementation hard stop active.                |
| 2026-08-09 | S0    | Draft PR handoff   | Draft PR #1402 targets `main` at plan-only head `6bb6b3961`; labeled `status:plan-eval`.                               |
| 2026-08-09 | S0    | PLAN-EVAL cycle 1  | `FAIL_PLAN`: repair RED classification/port compile mechanics, package-scoped fitness proof, and finding 7 wording.    |
| 2026-08-09 | S0    | Plan repair        | F1–F3 repaired without product edits; cycle 2 requested. Evaluator artifact was not visible locally at repair time.    |

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

| Gate                                | Command or check                                                  | Result       | Notes                                                  |
| ----------------------------------- | ----------------------------------------------------------------- | ------------ | ------------------------------------------------------ |
| Baseline focused tests              | producer + service producer test files                            | PASS, exit 0 | 5 passed; no reconnect behavior.                       |
| Initial desired-behavior diagnostic | inline `deno eval` initial-offline → online → write → flush       | RED, exit 1  | Product failure: latched initial error; write skipped. |
| Full export doc lint                | `deno task doc:lint --root packages/plugin-streams-core --pretty` | PASS, exit 0 | Combined diagnostics 0.                                |
| Raw package publish dry-run         | `deno publish --dry-run --allow-dirty --no-check`                 | PASS, exit 0 | Success, intended files, no real slow-type diagnostic. |

### Fitness Gates

| Gate                   | Result                  | Evidence      | Notes                                                                                              |
| ---------------------- | ----------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| F-1..F-19              | NOT_RUN                 | Planned S2–S4 | AP-13 exact producer debt currently accepted.                                                      |
| JSR surface scan       | PASS with helper caveat | `research.md` | Helper warns on banner; raw dry-run authority is green.                                            |
| Package quality scan   | NOT_RUN                 | Planned S3–S4 | Decisive scoped command covers `packages/plugin-streams-core/src`; #1403 owns root gap.            |
| Package doctrine check | NOT_RUN                 | Planned S3–S4 | Decisive scoped command covers `packages/plugin-streams-core`; root aggregate is non-covering.     |
| F-14 manual scan       | `PENDING_SCRIPT`        | Planned S3    | Record every `console.*` match and classify executable versus comment-only; #1403 owns automation. |

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
- PLAN-EVAL cycle 2 must verify that four default-typechecked runtime REDs cannot collapse into the
  four isolated `COMPILE_TIME_API_ABSENCE` fixtures, and that S1 leaves the existing producer port
  unchanged so its scoped check stays green.
- Treat package-scoped quality/doctrine commands as decisive. Mandatory aggregate gates still run,
  but their omission of `plugin-streams-core` is disclosed and tracked by #1403.
- No product implementation may begin until `plan-eval.md` records `PASS` from the separate session.
- Draft PR: https://github.com/rickylabs/netscript/pull/1402. GitHub auto-close syntax remains
  intentionally absent until every live #1326 acceptance row is truthfully evidenced.
