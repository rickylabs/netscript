# IMPL-EVAL — PR #1669 `fix/sdk-cached-entry-swr` (#1461)

Formal IMPL-EVAL, fresh session, separate from the Codex implementer
(`01a00646-82a9-7ec2-88e7-16dea98a58fa`, `gpt-5.6-sol`) and from the Tier-A topic orchestrator.
Every claim below was re-derived from the repository at the immutable head; nothing was adopted
from the slice reports or the brief without execution.

## Identity

| Field | Value |
| --- | --- |
| Evaluator | Claude Code, native Claude · `claude-fable-5` · effort `medium` · Remote Control |
| OS PID | `634990` (`claude bg-spare`), session file `~/.claude/sessions/634990.json` |
| Session id | `f40814ce-5b41-49ae-8cf2-e65014de01de` |
| bridgeSessionId | `session_01CMrdm9P2YwHxiNCT49C4Hf` (Remote Control: `https://claude.ai/code/session_01CMrdm9P2YwHxiNCT49C4Hf`) |
| Job id | `f40814ce` (`~/.claude/jobs/f40814ce/state.json`) |
| respawnFlags | `--permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1669 IMPL-EVAL" --effort medium --model claude-fable-5` |
| Requested route | native Claude · `claude-fable-5` · `medium` · Remote Control (`formal_impl_evaluation`) |
| Observed route | native Claude · `claude-fable-5` · `medium` · Remote Control (from `respawnFlags`; argv is `claude bg-spare --bg-spare …`) |
| Route verdict | **matched** |
| cwd | `/home/codex/repos/netscript-007-leaf-cached-entry` |
| `git rev-parse HEAD` | `9aa54ae2d4f53c705b0309ed472abf7bbccebe41` — equals immutable source head |
| Base | `main@3e8e146a4aedf8ee0afec15c83ddaefc171c71f9` (`origin/main`) |
| PR state at eval | draft, head `9aa54ae2d…`, labels `type:fix status:plan priority:p1 area:sdk`, milestone `0.0.7` |

Working tree was clean at start (`git status --short` empty) and remained clean after every gate
run below (the one deliberate predicate revert in Step 3 was restored with `git checkout` and
verified clean before continuing).

## Step 1 — the issue

`getCachedEntry` (`packages/sdk/src/cache/cache-query.ts:441-449`) delegates to `readCachedEntry`
(`:403-432`), which does one `store.get`, records a lookup, and maps `{data,timestamp}` →
`{data,cachedAt}`. No staleness evaluation, no fetch, no in-flight registration. The callable
procedure action (`packages/sdk/src/query/query-factory.ts:73-82`) routes into `CacheQuery.query` →
`executeQuery` (`cache-query.ts:99-204`), which owns fresh-hit / stale-SWR / stale-blocking /
expired / missing policy. Issue #1461's premise (the loader example never revalidates) is confirmed
against base: `git show 3e8e146a4:docs/site/services-sdk/sdk.md` line 188 read
`if (entry) return entry; // serve cached; SDK reloads stale in the background`, which was false.

Acceptance at this head: the published loader now composes the policy action before the metadata
read (Services SDK `sdk.md:188`; tutorial `03-sdk-cache-first-query.md:112-116`), the runtime honors
that composition (Step 3/4), and the regression is executable (`query-factory_test.ts:129-229`).
Met — see terminal verdict.

## Step 2 — scope

`git diff --stat 3e8e146a4..HEAD` (excluding run artifacts):

```
docs/site/services-sdk/sdk.md                                 |   2 +-
docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md |  24 +-
.llm/assets/agent-docs/prose.json.gz                            | Bin
.llm/assets/agent-docs/provenance.json                          |  10 +-
packages/cli/src/kernel/assets/agent-docs.generated.ts         |  12 +-
packages/mcp/src/publish-assets.generated.ts                    |   8 +-
packages/sdk/src/cache/cache-query.ts                           | 203 ++++----
packages/sdk/tests/cache/cache-query_test.ts                    | 120 +++-
packages/sdk/tests/query/query-factory_test.ts                  | 118 +++-
```

Exactly the authorized set; no lockfile, no `_site`, no third docs source, no export/port/factory
file.

