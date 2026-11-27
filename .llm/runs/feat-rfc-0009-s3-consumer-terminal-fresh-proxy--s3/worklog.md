# Worklog: RFC 0009 Slice 3 — Consumer terminal-status propagation, fetch source opt-ins, and Fresh proxyUrl helper (#2679)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-rfc-0009-s3-consumer-terminal-fresh-proxy--s3` |
| Branch | `feat/rfc-0009-s3-consumer-terminal-fresh-proxy` |
| Issue | `#2679` (`Part of #2146`, milestone `0.0.10`, blocked-by `#2678` merged at `6d7f10338`) |
| Archetype | Archetype 3 (`@netscript/plugin-streams-core`) + Archetype 2 (`@netscript/sdk`) + Archetype 4 (`@netscript/fresh`) |
| Scope overlays | `none` |

## Owner Direction (verbatim)

> "Then all merged RFC Ready for start implementation should be launched in separate main lanes with Neon and Fable 5.2 as reviewer (sub lane of it) + hydrogen on subsequent pass (where needed)"
>
> "Make sure relevant issues are assigned to milestone 0.0.10"
>
> "Merge all what is ready to merge as it lands"

### PLAN-EVAL Disposition

- `PLAN-EVAL: N/A` — governed directly by accepted RFC 0009 (`rfcs/0009-authorizing-stream-proxy.md`, merged at `af5107b8d` after `PLAN-EVAL: APPROVED` at `ab1ef854f6966168c66e93629c813d677d10e4f7`).

### Design Checkpoint

- **Contract & boundary ownership:**
  - `@netscript/plugin-streams-core/sse`: additive optional `StreamEventSourceV1.readyState?: number`; `bindStreamEventSourceV1` emits `retryable: options.source.readyState !== 2` (native `EventSource.CLOSED` / `2` stops reconnect spin; omitted doubles stay `retryable: true`).
  - `@netscript/sdk/streams/consumer`: additive `FetchStreamHttpErrorInfoV1`, opt-in `terminalStatuses`, synchronous observer `onHttpError`, and irreversible `readyState: 0 | 1 | 2` on `FetchStreamEventSourceV1` while keeping `StreamFetchResponseV1` unchanged and preserving retry-all default when `terminalStatuses` is omitted.
  - `@netscript/fresh/streams` + `plugins/streams` emitted consumer stub: mutually exclusive `proxyUrl` vs `streamPath`/`baseUrl` union enforcing single offset authority (one captured `offset` value reused for URL and replay snapshot), canonical `isValidStreamOffset` validation, no `/v1/stream/netscript` prepend, no forced `live=sse`, and `readonly proxyUrl?: never` on generated direct-subscriber wrappers so variable arguments carrying `proxyUrl` fail at compile time.
- **Shutdown & framing invariants:**
  - Response-body cancellation on denial (`!response.ok`), `204`, and invalid `200` responses races against the connection abort signal (`cancelBodyUntilAborted`), and `close()` / `signal` abort immediately disposes the heartbeat deadline so blocked/teed bodies never stall `done` or leave timers armed.
  - `SseParser.feed` checks `shouldStop()` (`() => options.signal.aborted`) before/after every line dispatch so re-entrant `close()` inside a listener stops trailing-byte framing immediately without rejecting `done`, while genuine listener throws still reject `done`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-11-27 | S3 | bootstrap | Branched `feat/rfc-0009-s3-consumer-terminal-fresh-proxy` from `origin/main` (`6d7f10338`), verified zero open-PR overlap, linked `#2679`, confirmed `status:impl`. |
