# IMPL-EVAL — PR #1665 `fix/sdk-cache-surface-and-telemetry`

## Identity (recorded before any mutation)

| Field | Value |
| --- | --- |
| Evaluator OS PID | `126694` (`claude bg-spare --bg-spare /tmp/cc-daemon-1000/59093fbc/spare/6aded0de.claim.sock`) |
| `~/.claude/sessions/126694.json` | `sessionId=1fbb1c07-3b05-4d90-ab9c-c827c5aca2d5`, `kind=bg`, `name="NetScript 0.0.7 #1665 IMPL-EVAL"`, `jobId=1fbb1c07`, `bridgeSessionId=session_01JePyQuiERLe8GeWWKQp5wL`, `version=2.1.233` |
| Remote Control | `https://claude.ai/code/session_01JePyQuiERLe8GeWWKQp5wL` |
| Job id | `1fbb1c07` |
| `respawnFlags` (authoritative) | `--permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1665 IMPL-EVAL" --effort medium --model claude-fable-5` |
| Requested route | native Claude · `claude-fable-5` · effort `medium` · Remote Control on |
| Observed route | native Claude · `claude-fable-5` · `medium` · `--remote-control` present |
| Route verdict | **matched** |
| cwd | `/home/codex/repos/netscript-007-leaf-sdk-cache` |
| `git rev-parse HEAD` | `9a26c107afa75bf1f38b78fe96c6df533b156c36` (equals immutable source head) |
| Separation | fresh session; not the Codex implementer (`01a00516-…`), not the Tier-A orchestrator; every claim below re-derived |

## Scope boundary

`git diff --stat baf1cdf67..HEAD` (excluding `.llm/runs/**`): exactly nine files —
`docs/site/web-layer/query-bridge.md`, `packages/sdk/README.md`, `src/cache/cache-provider.ts`,
`src/cache/cache-provider_test.ts`, `src/cache/cache-query.ts`, `src/cache/cache-telemetry.ts`,
`src/ports/cache-store.ts`, `tests/cache/cache-query-kv-limit_test.ts` (new),
`tests/cache/cache-telemetry_test.ts`. That is the four declared product files plus the five granted
paths; nothing else. `ports/query-options.ts` is untouched. **Confirmed in scope.**

## Per-issue findings

### #1637 / D1 — persistence-failure isolation — MET

- `cache-query.ts:241-251` (`fetchAndCache`): only `this.store.set` is wrapped; on rejection it
  records `recordCacheProviderError(span, READ, …, WRITE)` and `return data;`. `queryFn()` (line 235)
  and the lookup (`store.get`, ~line 140–157) remain outside that catch and still throw.
- Explicit `setCachedData` (`cache-query.ts:445-482`) still rethrows after recording — fail-loud
  preserved.
- Background revalidation (`revalidateInBackground`, `cache-query.ts:264-312`): a `store.set` failure
  records the WRITE-span error and rethrows into the `void parent.run(...).catch(() => {})` sink
  (pre-existing SWR detachment) — no unhandled rejection, caller already holds stale data.
- Runtime proof with **real Deno KV** (`tests/cache/cache-query-kv-limit_test.ts`): 80 000-byte payload
  → `Value too large (max 65536 bytes)`; asserts result is the identical object, loader ran once,
  READ span carries `WRITE` event with `outcome=error`/`topology_complete=false`,
  `getCachedData` → `null` (entry uncached), and `setCachedData` still `assertRejects` with
  `TypeError 'Value too large'`. Executed: `ok (44ms)`.

### #1619 / D2 — fail-safe evidence validation — MET, approved contract change

- `cache-telemetry.ts:211-226`: `recordIncompleteTopology` is `: void`, no `throw`. Callers
  short-circuit: `recordCacheLookup` returns `CacheOutcomes.ERROR` (line ~304-311),
  `recordCacheWrite` `return`s (line ~375), `recordCacheInvalidation` stages per-report tiers and
  merges only after the whole report validates, sets `topologyComplete=false` on failure
  (lines 391-461).
