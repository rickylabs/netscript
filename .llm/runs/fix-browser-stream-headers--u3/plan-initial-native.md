## U3 feature PLAN — caller-provided reader headers (PLAN only, no implementation)

Baseline `1582e1c9e`, branch `fix/browser-stream-headers`. Verified against actual source (not the research summary alone): both factories hard-code `getStreamsAuth()` (`packages/fresh/src/runtime/streams/create-stream-db.ts:150`, `plugins/workers/streams/factory.ts:64`); workers calls upstream `createStreamDB` directly, not Fresh. Locked `@durable-streams/client@0.2.7` exports `HeadersRecord = { [key: string]: string | (() => MaybePromise<string>) }` and `resolveHeaders` is awaited inside every `#buildRequest`/long-poll/SSE request (`dist/index.js:1807,1841,1857,3083`). Fresh's recovery adapter calls `native.stream()` per reconnect (`stream-db-recovery-adapter.ts:116`), so rotation on reconnect is native — nothing to implement.

MCP `find_guidance` qualification: the indexed streams doc describes producer-side `getStreamsAuth()` only and `create-chat-connection.ts:76` **merges** `{...getStreamsAuth(), ...target.headers}`. This slice deliberately diverges (replace, never merge) because merging forces an eager env read in browser/denied-env contexts; the closer precedent is `stream-proxy.ts:169` (`options.auth ?? getStreamsAuth`) — undefined selects legacy.

### 1. Decision and type signatures

**Fresh** (`create-stream-db.ts`):
```ts
import type { HeadersRecord } from '@durable-streams/client';
/** Per-header values forwarded untouched to the durable streams client; callbacks run per request. */
export type NetScriptStreamDBHeaders = HeadersRecord;          // precedent: NetScriptStreamStateDefinition alias
// NetScriptStreamDBFactoryInput.streamOptions
headers: NetScriptStreamDBHeaders;                              // WIDENED from Record<string, string>
// NetScriptStreamDBOptions
/** Explicit reader headers; any value (including `{}`) replaces env-resolved producer auth. Omit for legacy `getStreamsAuth()`. */
headers?: NetScriptStreamDBHeaders;
// composition
headers: options.headers ?? getStreamsAuth(),
```
`mod.ts` adds `type NetScriptStreamDBHeaders` to the export list. `defaultCreateStreamDB` already spreads `input.streamOptions` into `new DurableStream(...)`, so the caller's record reaches the client by reference, no copy, no resolution.

**Workers** (`streams/factory.ts`):
```ts
import type { HeadersRecord } from '@durable-streams/client';   // already a package.json catalog: dep
export function createWorkersStreamDB(
  options: { baseUrl?: string; headers?: HeadersRecord } = {},
): WorkersStreamDB
// headers: options.headers ?? getStreamsAuth(),
```
No new alias in workers (thin composition; return type unchanged). No core type, no dependency/lock/version edit.

**Port compatibility (item 3).** `NetScriptStreamDBFactoryInput.streamOptions.headers` is public and string-only today. Widening to `HeadersRecord` is the smallest sound contract: keeping `Record<string,string>` would force eager callback resolution, violating the no-eager rule. Impact: custom `createStreamDB` adapters that *forward* `streamOptions` to the upstream client/state (the only in-repo consumer, `create-stream-db_test.ts:34`, plus `streamdb-wrapper_type.ts` which does not touch the port) compile unchanged; adapters that *serialize* headers themselves break at compile time and must await function values (upstream semantics). This is a stated 0.0.x source-level widening for serializing adapters, not a universal non-breaking claim; JSDoc on the field names it. No cast/any/suppression; `isolatedDeclarations` satisfied by explicit alias and annotations.

Semantics (both owners): `undefined` → legacy `getStreamsAuth()`; `{}` or any record → replaces, no merge, no env read, no callback invocation at construction.

### 2. Exact path list and line budgets (physical added/removed)

