# PLAN-EVAL — `fix-sdk-cached-entry-swr--0.0.7-wave5` (PR #1669, issue #1461)

## Identity (recorded before any mutation)

| Field | Value |
| --- | --- |
| Evaluator OS PID | `391331` (`claude bg-spare --bg-spare …/f623667e.claim.sock`; tool shell PID 397920) |
| `~/.claude/sessions/391331.json` | `{"pid":391331,"sessionId":"01f0eda8-24fe-41b0-919e-7426579ab868","cwd":"/home/codex/repos/netscript-007-leaf-cached-entry","startedAt":1786814588876,"version":"2.1.233","kind":"bg","entrypoint":"cli","messagingSocketPath":"/run/user/1000/cc-socks/391331.sock","name":"NetScript 0.0.7 #1669 PLAN-EVAL","jobId":"01f0eda8","status":"busy","bridgeSessionId":"session_01SWnk7LwvoLaamvEwR5WLfX"}` |
| Bridge session (resolvable) | `session_01SWnk7LwvoLaamvEwR5WLfX` |
| Remote Control URL | `https://claude.ai/code/session_01SWnk7LwvoLaamvEwR5WLfX` |
| Job id | `01f0eda8` (`~/.claude/jobs/01f0eda8/state.json`, `bridgeSessionId: cse_01SWnk7LwvoLaamvEwR5WLfX`) |
| `respawnFlags` | `["--permission-mode","bypassPermissions","--remote-control","--name","NetScript 0.0.7 #1669 PLAN-EVAL","--effort","medium","--model","claude-fable-5"]` |
| Requested route | native Claude · `claude-fable-5` · effort `medium` · Remote Control · `formal_plan_evaluation` (Codex-authored plan) |
| Observed route | native Claude · `claude-fable-5` · `medium` · `--remote-control` — **matched** |
| Generator session | Codex `01a00646-82a9-7ec2-88e7-16dea98a58fa` (`gpt-5.6-sol`) — different session/family: evaluator separation holds |
| cwd | `/home/codex/repos/netscript-007-leaf-cached-entry` |
| `git rev-parse HEAD` | `23db20f301d06ed1e4a9a65cbbf64349f89cb8c0` — equals the immutable source head |
| Base | `3e8e146a4aedf8ee0afec15c83ddaefc171c71f9` |

## Step 1 — phase invariant

```
$ git diff --name-only 3e8e146a4aedf8ee0afec15c83ddaefc171c71f9..HEAD
.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/codex-thread-ids.md
.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/context-pack.md
.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/drift.md
.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/plan.md
.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/research.md
.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/supervisor.md
.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/worklog.md
```

**PASS** — run-dir only; no product, test, or docs mutation at this head.

## Step 2 — the issue and the docs claim (re-derived from source)

- `packages/sdk/src/cache/cache-query.ts:415-442` — `CacheQuery.getCachedEntry` opens a READ span,
  calls `this.store.get(...)` once, and returns `toCachedEntry(cached.value)` or `null`. No
  `staleTime` evaluation, no `queryFn`, no `revalidateInBackground`. **KV-only metadata read —
  confirmed.**
- `packages/sdk/src/query/query-factory.ts:136-141` — `actionMethod.getCachedEntry` delegates
  straight to `getCacheProvider().getCachedEntry(key, operationId)`. **Confirmed.**
- `packages/sdk/src/query/query-factory.ts:65-87` — the callable action forwards
  `staleTime/cacheTime/revalidateOnStale/preferFreshOnStale` into `getCacheProvider().query(...)`;
  `cache-query.ts:159-201` is where fresh-hit / expired-or-`preferFreshOnStale` blocking refetch /
  stale-SWR background refresh are decided. **The callable action owns the SWR policy —
  confirmed.**
- `packages/sdk/src/ports/query-options.ts:18-23` — `preferFreshOnStale` documented as "stale
  entries trigger a blocking refetch instead of returning stale data immediately". Matches
  `cache-query.ts:170`.
