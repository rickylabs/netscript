# Drift Log: sdk cached-entry stale policy

Drift is append-only.

## 2026-08-15 — Frozen file-surface contract contains two nonexistent paths

- **What:** `docs/sdk` and `docs/site/_site/capabilities/sdk/index.md` do not exist at the named
  baseline; the latter is also under generated Lume output.
- **Source:** coordinator brief and direct path checks.
- **Expected:** four frozen `fileSurfaces` exist as editable targets.
- **Actual:** only `docs/site/services-sdk/sdk.md` and `packages/sdk/src/cache/cache-query.ts`
  exist; the exact offending snippet is in the former.
- **Severity:** significant
- **Action:** fix the plan contract; never create replacements or edit `_site`.
- **Evidence:** `research.md` findings 1-4; `.llm/tools/docs/snippet-policy.ts:45-48`.

## 2026-08-15 — Adjacent tutorial repeats the false behavior outside frozen scope

- **What:** `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md:100` also claims stale
  `getCachedEntry()` reads refresh in the background.
- **Source:** site-source search for `getCachedEntry`, stale, and background claims.
- **Expected:** the cited false published example is represented by the frozen site source.
- **Actual:** the exact example is in scope, but adjacent prose outside the frozen contract repeats
  the same misconception.
- **Severity:** significant
- **Action:** defer and request coordinator surface expansion if it is to be edited; do not silently
  widen this leaf.
- **Evidence:** `research.md` finding 11.

## 2026-08-15 — Doc-lint brief ambiguity corrected by the orchestrator

- **What:** the brief's count of six compressed two separate expected-red invocations into one
  number.
- **Source:** coordinator brief, corrected by the orchestrator at plan head `7e5be1514`.
- **Expected:** the original wording ambiguously pinned one raw SDK doc-lint invocation at six
  diagnostics.
- **Actual:** the combined 12-entrypoint invocation exits 1 with exactly three diagnostics:
  `QueryClientPort` → private `QueryClient` (`src/ports/query-client.ts:41:1`),
  `createNetScriptQueryClient` → private `QueryClient`
  (`src/query-client/query-client-factory.ts:44:1`), and
  `DurableStreamProducerOptions["instrumentation"]` → private `StreamsInstrumentation`
  (`packages/plugin-streams-core/src/application/create-durable-stream.ts:41:3`). The cache-only
  invocation separately exits 1 with exactly three diagnostics in `src/cache/kv-cache-store.ts`:
  `KvCacheStore` → private `CacheStore` (`:48:1`), `KvCacheStore.prototype.get` → private `CacheKey`
  (`:97:3`), and `KvCacheStore.prototype.get` → private `CacheStoreEntry` (`:97:3`). "Six" was the
  sum of those two invocation counts; the combined invocation's `plugin-streams-core` diagnostic is
  not this leaf's repair scope.
- **Severity:** significant
- **Action:** resolved — pin and run both invocations independently. Each must exit 1 with exactly
  its three named diagnostics and no others; neither may be reported as a pass.
- **Resolution:** brief ambiguity corrected by the orchestrator.
- **Evidence:** `plan.md` validation rows 14a–14b and the orchestrator's correction at `7e5be1514`.

## 2026-08-15 — Coordinator authorizes exactly one adjacent tutorial source

- **What:** the earlier scope-boundary report is resolved by adding
  `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md` and no other docs source.
- **Source:** coordinator scope ruling for PR #1669.
- **Expected:** the leaf would edit only `docs/site/services-sdk/sdk.md` until a ruling.
- **Actual:** the authorized docs set is now exactly those two pages. The second page's line 100
  independently says a stale `getCachedEntry` result refreshes in the background.
- **Severity:** significant
- **Action:** resolved — include the second page in S2 and correct it to say that `getCachedEntry`
  only returns `{ data, cachedAt }` from warm KV or `null` from cold KV; it does not evaluate
  staleness or initiate revalidation. Do not edit a third docs source.
- **Verification:** the two-page, surrounding-tutorial, and site-wide source sweeps found no third
  false assignment of revalidation to `getCachedEntry()`. The ordered `gen:agent-docs-prose` →
  `gen:assets-barrel` → `gen:publish-assets` run exited 0 throughout; provenance includes both
  authorized pages, and the clean synchronized content head produced no tracked delta or undeclared
  generated path.
- **Resolution:** exact one-source expansion authorized by the coordinator; fresh PLAN-EVAL still
  required before implementation.
- **Evidence:** `research.md` findings 11-15; `plan.md` S2 and validation row 8; `worklog.md`
  plan-amendment evidence.

## 2026-08-15 — Tier-A requires a page-level tutorial contract

- **What:** the amended scope committed only to replacing tutorial line 100, while S2 required the
  page as a whole to distinguish SWR policy execution from the pure KV read.