- `validateDescriptor` removed from `createCacheSpanAttributes` (argument position, pre-span) and
  moved into `recordCacheSpanPrologue` (in-span, `cache-telemetry.ts:157-176`), which every
  `withSpan` body in `cache-query.ts` and the provider boundary now calls first.
- Contract: issue #1619 itself proposed fail-safe as the suggested option; the plan (PLAN-EVAL PASS)
  chose it; `packages/sdk/README.md:148-154` documents it. The `assertRejects` inversion in
  `cache-telemetry_test.ts` ("degrades malformed lookup evidence without losing data") is the
  intended contract flip, not a weakened guard: it still asserts `outcome=error`,
  `topology_complete=false`, `backend_executed=true`, `status='unset'`. New tests cover malformed
  write reports and the third-invalidation rollback (only `durable` emitted as complete).

### #1620 / D3 — bounded namespace cardinality — MET

- `cache-telemetry.ts:77-116`: budget `256`, module-level `Set`, `admitCacheNamespace` returns
  `{namespace:'overflow', overflowId}` exactly once (`cacheNamespaceOverflowRecorded` latch), later
  overflow ids are neither retained nor emitted. Event `cache.namespace.overflow` with
  `cache.namespace.offending_id` is added inside the real span by `recordCacheSpanPrologue`.
- Static call sites: `composite-query.ts:42` still only *normalizes* at construction; admission
  happens in `CacheQuery.query`/boundary at run time — test "composite construction defers namespace
  admission until a real operation" passes. Generated `resource.action` ids are admitted on first
  use as before.
- Helpers off the public surface: `grep admitCacheNamespace|recordCacheSpanPrologue|resetCacheNamespaceRegistry|CacheNamespaceAdmission src/mod.ts src/cache/mod.ts` → no hits.
  `normalizeCacheNamespace` remains exported as before.
- Acceptance wording says "collapsed with a warning naming the offender": implementation names it in a
  span event rather than `console.warn` (test asserts `warnCalls===0`), which is the plan's explicit
  choice (`plan.md:120`). Consistent with the approved plan.

### #1598 / D4 — module-identity diagnostic — MET

- `cache-provider.ts:210-221`: message begins `… not initialized in module ${import.meta.url}.`,
  registration import + `setCacheProvider` hint kept, hypothesis framed as "one possibility is that
  two `@netscript/sdk` module instances are loaded; check that …", browser clause preserved verbatim.
  `_provider` is still `let _provider … = null` module-local (`cache-provider.ts:57`), not exported.