- Corroborating defect the plan builds on: `revalidateInBackground` (`cache-query.ts:262-313`)
  never touches `inflightRequests`, and `fetchAndCache` (`:235-236`) registers only the raw
  `queryFn()` promise, so a joiner resolves *before* `store.set` completes (`:239-243`). Both
  "hidden scope" items in `plan.md:103-106` are real, not speculative.

Plan characterisation: **correct.** Issue #1461's minimal repro is consistent with this code.

## Step 3 — scope

- `plan.md:55-61, 92-94, 226-229` declare exactly `docs/site/services-sdk/sdk.md` and
  `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md`; Non-Scope names "No third docs
  source". **Confirmed — exactly two.**
- Generated cascade: `plan.md:61, 107-109, 196` and S2 file list name exactly
  `.llm/assets/agent-docs/prose.json.gz`, `.llm/assets/agent-docs/provenance.json`,
  `packages/cli/src/kernel/assets/agent-docs.generated.ts`,
  `packages/mcp/src/publish-assets.generated.ts`. I confirmed both pages are provenance inputs
  (`provenance.json` lists `pages/services-sdk/sdk/index.md` and
  `pages/tutorials/live-dashboard/03-sdk-cache-first-query/index.md`), so the four-file cascade is
  the correct derived set. Nothing in the design requires a further page or generated path.
- Out-of-scope reds: `plan.md:95-96` (Non-Scope) and `:206-207` explicitly refuse to repair or
  green-report `#1667`, `#1668 check:mcp-export-corpus`, `surface:diff`, JSR `F-DOCT-5`;
  `plan.md:143` reports #1667 as `expected 1, got 2` with no rerun-for-green. **Correct posture.**

## Step 4 — published-claim dispositions (swept independently)

Sweep: `grep -rn getCachedEntry docs/site --include=*.md` (excluding `_site`) plus a
`revalidat|stale|background|cache-first` sweep of the two authorized pages and their neighbours.

**Completeness.** In the two authorized pages the same-class claims are exactly tutorial
`:13,:15,:32,:75-76,:80,:94,:100,:107-108` and Services SDK `:138,:188`. The table covers all of
them. Outside the authorized set: `web-layer/query-bridge.md:84,:159,:190,:337` and
`web-layer/index.md:67` already state "read, not a fetch"; chapter 4
(`04-definePage-QueryIsland.md:14,:124,:231`) uses `getCachedEntry` as a pure read and its
"refetches in the background" refers to the island/`withPolicy('balanced')` mechanism, not to
`getCachedEntry`. **No surviving same-class false claim outside the table — Tier-A claim
confirmed.**

**Retained lines.** 13, 15, 75, 76 (tutorial) describe `createQueryFactories`'s callable path,
which does carry SWR (`cache-query.ts:186-189`). Services SDK 138 says the loader *uses* the
timestamp to decide stale-reload — that is the `withLayer` `staleTime`/`staleReloadMode` mechanism
(`web-layer/layers.md:154-155,:196-202`), it does not attribute refresh to `getCachedEntry`.
The mandated scoping sentences (`plan.md:70,:73`) name the callable action and expressly exclude
`getCachedEntry`. **Defensible.**

**Corrected lines.** 32, 80, 94, 100, 107, 188 wordings are accurate to the code. None says the
factory lacks SWR; 80 and 100 explicitly re-assign SWR to the callable action. **No
overcorrection.**

**Line-107 composition against the real API.** `await ordersQueries.list(input, {
preferFreshOnStale: true })` type-checks against `ActionMethod` (`ports/query-factory.ts:49-52`,
`QueryParams.preferFreshOnStale`). Path: fresh → `cache-query.ts:182-183` returns cached, zero
calls; stale → `:170-171` blocking `fetchAndCacheOnce`, which awaits `store.set` (`:243`) before
returning; miss → `:193`. Then `getCachedEntry(input)` reads the persisted entry. On write
failure the fail-safe returns data (`:244-253`) and the metadata read may return the old entry or
`null` — the plan's "fail-safe data fallback" (`plan.md:80`) is therefore required and correctly
anticipated for line 188. The one gap — a *joiner* of an in-flight fetch resolving before the
write — is exactly what S1's persistence-complete ownership fixes. **Works as written once S1
lands; S1 precedes S2 in the slice order.**

