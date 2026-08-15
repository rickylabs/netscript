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