| 2026-11-27 | S3 | implement | Implemented `StreamEventSourceV1.readyState?: number` and `retryable: options.source.readyState !== 2` in `bindStreamEventSourceV1`; added `FetchStreamHttpErrorInfoV1`, opt-in `terminalStatuses`, observer-only `onHttpError`, and `readyState: 0 | 1 | 2` full transition table on `createFetchStreamEventSourceV1` (keeping `StreamFetchResponseV1` unchanged and legacy retry-all default preserved); added mutually exclusive `proxyUrl` single-offset-authority support with canonical `isValidStreamOffset` validation on `createNetScriptStreamEventSourceV1`; added unit, control-only commit/interrupted reconnect, bearer terminal-status, type-fixture, and real headless-browser `EventSource` `readyState === 2` tests (`packages/fresh/tests/stream-eventsource-terminal_browser.ts`). |
| 2026-11-27 | S3 | verify | Local gates passed: sanitized unit/Gate 5 suites (`plugin-streams-core/tests` + `sdk/tests` + `fresh/src/runtime/streams/create-stream-event-source_test.ts`, plus `fresh/src/runtime/streams` 17/17); real headless-Chromium browser gate (`packages/fresh/tests/stream-eventsource-terminal_browser.ts`, 1/1 passed: `401`, `403`, and mid-stream revocation `EventSource.readyState === 2` + zero reconnect spin); `deno task check` across `plugin-streams-core`, `sdk`, `fresh` (incl. `check:streams-types`), and `mcp`; `run-deno-check` / `run-deno-lint` / `run-deno-fmt` across all 478 files (0 errors/findings); `deno doc --lint` passed with 0 errors on all 3 touched public modules (`packages/plugin-streams-core/src/sse/mod.ts`, `packages/sdk/src/client/stream-source/mod.ts`, `packages/fresh/src/runtime/streams/create-stream-event-source.ts`; pre-existing merge-base `private-type-ref` errors remain unchanged on untouched `packages/fresh/src/runtime/streams/mod.ts` and `packages/sdk/src/streams.ts`); `docs:exports-drift`, `docs:accuracy`, `check:agent-docs-prose`, `check:mcp-export-corpus`, `check:publish-assets`, `check:netscript-jsr-specifiers`, `docs:jsdoc-examples`, `docs:readme-fences`; `quality:gate` + `arch:check` (doctrine FAIL=0); `deno publish --dry-run --allow-dirty` on all 3 packages; zero `deno.lock` churn. |
| 2026-11-27 | S3 | ci-fix | CI `quality` caught `check:emitted-samples` TS2345 in `plugins/streams/src/adapter/resources/consumer/consumer.stub.ts` (`Omit<CreateNetScriptStreamEventSourceOptionsV1, 'streamPath'>` retained `proxyUrl?: string | undefined` across the mutually exclusive union). Updated consumer stub to `Omit<CreateNetScriptStreamEventSourceOptionsV1, 'streamPath' | 'proxyUrl'>` (preserving `baseUrl` while forbidding `proxyUrl` on hardcoded-`streamPath` wrappers) and added a matching compile-time fixture in `packages/fresh/tests/type-fixtures/streamdb-wrapper_type.ts`. Verified `deno task check:emitted-samples`, `plugins/streams` resources test + static/publish dry-run, and `packages/fresh` `check:streams-types`. |
| 2026-11-27 | S3 | eval-fix | Addressed all 4 Round-1 Sol 6.2 xhigh IMPL-EVAL (`IC_kwDOSxcnO88AAAABrYNGLw`) findings + worklog Design checkpoint/doc-lint qualification: (1) made denial-body/`204`/invalid-`200` cancellation abortable (`cancelBodyUntilAborted`) and synchronously disarmed the heartbeat deadline on close/abort/terminal status (`fetch-stream-source.ts`, `connection.ts`); (2) stopped `SseParser.feed` immediately when `shouldStop()` (`signal.aborted`) flips on re-entrant listener `close()` while preserving genuine listener throws (`sse-parser.ts`, `connection.ts`); (3) captured `offset`/`lastObservedCursor`/`onEvent`/`createEventSource` once in `createNetScriptStreamEventSourceV1` so factory mutations/getters cannot split URL and replay state (`create-stream-event-source.ts`); (4) added `& { readonly proxyUrl?: never }` to the emitted direct subscriber stub (`consumer.stub.ts`) so variable arguments carrying `proxyUrl` fail at compile time; added dedicated regression tests for all 4 probes. |