`packages/sdk/tests/cache/cache-query_test.ts`: last touched by S1 commit `e05a54145`
(`git log --format=%h -- <file>` → `e05a54145`, then `317e4b509`), and
`git diff --stat e100ea205..HEAD -- packages/` shows it is **untouched** since the accepted S1 head.
The S2/S2-A non-grant is honored. **Confirmed.**

Was the granted test surface sufficient? The S2-A predicate change is proven only end-to-end via
`query-factory_test.ts` (through `createQueryFactory` → `CacheQuery`), not by a unit case in
`cache-query_test.ts`. Behaviourally that is a full proof of the corrected predicate (fresh+flag →
0 calls, expired → 1 call, stale+flag → blocking single refresh); nothing was papered over.
Advisory (non-blocking): a direct `CacheQuery.query` fresh+`preferFreshOnStale` unit case would be
the natural home per the worklog's own contributor path (`worklog.md:74-79`).

## Step 3 — S2-A semantic correction

Attribution: `git show 3e8e146a4:packages/sdk/src/cache/cache-query.ts | sed -n 170p` →
`if (isExpired || preferFreshOnStale) {` — identical predicate at base, before the `isFresh` return.
S1 head `e100ea205` diff (`git diff eba0b0924~1..eba0b0924 -- packages/sdk/src`) shows the only S2-A
source change is that one line (`:165`). **Pre-existing baseline defect — confirmed, not an S1
regression.**

Corrected predicate `cache-query.ts:165`: `if (isExpired || (!isFresh && preferFreshOnStale))`
then `:177 if (isFresh) return cached.value.data;` then `:181` SWR branch. Expired precedence
preserved (short-circuit first); stale+flag blocks (`!isFresh && flag`); fresh non-expired falls
through to `:177`. **Confirmed.**

Executed proof (head):

```
run-deno-test.ts -- --allow-all packages/sdk/tests/cache/cache-query_test.ts packages/sdk/tests/query/query-factory_test.ts
→ exitCode 0, passed 11, failed 0
```

Executed pre-fix rebuild (temporary `sed` revert to `if (isExpired || preferFreshOnStale)`, then
`deno test`, then `git checkout` of the file, tree verified clean):

```
published loader runs cache policy before reading persisted metadata ... FAILED
error: Error: Expected seeded-fresh, got fetched
    at packages/sdk/tests/query/query-factory_test.ts:165:5
```

The fresh-hit assertion (`query-factory_test.ts:164-166`, `assertEquals(clientCalls, 0)`) is RED
against the old predicate and GREEN at head. Supervisor RED claim **confirmed by execution**. The
three branches are all asserted in that test: fresh (`:157-166`), expired-with-flag-false
(`:183-193`), overlapping stale+flag (`:195-225`, calls exactly 1 pinned before *and* after release).

## Step 4 — S1 behaviour survives

- Map-registered operation covers fetch **and** persistence: `startInflight` (`:257-265`) wraps
  `run` = `fetchAndCache` (`:232-254`), which awaits `queryFn()` *and* `store.set` before resolving;
  map cleanup runs in `.finally`. **Confirmed.**
- Joiners resolve to data on write failure: `fetchAndCache` catches only `store.set` (`:248-251`),
  records `recordCacheProviderError(…, WRITE)` and returns `data`; the operation resolves. Fetch
  failure (`:240`) propagates as rejection. Test
  `cache-query_test.ts:143-186` ("blocking joiner receives data when background persistence fails")
  asserts joiner → `'fresh'`, store still `'stale'`, `calls === 1`, map empty. **Confirmed.**
- Synchronous registration: `startInflight` sets the map entry synchronously (`:263`) before
  returning; the callback is deferred one microtask (`Promise.resolve().then(run)`).
  `revalidateInBackground` (`:276-280`) checks the map first and joins. Test
  `cache-query_test.ts:97-141` fully awaits reader 1, reads `inflight.get('["orders"]')`, awaits
  reader 2, asserts both `'stale'`, `calls === 1`, `size === 1`, then releases the manual resolver.
  No `setTimeout`/`sleep`; only `Promise.withResolvers` and a seeded timestamp
  (`Date.now() - 100` vs `staleTime: 1`; `cacheTime: 10_000`, so not expired). **Sleep-free and
  deterministic — confirmed.** The factory-level overlap proof (`query-factory_test.ts:195-225`) uses
  a `JoinObservedInflightMap` whose `get` resolves a promise only when an existing operation is
  observed by the second reader — also sleep-free.
