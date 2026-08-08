# Worklog: W2-B #1329 versioned stream SSE envelope

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w2-b-1329` |
| Branch         | `fix/streams-versioned-sse-envelope`            |
| Archetype      | `3 — Runtime/Behavior`                          |
| Scope overlays | `frontend`, `service`, `docs`                   |

## Design

### Public Surface

- `@netscript/plugin-streams-core/sse` — versioned wire and consumer contract entry point.
- `STREAM_SSE_CONTRACT_V1` — single runtime schema/name/version authority.
- `parseStreamSseEventV1` — validate a named browser frame without throwing on malformed data.
- `createStreamSseReplayStateV1` / `reduceStreamSseReplayStateV1` — commit offsets only on valid
  control/heartbeat outcomes.
- `bindStreamEventSourceV1` — named-event browser binding returning a disposable handle and replay
  snapshot, with no reconnect policy.
- `StreamWriteContextV1` — optional per-write correlation/message identity consumed by producer
  input methods; emitted data always has a correlation fallback and W3C headers.
- `@netscript/fresh/streams` re-exports the binding/types needed by a Fresh island.

### Domain Vocabulary

- `StreamSseWireEventNameV1` — `data | control`, the actual upstream names.
- `StreamSseConsumerEventNameV1` — `data | control | heartbeat | error`, validated outcomes.
- `StreamSseChangeV1<T>` — one State Protocol change with operation, identity, and trace headers.
- `StreamSseDataPayloadV1<T>` — non-empty readonly change batch.
- `StreamSseControlPayloadV1` — offset/cursor/up-to-date/closed commit frame.
- `StreamSseHeartbeatPayloadV1` — up-to-date no-data control classification.
- `StreamSseErrorPayloadV1` — normalized malformed/transport failure with retryability and last
  committed offset.
- `StreamSseParseResultV1<T>` — success/error result, never an untyped cast.
- `StreamSseReplayStateV1` — last committed opaque offset, optional last-observed cursor, explicit
  terminal state, plus pending batch state.

### Ports

- Native `EventSource`-shaped input is the browser edge/test seam; no custom transport abstraction.
- Existing `StreamsInstrumentation` remains the telemetry port; explicit public annotations repair
  private upstream type leakage.
- Existing `StreamProducerPort` gains optional write context; no second producer interface.

### Constants

- `STREAM_SSE_PROTOCOL_VERSION_V1` — literal protocol authority version.
- `STREAM_SSE_WIRE_EVENT_NAMES_V1` — `data`, `control`.
- `STREAM_SSE_CONSUMER_EVENT_NAMES_V1` — wire names plus `heartbeat`, `error`.
- `STREAM_OPERATIONS` — existing finite insert/update/delete/upsert vocabulary, used by validation.

### State, Lifecycle, Delivery, and Diagnostics

- State: disconnected browser handle plus `StreamSseReplayStateV1`; no hidden globals.
- Lifecycle: bind → receive named frames → validate → stage data → commit control/heartbeat →
  dispose. EventSource transport error emits an error outcome; W3-A owns reconnect/backoff.
- Identity: explicit correlation id, else entity key; message id defaults to key. Both survive
  replay.
- Delivery: at-least-once across disconnect-before-control. Consumers materialize idempotently by
  entity `type + key`; delete has no value and removes that identity.
- Ordering: data arrays preserve wire order; a control commits every preceding pending data frame.
  Offsets are opaque ordered tokens owned by the server. Consumers store/replace them verbatim and
  never parse them, perform arithmetic on them, or manufacture successor offsets.
- Cancellation: returned dispose closes EventSource and removes listeners.
- Diagnostics: malformed frames become typed errors, include event name and last committed offset,
  and never advance replay state.

### Commit Slices

See `plan.md` S0–S6. Implementation may not begin until S0 receives separate PLAN-EVAL `PASS`.

### Deferred Scope

- Reconnect/backoff/buffering/readiness/shutdown — W3-A #1326 consumes this contract.
- AP-13 structured reporter replacement — accepted exact debt, assigned to W3-A.
- Connector convergence — accepted separate raw-route seam debt.

### Contributor Path

Add or revise an SSE field in the single `sse-contract-v1` domain module, update its package-owned
validator and drift-negative fixtures, then copy the binding pattern in the small Fresh island. No
service, generator, or docs file owns a second event-name/payload table.

## Progress Log

| Time       | Slice | Step                | Notes                                                                                                                                                   |
| ---------- | ----- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-08 | S0    | activation/research | Required skills and harness/doctrine references read; issue and current worktree re-verified.                                                           |
| 2026-08-08 | S0    | baseline gates      | Package 9/9, generator 7/7, Fresh 1/1 tests pass. Full export doc lint baseline fails with five private-type refs; JSR audit has one slow-type warning. |
| 2026-08-08 | S0    | design checkpoint   | Public surface, domain vocabulary, replay lifecycle, identity, delivery, slices, debts, and gates locked.                                               |
| 2026-08-09 | S0    | PLAN-EVAL            | PASS authorized by separate Claude/Fable 5 medium session. F1 cursor/terminal replay insurance and opaque offsets folded into S1.                       |
| 2026-08-09 | S4    | trace-host decision  | The OTEL consumer span is emitted by a Deno-side SSE consumer hosted in the isolated AppHost; the browser island separately proves the unchanged example. |
| 2026-08-09 | S1    | contract implemented | Exported v1 schemas/parser/reducer/binding include opaque offset, cursor, terminal, malformed-frame, deletion, correlation, and W3C semantics.              |
| 2026-08-09 | S1    | doc surface repaired | Full export-map diagnostics reduced from five private type refs to zero using explicit package-owned streams telemetry ports; no waiver added.             |

## Decisions

| Decision                                    | Reason                                                                                                 | Source                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Separate wire events from consumer outcomes | Upstream sends only named data/control; error and heartbeat are lifecycle/semantic outcomes.           | upstream source + issue #1329          |
| Offset commits only on control              | Upstream control follows one or more data frames and carries next offset.                              | upstream client response logic         |
| Correlation falls back to entity key        | Stable, available for delete, durable across replay, satisfies TC-7 without a global.                  | telemetry convention + producer schema |
| Preserve exact debts                        | AP-13 and connector convergence have accepted owners/closing gates; general cleanup would widen scope. | arch-debt registry                     |
| Preserve cursor and terminal observations   | Add optional `lastObservedCursor` and explicit `streamClosed`; offset remains today's only resume input. | PLAN-EVAL F1                           |
| Host consumer OTEL in AppHost                | Browser EventSource does not export OTLP; a Deno-side consumer provides the genuine final trace span.    | PLAN-EVAL F2                           |

## Drift

| Drift                                                                                            | Severity    | Logged in drift.md |
| ------------------------------------------------------------------------------------------------ | ----------- | ------------------ |
| Shared brief file absent but exact contract inlined by dispatcher                                | significant | yes                |
| Historical prepared/held supervisor metadata superseded by explicit dispatch/current C14 receipt | minor       | yes                |
| Full export doc lint baseline red despite package publish dry-run success                        | significant | yes                |

## Gate Results

### Static Gates

| Gate                     | Command or check                                                                              | Result                         | Notes                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| Package baseline tests   | `deno test --no-lock --allow-all packages/plugin-streams-core/tests`                          | PASS (exit 0)                  | 9 passed, 0 failed.                                            |
| Generator baseline tests | `deno test --no-lock --allow-all plugins/streams/src/adapter/resources/resources.test.ts`     | PASS (exit 0)                  | 7 passed, 0 failed.                                            |
| Fresh baseline test      | `deno test --no-lock --allow-all packages/fresh/src/runtime/streams/create-stream-db_test.ts` | PASS (exit 0)                  | 1 passed, 0 failed.                                            |
| Full export doc lint     | `deno task doc:lint --root packages/plugin-streams-core --pretty`                             | FAIL (exit 1 in command chain) | 5 distinct private-type refs; hidden scope owned by this plan. |
| JSR audit                | `audit-jsr-package.ts --root packages/plugin-streams-core --text`                             | WARN                           | dry-run OK; one slow-type warning.                             |
| S1 focused tests         | `deno test --no-lock --allow-all packages/plugin-streams-core/tests/application/stream-sse-v1_test.ts` | PASS (exit 0)          | 6 passed, 0 failed.                                           |
| Package S1 tests         | `deno test --no-lock --allow-all packages/plugin-streams-core/tests`                          | PASS (exit 0)                  | 15 passed, 0 failed.                                          |
| S1 scoped check          | `run-deno-check.ts --root packages/plugin-streams-core --ext ts,tsx --deno-arg --no-lock`    | PASS (exit 0)                  | 26 selected; zero occurrences.                               |
| S1 scoped lint           | `run-deno-lint.ts --root packages/plugin-streams-core --ext ts,tsx`                          | PASS (exit 0)                  | zero findings.                                                |
| S1 scoped format         | `run-deno-fmt.ts --root packages/plugin-streams-core --ext ts,tsx`                           | PASS (exit 0)                  | zero findings after targeted format.                          |
| Full export doc lint S1  | `deno task doc:lint --root packages/plugin-streams-core --pretty`                            | PASS (exit 0)                  | zero diagnostics across four export entrypoints.              |
| Native publish dry-run S1 | `deno publish --dry-run --no-check --allow-dirty` from package                              | PASS (exit 0)                  | No slow-type diagnostic; generic audit script counts Deno's informational heading as a warning. |

### Fitness Gates

| Gate                 | Result        | Evidence                         | Notes                                     |
| -------------------- | ------------- | -------------------------------- | ----------------------------------------- |
| F-5/F-6/F-7 baseline | FAIL          | full export doc lint + JSR audit | Must be zero before handoff; no waiver.   |
| F-14 AP-13           | DEBT_ACCEPTED | exact arch-debt row              | Preserve, do not deepen or claim closure. |
| Other F-1..F-19      | NOT_RUN       | implementation not started       | Run per plan after slices.                |

### Runtime Gates

| Gate                           | Result  | Evidence                        | Notes                                       |
| ------------------------------ | ------- | ------------------------------- | ------------------------------------------- |
| Real generated service/browser | NOT_RUN | waiting for implementation      | Isolated Aspire and owned cleanup required. |
| Correlated OTEL trace          | NOT_RUN | waiting for implementation      | Producer → durable stream → SSE consumer.   |
| `scaffold.runtime`             | NOT_RUN | serialized; token not requested | Request only after all cheaper gates pass.  |

### Consumer Gates

| Consumer                                  | Result        | Evidence                | Notes                                                       |
| ----------------------------------------- | ------------- | ----------------------- | ----------------------------------------------------------- |
| Current generated StreamDB/Fresh consumer | PASS baseline | generator + Fresh tests | Does not yet prove named/schema-validated SSE contract.     |
| Official native EventSource example       | FAIL baseline | source inspection       | Uses `onmessage`, wrong URL mode/cardinality, untyped cast. |

## Handoff Notes

- PLAN-EVAL should inspect D2, D5–D8, and whether the raw-wire/consumer-outcome distinction gives
  W3-A enough stable reconnect semantics without pulling reconnect implementation into W2-B.
