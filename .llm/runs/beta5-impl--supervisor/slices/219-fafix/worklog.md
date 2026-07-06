# 219-fafix Worklog

## Design

### Public Surface

- `NetScriptChatStreamPath` exported from `@netscript/fresh/ai`.
- `NetScriptChatConnectionOptions.streamPath` for FA1 live connection URL resolution.
- `NetScriptChatResponseOptions.streamPath` for durable assistant-turn response URL resolution.
- `NetScriptChatSnapshotOptions.streamPath` for SSR seed snapshot URL resolution.
- `NetScriptChatStreamProxyOptions.streamPath` for FA2 route proxy URL resolution.
- `createNetScriptChatStreamProxy` sends `Accept-Encoding: identity` on the upstream streams hop.
- `resolveChatHeaders` now forces `accept-encoding: identity` for FA1 durable-stream reads as well
  as writes, overriding caller-supplied gzip/br preferences before the transport sees them.
- `NetScriptVitePlugin` remains package-owned but exposes hook slots with broad structural function
  types instead of `unknown`, preserving assignability to Vite `Plugin` / `PluginOption` without
  re-exporting Vite's private hook types.

### Domain Vocabulary

- Static stream path prefix: string path appended with encoded `sessionId`.
- Dynamic stream path: function returning the full per-session durable stream subpath.
- Mislabeled gzip: upstream sends plain JSON bytes with `content-encoding: gzip`.

### Ports

- Existing FA1 test seams: `createConnection`, `toResponse`, `materialize`.
- Existing FA2 test seam: injectable `fetch`.

### Constants

- Default durable chat stream prefix remains `NETSCRIPT_CHAT_STREAM_SUBPATH = "/ai/chat"`.
- Header negotiation uses literal `accept-encoding: identity` because it is the Web Platform request header that prevents Deno's decoder from failing before FA2 can sanitize the response.

### Commit Slices

1. Stream-path and identity-encoding fix: update FA1/FA2 public options, tests, README, and slice artifacts. Gate: targeted ai tests, scoped check/lint/fmt, package tests, doc lint, publish dry-run, root check/test.
2. Adversarial caveat fix: extend identity encoding to FA1 direct seed/live reads and restore Vite
   plugin assignability. Gate: targeted ai/vite tests, scoped Fresh wrappers, package tests, doc
   lint, publish dry-run, root check/test.

### Deferred Scope

- No changes to `plugin-streams-core` or durable-streams runtime source in this slice.
- No edits to eis-chat; proof is a local `@netscript/fresh/ai` test mirroring its route shape.
- No `deno task e2e:cli` per instruction.

### Contributor Path

- Add future chat-session addressing variants by passing `streamPath`.
- Use string form for simple prefixes; use function form when the session id is embedded in a non-trailing position, such as `/eischat/sessions/{id}/messages`.
- Keep FA2 upstream transport fixes in `stream-proxy.ts` and prove them with injected or local-server fetch tests.

## Evidence

| Gate | Command | Result | Notes |
| --- | --- | --- | --- |
| Targeted ai tests | `rtk proxy deno test --allow-all packages/fresh/src/runtime/ai/create-chat-connection_test.ts packages/fresh/src/runtime/ai/stream-proxy_test.ts` | PASS | 12 passed, 0 failed. |
| Scoped Fresh fmt | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx --pretty` | PASS | 159 files selected, 0 findings. |
| Scoped Fresh lint | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx --pretty` | PASS | 159 files selected, 0 findings. |
| Scoped Fresh check | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx --pretty` | PASS | 159 files selected, 0 diagnostics. |
| Fresh package tests | `rtk proxy deno task --cwd packages/fresh test` | PASS | 189 passed, 0 failed. |
| Fresh full export-map doc lint | `rtk proxy deno task --cwd packages/fresh doc-lint` | PASS | Exit 0 after doc-lint cleanup for `EmptySegment` and `NetScriptVitePlugin`; upstream npm optional type warnings remain informational. |
| Fresh publish dry-run | `rtk proxy deno publish --dry-run --allow-dirty` from `packages/fresh` | PASS | `@netscript/fresh@0.0.1-beta.4` dry-run completed. |
| Root check | `rtk proxy deno task check` | PASS | 2,106 files selected, 18 batches, 0 diagnostics. |
| Root test | `rtk proxy deno task test` | PASS | 1,500 passed, 482 steps, 0 failed, 12 ignored. |
| Root publish dry-run | `rtk proxy deno task publish:dry-run` | PASS | Exit 0; existing workspace warnings for dynamic imports/slow types printed by dry-run wrapper. |
| Adversarial focused tests | `rtk proxy deno test --allow-all packages/fresh/src/runtime/ai/create-chat-connection_test.ts packages/fresh/src/runtime/ai/stream-proxy_test.ts packages/fresh/src/application/vite/vite.test.ts` | PASS | 21 passed, 0 failed. Covers FA1 SSR seed gzip-mislabel, FA1 live read gzip-mislabel, FA2 proxy, and Vite `Plugin` / `PluginOption` / `defineConfig` assignability. |
| Focused FA1 check | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/src/runtime/ai --ext ts,tsx --pretty` | PASS | 8 files selected, 0 diagnostics. |
| Focused Vite check | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/src/application/vite --ext ts,tsx --pretty` | PASS | 2 files selected, 0 diagnostics. |
| Adversarial scoped Fresh fmt | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx --pretty` | PASS | 159 files selected, 0 findings. |
| Adversarial scoped Fresh lint | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx --pretty` | PASS | 159 files selected, 0 findings. |
| Adversarial scoped Fresh check | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx --pretty` | PASS | 159 files selected, 0 diagnostics. |
| Adversarial Fresh package tests | `rtk proxy deno task --cwd packages/fresh test` | PASS | 191 passed, 0 failed. |
| Adversarial Fresh full export-map doc lint | `rtk proxy deno task --cwd packages/fresh doc-lint` | PASS | Exit 0; upstream npm optional type-resolution warnings remain informational. |
| Adversarial Fresh publish dry-run | `rtk proxy deno publish --dry-run --allow-dirty` from `packages/fresh` | PASS | `@netscript/fresh@0.0.1-beta.4` dry-run completed. |
| Adversarial root check | `rtk proxy deno task check` | PASS | 2,106 files selected, 18 batches, 0 diagnostics. |
| Adversarial root test | `rtk proxy deno task test` | PASS | 1,502 passed, 482 steps, 0 failed, 12 ignored. |
| Adversarial root publish dry-run | `rtk proxy deno task publish:dry-run` | PASS | Exit 0; existing workspace warnings for dynamic imports/slow types printed by dry-run wrapper. |

## Reconcile

- 2026-07-06: `.llm/runs/beta5-impl--supervisor/` was absent in this checkout at start. Per user instruction, slice artifacts were created only under `.llm/runs/beta5-impl--supervisor/slices/219-fafix/`.
- 2026-07-06: Full-slice reconcile after gates: no `deno.lock` churn; no `deno task e2e:cli` run per instruction.
- 2026-07-06: Adversarial caveat reconcile after gates: no `deno.lock` churn; no
  `deno task e2e:cli` run per instruction.
