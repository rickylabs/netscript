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