| Path | Kind | Budget |
|---|---|---|
| `packages/fresh/src/runtime/streams/create-stream-db.ts` | product | +22 / −6 (alias, option, port widen, forwarding, fix stale "plugin factories call this" header lines 9-11) |
| `packages/fresh/src/runtime/streams/mod.ts` | product | +1 / −2 (export; fix stale line 13-14 claim) |
| `plugins/workers/streams/factory.ts` | product | +12 / −2 |
| `packages/fresh/src/runtime/streams/create-stream-db_test.ts` | test | +115 |
| `plugins/workers/tests/streams/factory-headers_test.ts` | test (new) | +95 |
| `packages/fresh/tests/type-fixtures/streamdb-wrapper_type.ts` | type gate | +9 |
| `plugins/workers/tests/streams/live-query-consumer_type.ts` | type gate | +4 |
| `docs/site/durable-workflows/streams.md` | doc | +16 (new "Caller-provided reader headers" paragraph after line 300) |
| `.llm/runs/fix-browser-stream-headers--u3/{worklog,drift}.md` | provenance | +≈40 |

Tracked files touched: 9 (ceiling <30 respected). No new fixture file, no production test hook, no shared helper. `stream-db-recovery-adapter.ts`, `stream-db-server.ts`, configs, locks: untouched.

### 3. Ordered logical commits

**C1 `feat(fresh): accept caller stream headers in createNetScriptStreamDB`** — product + Fresh tests + wrapper type fixture.
Proof:
- T1 (port, no network): custom `createStreamDB` captures input; `captured.streamOptions.headers === headers` (identity); sync/async callback counters are 0 after construction; with `STREAMS_SECRET` set in-test (save/restore like `factory-discovery_test.ts:23`), `headers: {}` → captured `{}`, absent → `{ Authorization: 'Bearer …' }`.
- T2 (actual client, extend existing `startReferenceServer` pattern): headers `{ 'x-static': 'a', 'x-sync': () => sync, authorization: async () => current }`; reuse the existing `globalThis.fetch` observer (delegates to real fetch, records GET `Request.headers`) — this is the permitted bounded observer, not a transport. Assert: first catch-up request carries v1; rotate `current = v2`; next long-poll carries v2 and static/sync values persist; kill + restart server (existing kill/restart flow) with `current = v3`; reconnect request carries v3 at the retained checkpoint offset (not `-1`), collection identity preserved, status `live`; `stop()` → `stopped`.
- T3 (callback failure): async callback rejects with plain `Error` → `preload()` rejects with that error, observer saw zero requests (no stale/ambient fallback), status `failed`; `stop()`/`dispose()` idempotent → `stopped`. Note: a `TypeError` thrown by a callback is classified recoverable by the existing adapter — that is native/adapter semantics, not changed here; test uses `Error`.
- T4 (env denied): `Deno.test({ permissions: { env: false, net: true, read: true } })` with explicit `baseUrl` (the `Deno.serve` up-to-date stub already used at line 211) + explicit `headers` → preload succeeds; control: same but headers absent → throws the `getStreamsAuth` denied-env error. **Preflight**: confirm the permission-scoped worker loads the npm graph; fallback is a `Deno.Command --deny-env=STREAMS_SECRET,DURABLE_STREAMS_SECRET` subprocess reusing `stream-db-server.ts` style (would add one ≈25-line fixture — only if preflight fails).
- Type fixture: `createNetScriptStreamDB({ …, headers: { authorization: async () => 't' } })` compiles; a custom factory port typed `NetScriptStreamDBFactory` reading `input.streamOptions.headers` as `NetScriptStreamDBHeaders` compiles.
Gates: existing `create-stream-db_test.ts` + `stream-db-recovery-adapter_test.ts` unchanged and green.

**C2 `feat(workers): accept caller stream headers in createWorkersStreamDB`** — product + new test + live-query type fixture.
Proof (`factory-headers_test.ts`, real client, real HTTP, server-side observation — no fetch patch): `Deno.serve` stub records `request.headers.get('authorization'|'x-static'|'x-sync')` per request and answers `[]` with `stream-next-offset`/`stream-up-to-date: true`. Factory with the three header kinds; counters 0 before preload; obtain `preload`/`close` via `Reflect.get` + `typeof === 'function'` checks (same style as `factory-discovery_test.ts:17`, no cast, no handle widening); after `preload()` first record = v1; rotate; wait (`eventually`-style loop ≤2 s) until a later record = v2; `{}` with `STREAMS_SECRET` set → no authorization header on the wire; absent → `Bearer`; cleanup: `close()` then `server.shutdown()` in `finally`, env restored. Type fixture: `createWorkersStreamDB({ headers: { authorization: async () => 't' } })` keeps `WorkerExecution` inference.
Gates: `factory-discovery_test.ts`, `live-query-consumer_test.ts` green.

