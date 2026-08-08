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
| 2026-08-09 | S2    | producer identity    | Per-write explicit correlation/message identity wins; empty/absent values fall back to the entity key. Correlation and W3C headers are emitted on every change. |
| 2026-08-09 | S2    | service conformance  | Real DurableStreamTestServer output through the NetScript proxy validates only through the exported authority: named arrays, ordered upsert/delete, control commit. |
| 2026-08-09 | S3    | Fresh/generated      | Fresh helper builds the native `offset` + `live=sse` URL and binds v1 outcomes; generated Fresh 2.x island consumes it inside one effect and seed route retains `createDefine`. |
| 2026-08-09 | S3    | official example     | Native EventSource docs example uses the exported named-event binding, no `onmessage`/cast, handles ordered batches/deletion/errors, and is extracted/type-checked unchanged. |
| 2026-08-09 | S4    | named runtime consumer | Flow-B's Deno-side consumer now reads named SSE through the exported parser/binding, commits the opaque control offset, reconnects from it, observes the derived heartbeat, and rejects malformed control without advancing replay. |
| 2026-08-09 | S4    | unchanged docs proof | The gate extracts the official native example verbatim and executes it against both a focused SSE server and, during `scaffold.runtime`, the real generated streams service; the focused proof covers ordered batching and deletion. |
| 2026-08-09 | S4    | trace verdict strengthened | `stream.subscribe` must be exported by service `flow-b-stream-consumer` in the Deno gate and carry a W3C link whose trace id is the actual producer Flow-B trace id. |
| 2026-08-09 | S4    | pre-runtime leak check | Exit 0. Only `redis-jfgcbtaf`, proven foreign to `/home/codex/repos/w6-review-desk`, was reported and left untouched. No W2-B AppHost/container was started. |
| 2026-08-09 | S5    | merge-readiness gates | Final targeted suite, 114-file scoped wrappers, full core export doc lint, workspace publish dry-run, quality/doctrine, docs, JSR audits, and review threads completed. |
| 2026-08-09 | S6    | EXPENSIVE-GATE-REQUEST | Every cheaper gate is complete. Requesting the serialized `scaffold.runtime` token from the milestone orchestrator; the command has not been started. |
| 2026-08-09 | S6    | serialized runtime | Grant received and exact one-pass command run once. Aggregate exit 1: 74 passed, 1 failed (`behavior.otel.traces` TC-14 link trace id did not equal producer Flow-B trace id). No retry. |
| 2026-08-09 | S6    | runtime cleanup | `cleanup.aspire-stop` passed; post-run leak artefact reports no W2-B-owned survivor. Known foreign `redis-jfgcbtaf` remains untouched. |
| 2026-08-09 | S6    | honesty verdict | Seven of eight issue acceptance rows are proven. End-to-end correlated Aspire trace is not; remain `status:impl`, do not add `Closes #1329`, and do not launch IMPL-EVAL. |
| 2026-08-09 | S6    | post-failure threads | `agentic:review-threads` exit 0: 0 threads, 0 unanswered. |
| 2026-08-09 | S6-D1 | diagnostic instrumentation | Before any repair, TC-14 now distinguishes absent consumer span, zero links, and wrong links; mismatch output includes selected producer trace id, consumer trace/span ids, every link trace/span id, and link count. |
| 2026-08-09 | S6-D1 | focused diagnostic gates | Two message-shape tests plus 33-file scoped check/lint/fmt and `quality:gate` pass. No product behavior or trace selector was repaired. |
| 2026-08-09 | S6-D2 | live trace diagnosis | Retained generated service reproduced TC-14 with producer `36877bd0933da790de3f5f17d7c885dd`, consumer `0a17c1c06c30cada853b5849bea776ba`/`06d3f0d130f712a6`, and three links. All links resolve to unrelated `job` snapshot publications (`flow-b-callback`, `health-check`, `workers-plugin-health-check`), not the Flow-B execution. |
| 2026-08-09 | S6-D2 | classification | Gate defect: the Deno diagnostic consumes the first SSE batch wholesale, links those job snapshots, then separately labels the consumer span with the real Flow-B `job.execute` correlation. The observed mismatch does not demonstrate a product context drop. No repair implemented before reporting this verdict. |
| 2026-08-09 | S6-D2 | diagnostic cleanup | Foreground isolated AppHost stopped. Scoped teardown removed owned persistent `postgres-b73d5698`; final leak artefact reports no W2-B survivor. Foreign `redis-jfgcbtaf` was left untouched. |

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
| S2 producer/server tests  | `deno test --no-lock --allow-all packages/plugin-streams-core/tests plugins/streams/services/src/sse-contract_conformance_test.ts` | PASS (exit 0) | 17 passed, 0 failed. |
| S2 scoped check           | `run-deno-check.ts --root packages/plugin-streams-core --root plugins/streams --ext ts,tsx --deno-arg --no-lock` | PASS (exit 0) | 76 selected; zero occurrences. |
| S2 scoped lint/format     | corresponding repo wrappers over both roots                                                   | PASS (exit 0)                  | zero lint and format findings. |
| Framework-wave law       | `deno task quality:gate`                                                                       | PASS (exit 0)                  | quality scan has zero findings; repository has 7 existing explicit allowances. |
| Doctrine fitness         | `deno task arch:check`                                                                          | PASS (exit 0)                  | Existing WARN/INFO inventory only; streams exact debts remain unchanged. |
| S3 Fresh/generator/docs tests | focused Fresh helper, generator/type fixture, and copy-exact docs test                      | PASS (exit 0)                  | 10 passed, 0 failed. |
| S3 scoped check/lint/fmt | wrappers over Fresh streams, generator resources, and docs test                                | PASS (exit 0)                  | 19 files; zero findings. |
| Docs links               | `deno task docs:links`                                                                           | PASS (exit 0)                  | 0 broken links, anchors, or orphans. |
| Docs accuracy            | `deno task docs:accuracy`                                                                        | PASS (exit 0)                  | Repository accuracy/discoverability checks pass. |
| Fresh publish dry-run    | `deno publish --dry-run --allow-dirty` from `packages/fresh`                                   | PASS (exit 0)                  | Published helper surface checks and packages successfully. |
| Fresh streams doc baseline | `deno doc --lint packages/fresh/src/runtime/streams/mod.ts` in branch and untouched eval tree | BASELINE FAIL (exit 1)         | Exactly 11 both before/after; new SSE helper/core files add zero diagnostics. |
| S4 unchanged-example test | `deno test --no-lock --unstable-kv --allow-all packages/cli/e2e/src/application/gates/scaffold/run-documented-stream-example_test.ts` | PASS (exit 0) | 1 passed; verbatim docs source consumes a named batch and materializes deletion. |
| S4 scoped check | `run-deno-check.ts --root packages/cli/e2e/src/application/gates/scaffold --ext ts,tsx --deno-arg --no-lock` | PASS (exit 0) | 32 files selected; zero diagnostics. |
| S4 scoped lint/format | corresponding repo wrappers over the scaffold gate root | PASS (exit 0) | 32 files; zero lint/format findings. |
| Final focused suite | `deno test --no-lock --unstable-kv --allow-all` over contract/server/Fresh/generator/docs/runtime files | PASS (exit 0) | 28 passed, 0 failed. Initial aggregate invocation exited 1 because it named a nonexistent `packages/fresh/tests/streams`; corrected to the exact two Fresh test files. |
| Final scoped check | wrappers over core, Fresh streams, streams plugin, and scaffold gates | PASS (exit 0) | 114 selected files; zero diagnostics. |
| Final scoped lint/format | corresponding repo wrappers over all owned TypeScript roots | PASS (exit 0) | 114 selected files; zero findings. |
| Final core export doc lint | `deno task doc:lint --root packages/plugin-streams-core --pretty` | PASS (exit 0) | Four entrypoints; combined total/private/missing/other all zero. |
| JSR audits | `audit-jsr-package.ts` over core and Fresh | PASS with inherited warnings (exit 0) | Dry runs OK. Wrapper counts Deno's informational slow-type heading; Fresh also retains pre-existing AI directory cardinality warning. |
| Workspace publish dry-run | `deno task publish:dry-run` | PASS (exit 0) | `Success Dry run complete`; only repository-known dynamic-import warnings; no lock/source churn. |
| Final framework-wave law | `deno task quality:gate` | PASS (exit 0) | Zero quality findings; seven existing explicit allowances; doctrine subgate passed with carried WARN/INFO inventory. |
| Final doctrine fitness | `deno task arch:check` | PASS (exit 0) | Existing WARN/INFO inventory only; the two exact streams debts remain unchanged. |
| Final docs links/accuracy | `deno task docs:links`; `deno task docs:accuracy` | PASS (both exit 0) | Zero broken links/anchors/orphans; accuracy/discoverability passed. |
| Review threads | `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1395 --pretty` | PASS (exit 0) | 0 threads, 0 unanswered. |
| TC-14 diagnostic tests | `deno test --no-lock --unstable-kv --allow-all packages/cli/e2e/src/application/gates/scaffold/validate-flow-b-traces_test.ts` | PASS (exit 0) | 2 passed: explicit zero-link and complete wrong-link identities. |
| Diagnostic scoped wrappers | wrappers over `packages/cli/e2e/src/application/gates/scaffold` | PASS (all exit 0) | 33 files; zero check/lint/format findings. |
| Diagnostic framework law | `deno task quality:gate` | PASS (exit 0) | Zero quality findings; carried doctrine inventory only. |