**S2 page-level acceptance (`plan.md:82-86`).** The sentence names three observable properties
(action identified as SWR path; `getCachedEntry` identified as KV-only; loader composes action
before read) — judgeable by a reader/evaluator against the disposition table.

**Does gate 7 bind it?** **No.** `docs-accuracy` resolves to `deno task docs:accuracy` →
`.llm/tools/docs/check-accuracy-and-discoverability.ts` (`.llm/tools/gates/catalog.ts:59`,
`deno.json:85`). That script has no marker for `getCachedEntry`/SWR/revalidation (grep returns
nothing); it checks golden-path vocabulary, saga stale claims, and command census. A `docs-accuracy`
PASS receipt proves none of the "expected result" text in `plan.md:194`. See advisory A1.

## Step 5 — design feasibility

- **Persistence-complete in-flight ownership.** Feasible: register the whole fetch→persist
  operation (the promise that settles after the `try/catch` at `cache-query.ts:242-253`) instead
  of the raw `queryFn()` promise; `finally` cleanup stays. On write failure the foreground path
  *returns* data, so a joiner resolves — no hang. On fetch failure the operation rejects and
  joiners reject, as today. A stale SWR reader returns `cached.value.data` at `:189` after only
  scheduling/observing the registered refresh, so it never blocks. **Buildable.** One
  under-specified corner: a *blocking* joiner attached to a *background-owned* refresh whose write
  fails — the background path currently rethrows (`:297-306`), foreground returns data. See
  advisory A2.
- **Deterministic two-reader proof.** With `MemoryCacheStore` and a manually-blocked `queryFn`,
  reader-1's continuation after `store.get` runs before reader-2's; provided the map registration
  happens **synchronously** in that continuation (before any `await` in the background path),
  reader-2 observes it deterministically. No sleeps required. Alternatively, fully `await` reader-1
  (it returns stale without waiting) before starting reader-2 — the refresh is still unreleased, so
  overlap and "exactly 1" are still proven with zero ordering assumption. **Deterministic;
  advisory A3 pins the registration-ordering requirement.**
- **#1665 preservation.** Admission (`:86-87`), read-span prologue (`:92`), captured-parent write
  span (`:268-280`), detached `.catch` (`:309-312`), non-fatal foreground write (`:244-253`) are
  all outside the dedupe decision points (`:140-143`, `:219-222`, `:235-236`); the refactor can
  keep them byte-identical. Existing telemetry test
  (`tests/cache/cache-telemetry_test.ts:431-459`) constrains joiner attribution and stays valid.
  AP-10: plan adds no new catch (`plan.md:150`). **Preservable.**
- **API choice.** Rejecting `queryEntry()` is right: issue #1461 offers "correct the documentation
  to require a cache-aware `query()` before reading metadata" as remedy 1; every acceptance bullet
  is behavior/regression, satisfiable with the existing `ActionMethod` + `getCachedEntry`. New
  surface would cross `ports/`, `query/`, `composite-query`, and JSR doc-lint. **Correct.**
- **No hidden public surface.** Files list is `cache-query.ts` + two test files + two docs + four
  generated mirrors (`plan.md:179-180`); Non-Scope `:89-90`; Drift Watch `:231-232`.
  **Confirmed.**

## Step 6 — doc-lint baseline honesty (executed)

`cd packages/sdk && deno doc --lint ./mod.ts ./src/auto-update/mod.ts ./src/cache/mod.ts …
./src/telemetry/mod.ts` → **exit 1**, exactly 3 diagnostics:
`QueryClientPort`→`QueryClient` (`src/ports/query-client.ts:41:1`);
`createNetScriptQueryClient`→`QueryClient` (`src/query-client/query-client-factory.ts:44:1`);
`DurableStreamProducerOptions["instrumentation"]`→`StreamsInstrumentation`
(`packages/plugin-streams-core/src/application/create-durable-stream.ts:41:3`). "Found 3
documentation lint errors." — **matches row 14a exactly.**