**C3 `docs(streams): document caller-provided reader headers`** — `streams.md` paragraph (replace semantics, per-request callbacks, "this is not authentication/issuance") + run worklog/drift (port widening recorded as explicit drift from "universal compat").

### 4. Negative controls
- Explicit `{}` + env secret set → wire has no `Authorization` (both owners).
- Explicit headers + env denied → works; absent + env denied → throws (Fresh T4).
- Callback never invoked before first request (counters), and never invoked by construction of a second `db` either.
- Failing callback → zero requests, `failed`, no ambient retry (Fresh T3).
- Existing recovery/replay/cancellation tests unchanged (regression gate).
- Type negative (compile-only, in wrapper fixture as `// @ts-expect-error`): `headers: { x: 1 }` rejected — preserves the upstream value contract.

### 5. Commands (existing tasks/wrappers)
```
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/fresh/src/runtime/streams/create-stream-db_test.ts packages/fresh/src/runtime/streams/stream-db-recovery-adapter_test.ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all plugins/workers/tests/streams/factory-headers_test.ts plugins/workers/tests/streams/factory-discovery_test.ts plugins/workers/tests/streams/live-query-consumer_test.ts
deno task --cwd packages/fresh check            # includes check:streams-types (wrapper type fixture)
deno task --cwd plugins/workers check
deno task --cwd packages/fresh doc-lint
deno task doc:lint                              # PREFLIGHT: wrapper args for plugins/workers/streams/mod.ts
deno task --cwd packages/fresh publish:dry-run
deno task --cwd plugins/workers publish:dry-run # PREFLIGHT: type-only '@durable-streams/client' resolves via package.json catalog
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --root plugins/workers --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --root plugins/workers --ext ts,tsx
deno task docs:links
```
Wrap in `rtk proxy` only if `rtk` is on PATH (research: absent). `e2e:cli` not required: no scaffold/plugin-registry/Aspire output changes.

### 6. Consumer / publish gates and JSR risk
- Browser type consumers: `streamdb-wrapper_type.ts` (own config pinning `plugin-streams-core@0.0.4` — unaffected, core unchanged) and `live-query-consumer_type.ts` (all four plugin factories; sagas/triggers/auth untouched and must still compile).
- Slow types: alias to an imported npm type + explicit annotations → no `no-slow-types` violation under `isolatedDeclarations`. Risk: `deno doc --lint` requires JSDoc on the new exported alias/fields (budgeted). Workers' public signature now references an npm type on JSR; acceptable (Fresh already does for `StreamDB`).
- `docs:exports-drift`/`docs:accuracy` may flag the new Fresh export in `docs/site/reference/fresh/index.md` (line 520 table) — run and add one table row if required (+1 line, within ceiling).

### 7. Rollback / removal
Revert C1–C3 (additive, no state, no migration). Remove if EIS adopts a server-side reader proxy that makes direct browser headers unnecessary, or if upstream drops `HeadersRecord` on a future client bump (version work excluded here).

### 8. Unresolved decisions
Resolve before implementation (PLAN-EVAL):
1. Accept the public port widening `Record<string,string>` → `HeadersRecord` with the stated serializing-adapter break (alternative — a second optional field — would leave the string field lying about what the client receives; not recommended).
2. Fresh alias `NetScriptStreamDBHeaders` vs exposing `HeadersRecord` raw (recommend alias, matches existing owned-alias precedent; workers stays raw).
3. Replace-not-merge semantics as the owned contract, diverging from `create-chat-connection.ts:76`.

Safely deferred: `Deno.test permissions` vs subprocess for T4 (preflight); workers stub long-poll busy loop (bounded by `close()` in `finally`, mirrors existing Fresh stub tests); sagas/triggers/auth parity (explicitly excluded); README mention.

No new debt entry warranted: no doctrine gate is violated; the port widening is recorded as drift in the run, not debt.

This plan exposes a primitive only; it does not authenticate browsers, issue credentials, or resolve S16/U1/U2/U4. No implementation, tests, or commands were run; no PASS is claimed.