### Fitness Gates

| Gate                 | Result        | Evidence                         | Notes                                     |
| -------------------- | ------------- | -------------------------------- | ----------------------------------------- |
| F-5/F-6/F-7 final | PASS | full export doc lint + JSR/native publish dry-runs | Combined doc diagnostics zero; native publish bars green; no waiver. |
| F-14 AP-13           | DEBT_ACCEPTED | exact arch-debt row              | Preserve, do not deepen or claim closure. |
| Other required fitness gates | PASS | final scoped/quality/doctrine/docs gates | No new debt or escape hatch. |

### Runtime Gates

| Gate                           | Result  | Evidence                        | Notes                                       |
| ------------------------------ | ------- | ------------------------------- | ------------------------------------------- |
| Focused unchanged docs example | PASS | focused Deno native EventSource test | Exact extracted source; named batch and deletion materialization. |
| Real generated service/browser | PASS | `behavior.otel.stream-consumer` (943 ms) | Generated service and verbatim native example executed. Deletion is focused/real-test-server proof, not observed in generated Flow-B. |
| Correlated OTEL trace          | FAIL | `behavior.otel.traces` (58,790 ms) + S6-D2 live diagnosis | TC-14 attached the first SSE batch's three unrelated job-snapshot links to the consumer span; the gate did not select the Flow-B execution record, so end-to-end propagation remains unproven rather than disproven. |
| `scaffold.runtime`             | FAIL (exit 1) | aggregate 74 passed, 1 failed | One pass only; no retry. Cleanup passed. Full evidence in `runtime-gate.md`. |

### Consumer Gates

| Consumer                                  | Result        | Evidence                | Notes                                                       |
| ----------------------------------------- | ------------- | ----------------------- | ----------------------------------------------------------- |
| Current generated StreamDB/Fresh consumer | PASS baseline | generator + Fresh tests | Does not yet prove named/schema-validated SSE contract.     |
| Official native EventSource example       | PASS | copy-exact type check + runtime test | Named schema-validated arrays, deletion, correct URL mode; no `onmessage` or untyped cast. |

## Handoff Notes

- Serialized token is released with a failing verdict. The orchestrator owns rescheduling or
  rescope; implementation must not advance to IMPL-EVAL until TC-14 trace equality is repaired and
  a newly granted serialized run passes.
- S6-D2 classifies the failure as gate-side record selection. A repair must select the actual
  `flow-b-callback` execution record and inspect its stored W3C context before constructing the
  consumer span; it must not compare the Flow-B producer against unrelated startup job snapshots.