`deno doc --lint ./src/cache/mod.ts` → **exit 1**, exactly 3 diagnostics, all
`src/cache/kv-cache-store.ts`: `KvCacheStore`→`CacheStore` (`:48:1`);
`KvCacheStore.prototype.get`→`CacheKey` (`:97:3`); `KvCacheStore.prototype.get`→`CacheStoreEntry`
(`:97:3`). — **matches row 14b exactly.**

Reconciliation: 6 occurrences across 2 invocations, 5 unique symbols (`KvCacheStore.prototype.get`
twice at the same location). **Confirmed.** Rows 14a/14b, F-7 (`plan.md:161`) and `:206-207`
never describe these or any known-red command as passing; every gate that needs a named
diagnostic names it (14a, 14b, 16 names `expected 1, got 2`). **Honest.**

## Plan-Gate checklist

| Box | Evidence | State |
| --- | --- | --- |
| Research present and current | `research.md:3-9` re-baselined on `3e8e146a4`; spot-checks above confirm load-bearing findings | ✅ |
| Decisions locked | `plan.md:113-123` D1–D7 with rationale | ✅ |
| Open-decision sweep | `plan.md:125-131`; my sweep found no deferred decision that forces rework (A1–A4 are refinements, not reworks) | ✅ |
| Commit slices | S1, S2 (`plan.md:175-182`), ordered, each names proof/gates/files | ✅ |
| Risk register | `plan.md:133-143` | ✅ |
| Gate set selected | `plan.md:157-166`, validation 1–18 | ✅ |
| Deferred scope explicit | `plan.md:220-224` | ✅ |
| jsr-audit | `research.md:164-185`; no new export; F-DOCT-5 named as unchanged red | ✅ |

## Tier-A claims tested

| Claim | Verdict |
| --- | --- |
| Callable action owns SWR; `getCachedEntry` is KV-only | **Confirmed** |
| Exactly two docs sources, four-file cascade, no third page | **Confirmed** |
| Disposition table complete for the two pages; no third same-class claim site-wide | **Confirmed** |
| Retained lines accurate; corrected lines do not overcorrect | **Confirmed** |
| Line-107 composition works against the API | **Confirmed** (fully after S1) |
| Doc-lint pins 14a/14b: 3+3, exit 1, five unique symbols | **Confirmed by execution** |
| Gate 7 `docs-accuracy` binds the S2 sentence | **Refuted** — script has no such marker (advisory A1) |

## Advisory (non-blocking)

- **A1 — S2 acceptance evidence.** `plan.md:194` attributes the S2 page-level sentence to a
  `docs-accuracy` PASS receipt; the script cannot judge it. In `worklog.md` record the S2 sentence
  as **manual evidence** (Tier-A slice review + IMPL-EVAL reading the disposition table against the
  rendered page), per Plan-Gate "Phase A reporting". IMPL-EVAL should reject any worklog that
  cites the `docs-accuracy` receipt as proof of S2. (Extending the accuracy script with
  `requireText`/`forbidText` markers would need a `.llm/tools` scope ruling; not required.)
- **A2 — joiner semantics on background-owned write failure.** Specify in S1 that the
  map-registered operation *resolves to data* when the fetch succeeds and only the write fails,
  regardless of whether a foreground or background reader owns it, so a blocking joiner inherits
  #1665's non-fatal-write behavior; the background owner still records the error and stays
  detached. Rejection propagates only for fetch failure.
- **A3 — registration ordering for D5.** Register the background refresh in `inflightRequests`
  synchronously in the scheduling reader's turn (before any `await` inside the write span), or
  structure the test as reader-1 fully awaited → reader-2 started → then release. Either keeps the
  test sleep-free and deterministic.
- **A4 — tutorial posture wording.** Retained lines 13/15/75 promise "instantly / not blocking"
  while the corrected line-107 loader uses `preferFreshOnStale: true` (blocking on stale). Both
  are true, but add one clause at 107 saying the default call (no flag) is the non-blocking SWR
  path and the flag is chosen so `cachedAt` reflects the refreshed value.

## Verdict

**PASS.** Implementation of S1 then S2 may begin under the locked decisions; advisories A1–A4 are
refinements to carry into the slices and IMPL-EVAL, not plan defects.