- PR #1665 fail-safe intact / AP-10 not broadened: the only `catch` around a store write is the
  one that existed at base (now at `:248`), scoped to `store.set`; the background path's `.catch`
  (`:312-321`) records and **rethrows** exactly as base did; `void operation.catch(() => {})`
  (`:326`) keeps the detached background rejection from becoming unhandled, as at base. Read
  errors still throw (`:143-152`). No new swallowing boundary. **Confirmed.**
- `getCachedData`/`getCachedEntry` were consolidated into a private `readCachedEntry`
  (`:403-449`) in S1 `e100ea205` — behaviour-preserving (same span, same lookup record, same
  error rethrow). Documented in worklog as the honest F-1 structural reduction; file is 497 lines,
  `check-doctrine.ts --root packages/sdk` → `FAIL=0 WARN=1 INFO=1`, the WARN being F-16
  cardinality, no F-1.

Two behaviour deltas vs base that are **not** regressions but are worth naming (non-blocking):
(a) joiners now record a cache lookup event before joining (base short-circuited before
`store.get`), i.e. slightly richer telemetry evidence, and (b) a background refresh whose *write*
fails now resolves (previously rejected while detached); telemetry evidence is the same single
WRITE provider-error record.

## Step 5 — documentation contract

Sweep of both authorized pages (`grep -n -i "getCachedEntry|revalidat|cache-first|background"`)
plus the rendered `_site/tutorials/live-dashboard/03-sdk-cache-first-query/index.html` (built by
the generator run in Step 6, tag-stripped and read).

| Line (base) | Disposition | Verdict at head |
| --- | --- | --- |
| Tutorial 13 | Retained | `:13` "wraps every procedure in a KV-backed stale-while-revalidate cache" stands; scoping sentence added `:16-18` naming the callable action and excluding `getCachedEntry`. Accurate: the factory action *is* SWR by default (`revalidateOnStale = true`, `cache-query.ts:108`). |
| Tutorial 15 | Retained | `:15` "refreshes in the background" — the immediately following sentence `:16-18` scopes it. OK. |
| Tutorial 32 | Corrected | `:34-35` "the KV-only `getCachedEntry()` metadata read". OK. |
| Tutorial 75/76 | Retained | `:77-79` still says the factory does SWR; post-code scoping `:89-90` "The callable procedure action owns that stale policy. `getCachedEntry(input)` only inspects…". OK. |
| Tutorial 80 | Corrected | `:83` comment names callable actions. OK. |
| Tutorial 94 | Corrected | `:100` table row: "does not evaluate staleness or fetch". OK. |
| Tutorial 100 | Corrected | `:106` callout: pure KV read; "does not evaluate staleness or start revalidation; the callable action or page/client policy must do that explicitly". OK. |
| Tutorial 107 | Corrected | `:112-117` action-then-metadata composition with the A4 posture clause. OK. |
| Services SDK 138 | Retained | `:138` "the SWR primitive a layer loader uses to decide stale-reload" — describes the loader's use of `cachedAt`; the corrected `:188` example gives the mechanism. Acceptable. |
| Services SDK 188 | Corrected | `:188` action with `preferFreshOnStale: true` → `getCachedEntry` → `entry ?? { data, cachedAt: Date.now() }`. OK. |

- Same-class false claim still standing on either page? **None found.** Remaining "cache-first"
  wording (`:3,:9,:23,:75,:77,:105,:145`; `sdk.md:17,25,26,42,108,127,249`) describes the factory /
  page posture, not `getCachedEntry` behaviour, and each is now adjacent to scoping text.
- Overcorrection? **No.** Every corrected line keeps "stale-while-revalidate" attached to the
  callable action; `:113-114` explicitly says "The default callable action without the flag is the
  non-blocking SWR path". No wording implies the factory lacks SWR.
- Line-107 composition against the real API: `ordersQueries.list(input, { preferFreshOnStale: true })`
  is `ActionMethod(props, options?)` with `QueryParams.preferFreshOnStale`
  (`packages/sdk/src/ports/query-options.ts:23`, `query-factory.ts:73-82`), and
  `query-factory_test.ts:141-149` executes precisely this composition. **Works.**
