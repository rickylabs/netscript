## U3 feature PLAN — corrected replacement (attempt 2; attempt 1 retained verbatim at `.llm/tmp/browser-stream-headers-u3-plan/attempt-1/plan-proposal.md`)

Baseline `1582e1c9e`, branch `fix/browser-stream-headers`. PLAN only; nothing implemented, run, or claimed PASS. Forwarding primitive only — not reader authentication, not S16/U1/U2/U4.

MCP qualification (this turn): `search_docs` for `createNetScriptStreamDB headers reconnect preload stop dispose` returned no streams-factory page (hits were shutdown/session/telemetry/response). The indexed corpus does not describe Fresh recovery/headers behavior; the authority is local source: `create-stream-db.ts:110-121` JSDoc, `stream-db-recovery-adapter.ts:86-103,232-241`, upstream `client@0.2.7 dist/index.js:1623,3083` (`resolveHeaders` awaited per `#buildRequest`), `state@0.3.2 dist/db.d.ts:95-107` (`stream`/`preload`/`close` public on the runtime handle).

### 1. Contract and signatures (absence-only legacy selection)

**Fresh `packages/fresh/src/runtime/streams/create-stream-db.ts`**
```ts
import type { HeadersRecord } from '@durable-streams/client';   // already a declared dep (deno.json:48)

// NetScriptStreamDBFactoryInput.streamOptions — WIDENED public port field
/** Headers forwarded untouched to the durable streams client; function values resolve per request. */
headers: HeadersRecord;                       // was Record<string, string>

// NetScriptStreamDBOptions — new optional input
/** Explicit reader headers. Any supplied record (including `{}`) replaces env-resolved producer auth entirely; omit to keep `getStreamsAuth()`. */
headers?: HeadersRecord;

// composition (replaces line 150)
headers: options.headers === undefined ? getStreamsAuth() : options.headers,
```
`defaultCreateStreamDB` already spreads `input.streamOptions` into `new DurableStream(...)` (line 167-170): the caller's record reaches the native client by reference; no copy, no resolution, no env read. `mod.ts` export list unchanged (no new symbol); only the stale "plugin factories call this" lines (`create-stream-db.ts:9-11`, `mod.ts:13-14`) are corrected.

**Workers `plugins/workers/streams/factory.ts`**
```ts
import type { HeadersRecord } from '@durable-streams/client';   // package.json catalog: dep (line 3)
export function createWorkersStreamDB(
  options: { baseUrl?: string; headers?: HeadersRecord } = {},
): WorkersStreamDB
// headers: options.headers === undefined ? getStreamsAuth() : options.headers,
```
`WorkersStreamDB` return type unchanged (collections only). No alias, no shared type, no lifecycle handle, no core/lock/version edit. `null` is a compile error under both signatures (not an undocumented fallback).

**Port migration risk (retained, explicit).** `NetScriptStreamDBFactoryInput.streamOptions.headers` is public (`mod.ts:24`, `docs/site/reference/fresh/index.md:520`). Widening to `HeadersRecord` is a source-level break for any external custom `createStreamDB` adapter that serializes `headers` as plain strings; adapters that forward `streamOptions` to the upstream client/state (the only in-repo consumer, `create-stream-db_test.ts:34`) compile unchanged. Migration statement for docs/JSDoc: forward the record to the upstream client, which owns per-request resolution; the framework does not provide a serializer. Root must accept this widening.

### 2. Exact owners and physical ceilings (added/removed)