- Docs proof (`cache-provider_test.ts`) is mechanical: it slices the runtime URL, asserts it equals
  `new URL('./cache-provider.ts', import.meta.url).href`, normalizes to `<resolved import.meta.url>`,
  and `assertEquals` against the single-line ```` ```text ```` block in `query-bridge.md` captured by
  a `[^\n]+` regex. **Red-on-rewrap verified** by scratch script (no product mutation): the regex
  matches the checked-in doc, and does NOT match once the line is wrapped after `url>.` — the test
  would hit `assert(documentedDiagnostic !== null)` and fail.
- `deno fmt --check docs/site/web-layer/query-bridge.md` → clean.

### #1623 / D5 — CacheStore JSDoc — MET

- `ports/cache-store.ts:63-64` `get` → `{ value: T | null, report: CacheReadTopologyReport }`;
  matches `CacheStoreEntry<T>` (`cache-store.ts:38-43`). `set` (line 74) → ordered
  `CacheWriteTopologyReport` writes+promotions — matches `cache-topology.ts:48-55`. `delete`
  (line 86) → `CacheInvalidationTopologyReport` — matches `cache-topology.ts:58-63`.
- Sweep: `grep -rn "@returns|@example" src/ports/*.ts` — only `cache-entry.ts:35,49` besides
  cache-store; neither describes a superseded shape; no other `{ value: null }` literal in `ports/**`.
  Sweep is real and clean.

## Carried evidence — confirm / refute

| Item | Verdict | Measurement |
| --- | --- | --- |
| `surface:diff` FAILS 517 at head | **Confirmed** | `deno task surface:diff` → exit 1, `517 undeclared major change(s)`; 31 of them in `@netscript/sdk` (all `export signature changed`, e.g. `CacheStore`, `KvCacheStore`, `QueryParams`) |
| 517 at base `baf1cdf67`, base == head | **Confirmed** | detached worktree at base → exit 1, 517; sorted MAJOR sets diffed: **identical** ⇒ zero net findings from this leaf; stale checked-in `baselines/public-surfaces.json` |
| Implementer's 524 | **Not reproduced** | 517 obtained twice against the checked-in baseline (deterministic snapshot); 524 in `s3-report.md:79` could not be reproduced at this head — most likely measured mid-slice / different local state. Either number is a stale-baseline FAIL, not a pass |
| JSR `F-DOCT-5` 13 children | **Confirmed pre-existing** | `git ls-tree` on `packages/sdk/src/`: 13 at base, 13 at head |
| Raw `deno doc --lint` RED, exactly six | **Confirmed, zero new** | 12 entrypoints → 3 `private-type-ref` (`query-client.ts:41:1`, `query-client-factory.ts:44:1`, `create-durable-stream.ts:41:3`); `./src/cache/mod.ts` → 3 (`kv-cache-store.ts:48:1`, `:97:3` ×2). Never a pass |
| `typed-queue` flake | **Not hit** | root `run-deno-test.ts -- --allow-all`: `4203 passed / 0 failed / 19 ignored`, exit 0, 446.7 s. Single run, not re-run |
| Root check "cached" trap | **Confirmed uncached** | wrapper `--root packages --root plugins --ext ts,tsx` (task's roots): 2925 files, 25 batches, 0 diagnostics |

## Additional executed evidence

- Focused: `deno test --allow-all --unstable-kv tests/cache/ src/cache/cache-provider_test.ts` → **28 passed / 0 failed**.
- `run-deno-check|lint|fmt.ts --root packages/sdk --ext ts,tsx` → 84 files, 0 findings each.
- `deno publish --dry-run --allow-dirty` in `packages/sdk` → `Success Dry run complete`.
- `deno task fmt:check` (repo gate, ts/tsx) → 2037 files, 0 findings.

## Advisory (non-blocking)

- **A1 — README fmt drift (new).** `deno fmt --check packages/sdk/README.md` fails at head (clean at
  base): lines 143-147 of the D3 paragraph re-wrap. The repo `fmt-check` gate is `--ext ts,tsx` and CI
  `quality-fmt` runs that task, so no gate is red; but this is a JSR-published README regressed by
  S1. Repair: `deno fmt packages/sdk/README.md` (one paragraph). Recommended before ready-for-review.
- **A2** — `admitCacheNamespace`, `recordCacheSpanPrologue`, `resetCacheNamespaceRegistry`,
  `CacheNamespaceAdmission` are exported from `cache-telemetry.ts` without JSDoc. They are not on any
  entrypoint so `deno doc --lint` does not see them; noting only so a future re-export does not
  silently add missing-jsdoc errors.
- **A3** — #1637 mentions a per-action `no-store` opt-out as "also useful"; not part of acceptance
  and not delivered — correct per plan scope.

## Verdict

**PASS** — all five issue acceptances met at runtime at `9a26c107a`; scope boundary respected; no
new red in doc-lint, check, lint, ts/tsx fmt, publish dry-run, or the root test suite. Blocking list:
empty. Carried FAILs (surface:diff, F-DOCT-5, doc-lint six) are pre-existing at base and reported
here as red, not green.
