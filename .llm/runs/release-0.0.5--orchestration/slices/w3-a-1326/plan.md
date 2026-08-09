# Plan: DurableStreamProducer bounded reconnect (#1326)

## Run Metadata

| Field          | Value                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w3-a-1326`                                 |
| Branch         | `fix/streams-durable-producer-reconnect`                                        |
| Phase          | `plan-eval`                                                                     |
| Target         | `packages/plugin-streams-core`, focused streams runtime/E2E proof, run evidence |
| Archetype      | `3 — Runtime/Behavior`                                                          |
| Scope overlays | none; Aspire supplies required runtime validation                               |

## Archetype

Archetype 3 is the smallest truthful profile because the change owns a long-lived producer state,
bounded retry, a clock/cancellation seam, FIFO delivery, readiness, shutdown, and telemetry. The
existing schema contract remains folded into that runtime package; no plugin-package or service
architecture redesign is needed.

## Current Doctrine Verdict

Doctrine chapter 10 does not list `@netscript/plugin-streams-core` separately. The package is the
established runtime owner behind the thin streams plugin, so all new work meets the Archetype-3
state/lifecycle/failure bar. The exact AP-13 producer-warning debt is in scope to close only because
#1326 requires structured operator reporting. The independent streams connector convergence debt
stays accepted, open, and untouched. Repo-wide `quality:gate` and `arch:check` do not currently
cover this package; #1403 owns that tooling gap. This slice uses package-scoped quality/doctrine
commands as its decisive fitness evidence and does not repair the repo-wide roots.

## Goal

Replace the one-shot/latching producer with an explicit, bounded state machine that preserves FIFO
writes through recoverable initial and mid-session outages, rejects overflow immediately, makes
every non-delivery observable to its caller, supports deterministic cancellation and shutdown, and
proves one correlated OTEL write trace survives the outage and recovery.

## Live Acceptance Rows

The plan maps the live issue's exact rows, not a summary:

|  # | Acceptance row (verbatim)                                                                                                                  | Planned proof                                                                                                                                     |
| -: | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1 | “Initial and later transport failures enter a documented reconnect state.”                                                                 | S1 contract/state tests; S2 deterministic transitions; S5 real outage trace.                                                                      |
|  2 | “Retry/backoff, cancellation, readiness, and shutdown semantics are explicit.”                                                             | S1 public contract plus readiness/stop API-absence evidence; S2 clock/abort/stop/close tests.                                                     |
|  3 | “Buffer bounds and overflow behavior are explicit; writes are not silently lost.”                                                          | S1 receipt/bounds contract plus count/byte API-absence evidence; S2 overflow tests and settlement audit.                                          |
|  4 | “The producer recovers when the stream server starts after the producer.”                                                                  | S2 fake transport recovery; S5 stopped-then-started real streams resource.                                                                        |
|  5 | “Tests cover initial outage, mid-session outage, recovery, event ordering, and shutdown during backoff.”                                   | S1 records four independently behavioral REDs and four weaker API-absence REDs; S2 makes all eight behavioral and green; S5 proves real recovery. |
|  6 | “OTEL spans/metrics expose connection state, retries, dropped/buffered events, and recovery using the standardized stream event envelope.” | S3 fake tracer/meter tests; S5 Aspire OTLP/dashboard trace+metric receipt.                                                                        |
|  7 | “Operator messages never promise a transition the implementation cannot perform.”                                                          | S3 removes producer `console.*`, emits typed structured events, and closes only the exact AP-13 row.                                              |

## Scope

- Publish explicit v1 producer lifecycle, reconnect policy, buffer policy, readiness snapshot, write
  receipt/outcome, and shutdown semantics before runtime code.
- Split the current producer monolith into domain contract, application supervisor, clock/transport
  ports, upstream adapter, telemetry, and thin composition/public class.
- Preserve exact serialized payload plus upstream producer epoch/sequence across retry until the
  server acknowledges it; advance FIFO only after acknowledgement.
- Add `state`, `isReady`, `waitUntilReady`, and `stop`; make `upsert`/`delete` return receipts while
  keeping ignored return values source-compatible for existing callers.
- Keep `flush` as a watermark over writes accepted before the call; keep `close` as the only remote
  terminal operation and make failure explicit.
- Replace producer console warnings with typed span events/metrics and receipt outcomes.
- Add a focused generated-runtime/Aspire outage probe and correlated OTEL validation.

## Non-Scope

- No consumer reconnect implementation and no change to `bindStreamEventSourceV1`, opaque offset
  handling, replay reduction, heartbeat derivation, malformed-frame policy, or `streamClosed`.
- No offset arithmetic, parsing, ordering comparison, or producer-side cursor.
- No streams connector convergence or `createPluginService` raw-route escape hatch.
- No generic manifest topic publish/subscribe transport.
- No #1398 mutation-hook repair and no unilateral re-enabling/widening of
  `behavior.otel.stream-consumer` or `behavior.otel.traces`.
- No merge, canary, publish, release workflow, or self-evaluation.

## Hidden Scope

- Upstream failed batches cannot be recovered through `IdempotentProducer.onError`; the adapter must
  retain payload/epoch/sequence and use the upstream-exported protocol constants directly.
- Both event count and UTF-8 byte size must be bounded; count-only buffering permits unbounded
  memory through large JSON values.
- Transport acknowledgement can be lost after server commit. Retry exhaustion must settle the active
  receipt as `delivery-unknown`, not falsely `rejected` or `delivered`.
- External cancellation during a request has the same ambiguity; queued-but-unattempted receipts are
  `cancelled`, while the active receipt is `delivery-unknown`.
- `close()` must retry the same terminal producer identity and resolve only after an acknowledged
  close response; otherwise consumers cannot rely on `streamClosed`.
- Existing singleton reuse must reject incompatible policies for the same stream path rather than
  silently returning a producer configured by an earlier caller.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                                                                                                                                                                                                     | Rationale                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Lifecycle is the exported discriminated union `connecting → ready ↔ backoff/reconnecting → stopping → stopped`, with terminal `failed` reachable on budget exhaustion or non-retryable protocol failure. Every transition carries attempt/buffer/error metadata.                                                                                                                             | Named finite state makes readiness and legal transitions observable and testable.                                                                     |
| D2  | Default reconnect policy is 8 total attempts per operation, exponential delay `100ms × 2^(attempt-1)`, capped at 5s, with 20% jitter. Options may lower/raise finite values but may not request infinity.                                                                                                                                                                                    | Roughly 11.3s nominal retry window covers startup races while remaining bounded; injected randomness makes jitter deterministic.                      |
| D3  | `StreamProducerClockPort.sleep(ms, {signal})` and `StreamProducerRandomPort.next()` are injected; system adapters are the only timer/random edges.                                                                                                                                                                                                                                           | No wall-clock sleeps in tests; AP-12/AP-25 remain at adapters.                                                                                        |
| D4  | Buffer defaults are 256 events and 1 MiB of UTF-8 serialized payload. Overflow is fixed `reject-newest`; existing FIFO entries are never evicted. An event larger than the byte budget is rejected immediately.                                                                                                                                                                              | Dual bounds prevent hidden memory growth; rejecting newest preserves accepted order and gives immediate caller knowledge without another policy axis. |
| D5  | `upsert`/`delete` return `StreamWriteReceiptV1`. It exposes immutable identity, `accepted`, and `completion: Promise<StreamWriteOutcomeV1>`. Outcomes are `delivered`, `rejected`, `cancelled`, or `delivery-unknown`, each with a typed reason.                                                                                                                                             | A later asynchronous failure cannot be represented by a synchronous boolean; completion makes every accepted write settle explicitly.                 |
| D6  | Validation/serialization failures, overflow, `stopping`, `stopped`, and terminal `failed` reject synchronously through an already-settled receipt. No new write is accepted outside connecting/ready/backoff/reconnecting.                                                                                                                                                                   | Caller learns at the write boundary and the queue never hides terminal loss.                                                                          |
| D7  | The application supervisor processes one FIFO head at a time. The real adapter sends the exact JSON event with `(producerId, epoch, sequence)` headers, retries the same tuple/body on retryable failure, treats upstream duplicate acknowledgement as delivered, advances sequence only on acknowledgement, and uses stale-epoch response data to claim a new epoch starting at sequence 0. | This is the smallest way to retain upstream idempotency while making retry state explicit.                                                            |
| D8  | Retry exhaustion is terminal `failed`: active attempted receipt becomes `delivery-unknown`; queued receipts become `cancelled` with `producer-failed`; subsequent writes reject. Recovery is guaranteed only within the documented finite budget.                                                                                                                                            | A fresh epoch after ambiguous failure could duplicate an unknown commit; terminal honesty is safer than silent or false recovery.                     |
| D9  | `waitUntilReady({signal})` resolves on the next `ready` transition and rejects on caller abort, `failed`, or `stopped`. `isReady` reflects only current state.                                                                                                                                                                                                                               | A one-shot readiness promise cannot model a later outage/recovery cycle.                                                                              |
| D10 | `flush()` waits for the acceptance watermark captured at invocation and rejects if any receipt through that watermark is not delivered. Later writes do not extend the wait.                                                                                                                                                                                                                 | Deterministic backpressure without global drain races.                                                                                                |
| D11 | `stop()` immediately stops local work, aborts sleep/transport, never sends remote terminal close, and is idempotent. `close()` rejects new writes, drains accepted writes, sends one idempotent terminal close under the same bounded policy, and resolves only after acknowledgement.                                                                                                       | Process cancellation and durable EOF are distinct; only successful close may imply `streamClosed`.                                                    |
| D12 | One `stream.publish` span is created when a write is accepted, injects W3C/correlation fields once into the v1 event, remains open across buffering/retries, records lifecycle/retry/recovery events, and ends with the receipt outcome.                                                                                                                                                     | The trace literally survives the outage instead of manufacturing an unrelated recovery session.                                                       |
| D13 | Metrics are typed counters/up-down values for buffered, rejected, explicitly dropped accepted writes, retry attempts, recovery, delivery-unknown, and connection-state transitions; attributes include stream path, producer id, state, reason, and attempt, never payload values.                                                                                                           | Meets observability without leaking entity data or creating high-cardinality message metrics.                                                         |
| D14 | Producer operator reporting is structured telemetry only. Remove all `console.*` from `create-durable-stream.ts`; no English message claims future behavior. Close the exact AP-13 producer row only after F-14 and telemetry tests pass.                                                                                                                                                    | Resolves the issue's false promise and the accepted debt without generalizing to other packages.                                                      |
| D15 | W2-B's SSE/OTEL envelope is consumed unchanged. Correlation/trace headers are captured before buffering and reused verbatim; producer state never reads or synthesizes SSE offsets.                                                                                                                                                                                                          | #1329 is the authority, and offsets are consumer-owned opaque tokens.                                                                                 |
| D16 | The real Aspire proof uses an external Deno producer probe registered to the isolated AppHost's OTLP/HTTP endpoint. The gate stops only the exact `streams` resource, waits for the probe's backoff marker, restarts/waits for that resource, then asserts receipt order and one dashboard trace containing buffered → retry → recovered → delivered evidence under one trace id.            | Proves a real late-start recovery while staying independent of #1398's missing worker mutation hook.                                                  |

## Open-Decision Sweep

| Decision                         | Status        | Notes                                                                                          |
| -------------------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| Public lifecycle/receipt names   | resolved now  | D1, D5, D6.                                                                                    |
| Default retry/buffer budgets     | resolved now  | D2, D4; README documents total nominal window.                                                 |
| Ambiguous transport outcome      | resolved now  | D8; never claim exactly-once certainty without acknowledgement.                                |
| Stop versus terminal close       | resolved now  | D11.                                                                                           |
| Upstream transport seam          | resolved now  | D7; protocol constants are upstream-owned, application policy is package-owned.                |
| Metrics backend                  | resolved now  | D13 via `MeterPort`, with fake meter in unit tests and OTLP in Aspire.                         |
| Batching/throughput optimization | safe to defer | One-at-a-time FIFO is correct; a future batcher must preserve receipts and exact tuple replay. |
| Consumer reconnect               | safe to defer | Outside #1326 and already separated by W2-B.                                                   |
| Connector convergence            | safe to defer | Existing named debt, unrelated raw-route architecture.                                         |
| #1398 deferred gates             | safe to defer | This proof uses a dedicated producer probe, not missing worker publication.                    |

No decision that would force implementation rework remains open.

## Risk Register

| Risk                                                                        | Mitigation                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A retry wrapper repeats a changed payload/sequence and defeats idempotency. | Transport fixture records byte-identical body and tuple on every attempt; real-server duplicate test proves one materialized event.                                                                                                 |
| Stale epoch or sequence-gap handling is guessed.                            | Derive response shapes from upstream server contract; focused adapter tests include 403, duplicate 204, 409, closed 409, 4xx non-retryable, and 5xx/network retryable fixtures.                                                     |
| One compile error is counted as many behavioral REDs.                       | S1 separates four pre-fix runtime tests that type-check and fail distinct assertions from four one-symbol API-absence fixtures; every result records `BEHAVIORAL` or `COMPILE_TIME_API_ABSENCE`, raw exit, and decisive diagnostic. |
| An accepted receipt never settles on stop/failure.                          | Settlement audit tracks every created receipt and uses bounded test clocks; stop/failure tests assert all completions settle.                                                                                                       |
| New public result types create slow/private types.                          | Explicit annotations/JSDoc, full export-map doc lint, raw publish dry-run, detached consumer type fixture.                                                                                                                          |
| Singleton configuration differs by caller.                                  | Store an immutable policy fingerprint per path and reject incompatible reuse with an immediate structured error.                                                                                                                    |
| Long-lived spans leak if callers ignore receipts.                           | Runtime, not caller, owns span end on every delivered/rejected/cancelled/unknown branch; tests assert balanced starts/ends.                                                                                                         |
| Aspire proof interferes with sibling runs.                                  | Pre/post leak-check, isolated exact AppHost, `aspire resource streams stop/start --apphost <exact>`, foreign resources untouched, teardown only proven owned resources.                                                             |
| Expensive gate failure is contention.                                       | Do not start without recorded token grant; run one exact one-pass command only.                                                                                                                                                     |

## Anti-Patterns to Resolve or Avoid

| AP          | Status                     | Plan                                                                                                                                             |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| AP-1        | current risk               | Split the 320-line producer before adding state/retry/telemetry; supervisor, adapter, contracts, and composition each keep one reason to change. |
| AP-3/AP-8   | risk                       | Keep clock, randomness, and transport ports narrow; constructor injection, no DI container.                                                      |
| AP-10       | risk                       | Transport classifies failures; application supervisor owns retry/halt. No swallow-and-continue handlers.                                         |
| AP-11/AP-12 | risk                       | No global clock/random/queue and no application `setTimeout`; system edge adapters only.                                                         |
| AP-13       | exact accepted debt, owned | Replace only producer warnings with structured telemetry; close exact registry row after proof.                                                  |
| AP-19/AP-25 | risk                       | Network permission stays documented; fetch/timer/random effects remain in adapters/E2E edges.                                                    |
| AP-22       | risk                       | No new sub-barrels; root/public export manifests only.                                                                                           |

## Arch-Debt Implications

| Entry                                                                 | Action                    | Notes                                                                                 |
| --------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| `packages/plugin-streams-core — AP-13 console.warn runtime reporting` | close conditionally in S3 | Only if structured reporter/metrics pass and producer source contains no `console.*`. |
| `plugins/streams — connector SOUND convergence deferred`              | cite/preserve             | No connector source or closure claim.                                                 |
| New debt                                                              | none planned              | Any new allowance, cast escape, or unbounded path is `FAIL_DEBT`, not a waiver.       |

## Ordered Commit Slices

| #  | What the slice proves                                                                                                                                                                           | Decisive gate                                                                                                                                                                                                  | Files                                                                                                                                                                                                                                             |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S0 | Research, contract decisions, gates, and exact acceptance mapping are current before product code.                                                                                              | Separate Claude/Fable PLAN-EVAL `PASS`                                                                                                                                                                         | Slice `supervisor.md`, `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`                                                                                                                                                      |
| S1 | Public lifecycle/policy/receipt/shutdown types exist; four existing-API runtime tests are independently RED, while four missing-API behaviors have explicitly weaker compile-time RED evidence. | Four filtered default-typechecked tests fail distinct runtime assertions; four individual `deno check` fixtures fail only on their named absent API; post-contract scoped check exits 0                        | `src/domain/producer-contract-v1.ts`, new clock/random/transport port types, root/public exports, README contract section, `tests/application/durable-stream-producer-reconnect_behavior_test.ts`, slice `red-fixtures/producer-api-absence/*.ts` |
| S2 | The port and concrete class widen atomically; the finite supervisor and upstream adapter make all eight behaviors executable and green without silent settlement gaps.                          | Four runtime REDs turn green; four negative fixtures are replaced by behavioral tests and turn green; full focused suite; real `DurableStreamTestServer` idempotency/ordering test                             | `src/ports/stream-producer-port.ts`, `src/application/durable-stream-producer-supervisor.ts`, adapter/system-edge files, thin `create-durable-stream.ts`, focused tests                                                                           |
| S3 | One correlated write span and metrics cover buffered/retry/recovery/rejection/unknown outcomes; false warnings are gone.                                                                        | Telemetry tests; package-scoped quality/doctrine commands; manual F-14 evidence marked `PENDING_SCRIPT`; exact debt-row update                                                                                 | `src/telemetry/{attributes,instrumentation,mod}.ts`, producer telemetry tests, `.llm/harness/debt/arch-debt.md`                                                                                                                                   |
| S4 | Public/testing/consumer surfaces remain compatible and publishable with explicit new outcomes.                                                                                                  | Full core + direct consumer tests; scoped wrappers; full export `doc:lint`; JSR audit; raw package/root publish dry-runs; package-scoped quality/doctrine; mandatory aggregate gates disclosed as non-covering | root/public exports, `src/testing/memory-stream-producer.ts`, service producer tests, README, downstream focused producer users as required                                                                                                       |
| S5 | A real isolated AppHost proves initial outage, buffered FIFO recovery, and a single OTEL trace across the reconnect boundary without relying on #1398.                                          | Pre/post leak-check; focused new runtime gate with raw exit 0; named trace/metric assertions; owned cleanup artifact                                                                                           | `plugins/streams/src/e2e/probes/producer-reconnect.ts`, CLI E2E gate/fixture/tests/registry, slice runtime evidence                                                                                                                               |
| S6 | All cheaper gates and review-thread gate are green; expensive gate request is recorded, not run.                                                                                                | `agentic:review-threads` exit 0; `EXPENSIVE-GATE-REQUEST` committed/pushed                                                                                                                                     | Run artifacts, PR body/comments                                                                                                                                                                                                                   |
| S7 | Serialized release smoke is green after orchestrator grant.                                                                                                                                     | Exact one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, raw exit 0; decisive gate names and skipped count disclosed                                                                 | Evidence-only run artifacts; no source/lock churn                                                                                                                                                                                                 |

### S1 evidence classification and port compile story

S1 uses the following binding evidence taxonomy. A raw exit code without its classification and
decisive assertion/diagnostic is not evidence.

| Behavior            | Pre-fix class              | Pre-fix mechanism                                                                                                       | S2 disposition                                                      |
| ------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Initial outage      | `BEHAVIORAL`               | Existing void `upsert` plus `flush`/read-back; default test type-check succeeds, then a named recovery assertion fails. | Same test passes against the supervisor.                            |
| Mid-session outage  | `BEHAVIORAL`               | Existing API; transport fails after a delivered write, then a distinct post-outage read-back assertion fails.           | Same test passes after reconnect.                                   |
| Recovery            | `BEHAVIORAL`               | Existing API; server becomes available after producer construction and a named eventual read-back assertion fails.      | Same test passes within the finite budget.                          |
| FIFO ordering       | `BEHAVIORAL`               | Existing API; writes straddle an outage and the exact ordered read-back assertion fails.                                | Same test passes with one FIFO head.                                |
| Count overflow      | `COMPILE_TIME_API_ABSENCE` | Its own fixture references only the planned count-bound option/receipt outcome and fails on that missing API.           | Fixture is replaced by a runtime reject-newest/count test.          |
| Byte overflow       | `COMPILE_TIME_API_ABSENCE` | Its own fixture references only the planned byte-bound option/receipt outcome and fails on that missing API.            | Fixture is replaced by a runtime oversized/aggregate-byte test.     |
| Stop during backoff | `COMPILE_TIME_API_ABSENCE` | Its own fixture references only `stop()` and fails on that missing member.                                              | Fixture is replaced by a deterministic clock/abort settlement test. |
| Readiness           | `COMPILE_TIME_API_ABSENCE` | Its own fixture references only `waitUntilReady`/readiness state and fails on those missing members.                    | Fixture is replaced by transition/abort/terminal-state tests.       |

The four compile-time results are intentionally weaker than behavioral REDs and are never reported
as runtime failures. Each fixture is checked separately and must produce only its expected missing
symbol diagnostic; an unrelated diagnostic invalidates that result.

The four intentionally type-broken fixtures are committed only under
`.llm/runs/release-0.0.5--orchestration/slices/w3-a-1326/red-fixtures/producer-api-absence/`. They
must never live below `packages/` or `plugins/`: only the direct negative commands sweep them, while
package/repo scoped-check wrappers remain green at every pushed S1 state. This location is a locked
evidence decision, not a temporary exclusion; rows 1c and 4 therefore require no `--exclude` escape.

Within S1 the supervisor first writes the standalone v1 domain types, new clock/random/transport
port types, exports, and README contract, without changing the concrete producer or its existing
port. It then runs and records all eight negatives against that unchanged pre-fix runtime/API. S1
does **not** widen `StreamProducerPort`, and the unchanged
`DurableStreamProducer implements StreamProducerPort` therefore continues to satisfy the S1 scoped
check. S2 widens `StreamProducerPort` and the concrete implementation in the same commit, after
which it removes the negative fixtures only as it replaces each with a named behavioral test.

## Validation Plan

| Order | Gate                           | Command or check                                                                                                                                                                                                        | Expected result                                                                                                                                                                                                               |
| ----: | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    1a | Behavioral REDs                | Run each of the four exact names separately with `deno test --no-lock --allow-all --filter '<exact behavioral name>' packages/plugin-streams-core/tests/application/durable-stream-producer-reconnect_behavior_test.ts` | Default type-check succeeds, then that test's distinct runtime assertion fails; raw exit 1 recorded as `BEHAVIORAL`. No TypeScript diagnostic is accepted.                                                                    |
|    1b | API-absence REDs               | Run `deno check --no-lock --unstable-kv .llm/runs/release-0.0.5--orchestration/slices/w3-a-1326/red-fixtures/producer-api-absence/<one-behavior>.ts` separately for count, bytes, stop, and readiness                   | Each command raw exit 1 with only its named missing API diagnostic, recorded as `COMPILE_TIME_API_ABSENCE`; unrelated/shared compile failure invalidates it.                                                                  |
|    1c | S1 port compile safety         | Run the exact scoped-check command from row 4 after committing the run-dir fixtures and adding standalone contract/port types, but before widening the existing producer port                                           | Exit 0 without `--exclude`; proves the run-dir negatives are outside the swept package tree and S1 does not structurally break `DurableStreamProducer implements StreamProducerPort`.                                         |
|     2 | Focused implementation         | Same four behavioral tests plus replacement runtime tests for count, bytes, stop, and readiness; adapter/telemetry tests                                                                                                | Raw exit 0; each decisive behavior named; negative fixtures removed only with behavioral replacements.                                                                                                                        |
|     3 | Package suite                  | `deno test --no-lock --allow-all packages/plugin-streams-core/tests/`                                                                                                                                                   | Exit 0.                                                                                                                                                                                                                       |
|     4 | Scoped check                   | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-streams-core --ext ts,tsx --deno-arg --no-lock --deno-arg --unstable-kv`                                                         | Exit 0, no lock rewrite.                                                                                                                                                                                                      |
|     5 | Scoped lint                    | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-streams-core --ext ts,tsx`                                                                                                        | Exit 0.                                                                                                                                                                                                                       |
|     6 | Scoped format                  | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-streams-core --ext ts,tsx`                                                                                                         | Exit 0.                                                                                                                                                                                                                       |
|     7 | Full export docs               | `rtk proxy deno task doc:lint --root packages/plugin-streams-core --pretty`                                                                                                                                             | Exit 0, combined diagnostics 0.                                                                                                                                                                                               |
|     8 | JSR audit                      | `deno run --no-lock --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin-streams-core --text` plus raw package dry-run                                                   | Exit 0; helper banner warning disclosed; raw dry-run has no real slow-type diagnostic.                                                                                                                                        |
|     9 | Publish surface                | `rtk proxy deno task publish:dry-run`                                                                                                                                                                                   | Exit 0; no unintended files/slow types/lock churn.                                                                                                                                                                            |
|    10 | Scoped framework law           | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/plugin-streams-core/src`; `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/plugin-streams-core`               | Both exit 0 and actually traverse this package; no new allowances/casts/ignores. These are the decisive quality/doctrine verdicts until #1403 lands.                                                                          |
|    11 | Mandatory aggregates           | `rtk proxy deno task quality:gate`; `rtk proxy deno task arch:check`                                                                                                                                                    | Both exit 0, but recorded as non-decisive for this package because their configured roots omit `plugin-streams-core`; no coverage claim.                                                                                      |
|    12 | Manual F-14 (`PENDING_SCRIPT`) | `rg -n 'console[.]' packages/plugin-streams-core/src` followed by manual classification of every match                                                                                                                  | Record raw output/exit and reviewer classification: zero executable producer `console.*`; identify comment-only examples. #1403 owns automation; close the exact AP-13 row only after this evidence and telemetry tests pass. |
|    13 | Focused Aspire/OTEL            | Leak-check → isolated AppHost/new producer gate → exact owned teardown verification → leak-check                                                                                                                        | Raw exit 0; same trace id spans buffered/retry/recovered/delivered, metrics present, FIFO receipts delivered, no owned leak.                                                                                                  |
|    14 | Deferred boundary audit        | Inspect runtime selection/results                                                                                                                                                                                       | `behavior.otel.stream-consumer` and `behavior.otel.traces` remain deferred to #1398; no widening.                                                                                                                             |
|    15 | Review threads                 | `rtk proxy deno task agentic:review-threads -- --repo rickylabs/netscript --pr <n> --pretty`                                                                                                                            | Exit 0, zero unanswered current threads.                                                                                                                                                                                      |
|    16 | Serialized full smoke          | Request token in worklog, push/tell orchestrator, then only after grant run exact one-pass command                                                                                                                      | Raw exit 0; each decisive gate and `skipped=` count reported; no retry without a new grant.                                                                                                                                   |

## Dependencies

- Exact base `aa8e151e6` supplies the W2-B v1 envelope and stable correlation/replay semantics.
- After two `FAIL_PLAN` verdicts reached the normal escalation threshold, the owner ratified one
  third Claude/Fable 5 medium PLAN-EVAL on the F4 fixture-location repair. It must write
  `plan-eval.md = PASS` before S1; another failure escalates and never authorizes implementation.
- #1403 owns repo-wide quality/doctrine root coverage. This slice consumes its finding through
  scoped commands and does not modify those tools.
- Separate Claude/Fable 5 medium IMPL-EVAL and Tier-A review occur after all gates; this session
  neither launches nor substitutes for them.
- The milestone orchestrator owns the serialized gate token, merge, canary, publish, and release.

## Deferred Scope

- Producer batching/performance optimization after correctness; any batching must keep per-receipt
  settlement and exact tuple/body replay.
- Consumer backoff/reconnect implementation beyond the already-shipped envelope.
- Connector convergence debt and generic topic transport debt.
- #1398 worker execution publication and its two deferred OTEL gates.

## Drift Watch

- If the upstream producer protocol cannot acknowledge duplicate tuples or expose stale epoch as
  verified, stop before implementing a custom workaround and raise rescope.
- If real OTEL proof requires wiring the missing worker mutation hook, stop and report the #1398
  boundary rather than widening this PR.
- Any need for infinite retry, unbounded memory, offset parsing, new SSE envelope types, connector
  redesign, or an unchecked acceptance row is significant/architectural drift requiring orchestrator
  direction.
