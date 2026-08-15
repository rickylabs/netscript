# Tier-A plan review — PR #1669 (`sdk-cached-entry-swr`, #1461)

| Field | Value |
| --- | --- |
| Reviewed head | `eadd672d06bd701c4014156dfbbb31e09c9d3e19` — local == remote == PR, clean, draft, sole `status:plan` |
| Amendment commit | `eadd672d0 docs(harness): authorize live-dashboard cache claim` (prior `ebf8977c1`, plan head `7e5be1514`) |
| Base | `main@3e8e146a4` (the #1665 merge) |
| Phase proof | `git diff --name-only origin/main..HEAD` outside `.llm/runs/` is **empty** — plan-only, no product mutation |
| Author | Codex `01a00646-82a9-7ec2-88e7-16dea98a58fa`, `gpt-5.6-sol` · medium — preserved, route matched |
| Verdict | **FAIL_FIX** — one blocking finding; bounded plan repair before PLAN-EVAL |

## Scope amendment — landed correctly

PR body now declares **"Authorized docs sources (exactly two)"** and names the second page with its
false clause, adding "No third docs source is in scope." `research.md` and `plan.md` moved the entry
out of "reported, not edited". The residual "reported, not edited" line (`plan.md:198`) refers to a
hypothetical **third** claim — correct posture, not stale text.

Credit where due: the plan had **already found** the tutorial claim (`plan.md:189`) and refused to
edit it, classifying it as a frozen-contract expansion requiring a ruling. The widening vindicates
that report rather than correcting an oversight.

## Doc-lint baseline — reconciled exactly, as required

Measured at this head with the exact commands the plan pins (rows 14a/14b):

| Invocation | Occurrences | Unique named symbols | Exit |
| --- | --- | --- | --- |
| Combined, 12 entrypoints | **3** | **3** | 1 |
| `./src/cache/mod.ts` alone | **3** | **2** | 1 |

**The occurrences-vs-symbols distinction the coordinator asked for is real and lands in 14b.**
`KvCacheStore.prototype.get` emits **two** diagnostics at the same location (`:97:3`) — one for
private `CacheKey`, one for private `CacheStoreEntry` — so the cache invocation is 3 occurrences
across only 2 named symbols. The pinned "six" is therefore **six diagnostic occurrences across two
invocations, spanning five unique named symbols**, not six symbols. The plan states this correctly:
row 107 resolves "six" as "the sum of two separate expected-red invocations, each with exactly three
named diagnostics", and 14a/14b enumerate all six by name **and** location. Diagnostic 3 of the
combined set is external (`plugin-streams-core`) and the plan says so. Both invocations are pinned
expected-exit-1 and explicitly "never report as a pass". **Accurate, auditable, no change needed.**

## Verified sound

| Item | Finding |
| --- | --- |
| Docs-only API choice | `queryEntry` **rejected** (row 108) — the existing callable action plus metadata read satisfies acceptance without a parallel public policy surface. Correct: the issue is a false doc claim, and a new public API to fix prose would be the wrong remedy. |
| Persistence-complete inflight | D4 puts fetch **and** persistence in the in-flight map; risk row 115 resolves joiners only after write completion **"or the existing fail-safe write handling completes"** — which correctly prevents a #1665 write failure from hanging joiners forever. That second clause is the non-obvious part and it is present. |
| Deterministic two-reader proof | D5 requires two overlapping readers plus a **manually blocked fetcher**, stating a sequential or single-reader test cannot establish exactly-one refresh; row 114 requires asserting both overlapping returns **before** releasing the refresh; gate 1 pins call count exactly `1`. Genuinely deterministic, not timing-hopeful. |
| #1665 fail-safe preservation | A13, D6, and risk row 116 keep request-local admission and the read-span prologue unchanged, retain the captured-parent background write span, detached failure handling, and non-fatal foreground cache-write behaviour. AP-10 row 127: "do not broaden catches beyond that owned boundary." |
| Cascade paths and gates | S2 declares the four generated mirrors and their freshness gates (`check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`, `docs-source-format`, `docs-accuracy`); `plan.md:210` requires any fifth generated path to be inspected and recorded before commit. |
| No hidden public surface | No public type files planned; `deno doc` comparison plus package and root publish dry-run pinned (`plan.md:119`). |
| Excluded reds | #1667 (queue flake), #1668 (`check:mcp-export-corpus`), `surface:diff`, JSR `F-DOCT-5` all explicitly out of scope (`plan.md:72`). No Aspire/Docker/`e2e:cli`; no runtime lease acquired by this review. |

## Blocking finding

### T-1 — the authorized page still teaches background revalidation for the loader it demonstrates

Correcting line 100 alone does not make the page true. My sweep of the **same authorized page** found
the identical story asserted five more times:

| Line | Text |
| --- | --- |
| 13 | "wraps every procedure in a KV-backed **stale-while-revalidate** cache" |
| 15 | "…and **refreshes in the background** instead of blocking the person watching it" |
| 75 | "last-known answer instantly, **then revalidate in the background**" |
| 76, 80 | "a KV-backed **stale-while-revalidate** layer" / "Server-side query factories — KV-backed **stale-while-revalidate**" |

Line 107 of the same page then instructs the reader to use
`await ordersQueries.list.getCachedEntry(input)` in the page loader — the **pure read** that performs
no revalidation. So the page promises stale-while-revalidate and demonstrates a loader that does not
do it. Line 100 is simply where the conflation became explicit enough to cite in #1461.

Note these lines are **not individually false**: the factory genuinely offers SWR through `query()`
(`cache-query.ts` `revalidateInBackground`). The falsehood is the *implication* created by pairing
them with a `getCachedEntry` loader — which is exactly the defect #1461 exists to remove. The remedy
is therefore not deletion; it is making the page distinguish the policy path from the pure read.

**The plan is ambiguous on precisely this point, and the ambiguity decides what "done" means:**

- Scope (`plan.md:57-61`) commits only to replacing the **line-100 clause**, with good replacement
  wording.
- S2 acceptance (`plan.md:157`) promises the broader "**both docs pages distinguish policy execution
  from the pure KV read**".

An implementer can satisfy the narrow scope text and claim the broad acceptance. Since the
coordinator's Tier-A charge is explicitly "no other false `getCachedEntry`/revalidation claim left in
the touched documentation story", this must be pinned before PLAN-EVAL rather than discovered at
IMPL-EVAL.

**Required repair:** reconcile `plan.md:57-61` with `plan.md:157` by giving an explicit **per-line
disposition** for lines 13, 15, 75, 76, and 80 — each either corrected (with the replacement wording)
or explicitly retained with the justification that it describes the `query()` policy path, plus the
statement of how the page as a whole stops implying the demonstrated loader revalidates. Plan-only.

## Non-blocking observation

`docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md:231` describes
`.withPolicy('balanced')` as "serves cache-first and **revalidates in the background**". That is a
third page, correctly **out of scope** under the exactly-two ruling, and it is plausibly **true** of
`withPolicy` rather than same-class false. Reported, not to be edited — recorded so the sweep result
is complete rather than silently narrowed.

## Outcome

Tier-A **FAIL_FIX** at `eadd672d0`. One blocking finding, plan-only repair. PLAN-EVAL is **not**
requested yet; it follows a re-review of the repaired head. No implementation, no evaluator, no
readiness or label change, no runtime lease.

---

# Tier-A re-review — repaired head `23db20f301d06ed1e4a9a65cbbf64349f89cb8c0`

| Field | Value |
| --- | --- |
| Head | `23db20f301d06ed1e4a9a65cbbf64349f89cb8c0` — local == remote == PR, clean, draft, sole `status:plan` |
| Repair commit | `23db20f30 docs(plan): pin tutorial SWR dispositions` (from `eadd672d0`) |
| Plan-only proof | `git diff --name-only origin/main..HEAD` outside `.llm/runs/` is **empty** |
| Verdict | **PASS** |

## T-1 — RESOLVED, and more completely than the finding required

The plan gained a **Published-claim dispositions** table. It covers **nine** source lines, where the
finding named five: `13`, `15`, `32`, `75`, `76`, `80`, `94`, `100`, `107` — plus `Services SDK 188`
on the first authorized page.

**My independent re-sweep of the authorized page returns exactly `13 15 32 75 76 80 94 100 107` —
identical to the table.** Nothing is unaccounted for, and the author found `32`, `94`, and `107`
which my sweep had seen only as context.

The dispositions take the correct shape — neither deletion nor overcorrection:

- **Retained** (13, 15, 75, 76): each accurately describes the factory's callable policy path, and
  each gains required *nearby* scoping text naming the callable action and expressly excluding
  `getCachedEntry()` from the refresh mechanism. The table states "Nearby text is part of the
  required edit, not optional explanatory prose", which closes the loophole of retaining a line and
  adding nothing.
- **Corrected** (32, 80, 94, 100, 107): wording supplied for each.

**Line 107 is the sharpest fix and the one that actually removes the defect.** It replaces
pure-read-only loader guidance with a policy-aware composition — `await ordersQueries.list(input,
{ preferFreshOnStale: true })` first, then `getCachedEntry(input)` for `{ data, cachedAt }` — and
states the metadata read alone never fetches. The false implication was created by demonstrating a
pure-read loader under an SWR promise; fixing the demonstrated loader removes it at the source rather
than papering over the prose.

**The one-sentence page-level acceptance now exists** (`plan.md:82-86`): "Taken as a whole, chapter 3
identifies the callable procedure action as the SWR policy path, identifies `getCachedEntry()` as a
KV-only metadata read, and demonstrates the loader composing the action before the metadata read, so
it no longer implies that the demonstrated `getCachedEntry()` loader revalidates." Validation gate 7
(`docs-accuracy`) now requires "every published-claim disposition is implemented, and chapter 3
satisfies the one-sentence S2 page-level acceptance criterion", so the narrative criterion is
mechanically gated rather than aspirational. The scope-vs-acceptance ambiguity is gone.

## Nothing else moved

| Check | Result |
| --- | --- |
| Doc-lint pin (rows 14a/14b) | **untouched** by the repair diff — still six occurrences across two invocations, five unique symbols, both expected-exit-1 and never reportable as a pass |
| #1665 fail-safe / persistence-complete inflight / deterministic two-reader commitments | intact |
| Authorized docs sources | still **exactly two** |
| Excluded reds | #1667, #1668, `surface:diff`, `F-DOCT-5` still out of scope; gate 16 additionally requires reporting the queue flake once with the exact `expected 1, got 2` and **no green-seeking rerun** |
| Phase | plan-only; no product mutation; PR draft at sole `status:plan`; no runtime lease |

## Process note

The first dispatch of this repair reported `*** NOT DELIVERED ***`. That was a **bug in this
session's own verification script** — `BEFORE` captured two lines, so the integer comparison errored
— not a delivery failure. The substantive proof (`rollout occurrences after dispatch: 3`, up from
`0`) and the resulting commit both confirm delivery. The delivery-proof discipline itself remains
correct and stays in force; the comparison is what needed fixing.

## Outcome

Tier-A **PASS** at `23db20f301d06ed1e4a9a65cbbf64349f89cb8c0`. Proceeding to exactly one separate
native Claude Fable 5 · medium · Remote Control PLAN-EVAL over this immutable head. No implementation
before its PASS.

---

# Tier-A — implementation slice S1 at `e100ea205b16a8ed22dbdb6b587212a852d6c416`

| Field | Value |
| --- | --- |
| Head | `e100ea205b16a8ed22dbdb6b587212a852d6c416` — local == remote == PR, clean, draft, sole `status:plan` |
| Commits | `e05a54145 fix(sdk): dedupe stale refresh persistence`, `e100ea205 refactor(sdk): simplify cache query lifecycle` |
| Verdict | **PASS** |

## Scope — exact

`packages/sdk/src/cache/cache-query.ts`, `packages/sdk/tests/cache/cache-query_test.ts`, plus three
run artifacts. No docs page, no `query-factory_test.ts`, no generated mirror — all correctly deferred
to S2.

## F-1 metric gaming — rejected, then honestly resolved

The coordinator's pre-review finding is **confirmed** against the committed base, not accepted on
report. At `e05a54145` the file was 499 lines with **zero** JSDoc on `queryInsideSpan`, `getInflight`,
`fetchAndCacheOnce`, `fetchAndCache`, `revalidateInBackground` — all five carried JSDoc at base — with
7 comment lines removed against 1 added, landing one line inside the 500 boundary.

After the finding, `e100ea205` reaches **497 lines with all five JSDoc blocks restored**. The
line-class comparison is what proves this is structural rather than cosmetic:

| Class | Base `d555cc971` | S1 `e100ea205` |
| --- | --- | --- |
| total | 490 | 497 |
| blank | 30 | **30** — identical |
| comment / JSDoc | 39 | **40** — one more than base |
| code (derived) | 421 | 427 |

Blank-line structure untouched, comments slightly **above** base, and code grew only 6 lines while
absorbing the whole A2/A3 behaviour — real duplication was removed. Strictly better than the rejected
499 on every axis, and with genuine headroom instead of one line.

`worklog.md:91` was corrected to record what happened: "Coordinator rejected the initial
comment/spacing deletion as F-1 metric gaming. Restored all useful documentation and structure, then
reduced real duplication; honest file is 497 lines." The quality row records a re-run on the restored
source. No extraction proposal was needed, so nothing is pending a scope ruling.

**Delivery race, recorded honestly.** The finding was dispatched while the author was mid-turn; the
sender retried on `already has an active writer` for 18+ attempts while `e05a54145` was committed and
pushed. Delivery was then proven by rollout grep (0 → 2). The practical guarantee a supervisor can
offer is "before the author's current turn ends", not "before commit" — there is no safe way to
inject into a live Codex turn, and corrupting one is worse than a late finding. Consequence was
bounded: draft PR, no verdict bound to that head, remedied by a follow-up commit.

## A2 and A3 — implemented, verified

- **A2** — `cache-query_test.ts:146` "CacheQuery blocking joiner receives data when background
  persistence fails". Exactly the required case: fetch succeeds, write fails, joiner still receives
  data, inheriting #1665's non-fatal-write behaviour.
- **A3** — `this.inflightRequests.set(key, operation)` (`cache-query.ts:263`) registers
  **synchronously** in the scheduling reader's turn, with `.finally()` cleanup at `:260-262`.
- **Sleep-free determinism confirmed by execution**: `grep -n 'sleep\|delay(' cache-query_test.ts`
  returns **nothing**. The overlapping-reader proof (`:97`) is ordering-based, not timing-based — the
  specific thing a "simplify" refactor could have quietly reintroduced.

## Gates — executed by this review

| Gate | Result |
| --- | --- |
| `cache-query_test.ts` | **5 passed / 0 failed** |
| `packages/sdk` suite | **68 passed / 0 failed** (66 at #1665 merge; +2 new) |
| check / lint / fmt (84 files) | 0 / 0 / 0 findings |
| `quality:scan` | `ok:true`, 0 findings, 7 known allowances, **no F-1** |
| Raw doc-lint combined / cache | 3 / 3 — pins unchanged, both still expected-red |

## Outcome

S1 Tier-A **PASS** at `e100ea205`. Proceeding to S2 (docs correction, factory-loader regression, and
the four-mirror cascade) carrying advisories **A1** (S2 page sentence is manual evidence — a
`docs-accuracy` receipt must not be cited as proof) and **A4** (line-107 posture clause).

---

# Tier-A — plan-only amendment S2-A at `ef3e43f06c807356aeabfc172427239bcafd5144`

| Field | Value |
| --- | --- |
| Head | `ef3e43f06c807356aeabfc172427239bcafd5144` — local == remote == PR, draft, sole `status:plan` |
| Commit | `docs(harness): amend S2 fresh-hit scope` |
| Verdict | **PASS** |

## Commit hygiene — the hazard this amendment was most likely to hit

| Check | Result |
| --- | --- |
| Paths in the commit | **exactly 5**, all under `.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/` (`context-pack.md`, `drift.md`, `plan.md`, `research.md`, `worklog.md`) |
| Non-run-artifact paths | **0** |
| Three in-progress S2 files | still **modified-but-uncommitted**: `docs/site/services-sdk/sdk.md`, `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md`, `packages/sdk/tests/query/query-factory_test.ts` |

A reflexive `git add -A` here would have swept in-progress S2 source into the amendment commit and
destroyed the plan-only property of the very head under review. It did not happen. Verified by
executed command rather than accepted from the slice report.

## Exact condition — as ruled

`plan.md:79` states the correction verbatim:

```ts
if (isExpired || (!isFresh && preferFreshOnStale)) {
```

`plan.md:85` records that expired precedence is unchanged and that only a stale entry with
`preferFreshOnStale` enters the blocking path. Risk row `:185` re-pins the same predicate, and
`plan.md:145-146` states the failure mode plainly — applying the blocking preference before the
fresh-hit branch without a `!isFresh` guard "silently converts a fresh hit into an upstream fetch and
falsifies the published contract". A fresh non-expired entry therefore falls through to the existing
`if (isFresh) return cached.value.data`.

## Baseline citation — correct, and independently reproduced

`drift.md:133` cites the defect at **both** `main@3e8e146a4:170` **and** accepted S1 head
`e100ea205:165`, before `if (isFresh)`. `:134` classifies it as a "pre-existing baseline defect
exposed by S2, not introduced by S1". This review reproduced both locations directly. Citing the S1
head alongside the base is the right call — it forecloses any later reading of this as an S1
regression.

## Query-factory-only proof — sufficient, no further path needed

`query-factory_test.ts` constructs `new CacheQuery(store)` against a `MemoryCacheStore` and installs
it via `setCacheProvider` (`:57-58`, `:80-81`). It therefore controls the store directly, can seed an
entry with a chosen timestamp, and can count loader invocations — everything required to prove
"fresh + `preferFreshOnStale` ⇒ no fetch", "stale + flag ⇒ blocking fetch", and "expired ⇒ fetch".

**The granted surface is adequate; `cache-query_test.ts` is not needed** and correctly stays
ungranted. The amendment does not ask for it.

## S1 preservation

Risk row `:185` requires retaining expired precedence, **all A2/A3 machinery and documentation**, and
re-running focused/full SDK plus `quality:gate` with the file remaining below the F-1 threshold.
`plan.md:273` scopes S2-A to "only the exact fresh-hit predicate correction". The change is a
one-line predicate edit, so the 497-line / no-F-1 result is unaffected by construction. The amendment
commit touched no source at all, so S1's landed behaviour is intact at this head by definition.

## Outcome

S2-A Tier-A **PASS** at `ef3e43f06`. Resuming the same original author for the single-line source
correction and S2 continuation. No evaluator, no runtime lease, PR stays draft at sole `status:plan`.

---

# Tier-A — S2 final at `9aa54ae2d4f53c705b0309ed472abf7bbccebe41`

| Field | Value |
| --- | --- |
| Head | `9aa54ae2d4f53c705b0309ed472abf7bbccebe41` — local == remote == PR, clean, draft, sole `status:plan` |
| Commits | `eba0b0924 fix(sdk): honor stale-only fresh preference` (content), `9aa54ae2d docs(harness): record S2 validation` (evidence) |
| Verdict | **PASS** — implementation complete across S1, S2-A, S2 |

## Scope — exact, nothing undeclared

`cache-query.ts`, `query-factory_test.ts`, the two authorized docs pages, **exactly** the four
declared mirrors, and three run artifacts. **`packages/sdk/tests/cache/cache-query_test.ts` is
untouched** — the ungranted path stayed ungranted, and the S2-A judgement that the factory surface
would suffice is borne out below.

## The S2-A correction — RED proven independently

`cache-query.ts:165` now reads `if (isExpired || (!isFresh && preferFreshOnStale))`.

I did not take the RED on report. A detached worktree at the pre-fix head `ef3e43f06` (predicate
`isExpired || preferFreshOnStale`) with the new test copied in gives:

```
exitCode 1 — 5 passed / 1 failed
"Expected seeded-fresh, got fetched"
  published loader runs cache policy before reading persisted metadata (:129)
```

At `9aa54ae2d` the same test is **6 passed / 0 failed**. The defect and its fix are demonstrated on
the real code path. Worktree removed afterwards; the leaf tree was never touched.

All four branches are proven inside `query-factory_test.ts:129`, against a `MemoryCacheStore` with a
seeded timestamp and a loader call counter: **fresh + `preferFreshOnStale: true` ⇒ `clientCalls === 0`**
and `cachedAt === freshTimestamp` (the regression that was missing), missing ⇒ fetch, expired ⇒ fetch,
stale ⇒ blocking refresh replacing the stale timestamp. The granted surface was sufficient.

## S1 preserved

497 lines; JSDoc intact on all five private methods (1/1/1/2/1); no F-1 finding. A2/A3 machinery
untouched by the predicate edit.

## Documentation contract

The false clause "the stale entry refreshes in the background" is **gone**. Retained-line scoping text
is present (`:17-18`: "`getCachedEntry(input)` is a separate KV-only metadata read and never
schedules a refresh"); the API table entry is corrected (`:100`); the pure-read contract is stated
(`:106`). The A4 posture clause is complete (`:114-118`): the loader composition, plus "The default
callable action without the flag is the non-blocking SWR path; this loader chooses
`preferFreshOnStale: true` so `cachedAt` reflects the refreshed value."

Sweep of both authorized pages finds **no surviving same-class false claim**. One grep hit at
`sdk.md:188` is a **negation** inside the corrected snippet — "getCachedEntry is a KV-only metadata
read; it never fetches or revalidates" — and that snippet also preserves the fail-safe fallback
`entry ?? { data, cachedAt: Date.now() }`.

**A1 handled correctly:** `worklog.md:116-119,200` records the S2 page-level sentence as manual
evidence and states explicitly that the `docs-accuracy` PASS "must not be cited as proof of that
sentence". That is the supervisor error this topic made and the previous evaluator corrected; the run
record now reflects the truth.

## Cascade — idempotent, not merely generated

All three freshness gates (`check:assets-barrel`, `check:publish-assets`, `check:agent-docs-prose`)
**PASS**, and the working tree stays **clean** afterwards. Regeneration reproduces the committed
mirrors rather than having been run once — the stronger form of the claim.

## Gates — executed by this review

| Gate | Result |
| --- | --- |
| `query-factory_test.ts` | **6 / 0** (pre-fix: 5 / 1) |
| `packages/sdk` suite | **69 / 0** (68 at S1) |
| check / lint / fmt (84 files) | 0 / 0 / 0 |
| **root `deno task test`** | **4206 passed / 0 failed / 19 ignored** — no #1667 recurrence |
| **root check, uncached wrapper** | **2925 files, 25 batches, 0 diagnostics** |
| Raw doc-lint combined / cache | 3 / 3 — pins unchanged, both still expected-red |
| `quality:scan` | `ok:true`, 0 findings, 7 known allowances |
| `arch:check` | **FAIL=0** |

Root check was re-run through the underlying wrapper rather than accepting a `deno task` cache line.

## Receipt

The structured implementation receipt is present on the PR:
`[PHASE: IMPL] [VERDICT: COMPLETE]` at 2026-08-15T18:59:41Z naming head `9aa54ae2d…`. Nothing was
missing and no author round-trip was needed to obtain it.

## Outcome

S2 Tier-A **PASS** at `9aa54ae2d`. Proceeding to a separate native Claude Fable 5 · medium · Remote
Control IMPL-EVAL bound to this exact head. No runtime lease; PR remains draft at sole `status:plan`.
