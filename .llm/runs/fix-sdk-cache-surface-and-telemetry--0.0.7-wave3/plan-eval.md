# PLAN-EVAL — PR #1665 `fix/sdk-cache-surface-and-telemetry`

## Identity (recorded before any mutation)

| Field | Value |
| --- | --- |
| Evaluator OS PID | `803215` (`claude bg-spare --bg-spare …/ffa9f78a.claim.sock`) |
| `~/.claude/sessions/803215.json` | `sessionId=0287ccbe-2740-45ee-b378-33d1c1c59429`, `kind=bg`, `name="NetScript 0.0.7 #1665 PLAN-EVAL"`, `jobId=0287ccbe`, `bridgeSessionId=session_01GaNTjv6oY6MaxnKHH1ZfrB`, `version=2.1.233` |
| Remote Control | `https://claude.ai/code/session_01GaNTjv6oY6MaxnKHH1ZfrB` |
| Job id | `0287ccbe` |
| `respawnFlags` (authoritative route) | `--permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1665 PLAN-EVAL" --effort medium --model claude-fable-5` |
| Requested route | native Claude · `claude-fable-5` · effort `medium` · Remote Control on (`formal_plan_evaluation`, Codex-authored plan) |
| Observed route | native Claude · `claude-fable-5` · `medium` · `--remote-control` present |
| Route verdict | **matched** |
| cwd | `/home/codex/repos/netscript-007-leaf-sdk-cache` |
| `git rev-parse HEAD` | `ee1b44c6d401a9edb9c8690870ea2d9151f8f504` (equals immutable source head) |
| Generator | Codex thread `01a00516-2033-7ed3-936a-a616cee47447` — separate session; this evaluator is not the Tier-A orchestrator |

## Step 1 — phase invariant

```text
$ git diff --name-only baf1cdf67a4e931af17b4772ddf6101f36152184..HEAD
.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/codex-thread-ids.md
.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/context-pack.md
.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/drift.md
.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/plan.md
.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/research.md
.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/scope-boundary.md
.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/supervisor.md
.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/worklog.md
```

Only `.llm/runs/` paths. `git status --short` clean. **Invariant holds.** PR #1665 is `OPEN`,
`isDraft=true`, `headRefOid=ee1b44c6d…`, labels `type:fix ci:skip-e2e status:plan priority:p1
area:sdk ci:skip-scaffold` (exactly one `status:`).

## Step 2 — Tier-A findings re-derived

### T-1 — overflow span event at every `normalizeCacheNamespace` call site — **CONFIRMED repaired**

Independent census (`grep -rn normalizeCacheNamespace packages/ --include=*.ts` excluding tests):
definition `cache-telemetry.ts:78`; barrel `cache/mod.ts:28`; calls at `cache-query.ts:85,305,329,361,389`,
`cache-provider.ts:125,141,159,169,176`, `query/composite-query.ts:42`. That is 11 calls + 1
definition — matches the plan's census.

- `cache-query.ts:85-91`: namespace computed pre-span, then `withSpan(…, createCacheSpanAttributes(…), async (span) => …)`. A span exists inside the callback; the plan's request-local decision + first-statement prologue can flush there. Same shape at `:305`, `:329`, `:361`, `:389`.
- `cache-provider.ts:84-118` `traceUnsupported` wraps every unowned-provider call in its own `withSpan`; `:159/:169/:176` currently pass the normalized string inline as the argument. Changing the parameter to the decision object and flushing first inside that callback works for both the precomputed (`:125,:141`) and inline shapes. The owned-provider boundary (`cache-provider.ts:62-81`) delegates straight to `CacheQuery`, so there is no double admission.
- `composite-query.ts:42` is factory/module time; there is genuinely no span. The plan explicitly does **not** admit there — it syntax-normalizes only and defers admission to the later `getCacheProvider().query(...)` / `invalidateQueries(...)` (`composite-query.ts:55-70`), both of which land at a spanned boundary. This is coherent and strands no warning.
- Descriptor-validation ordering: today `createCacheSpanAttributes` (`cache-telemetry.ts:114-129`) calls `validateDescriptor` during argument evaluation, i.e. before `withSpan` runs. The plan removes it from there and introduces **one** span-prologue helper that (a) flushes the pending overflow signal, then (b) validates the descriptor. Two concerns, one first statement, deterministic order — the "both first" ambiguity is resolved. `createCacheSpanAttributes`/`recordCache*` are referenced only from the three declared files (`grep -l` over `packages plugins`), so the removal has no external caller.

Verdict: the deferral seam works at every call site; ordering is coherent.

### T-2 — control flow after `recordIncompleteTopology` stops throwing — **CONFIRMED hole exists; plan closes it**