| # | Path | Kind | Ceiling |
|---|---|---|---|
| 1 | `packages/fresh/src/runtime/streams/create-stream-db.ts` | product | +18 / −8 |
| 2 | `packages/fresh/src/runtime/streams/mod.ts` | product (stale comment) | +1 / −2 |
| 3 | `plugins/workers/streams/factory.ts` | product | +12 / −2 |
| 4 | `packages/fresh/src/runtime/streams/create-stream-db_test.ts` | test (live/reconnect/failure/env-denied) | +210 |
| 5 | `packages/fresh/tests/streamdb-headers-contract_test.ts` | test (new; paired compiler control) | +110 |
| 6 | `packages/fresh/tests/type-fixtures/streamdb-wrapper_type.ts` | type gate (positive only) | +8 |
| 7 | `plugins/workers/tests/streams/factory-headers_test.ts` | test (new; real requests + compiler control) | +160 |
| 8 | `plugins/workers/tests/streams/live-query-consumer_type.ts` | type gate (positive only) | +4 |
| 9 | `docs/site/durable-workflows/streams.md` | doc | +18 |
| 10 | `.llm/runs/fix-browser-stream-headers--u3/worklog.md` | provenance (modify) | +25 |
| 11 | `.llm/runs/fix-browser-stream-headers--u3/drift.md` | provenance (new: port widening) | +15 |
| 12 | `.llm/runs/fix-browser-stream-headers--u3/plan.md` | provenance (coordinator-saved plan) | — |
| 13 | `.llm/runs/fix-browser-stream-headers--u3/plan-eval.md` | provenance (independent PLAN-EVAL) | — |
| 14 | `.llm/runs/fix-browser-stream-headers--u3/impl-eval.md` | provenance (independent IMPL-EVAL) | — |
| 15 | `.llm/runs/fix-browser-stream-headers--u3/research.md` | provenance (modify if findings change) | +10 |

Tracked total 15 (<30). Prospective owner **not** in the list: `docs/site/reference/fresh/index.md`. No new exported symbol is added, so `docs:exports-drift` should be clean; if it or `docs:accuracy` demands an edit there, that is a **stop/rescope** to root, not a silent addition. Unchanged by design: `stream-db-recovery-adapter.ts`, `tests/_fixtures/stream-db-server.ts`, `streamdb-consumer-deno.json` (keeps `--no-lock`, `workspace: []`, `plugin-streams-core@0.0.4`, client 0.2.7/state 0.3.2), all `deno.json`/`package.json`/locks.

### 3. Commit slices

**C1 `feat(fresh): forward caller headers through createNetScriptStreamDB`** — owners 1, 2, 4, 5, 6.
Tests in owner 4 (extend; existing helpers `startReferenceServer`, `eventually`, `preloadDeadline`, loopback `Deno.serve` stub at 211ff reused):
- **Port/identity (no network):** custom `createStreamDB` captures input; `captured.streamOptions.headers === headers`; sync/async callback counters remain 0 after construction and after a second `createNetScriptStreamDB` call. With `STREAMS_SECRET` set in-test (save/restore à la `factory-discovery_test.ts:23-38`): `headers: {}` → captured `{}`; absent → `{ Authorization: 'Bearer …' }`.
- **Live + rotation + reconnect (reference server 0.3.9, existing kill/restart flow):** headers `{ 'x-static': 'a', 'x-sync': () => syncValue, authorization: async () => current }`; the existing `globalThis.fetch` delegating observer (line 145) additionally records GET request `authorization`/`x-static`/`x-sync`. Assert: catch-up request = v1; set `current = v2`; the next long-poll carries v2 with static/sync intact; kill server, set `current = v3`, restart on the same port; first reconnect request carries v3 **at the retained checkpoint offset** (`!== '-1'`), `db.collections.events` identity preserved, status `live`; `stop()` → `stopped`. Fetch and env restored in `finally`.
- **Callback failure (native/adapter semantics, no ambient fallback):** (a) async callback rejects with plain `Error` → `isRecoverableReadError` false → `preload()` rejects with that error, observer saw zero requests, status `failed`; `stop()` → `stopped` (adapter line 237-240). (b) callback throws `TypeError` with `reconnect: { maxRetries: 1, initialDelayMs: 1, maxDelayMs: 1 }` → classified recoverable: callback invoked exactly twice, zero requests, then `failed`. Neither case fetches with `getStreamsAuth()`; "all errors terminal" is not claimed.
- **Env denied (permission-scoped):** `Deno.test({ permissions: { env: false, net: true, read: true } })` — graph already loaded by the parent — using the in-process loopback up-to-date stub (same shape as line 211-222): explicit `baseUrl` + explicit `headers` → `preload()` resolves; control in the same test: absent `headers` → construction throws the `getStreamsAuth` denied-env error (`stream-url-resolver.ts:131-136`). `buildStreamUrl` with explicit `baseUrl` never touches env (line 143). Server `shutdown()` awaited.
Owner 5 (new, paired compiler control): creates a `Deno.makeTempDir()`; writes one positive file (static/sync/async headers on `createNetScriptStreamDB`, plus a custom `NetScriptStreamDBFactory` reading `input.streamOptions.headers` as `HeadersRecord`) and three negative files (`authorization: 1`; `authorization: () => 1`; `headers: () => ({ authorization: 'x' })`); runs `deno check --no-lock --config <abs packages/fresh/tests/type-fixtures/streamdb-consumer-deno.json> --unstable-kv <file>` per file (import map `@netscript/fresh/streams` resolves relative to the config, not the importer — exactly the authored `check:streams-types` contract, unchanged). Assertions: positive exit 0 and no `TS\d+`; each negative exit ≠ 0, stderr contains `TS2322`, the temp file path, and `MaybePromise<string>`/`HeadersRecord` in the diagnostic, and **no** `TS2307`/`TS2305` (import resolved, selection non-empty). Temp dir removed in `finally`. No `@ts-expect-error`, cast, suppression, or `any`; invalid files never enter default source discovery.
Owner 6: positive-only additions (valid headers compile; wrapper collection type unchanged).
Gates: `stream-db-recovery-adapter_test.ts` and all existing owner-4 tests unchanged and green.