- A4 posture clause accuracy: default `revalidateOnStale = true`, `preferFreshOnStale = false`
  (`cache-query.ts:108-109`) → non-blocking SWR; with the flag a stale reader joins the
  persistence-complete operation, so the subsequent `getCachedEntry` observes the refreshed
  timestamp (`query-factory_test.ts:218-224` asserts `cachedAt > staleTimestamp` and equal across
  both readers). **Accurate.**
- **A1:** `.llm/tools/docs/check-accuracy-and-discoverability.ts` has `requireText`/`forbidText`
  (`:11`, `:17`) and no `getCachedEntry`/`03-sdk-cache-first`/`live-dashboard` marker
  (`grep -n` returns none). The `docs-accuracy` receipt therefore cannot prove the S2 page-level
  sentence. I checked `worklog.md:174,199-200`, `context-pack.md`, and the S2 PR comment
  (2026-08-15T18:59:41Z): each states the receipt is *not* cited for that sentence. No claim to
  reject. My own judgement against the rendered page: the page names the callable action as the
  SWR path (rendered lines 1295-1296, 1365), names `getCachedEntry()` as a KV-only read (1296,
  1323, 1403), and demonstrates action-then-metadata (1410-1414). **S2 page-level sentence holds —
  manual evidence, this session.**

Advisories (non-blocking, outside authorized scope — reported for ruling, not edited):
- `docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md:124` and
  `docs/site/web-layer/layers.md:184` still show pure-`getCachedEntry` loaders (no false
  revalidation *claim*, but chapter 3 now teaches the action-then-metadata shape and chapter 4 does
  not follow it — a cross-chapter inconsistency). `docs/site/index.vto:71` homepage snippet is
  the base-style read-then-fallback loader; it makes no revalidation claim.
- `sdk.md:188` / tutorial `:116` fallback `entry ?? { data, cachedAt: Date.now() }` only covers a
  cold cache. If the write fails on a *warm stale* cache, `getCachedEntry` returns the old stale
  entry (old data + old `cachedAt`) even though fresh `data` was fetched. Truthful about the
  common path; the "fail safe if persistence did not land" comment slightly overstates it.

## Step 6 — generated cascade

Cascade files in the diff: exactly `.llm/assets/agent-docs/prose.json.gz`,
`.llm/assets/agent-docs/provenance.json`, `packages/cli/src/kernel/assets/agent-docs.generated.ts`,
`packages/mcp/src/publish-assets.generated.ts`. **Only the four declared mirrors — confirmed.**

Idempotence, executed at head in order:

```
deno task gen:agent-docs-prose   → site build OK (227 HTML files), bundle sha256 c8491e53…, exit 0
deno task gen:assets-barrel      → exit 0
deno task gen:publish-assets     → exit 0
git status --short               → (empty)
deno task check:agent-docs-prose → {"fresh":true,"stalePaths":[]}  exit 0
deno task check:assets-barrel    → exit 0 (git diff --exit-code over 7 generated targets)
deno task check:publish-assets   → exit 0
git status --short               → (empty)
```

Regeneration reproduces the committed mirrors byte-for-byte. **Confirmed.**

## Step 7 — gates and honesty

