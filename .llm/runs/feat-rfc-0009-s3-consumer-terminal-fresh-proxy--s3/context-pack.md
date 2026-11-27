# Context Pack: RFC 0009 Slice 3 (#2679)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-rfc-0009-s3-consumer-terminal-fresh-proxy--s3` |
| Branch | `feat/rfc-0009-s3-consumer-terminal-fresh-proxy` |
| Current phase | `impl-eval` |
| Archetype | Archetype 3 (`@netscript/plugin-streams-core`) + Archetype 2 (`@netscript/sdk`) + Archetype 4 (`@netscript/fresh`) |
| Scope overlays | `none` |

## Current State

Implemented and locally verified RFC 0009 Slice 3 (`#2679`) on `feat/rfc-0009-s3-consumer-terminal-fresh-proxy` branched from `origin/main` (`6d7f10338`, containing merged Slice 1 `#2683` and Slice 2 `#2692`). Ready to open PR and dispatch Round-1 IMPL-EVAL once GitHub CI passes.

## Completed

- Slice 1 (`#2677`, PR `#2683`) merged at `36a464c23`.
- Slice 2 (`#2678`, PR `#2692`) merged at `6d7f10338`.
- `@netscript/plugin-streams-core/sse`: optional `StreamEventSourceV1.readyState?: number` and `bindStreamEventSourceV1` emitting `retryable: options.source.readyState !== 2`.
- `@netscript/sdk/streams/consumer`: `FetchStreamHttpErrorInfoV1`, opt-in `terminalStatuses`, observer-only `onHttpError`, and `readyState: 0 | 1 | 2` full transition table on `createFetchStreamEventSourceV1` (keeping `StreamFetchResponseV1` unchanged and legacy retry-all default preserved when `terminalStatuses` is omitted).
- `@netscript/fresh/streams`: mutually exclusive `proxyUrl` on `createNetScriptStreamEventSourceV1` with single offset authority (`options.offset`), canonical `isValidStreamOffset` validation, no `/v1/stream/netscript` prepend, and no forced `live=sse`.
- Unit tests, control-only commit & interrupted-delivery reconnect test, bearer terminal-status/`readyState` tests, Fresh type-fixture tests, and real headless-Chromium `EventSource` `readyState === 2` browser test (`packages/fresh/tests/stream-eventsource-terminal_browser.ts`, wired into `packages/fresh` `test:browser`).
- Updated reference docs and regenerated MCP/agent-docs/publish corpora (`agent-docs-prose.generated.ts`, `export-surface-corpus.generated.ts`, `publish-assets.generated.ts`).
- Full local verification passed (including real Chromium browser test, `quality:gate`, `arch:check`, `deno publish --dry-run` on all 3 packages, and zero `deno.lock` churn).

## In Progress

- Opening PR (`Closes #2679`, `Part of #2146`), running full GitHub CI (including `check-test-shard (browser)`), and awaiting Round-1 IMPL-EVAL.