- **Source:** Tier-A T-1 on plan head `eadd672d0`.
- **Expected:** the implementation boundary should state exactly how the authorized tutorial stops
  implying that its demonstrated `getCachedEntry()` loader revalidates.
- **Actual:** lines 13, 15, 75, 76, and 80 accurately describe factory-level SWR, but their pairing
  with the pure-read-only loader at line 107 creates the false page-level implication even if line
  100 is corrected in isolation.
- **Severity:** significant
- **Action:** resolved in the plan — retain lines 13, 15, 75, and 76 with explicit nearby text that
  assigns SWR to the callable procedure action; correct lines 32, 80, 94, 100, and 107; make the
  loader demonstrate action-then-metadata composition; retain the accurate services-SDK line 138
  and correct its line-188 loader.
- **Verification:** the exact-two-page sweep accounts for every same-class result in the plan's
  published-claim table. The site-wide sweep also checked
  `docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md:231`: its
  `.withPolicy('balanced')` statement describes a distinct policy mechanism, is plausibly true,
  and remains out of scope and unedited. No third docs source was added.
- **Resolution:** plan ambiguity repaired; fresh Tier-A and separate PLAN-EVAL remain required
  before implementation.
- **Evidence:** `plan.md` published-claim dispositions and S2 page-level acceptance;
  `research.md` finding 14 and executed docs claim sweep; `worklog.md` plan-repair entry.

## 2026-08-15 — Initial S1 F-1 response deleted documentation instead of reducing architecture

- **What:** an intermediate 501-line S1 shape was squeezed to the F-1 boundary by deleting useful
  private-method JSDoc, compressing the module block, and removing blank-line structure. The pushed
  `e05a54145` snapshot later measured 499 lines, but the nature of that reduction was unchanged.
- **Source:** coordinator pre-review finding and the S1 commit diff against `d555cc971`.
- **Expected:** F-1 prompts a responsibility/control-flow reduction while useful documentation and
  readable structure remain intact.
- **Actual:** the behavioral A2/A3 work and tests were correct, but the first size response gamed the
  physical metric and the run record incorrectly described it as a fitness refinement.
- **Severity:** significant
- **Action:** restored the full module JSDoc; summaries for `queryInsideSpan`, `getInflight`,
  `fetchAndCacheOnce`, `fetchAndCache`, and `revalidateInBackground`; and normal blank-line
  separation. Added a summary for `startInflight`. Structurally collapsed the duplicated
  telemetry-backed implementations of `getCachedData`/`getCachedEntry`, made fetch-and-persist one
  async responsibility without `register`/`inflightKey` mode parameters, and removed the duplicate
  background fetch-error control-flow shell.
- **Resolution:** honest source is 497 lines. All S1 wrappers pass; `quality:gate` exits 0 and SDK
  doctrine reports `FAIL=0 WARN=1 INFO=1`, with no F-1 finding and only the pre-existing F-16
  13-child warning.
- **Evidence:** `packages/sdk/src/cache/cache-query.ts`; structured gate table in `worklog.md`;
  coordinator amendment receipt on PR #1669.

## 2026-08-15 — S2 exposes a baseline fresh-hit predicate defect

- **What:** the corrected published loader calls the cache-aware action with
  `preferFreshOnStale: true`; its fresh-entry regression receives fetched data instead of the seeded
  fresh hit because the preference is evaluated before the fresh branch.
- **Source:** S2 focused query-factory regression and coordinator scope ruling S2-A.
- **Expected:** expired entries fetch; otherwise only `!isFresh && preferFreshOnStale` blocks;
  fresh non-expired entries fall through to the existing zero-fetch return.
- **Actual:** `if (isExpired || preferFreshOnStale)` appears at
  `main@3e8e146a4:170` and at accepted S1 head `e100ea205:165`, before `if (isFresh)`.
- **Classification:** pre-existing baseline defect exposed by S2, not introduced by S1.
- **Severity:** significant
- **Action:** coordinator authorized exactly `packages/sdk/src/cache/cache-query.ts` as an S2-A
  correction surface. After fresh fixes Tier-A passes, change only the predicate to
  `isExpired || (!isFresh && preferFreshOnStale)` and prove it in the already-authorized
  `packages/sdk/tests/query/query-factory_test.ts`. No `cache-query_test.ts` edit is authorized.
- **Preserved invariants:** S1 A2/A3 policy-aware persistence-complete ownership, synchronous
  registration, and non-fatal write joiner semantics remain unchanged. The documented 497-line
  source and `quality:gate` result with no F-1 finding must survive without comment/spacing games.
- **Resolution:** scope amendment recorded; source correction remains blocked pending fresh fixes
  Tier-A over the plan-only amendment head.