| Gate | Executed result | vs run record |
| --- | --- | --- |
| Focused cache + factory tests | PASS 11/11 | matches (5 + 6) |
| SDK check / lint / fmt (scoped wrappers) | 84 files, 0 occurrences / 0 / 0 findings | matches |
| Root check (`deno task check` args, run uncached via wrapper) | 2925 files, 25 batches, 0 failed | matches |
| Root tests (`deno task test`) | PASS: passed 4206, failed 0, ignored 19, total 4225, exit 0 (`deno task test`, single run) | matches (4,206/0/19) | — |
| `quality:gate` | exit 0; repo scan 0 findings; SDK `FAIL=0 WARN=1 INFO=1` (F-16 13 children) | matches |
| `arch:check` | exit 0 | matches |
| `docs:accuracy` | PASS (its own checks; not S2-sentence evidence) | matches, correctly scoped |
| JSR audit `packages/sdk` | exit 0; F-DOCT-5 13-child WARN + F-JSR-7 banner WARN | matches |
| `git ls-tree` `packages/sdk/src` base / head | 13 / 13 | pre-existing, unchanged — confirmed |
| Package raw `deno publish --dry-run --allow-dirty` | `Success Dry run complete`, exit 0, no slow-type diagnostic | matches |
| Doc-lint 14a (12 entrypoints) | exit 1, exactly 3 `private-type-ref`: `QueryClientPort`→`QueryClient` `src/ports/query-client.ts:41:1`; `createNetScriptQueryClient`→`QueryClient` `src/query-client/query-client-factory.ts:44:1`; `DurableStreamProducerOptions["instrumentation"]`→`StreamsInstrumentation` `packages/plugin-streams-core/src/application/create-durable-stream.ts:41:3` | matches pin; expected red, not a pass |
| Doc-lint 14b (`./src/cache/mod.ts`) | exit 1, exactly 3: `KvCacheStore`→`CacheStore` `kv-cache-store.ts:48:1`; `KvCacheStore.prototype.get`→`CacheKey` `:97:3`; `…get`→`CacheStoreEntry` `:97:3` | matches pin; expected red |
| `surface:diff` head | exit 1, "517 undeclared major change(s)" | run record says **524** — see note |
| `surface:diff` base (detached worktree at `3e8e146a4`, removed afterwards) | exit 1, 517; `@netscript/sdk` lines identical to head (`diff` empty, 105 lines each) | **no regression — confirmed** |
| Root `publish:dry-run` | `Success Dry run complete`, exit 0 | matches | — |
| #1667 queue flake | did not occur in the single root run; no rerun performed | matches | — |

Honesty notes:
- The run record's `surface:diff` figure (524) does not reproduce here (517 at both base and head).
  The record never presents the count as a verdict, and the equality test is what matters, so this
  is a stale number, not a misstatement of outcome. Non-blocking.
- No gate is described in the run record with an expectation it cannot evaluate; the one candidate
  (validation row 7's "chapter 3 satisfies the S2 sentence" under `docs-accuracy`) is explicitly
  disclaimed at `worklog.md:116-123,174` and in the S2 PR comment. The plan row itself
  (`plan.md:237`) still carries that wording — advisory: amend the plan row so the expectation
  matches the tool's capability.
- Doc-lint results are named diagnostics, not counts. Root check was executed uncached.
- Nothing in the record claims Aspire/Docker/e2e ran; I ran none.

## Tier-A / brief claims — confirm/refute ledger

| Claim | Verdict |
| --- | --- |
| Predicate defect pre-exists at base `:170`, exposed by S2, not S1 | **Confirmed** |
| Fresh-hit assertion fails against old predicate | **Confirmed by execution** (`Expected seeded-fresh, got fetched`) |
| Three predicate branches proven in `query-factory_test.ts` | **Confirmed** |
| `cache-query_test.ts` untouched after S1 | **Confirmed** |
| Overlap proof sleep-free / deterministic | **Confirmed** |
| Persistence-complete ownership, non-fatal write, fetch-only rejection | **Confirmed** |
| PR #1665 fail-safe intact, no broadened catch | **Confirmed** |
| Every disposition applied; no overcorrection; no standing same-class false claim | **Confirmed** |
| A4 clause accurate; line-107 composition executes against real API | **Confirmed** |
| Cascade = four mirrors, idempotent | **Confirmed** |
| Doc-lint pins (3 + 3 named) | **Confirmed** |
| `surface:diff` base == head | **Confirmed** (count 524 in record vs 517 observed — refuted as a figure, immaterial to verdict) |
| F-DOCT-5 13 children pre-existing | **Confirmed** |
| Root check 2925/25/0 | **Confirmed** |
| Root tests green | **Confirmed** (4206/0/19) |

## Verdict

**PASS**

Blocking items: none. Approved scope is complete on exactly the authorized surface; every required static/fitness/runtime gate was re-executed here with the stated results; the known reds (`surface:diff`, F-DOCT-5, the two pinned doc-lint invocations) are unchanged base→head and are stated honestly as reds; no doctrine violation was introduced or deepened; run artifacts are current.

Advisories (non-blocking): unit-level fresh+flag case in `cache-query_test.ts`; chapter 4 / `layers.md` / homepage loaders not yet on the action-then-metadata shape (ruling needed, out of this leaf's authorized scope); warm-stale write-failure caveat on the `??` fallback; stale `524` surface:diff figure; `plan.md:237` wording vs `docs-accuracy` capability.