**C2 `feat(workers): forward caller headers through createWorkersStreamDB`** — owners 3, 7, 8.
Owner 7 fixture (real native client, real HTTP, server-side observation, no fetch patch): `Deno.serve({ port: 0, hostname: '127.0.0.1' })` handler records `{ authorization, 'x-static', 'x-sync', live: url.searchParams.get('live') }` per request; non-long-poll requests answer `[]` immediately with `content-type: application/json`, `stream-next-offset: 0`, `stream-up-to-date: true`; `live=long-poll` requests `await delay(25)` (`@std/async`, declared in `plugins/workers/deno.json:32`) before the same empty up-to-date response — bounded, no zero-delay busy loop. Handle checks via public runtime shape (`Reflect.get(db,'preload')`/`'close'` with `typeof === 'function'`, as `factory-discovery_test.ts:17-21`); this is the state DB `close` (`db.d.ts:107`), not `DurableStream.close`. Tests: callbacks not invoked before `preload`; after `preload` first record = v1; rotate → `eventually` a later long-poll record = v2 with static/sync intact (proves actual request/poll rotation; Fresh recovery policy not claimed); `{}` with `STREAMS_SECRET` set → no `authorization` on the wire; absent → `Bearer`. Cleanup order in `finally`: `close.call(db)`, `await server.shutdown()`, env restored. Compiler control: same temp-dir mechanism as owner 5 against `@netscript/plugin-workers/streams` with `deno check --unstable-kv --config <abs root deno.json> <file>` (mirrors `live-query-consumer_test.ts:5-9`, which spawns check on the public fixture). **Preflight**: confirm workspace resolution for a temp file outside the repo under explicit root `--config`; if it does not resolve, the fallback is an owned, test-created and test-removed subdirectory under `plugins/workers/tests/streams/` — same owner 7, no new file owner.
Owner 8: positive-only `createWorkersStreamDB({ headers: { authorization: async () => 't' } })` keeps `WorkerExecution` inference; sagas/triggers/auth lines untouched and must still compile.

**C3 `docs(streams): caller-provided reader headers`** — owners 9, 10, 11, 15. Paragraph after `streams.md:300`: replace-not-merge, absence-only legacy, per-request callbacks owned by the upstream client, the custom-adapter widening/migration note, and "forwarding is not authentication". Keep any fence `ts` and compilable (gated by `docs:snippets`). `drift.md` records the public port widening versus the intake's "compatible port" expectation.