- `recordIncompleteTopology` (`cache-telemetry.ts:164-181`) is `never`/throws.
- `recordCacheWrite` (`:308-336`): the `catch` calls the recorder without `return`; if it returned normally, execution would fall into the `for (const write of report.writes)` loops over the invalid report and then `span.setAttributes(...descriptor)`. Plan: "write records error/incomplete evidence and returns before iterating" — correct repair.
- `recordCacheInvalidation` (`:339-401`): entries are banked into the shared `invalidationsByTier` **inside** the per-entry loop *before* a later entry can throw; the recorder is invoked in `catch` without `return`/`continue`; after the loop the aggregate is emitted and `span.setAttributes({... topologyComplete: true})` unconditionally. So a report failing at entry 3 would (once non-throwing) leak entries 1–2 and overwrite the incomplete signal with `true`. Plan D2 stages each report in a fresh map, merges only after full validation including cross-report tier consistency, keeps final `topologyComplete=false` if any report was rejected, and mandates a **third-entry** failure test with a valid sibling report. That test obligation genuinely proves rollback (a first-entry failure would not).
- `recordCacheLookup` (`:242-305`): its return value is unused by `queryInsideSpan` (`cache-query.ts:154-196`), which branches on `cached.value`, so "records error and returns `ERROR` without indexing" is feasible and the amended test (loader runs, payload returns, span error/incomplete) is achievable. `createCacheAttributes` uses `setOptional` (`packages/telemetry/src/attributes/cache.ts:123,130`), so the subsequent valid `recordCacheWrite` in the same span does not overwrite outcome/topologyComplete.

### T-3 — diagnostic-level doc-lint baseline — **CONFIRMED**

Executed from `packages/sdk` at head `ee1b44c6d`:

```text
$ deno doc --lint ./mod.ts ./src/auto-update/mod.ts ./src/desktop/mod.ts ./src/cache/mod.ts ./src/client/mod.ts ./src/collections/mod.ts ./src/discovery/mod.ts ./src/ports/mod.ts ./src/query/mod.ts ./src/query-client/mod.ts ./src/streams.ts ./src/telemetry/mod.ts
exit=1
error[private-type-ref]: public type 'QueryClientPort' references private type 'QueryClient'            --> packages/sdk/src/ports/query-client.ts:41:1
error[private-type-ref]: public type 'createNetScriptQueryClient' references private type 'QueryClient' --> packages/sdk/src/query-client/query-client-factory.ts:44:1
error[private-type-ref]: public type 'DurableStreamProducerOptions["instrumentation"]' references private type 'StreamsInstrumentation' --> packages/plugin-streams-core/src/application/create-durable-stream.ts:41:3
error: Found 3 documentation lint errors.

$ deno doc --lint ./src/cache/mod.ts
exit=1
error[private-type-ref]: public type 'KvCacheStore' references private type 'CacheStore'               --> packages/sdk/src/cache/kv-cache-store.ts:48:1
error[private-type-ref]: public type 'KvCacheStore.prototype.get' references private type 'CacheKey'   --> packages/sdk/src/cache/kv-cache-store.ts:97:3
error[private-type-ref]: public type 'KvCacheStore.prototype.get' references private type 'CacheStoreEntry' --> packages/sdk/src/cache/kv-cache-store.ts:97:3
error: Found 3 documentation lint errors.
```

The six diagnostics match `plan.md` steps 9a/9b by rule, symbol, and location, with no extras.
`plan.md` step 9a/9b "Expected result" says "Exit 1 … never report as PASS"; `worklog.md` gate table
says `FAIL (pre-existing, expected exit 1)`; `drift.md` says "must never be reported as PASS". No
artifact describes either invocation as a pass, and no count is used as the verdict — the plan
requires strict named comparison. Step 9 can produce a diagnostic-level no-regression baseline.

### T-4 — Query Bridge fifth path — **CONFIRMED**

- Debt entry: commit `ee1b44c6d` deleted the `FOLLOWUP-DOC-QUERY-BRIDGE-DIAGNOSTIC` drift/debt entry (13 lines removed from `drift.md`; research row rewritten). `grep -rn FOLLOWUP-DOC-QUERY-BRIDGE .llm/` returns nothing; `.llm/harness/debt/arch-debt.md` has no #1598/query-bridge entry. Removed, not left alongside.
- Current quotation (`docs/site/web-layer/query-bridge.md:98-103`) equals the runtime message at `cache-provider.ts:206-211`, confirming it will go stale under D4.
- Byte-comparison soundness: the locked template has exactly one variable token, `<resolved import.meta.url>`, delimited by `in module ` and `. Add`; a `file:`/`https:` URL contains no `. Add` sequence, so normalizing that single segment is unambiguous. The test also asserts the captured URL equals `new URL('./cache-provider.ts', import.meta.url).href` from the sibling test file — install-independent. The docs read is test-only (`--allow-all` under `run-deno-test.ts`); no runtime file read. Sound.

## Step 3 — scope

`scope-boundary.md` and `plan.md` "Scope" declare exactly the four product files plus the five
granted paths; no sixth. `query-options.ts` is explicitly *not* requested (D1 defers `no-store`, D3
rejects the branded type). Mechanism check per decision:

- D1: `cache-query.ts` + new test — no other file. `getKv` singleton reuse (`packages/kv/application/shared.ts:117-135`) means the test's pre-init `getKv({provider:'deno-kv', path:':memory:', skipServiceDiscovery:true})` is honored when `KvCacheStore.resolve()` later calls bare `mod.getKv()` (`kv-cache-store.ts:74-78`). All three option keys exist (`shared.ts:82,87,102`).
- D2/D3: entirely inside `cache-telemetry.ts` / `cache-query.ts` / `cache-provider.ts`; the internal admission helper and prologue are new non-barrel exports of `cache-telemetry.ts` (`composite-query.ts` keeps calling public `normalizeCacheNamespace`, so it is not touched).
- D4: `cache-provider.ts` + its test + the granted docs page.
- D5: `ports/cache-store.ts` only; `deno doc` of the surface confirms `get`/`set`/`delete` return report types.

Buildable within the authorized surface.

## Step 4 — D1–D5 feasibility

- **D1** — Seam is only the `store.set()` await at `cache-query.ts:238` after `data` resolved at `:234`; loader failure (`:233`) and lookup failure (`:141-152`) stay fail-loud; `setCachedData` (`:412+`) untouched. Telemetry vocabulary `recordCacheProviderError(span, CacheOperations.READ, namespace, descriptor, CacheEvents.WRITE)` matches the real signature (`cache-telemetry.ts:404-410`) and the existing call at `:239-246`. RED is real-path: `KvCacheStore.set` → `DenoKvAdapter.set` → `kv.set` (`packages/kv/adapters/deno-kv.adapter.ts:97-99`) against a real `Deno.openKv(':memory:')`; a >65,536-byte value raises Deno KV's `TypeError: Value too large` — not a synthetic store. Feasible.
- **D2** — "Amended" preserves the guard: same unbounded four-tier report, same assertions that the span is `error`/`topologyComplete=false`/`backendExecuted` per the new semantics; only the `assertRejects` becomes "loader executes and payload returns", which is the #1619 decision itself, plus new write/invalidation malformed cases. Not a weakening.
- **D3** — Memory bounded: ≤256 normalized strings (≤80 chars each) + one boolean; later raw ids are neither retained nor emitted. Offender named once (first crossing only). Existing static values `orders.list`, `billing.dashboard`, `composite` (`query-factory_test.ts:115-184`) stay admitted. Public `QueryParams`/`normalizeCacheNamespace` unchanged.
- **D4** — `_provider` stays module-local; only the string literal at `cache-provider.ts:206-211` changes. No ownership change.
- **D5** — Executed sweep (`rg` over `packages/sdk/src/ports`) found only the three `CacheStore` methods; JSDoc-only, non-breaking.

## Step 5 — validation honesty

- Currently-red commands (9a/9b) are declared red with named diagnostics; nothing red is called PASS.
- Gate set: `deno task test`/`check` (repo-root wrappers) cover Fresh (`define-fresh-app.ts` side-effect import, invalidation route), CLI (`write-app-files_test.ts` exact emitted import string), KV, MCP generated assets, `.llm/tools/release/baselines/public-surfaces.json` via `surface:diff` — i.e. the packages that *assert on* the SDK, not just importers. `surface:diff`, `check:netscript-jsr-specifiers`, JSR audit, `publish:dry-run`, `quality:scan`, `arch:check` all exist in root `deno.json`.
- No Aspire, Docker, or `e2e:cli` gate is planned; PR carries `ci:skip-e2e` + `ci:skip-scaffold`.

## Advisory (non-blocking)

1. D3 test reset: the admitted-namespace registry is module-global and shared by every test file in one `deno test` process. Wrap the 256-fill test in `try/finally` around the private reset so a mid-test failure cannot leak `overflow` into sibling test files.
2. D1 KV-limit test: the `@netscript/kv` singleton is process-global; call `resetKv()`/`closeKv()` (`shared.ts:187,208`) in the test's teardown so root `deno task test` ordering does not inherit an `:memory:` KV.
3. The single-line docs code block will exceed the prose wrap width; `deno fmt` does not reflow fenced blocks and no markdownlint config exists, so this is fine — just do not let a later formatter pass re-wrap it (the byte comparison would go red for the right reason).
4. The internal reset/admission/prologue helpers exported from `cache-telemetry.ts` for direct-file tests are not on the barrel; keep them out of `cache/mod.ts` so `surface:diff` stays patch-level.

## Verdict

**PASS** — the plan is buildable inside the authorized four+five surface, T-1..T-4 are genuinely
repaired at head `ee1b44c6d`, D1–D5 are feasible as written, and validation is stated honestly with a
diagnostic-level doc-lint baseline. Implementation may begin per the slice table; IMPL-EVAL remains
a separate mandatory session.
