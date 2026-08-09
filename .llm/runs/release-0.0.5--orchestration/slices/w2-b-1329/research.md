# Research — W2-B #1329 versioned stream SSE envelope

## Re-baseline

- Carried-in sources: release plan/preflight under `.llm/runs/release-0.0.5--orchestration/`, issue
  #1329, and the inlined shared supervisor contract in the dispatch prompt.
- Re-derived against `origin/main@c383b2e84c254d90bab8c4f9ffcbf43a7beb8652` on 2026-08-08.
- The branch and worktree match the dispatch identity and were clean at activation.
- The historical W2-B supervisor note was still marked prepared/held for a future train. The
  dispatch prompt and the parent context's terminal C14 green-pair receipt supersede that hold.
- The requested `_shared-brief-contract.md` file is absent at this base. Its complete contents were
  supplied inline by the user, so the run uses that exact inline contract and records the missing
  repository artifact in `drift.md`.

## Findings

| #  | Finding                                                                                                                                                                                                                                                 | How to verify                                                                                               |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1  | The official example uses `EventSource.onmessage` and parses one `{ key, value? }` object.                                                                                                                                                              | `docs/site/durable-workflows/streams.md`, “Consume over HTTP/SSE”.                                          |
| 2  | The upstream 0.3.7 server emits named `data` events followed by named `control` events. JSON stream data is an array, even when one stored message is emitted.                                                                                          | `@durable-streams/server@0.3.7` `handleSSE`; `@durable-streams/client@0.2.6/src/sse.ts`; root catalog pins. |
| 3  | The wire event-name set is exactly `data` and `control`. Transport failures arrive through the browser `error` lifecycle event; keepalive is a control payload with `upToDate: true`, not a third upstream event name.                                  | Upstream client/server source and issue #1329 reproduction.                                                 |
| 4  | Upstream control payloads carry `streamNextOffset`, optional `streamCursor`, `upToDate`, and `streamClosed`. The control frame follows its data batch and is the replay commit boundary.                                                                | Upstream `SSEControlEvent` and response processing comments.                                                |
| 5  | `plugin-streams-core` exports only loose `ChangeEvent`, `ControlEvent`, and `StateEvent` types. It exports no named event vocabulary, version, validator, malformed-frame result, replay state, or browser consumer helper.                             | `deno doc packages/plugin-streams-core/mod.ts`; `src/domain/stream-event.ts`.                               |
| 6  | Producer changes already include operation plus injected `traceparent`/`tracestate` in each change's `headers`, but `correlationId` is never supplied to instrumentation, so the TC-7 correlation floor is absent on normal writes.                     | `create-durable-stream.ts#publishHeaders`; `telemetry/instrumentation.ts`; telemetry convention TC-7/TC-9.  |
| 7  | `@netscript/fresh/streams` wraps upstream StreamDB but does not expose the SSE contract/parser; the generated Fresh island imports the upstream StreamDB directly and therefore cannot conformance-test NetScript frame handling.                       | `packages/fresh/src/runtime/streams/`; `plugins/streams/.../consumer.stub.ts`.                              |
| 8  | The generated seed route uses Fresh 2.x `createDefine` and the interactive view is a small island. The change must preserve those patterns while replacing direct upstream factory use with the NetScript helper/contract.                              | `consumer.stub.ts`; `deno-fresh` skill.                                                                     |
| 9  | Package tests, generated-consumer tests, and the Fresh StreamDB unit test are baseline green (9 + 7 + 1 tests).                                                                                                                                         | Commands recorded in `worklog.md` baseline gates.                                                           |
| 10 | Full export-map doc lint is baseline red: five distinct `private-type-ref` diagnostics in telemetry types; the JSR audit reports one slow-type warning. This hidden scope must be repaired because this PR changes the export map and forbids a waiver. | `deno task doc:lint --root packages/plugin-streams-core --pretty`; `audit-jsr-package.ts --text`.           |
| 11 | The package has accepted AP-13 `console.warn` debt specifically in `create-durable-stream.ts`. W3-A owns replacement; W2-B must cite it and not deepen it.                                                                                              | `.llm/harness/debt/arch-debt.md`, “packages/plugin-streams-core — AP-13 console.warn runtime reporting”.    |
| 12 | Streams connector convergence is separate accepted debt: its transparent raw proxy cannot yet converge further without the base-service raw-route seam. This PR may conformance-test the proxy but must not absorb that architecture program.           | `.llm/harness/debt/arch-debt.md`, `streams-connector-sound-deferred`.                                       |

## Upstream protocol observation

The contract must not pretend that `error` and `heartbeat` are upstream SSE event names. One
versioned authority will instead expose both layers:

- **wire events:** `data`, `control`;
- **validated consumer outcomes:** `data`, `control`, `heartbeat`, `error`.

`heartbeat` is the semantic classification of a valid up-to-date control frame that advances no
data; `error` normalizes an EventSource lifecycle failure or a malformed named frame. This keeps the
exported API exhaustive without falsifying the upstream wire and gives W3-A stable reconnect inputs
(`lastCommittedOffset`, retryability, malformed-frame policy).

## jsr-audit surface scan

- Surface scanned: all package exports (`.`, `./telemetry`, `./testing`) via `deno doc`, structured
  doc lint, and the package JSR audit.
- Current symbols are documented, but telemetry's public annotations reference five private upstream
  types and the package reports one slow-type warning.
- Planned additions use explicit exported types, explicit exported return annotations, module and
  symbol JSDoc, and package-owned Standard-Schema-compatible validators. Validator implementation
  details stay private; public types never infer from a private validator.
- The new consumer entry point is a declared subpath and is included in full export-map doc lint,
  publish dry-run, and detached import checks.

## Open questions closed by the plan

- Wire version placement: the schema authority is versioned as `v1`; upstream-compatible payloads
  are not mutated to add a field the server does not emit.
- Data correlation fallback: explicit per-write correlation wins; otherwise the entity key is the
  stable correlation identity. It is preserved in change headers with W3C trace context.
- Replay commit: only a valid control/heartbeat outcome commits `streamNextOffset`; data received
  before its control remains uncommitted and can be replayed after reconnect.
- Malformed frame: never advances the offset; returns a normalized non-retryable protocol error to
  the callback while the transport error path remains retryable.