### 4. Negative controls (summary)
Explicit `{}` + env secret → no auth header on the wire (both owners) · explicit headers + env denied → works; absent + env denied → throws · zero callback calls before first request · failing callback → zero requests, no ambient retry, `failed`/`stopped` transitions as in adapter · `TypeError` retry count bounded by `maxRetries` · three compile negatives fail on `TS2322` without `TS2307` · existing recovery/replay/cancellation/identity tests unchanged.

### 5. Commands (actual tasks/wrapper flags; nothing run yet)
Focused leaf gates:
```
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --frozen packages/fresh/src/runtime/streams/create-stream-db_test.ts packages/fresh/src/runtime/streams/stream-db-recovery-adapter_test.ts packages/fresh/tests/streamdb-headers-contract_test.ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --frozen plugins/workers/tests/streams/factory-headers_test.ts plugins/workers/tests/streams/factory-discovery_test.ts plugins/workers/tests/streams/live-query-consumer_test.ts
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/fresh/src/runtime/streams/mod.ts --file plugins/workers/streams/mod.ts --deno-arg --unstable-kv --deno-arg --frozen
deno task --cwd packages/fresh check            # authored; includes check:streams-types with its existing --no-lock contract
deno task --cwd plugins/workers check
deno task doc:lint --root packages/fresh --entrypoints src/runtime/streams/mod.ts
deno task doc:lint --root plugins/workers --entrypoints streams/mod.ts
deno task --cwd packages/fresh publish:dry-run
deno task --cwd plugins/workers publish:dry-run # also proves type-only '@durable-streams/client' resolves via package.json catalog on publish
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --root plugins/workers --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --root plugins/workers --ext ts,tsx
deno task docs:links && deno task docs:exports-drift && deno task docs:accuracy && deno task docs:jsdoc-examples && deno task docs:snippets
```
Final merge-readiness gates (evaluator pass, not per loop): `deno task quality:gate` (doctrine fitness + quality scan), and the repository-required full CLI E2E `deno task e2e:cli` (`scaffold.runtime --cleanup`; OpenHands trigger template in AGENTS.md) — not waived; no scaffold/plugin-registry change is expected, so a failure there is a stop. Note `--frozen` on the child `deno check` inside owners 5/7 is *not* used where the authored fixture contract is `--no-lock`; the parent test run is frozen.

### 6. Consumer/publish risks
- JSR slow types: option fields and widened port reference an npm type with explicit annotations under `isolatedDeclarations`; no new exported alias → no new doc-lint symbol, but the modified fields need JSDoc (budgeted).
- Browser consumer gates: Fresh wrapper fixture (`check:streams-types`), workers public consumer fixture (spawned check), both positive-only; negatives live in temp dirs.
- Reference docs drift: prospective stop/rescope on `docs/site/reference/fresh/index.md` (see §2).
- Workers compile-control workspace resolution (preflight, §3 C2).

### 7. Rollback / removal
Revert C1–C3 (additive; no state, migration, lock or version change). Remove if a server-side reader proxy makes direct browser headers unnecessary or a future client bump (out of scope) changes `HeadersRecord`.

### 8. Unresolved — resolve before implementation (root / PLAN-EVAL)
1. Accept the public port widening `Record<string,string>` → `HeadersRecord` with the stated external serializing-adapter break and footprint (§1, §2).
2. Accept the two new test owners (5, 7) and temp-dir compiler-control shape instead of additional checked-in `_type.ts` negatives.
3. Accept env-denied proof as permission-scoped `Deno.test` on the existing loopback stub (no new fixture owner).
Already decided by root and not reopened: replace-not-merge; absence-only legacy; exclusions (issuer/principal/TTL/workspace/bootstrap/U1/U2/U4/sagas/triggers/auth/versions/releases/locks). No new debt entry; the widening is recorded as drift.