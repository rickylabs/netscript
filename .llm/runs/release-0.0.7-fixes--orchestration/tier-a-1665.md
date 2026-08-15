# Tier-A plan review — PR #1665 (`sdk-cache-surface-and-telemetry`)

| Field | Value |
| --- | --- |
| Reviewed head | `20e7aed418efb46c23897debf610fb74b0c4fbef` (local == remote == PR, draft, clean) |
| Prior head | `89be8da76c127886842229f381889bfb7fdbc8ba`; delta `89be8da76..20e7aed41` = `context-pack.md` + `worklog.md` only |
| Product tree | `git diff baf1cdf67..20e7aed41 -- packages/ plugins/ tools/ deno.json deno.lock` is **empty** — artifact-only, so every source receipt below binds to `20e7aed41` |
| Reviewer | topic orchestrator (Claude Opus 5 · high), separate session from the Codex plan author `01a00516-2033-7ed3-936a-a616cee47447` |
| Verdict | **FAIL_FIX** — three blocking findings; bounded plan repair required before PLAN-EVAL |

## Verdict rationale

The plan is well-researched and its two hardest elements — the D1 telemetry vocabulary and the D1
real-KV RED — are correct and, in the RED's case, empirically reproducible. The failures are all in
the *seam ordering* of D2/D3 and in the doc-lint evidence command: three places where the plan
specifies a behaviour that cannot be produced at the point it is specified. None is a research gap;
all three are repairable in the plan without re-scoping the leaf.

## Blocking findings

### T-1 — D3's overflow **span event has no span** at any call site

D3 requires the over-budget namespace to "emit one `cache.namespace.overflow` span event naming that
offending normalized id", explicitly instead of `console.warn` (AP-13).

`normalizeCacheNamespace` is called at **11 sites, and every one evaluates it as an argument, before
any span exists**:

| Site | Evidence |
| --- | --- |
| `cache-query.ts:85` | `const namespace = normalizeCacheNamespace(...)` on the line *before* `this.telemetry.withSpan(...)` at `:86` |
| `cache-query.ts:305, 329, 361, 389` | same precomputed-argument shape |
| `cache-provider.ts:125, 141` | precomputed, then passed to `traceUnsupported(...)` |
| `cache-provider.ts:159, 169, 176` | evaluated *inline as an argument* to `traceUnsupported(...)` |
| `composite-query.ts:42` | module/factory level — no span and no request context at all |

The namespace cannot simply be moved inside the span, because it is itself an input to the span's
attributes: `createCacheSpanAttributes(CacheOperations.READ, namespace, this.descriptor)` is an
argument to `withSpan` at `cache-query.ts:86-87`. So D3 as written is not implementable — the plan
needs an explicit deferral seam (e.g. normalization returns/records a pending-overflow signal that
the first operation inside the span callback flushes as the event), and an explicit answer for
`composite-query.ts:42`, which has no span to flush into under any design.

This is the same structural defect the plan already correctly identifies for `validateDescriptor` in
D2 — argument-position evaluation outside the span — but D3 does not apply the lesson to itself.

### T-2 — D2's invalidation short-circuit leaves **partial unvalidated evidence** in the emit map

`recordIncompleteTopology` is `never`/throwing today (`cache-telemetry.ts:164-181`), and both
`recordCacheWrite` and `recordCacheInvalidation` rely on that throw for control flow — **neither
`catch` block has a `return`**:

- `recordCacheWrite` (`:317-328`): `catch { recordIncompleteTopology(...) }` then falls straight into
  `for (const write of report.writes)`. The plan **does** cover this ("write records error/incomplete
  evidence and returns before iterating the invalid report"). ✔
- `recordCacheInvalidation` (`:361-390`): the `catch` sits **inside** `for (const report of reports)`,
  and `invalidationsByTier.set(...)` is called **inside the `try`, before** the later throws at `:366`
  and `:378`. So a report that fails on its 3rd invalidation, or on the tier-consistency check, has
  already written entries 1–2 into the map. After D2 removes the throw, those partial entries survive
  and are emitted by the `for (const invalidation of invalidationsByTier.values())` loop at `:391`.

The plan says invalidation "skips that report, and may retain other valid bounded tier evidence".
That is ambiguous exactly where it must not be: entries from the *rejected* report are not "other"
evidence. As written, the fail-safe path can emit unvalidated topology evidence marked
`topologyComplete: true` — strictly worse than today's fail-loud behaviour, because it is silent.

The plan must state whether partial entries from a rejected report are rolled back (stage into a
per-report map and merge only on success) or deliberately retained, and must test it.

### T-3 — the plan's doc-lint command **cannot produce the named no-regression baseline** the ruling requires

Plan validation step 9 is `deno task doc:lint --root packages/sdk --pretty`. Both flags exist
(`run-deno-doc-lint.ts:87,128`) — but the report it emits is insufficient for a diagnostic-level
no-regression comparison:

- per-entrypoint results are **bare counts with no file, line, or symbol** (`./src/query/mod.ts` →
  `privateTypeRef: 31`, and nothing else);
- only the *combined* run names anything, and only at **file granularity** (3 paths, no line/symbol);
- the two modes also disagree: per-entrypoint totals sum to **50**, `combinedTotal` is **3**.

A baseline of "50" or "3" cannot distinguish a fixed pre-existing diagnostic from a newly introduced
one. Per the coordinator's ruling this must be auditable or Tier-A fails.

**It is auditable — but only via raw `deno doc --lint`, which the plan does not use.** I captured it;
the plan must adopt this as the step-9 evidence command and pin the baseline below.

## Doc-lint baseline at `20e7aed41` (strict no-regression reference)

Product tree is byte-identical to base `baf1cdf67`, so base diagnostics == head diagnostics. Both
invocations exit **1** today; the plan must never report either as PASS.

**Combined, all 12 entrypoints — 3 diagnostics:**

1. `private-type-ref`: public type `QueryClientPort` references private type `QueryClient` —
   `packages/sdk/src/ports/query-client.ts:41:1`
2. `private-type-ref`: public type `createNetScriptQueryClient` references private type `QueryClient` —
   `packages/sdk/src/query-client/query-client-factory.ts:44:1`
3. `private-type-ref`: public type `DurableStreamProducerOptions["instrumentation"]` references
   private type `StreamsInstrumentation` —
   `packages/plugin-streams-core/src/application/create-durable-stream.ts:41:3`

**Cache entrypoint alone (`./src/cache/mod.ts`) — 3 diagnostics:**

1. `KvCacheStore` references private `CacheStore` — `packages/sdk/src/cache/kv-cache-store.ts:48:1`
2. `KvCacheStore.prototype.get` references private `CacheKey` — `kv-cache-store.ts:97:3`
3. `KvCacheStore.prototype.get` references private `CacheStoreEntry` — `kv-cache-store.ts:97:3`

The author's `scope-boundary.md` claim of "three `private-type-ref` errors in `kv-cache-store.ts:48,97`"
is **verified accurate** for the cache entrypoint. Note diagnostic 3 of the combined set is in
`packages/plugin-streams-core`, not `packages/sdk` — it is not this leaf's to fix and must not be
counted as an SDK regression.

Required bar for this leaf: **these exact six named diagnostics, and no others.** Zero new.

## Non-blocking finding

### T-4 — D4's message change silently strands published documentation

`docs/site/web-layer/query-bridge.md:98` quotes the exact current string:
`[NetScript SDK] Cache provider not initialized. Add \`import '@netscript/sdk/cache';\` to your server`.
D4 rewrites that message. `docs/site/**` is outside both the declared surfaces and the coordinator's
grant, and the plan's "hidden consumer scope" list does not mention it.

This is precisely the defect class #1623 exists to fix — published prose left describing a superseded
contract. It must be recorded as a named, accepted drift with a follow-up, or the grant widened. It
must not be discovered after merge.

## Verified sound (executed, not inferred)

| Check | Result |
| --- | --- |
| **D1 vocabulary** | Exact. `recordCacheProviderError(span, operation, namespace, descriptor, event)` (`:412-428`) already sets `outcome: CacheOutcomes.ERROR` and `topologyComplete: false` internally; `CacheOperations.READ` + `CacheEvents.WRITE = 'cache.write'` (`:66`) is the correct pairing, and `CacheSpanName` includes `'cache.read'` (`:35`) so a write-failure event on the read span is coherent. |
| **D1 real-KV RED** | **Empirically reproduced.** Pre-initialising `getKv({provider:'deno-kv', path:':memory:', skipServiceDiscovery:true})` then constructing a real `KvCacheStore` (which calls argument-less `getKv()` via dynamic import, `kv-cache-store.ts:75-76`) and setting an 80,011-byte payload throws the real `TypeError: Value too large (max 65536 bytes)`, and the subsequent `get` returns `value === null`. All three `SharedKvConfig` fields exist (`packages/kv/application/shared.ts:82,87,102`). The RED is real-path, not synthetic. |
| **D2 seam choice** | Correct. `recordCacheLookup` already wraps `validateLookupChain` in `try/catch` (`:255-263`), so all validator throws (`:154,160,188,195,322,366,378`) funnel through `recordIncompleteTopology`. It is the single correct seam — subject to T-2. |
| **D2 descriptor claim** | Confirmed. `createCacheSpanAttributes(...)` is evaluated as an **argument** to `withSpan` at `cache-query.ts:86-87`, so a bad descriptor throws with no span created. |
| **Granted scope** | Exact match. Plan's four pending files == the coordinator's grant, no more: `packages/sdk/README.md`, `src/cache/cache-provider_test.ts`, `tests/cache/cache-telemetry_test.ts`, new `tests/cache/cache-query-kv-limit_test.ts`. |
| **Test paths vs real layout** | Correct despite looking inconsistent: `cache-provider_test.ts` genuinely co-locates in `src/cache/`, while cache telemetry/query tests genuinely live in `packages/sdk/tests/cache/`. |
| **Pinned test identity** | `cache-telemetry_test.ts:237` is `'cache telemetry rejects incomplete or unbounded provider evidence'`, using `assertRejects` — matches the plan's amend-not-delete description. |
| **Internal-export safety** | `packages/sdk/deno.json` exports expose `./cache` → `src/cache/mod.ts` only. A reset/helper exported from `cache-telemetry.ts` but not re-exported by `mod.ts` adds no published surface and no doc-lint entrypoint. The plan's "direct-file internal reset, no public reset export" is coherent. |
| **Cross-package (O-3 class)** | No code outside `packages/sdk` references `normalizeCacheNamespace`, `recordIncompleteTopology`, or `recordCacheProviderError`; no code outside `packages/sdk` asserts the `Cache provider not initialized` string. Consumers of `@netscript/sdk/cache` / `KvCacheStore` are `packages/cli` (incl. `write-app-files_test.ts`) and `packages/fresh` — covered by root `deno task test`, whose workspace is `packages/*`, `packages/cli/e2e`, `plugins/*`, `examples/*`, `apps/*`. The only cross-package exposure found is documentation (T-4). |
| **Every cited task/tool exists** | `surface:diff`, `check:netscript-jsr-specifiers`, `doc:lint`, `publish:dry-run`, `quality:scan`, `arch:check`, `test`, `check` all defined in root `deno.json`; `.llm/tools/fitness/audit-jsr-package.ts` present. `doc:lint` accepts `--root` and `--pretty`. |
| **Phase discipline** | Artifact-only at `20e7aed41`; PR draft; sole `status:plan`; no evaluator launched by the leaf; no Aspire/Docker/e2e run. |

## Required repairs before PLAN-EVAL

1. **T-1** — specify the deferral seam that lets the overflow event reach a span, at all 11 call
   sites, and state explicitly what happens at `composite-query.ts:42` where no span exists.
2. **T-2** — decide and state whether partial `invalidationsByTier` entries from a rejected report
   are rolled back or retained; commit to a test for the partial-failure case specifically.
3. **T-3** — replace step 9's evidence command with raw `deno doc --lint` capture (combined **and**
   cache entrypoint), and pin the six named diagnostics above as the strict no-regression baseline.
4. **T-4** — record the `docs/site/web-layer/query-bridge.md:98` drift as named accepted debt with a
   follow-up, or request a grant widening. Do not leave it undeclared.

Plan-only repair. No product code, no evaluator, PR stays draft.

---

# Tier-A re-review — repaired head `ee1b44c6d401a9edb9c8690870ea2d9151f8f504`

| Field | Value |
| --- | --- |
| Reviewed head | `ee1b44c6d401a9edb9c8690870ea2d9151f8f504` — local == remote == PR, clean, draft, sole `status:plan` |
| Repair commits | `92bf26e11 chore(sdk): repair cache contract plan` (T-1..T-3), `ee1b44c6d chore(sdk): own query bridge diagnostic plan` (T-4 five-path ruling) |
| Plan-only proof | `git diff baf1cdf67..ee1b44c6d --name-only` filtered for non-`.llm/runs/` paths is **empty** — no product, test, or docs file edited; correct for plan phase |
| Verdict | **PASS** — all four findings resolved; one non-blocking advisory |

## Finding-by-finding

**T-1 — RESOLVED.** Admission now returns a request-local decision (`namespace` + optional
first-overflow id) rather than a global pending flag; each span callback flushes the pending
`cache.namespace.overflow` signal as its first operation and *then* validates the descriptor. The
plan states the ordering explicitly, noting it will not claim two separate actions are each "first" —
the ordering conflict between D2 and D3 that the original plan would have hit. The deferral seam is
applied to every executable caller from the 11-site census, and `composite-query.ts:42` is handled
honestly: no admission and no event at factory/module level, deferred to its first real operation.
Risk register gained a matching row ("Overflow is detected before a span exists").

**T-2 — RESOLVED.** Invalidation stages each report into a fresh per-report map and merges into the
aggregate only on full success, so entries banked before a mid-report throw cannot escape. The
required test must fail **partway** — the plan states outright that a first-entry failure is
insufficient proof of rollback, which was the exact hole in the original wording.

**T-3 — RESOLVED.** Step 9 is now two raw `deno doc --lint` invocations — 9a across all 12
entrypoints, 9b across `./src/cache/mod.ts` — with all six diagnostics pinned by name and location,
"exactly these and no others", and an explicit instruction that neither red invocation may be
reported as PASS. The plan records that no count-only wrapper result can satisfy the gate, and that
the `plugin-streams-core` diagnostic in the combined run is outside the SDK and not this leaf's
regression.

**T-4 — RESOLVED under the coordinator's five-path ruling.** `scope-boundary.md` now declares
exactly five additional paths and no sixth. The superseded debt entry was genuinely **removed**, not
left alongside the fix: the final commit deletes the whole
`FOLLOWUP-DOC-QUERY-BRIDGE-DIAGNOSTIC` block from `drift.md` (13 lines), and no residual
debt/deferral language for the page survives anywhere in the run directory.

The dynamic-URL problem I raised is solved mechanically rather than by prose. The message becomes a
single-line template carrying one `<resolved import.meta.url>` token; `cache-provider_test.ts`
captures the real error, normalizes **only** the resolved URL segment back to that token, reads the
authorized docs code block, and byte-compares. It separately asserts the captured URL equals
`new URL('./cache-provider.ts', import.meta.url).href`. That makes the prefix, wording, punctuation,
hypothesis, and browser hint an automated acceptance item. The docs read is test-only; no runtime
asset or filesystem read is introduced.

Also verified: D4's new message **preserves** the existing browser/client-side clause already
shipped at `cache-provider.ts:209-211`, so D4 adds only the module identity and the two-instances
hypothesis — it does not smuggle new wording scope into an API-adjacent string.

## Advisory (non-blocking)

The docs quotation is currently a 4-line hard-wrapped `text` fence; the plan deliberately rewrites it
to a single ~450-character line so byte equality holds against the newline-free runtime string. That
is coherent and `deno fmt` does not rewrap fenced content, but the published page will render that
block with horizontal scroll. If the implementer prefers to keep the page wrapped, the test must
unwrap the block before comparison — it must not be "fixed" by loosening byte equality to a substring
check. Recorded for PLAN-EVAL and implementation; not a blocker.

## Regression check on the repair

`plan.md` hunks in `ee1b44c6d` fall only in the D4/T-4 regions and the scope/validation tables.
T-1..T-3 anchors are intact at the final head: the request-local pending-signal language, the
"merges that map into the aggregate" staging sentence, and all six `private-type-ref` baseline
entries.

## Outcome

Tier-A **PASS** at `ee1b44c6d`. Requesting the coordinator's fresh PLAN-EVAL grant. No evaluator
launched by this session; PR remains draft at sole `status:plan`; no product code exists on the
branch.

---

## Correction (recorded 2026-08-15, after PLAN-EVAL)

This artifact originally said `normalizeCacheNamespace` is called at **12 sites**. The correct count
is **11**; the evidence table in T-1 always listed 11, so the prose label was an arithmetic slip, not
a mis-reading of the source. Recount:
`git grep -n 'normalizeCacheNamespace(' packages/sdk/src` excluding the definition, imports, and the
`cache/mod.ts` re-export yields 11 — `cache-query.ts:85,305,329,361,389` (5),
`cache-provider.ts:125,141,159,169,176` (5), `composite-query.ts:42` (1). The independent PLAN-EVAL
census reported "11 calls + def" and is correct. No finding, evidence citation, or repair is affected;
only the count label. The "12 entrypoints" references elsewhere in this file refer to the SDK
doc-lint entrypoint set and are correct.

---

# Tier-A — implementation slice S1 at `0e4e26c51e9dcbac7dbd0e30eb5db19130e4d7d0`

| Field | Value |
| --- | --- |
| Head | `0e4e26c51e9dcbac7dbd0e30eb5db19130e4d7d0` — local == remote == PR, clean, draft, sole `status:plan` |
| Prior head | `cd5193b66` (PLAN-EVAL artifact); one commit `0e4e26c51 fix(sdk): make cache telemetry fail-safe` |
| Verdict | **PASS** |

## Scope — exact, no leakage

`git diff --name-only cd5193b66..0e4e26c51` = the five authorized paths plus two run artifacts:
`cache-telemetry.ts`, `cache-query.ts`, `cache-provider.ts`, `tests/cache/cache-telemetry_test.ts`,
`README.md`, `context-pack.md`, `worklog.md`. **No S2 file** (`cache-query-kv-limit_test.ts` not
created) and **no S3 file** (`cache-store.ts`, `cache-provider_test.ts`, `docs/site/**` untouched).
The uninitialized-provider message is unchanged, so the D4 wording boundary held.

## The six required proofs — verified by reading the assertions, not the names

1. **Partway third-entry rollback — PROVEN.** `cache-telemetry_test.ts:329`. The malformed report
   carries `memory/l1`, `redis/l2`, then `INVALID/durable`, so it fails on the **third** entry after
   two were staged. It asserts span `outcome=error`, `topology_complete=false`, exactly 2
   `cache.invalidate` events, that the only complete-evidence tier emitted is `['durable']` (from the
   *other*, valid report), and adds an explicit negative assertion that no complete-evidence event
   carries `l1` or `l2`. That is the T-2 hole closed and proven, not asserted.
2. **Normal data return under malformed evidence — PROVEN.** `:257` (lookup) and `:297` (write). The
   lookup case asserts the loader ran exactly once, the payload `'loaded'` returned, the span is
   `outcome=error` / `topology_complete=false` / `backend_executed=true`, and — the key line —
   `span.status === 'unset'`. Observability degrades; the application does not.
3. **Request-local first-overflow semantics — PROVEN.** `:477`.
4. **Composite construct-then-admit — PROVEN.** `:536`; `composite-query.ts:42` correctly still calls
   bare `normalizeCacheNamespace` (syntax only, no admission).
5. **`try/finally` registry reset — PRESENT.** Both cardinality tests reset before and in `finally`
   (`:483-531`, `:537-570`), so a mid-test failure cannot leak `overflow` into sibling files.
6. **Descriptor validation inside the span — PROVEN**, folded into `:477`.

## Implementation review

`recordIncompleteTopology` is now `void` and its `throw` is gone. All three call sites short-circuit
explicitly: lookup returns `CacheOutcomes.ERROR`, write gained the missing `return`, and invalidation
stages each report into a per-report `stagedInvalidations` map merged into the aggregate only after
the whole report validates. A `topologyComplete` flag is threaded to the final span attributes, so a
partially-rejected invalidation now reports incomplete rather than the previous hardcoded `true` —
better than the minimum the finding required.

`validateDescriptor` was removed from `createCacheSpanAttributes` and moved into
`recordCacheSpanPrologue`, which flushes any pending overflow event **then** validates — the stated
order. All 10 executable admission sites use `admitCacheNamespace`; every span callback calls the
prologue as its **first statement** (`cache-query.ts:92,274,323,355,395,425,455`;
`cache-provider.ts:98`). Note the import is aliased as `spanPrologue` in `cache-query.ts` — a grep for
the original symbol name misses it, which is worth remembering rather than mistaking for a gap.

## Gates — executed by this review, not accepted from the slice report

| Gate | Result |
| --- | --- |
| `run-deno-check.ts --root packages/sdk` | 0 occurrences, 83 files, 0 failed batches |
| `run-deno-lint.ts --root packages/sdk` | exit 0, 0 occurrences |
| `run-deno-fmt.ts --root packages/sdk` | 0 findings |
| `run-deno-test.ts packages/sdk/tests/cache/` | **26 passed / 0 failed** |
| `run-deno-test.ts packages/sdk/` (whole package) | **65 passed / 0 failed** |
| Raw `deno doc --lint` combined | exit 1 — **exactly diagnostics 1–3**, same names and locations |
| Raw `deno doc --lint ./src/cache/mod.ts` | exit 1 — **exactly diagnostics 4–6**, same names and locations |

Doc-lint no-regression bar is met precisely: **zero new, zero disappeared**. Neither invocation is
reported as a pass.

`cache/mod.ts` is untouched and none of `admitCacheNamespace`, `resetCacheNamespaceRegistry`,
`recordCacheSpanPrologue`, `CacheNamespaceAdmission` appear on any barrel, so the new surface stays
internal. No `console.*` was introduced. README documents both the D3 cardinality behaviour and the
D2 fail-safe contract, including that invalid reports are never partially emitted.

## Residual risk carried to later slices (not S1 blockers)

- **Cross-package coverage has not run.** I ran the whole `packages/sdk` suite rather than only the
  focused files, but `packages/fresh` and `packages/cli` consume this runtime behaviour and were not
  exercised. Root `deno task test` must run before merge readiness — this is the O-3 class and must
  not be deferred past the final slice.
- The amended `:237` test changed contract deliberately (`assertRejects` → data-returning). That is
  the approved D2 decision and is documented in README; it must be called out in the PR body so it
  is not mistaken for a weakened guard.
- Advisory 2 (process-global `@netscript/kv` needs `resetKv()`/`closeKv()` teardown) belongs to S2 and
  is still outstanding.

## Outcome

S1 Tier-A **PASS** at `0e4e26c51`. Stopping here per the coordinator's instruction: S2 is not started,
no evaluator launched, PR remains draft at sole `status:plan`.

---

# Tier-A — implementation slice S2 at `1cf76c6dd691378eddbbd9cd3c8a82d50c30fa2f`

| Field | Value |
| --- | --- |
| Head | `1cf76c6dd691378eddbbd9cd3c8a82d50c30fa2f` — local == remote == PR, clean, draft, sole `status:plan` |
| Prior head | `0e4e26c51` (S1); one commit `1cf76c6dd fix(sdk): isolate cache persistence failures` |
| PR receipt | comment `5302265198`, scope matches |
| Verdict | **PASS** |

## Scope — exact

`cache-query.ts`, new `tests/cache/cache-query-kv-limit_test.ts`, and three run artifacts. S1 files
(`cache-telemetry.ts`, `cache-provider.ts`, `cache-telemetry_test.ts`, `README.md`) are byte-identical
since `0e4e26c51`. S3 paths (`ports/cache-store.ts`, `cache-provider_test.ts`, `docs/`) untouched vs
base.

## The change

Two lines. The `try/catch` around `await this.store.set(...)` already existed and already recorded
`recordCacheProviderError`; S2 replaces `throw error` with `return data`. `recordCacheWrite` stays
outside the `try`, so only persistence is isolated — not the write-report recording.

## RED/GREEN — reproduced independently, not accepted from the slice report

I built a detached worktree at pre-fix `0e4e26c51`, copied in the S2 test, and ran it:
`exitCode 1`, 1 failure, stack `Kv.set → DenoKvAdapter.set → KvCacheStore.set →
CacheQuery.fetchAndCache`. That is the real adapter/backend limit path failing for exactly the reason
#1637 names — not a synthetic store. The worktree was then removed; the leaf tree was never touched.
GREEN at `1cf76c6dd`: focused test `1/0`, full `packages/sdk` suite `66/0` (S1 was `65/0`).

## Fail-loud boundaries

`setCachedData` keeps its uncaught `store.set` (`cache-query.ts:463`) and the new test proves it
**behaviourally** with `assertRejects(..., TypeError, 'Value too large (max 65536 bytes)')` — the
over-catching risk (AP-10) is closed by execution, not by assertion that a boundary exists.
Teardown is `try/finally` with **both** `await closeKv()` and `await resetKv()`; both are `async`, so
awaiting matters.

Investigated and cleared: `cache-query.ts:290-305` is a second `queryFn`+`store.set` pair on the
background-revalidation path that still throws. Its call site ends in `.catch(() => {})` which keeps
failures detached from the stale-data caller while the span still records the provider error. Correct
by design and pre-existing — no finding.

## Gates — executed by this review

| Gate | Result |
| --- | --- |
| `run-deno-check.ts --root packages/sdk` | 0 occurrences, 84 files |
| `run-deno-lint.ts --root packages/sdk` | exit 0, 0 occurrences |
| `run-deno-fmt.ts --root packages/sdk` | 0 findings |
| focused real-KV test | 1 passed / 0 failed |
| `packages/sdk` suite | 66 passed / 0 failed |
| raw `deno doc --lint` combined / cache entrypoint | exit 1 — exactly the six pinned diagnostics, zero new |
| root `deno task check` | cached, inputs unchanged, 0 diagnostics |
| root `deno task test` | see below |

## Root-suite flake — recorded, not an S2 regression

My first root run at `1cf76c6dd` was **RED**: `4202 passed / 1 failed / 19 ignored`. The failure was
`packages/queue/tests/typed-queue_test.ts:31` — "createTypedQueue sends invalid dequeue messages to
the configured DLQ store", `AssertionError` expecting 1 DLQ record and getting 2. That contradicted
the author's `4203/0/19` receipt, so the receipt was not accepted until resolved.

Causation established rather than assumed:

- the queue test passes **alone** (`3/0`) and passes **in one process with the new KV-limit test**
  (`4/0`) — no direct contamination;
- the branch touches **nothing** under `packages/queue` (`git diff --name-only base..HEAD | grep
  queue` is empty), and the test file is unchanged since `317e4b509` (0.0.1-beta.5);
- a **second root run at the identical head returned `4203 passed / 0 failed / 19 ignored`**,
  reproducing the author's receipt exactly.

Same tree, one red run and one green run ⇒ **non-deterministic**. The mechanism is visible in the
test: it polls up to 200 ms until `deadLetters.depth()` is non-zero, then aborts the listener and
stops the queue. If a Deno KV redelivery of the invalid message lands between the poll exiting at
depth 1 and the listener actually stopping, a second DLQ record is written — the observed `2` vs `1`.
Nothing in that sequence involves the SDK cache.

**This is a pre-existing repo-level flake and is not recorded in any known-flaky list.** It will cost
CI runs across every lane, not just this one. Recommend a tracked issue against `packages/queue` to
make the assertion redelivery-tolerant (assert *at least* one validation_failed record, or drain
after abort) rather than leaving a timing-sensitive equality. **Not filed by this session** — issue
creation and milestone scope remain the coordinator's.

## Outcome

S2 Tier-A **PASS** at `1cf76c6dd`. The author's root receipt is now independently reproduced.

---

# Tier-A — implementation slice S3 (final) at `9a26c107afa75bf1f38b78fe96c6df533b156c36`

| Field | Value |
| --- | --- |
| Head | `9a26c107afa75bf1f38b78fe96c6df533b156c36` — local == remote == PR, clean, draft, sole `status:plan` |
| Prior head | `1cf76c6dd` (S2); one commit `9a26c107a fix(sdk): identify cache provider module and document evidence` |
| Verdict | **PASS** — implementation complete across S1–S3 |

## Scope

Exactly the four authorized paths plus three run artifacts: `cache-provider.ts`, `ports/cache-store.ts`,
`cache-provider_test.ts`, `docs/site/web-layer/query-bridge.md`. S1/S2 product and test files are
byte-identical since `1cf76c6dd`.

## D4

`import.meta.url` is embedded in the message; the two-instances statement is framed as "one
possibility ... check that ... resolve to one version" — a hypothesis, not a diagnosis; the existing
browser/client-side clause is **preserved**; `_provider` remains module-local
(`let _provider: CacheProvider | null = null`, `cache-provider.ts:57`) with no ownership change.

**No guard was dropped**: `cache-provider_test.ts` has 1 `Deno.test` before and 1 after. The single
test was strengthened, replacing an `assertStringIncludes` spot-check with a full normalized byte
comparison: it extracts the resolved URL, asserts it equals
`new URL('./cache-provider.ts', import.meta.url).href`, normalizes only that segment to
`<resolved import.meta.url>`, reads the docs block, and `assertEquals` against it.

The docs match uses `/```text\n([^\n]+)\n```/`. That `[^\n]+` is load-bearing: a re-wrap makes the
match fail and the test go **red**, which is the required behaviour — the assertion cannot be
satisfied by loosening it to a substring.

**Advisory 3 is structurally resolved, not merely mitigated.** Root `fmt` includes only
`packages/**/*.ts(x)` and `plugins/**/*.ts(x)`; `docs/site/deno.json` excludes `**/*.md`, `**/*.mdx`,
`**/*.vto` with `proseWrap: preserve`. No formatter configured in this repo can reach that block.

## D5

`get`/`set`/`delete` `@returns` corrected to the real mandatory-evidence shapes. Sweep independently
corroborated: `ports/**` contains only 8 `@returns` total (`cache-store.ts` 4, `query-key.ts` 2,
`cache-entry.ts` 2); the non-cache-store ones describe key serialization and cache-entry
semantics and match their signatures. No other superseded shape — the author's claim is accurate.

## Gates — executed by this review

| Gate | Result |
| --- | --- |
| `packages/sdk` suite | 66 passed / 0 failed |
| `cache-provider_test.ts` | 1 passed / 0 failed |
| check / lint / fmt (`packages/sdk`, 84 files) | 0 / 0 / 0 |
| **root `deno task test`** | **4203 passed / 0 failed / 19 ignored** |
| **root check, uncached wrapper** | **2925 files, 25 batches, 0 failed batches, 0 occurrences** |
| raw `deno doc --lint` combined / cache | exit 1 — exactly the six pinned diagnostics, zero new |
| `check:netscript-jsr-specifiers` | scanned 2361, ranges 0, failures 0 |
| `quality:scan` | `ok:true`, 0 findings, 7 known allowances |
| `arch:check` | **FAIL=0**, warnings only |
| `deno publish --dry-run` (sdk) | **Success** |
| JSR audit (sdk) | dry-run OK; 2 WARN, no error |

**Root `deno task check` was not accepted from its cache.** The task printed "cached, inputs
unchanged" despite S3 modifying three TypeScript files. A cache line is not a verdict, so the
underlying wrapper was re-run uncached across `packages` + `plugins`: 2925 files, zero diagnostics.

## Two red gates — both proven pre-existing at the merge base

- **`surface:diff` fails: 517 undeclared major changes.** Run at base `baf1cdf67` in a detached
  worktree: **also 517**. Base == head ⇒ this leaf contributes **zero net surface findings**.
  Findings span ~20 packages the branch never touches (`watchers`, `logger`, `cron`, `aspire`, …),
  i.e. a stale checked-in baseline. The author reported it honestly as a stale baseline; their count
  was **524** against my **517** at both base and head — the discrepancy is recorded rather than
  smoothed over, and the base==head equality is the operative no-regression evidence.
- **JSR audit `F-DOCT-5`** (13 immediate children in `src`, cap 12): `git ls-tree` gives **13 at base
  and 13 at head** — the leaf adds no directory. Pre-existing.

Neither is this leaf's regression; neither may be described as a pass.

## Outcome

S3 Tier-A **PASS**. Implementation is complete across S1–S3; all five issues' behaviour is
implemented and proven. Next gate is IMPL-EVAL in a fresh opposite-family session. No readiness or
label change made; PR remains draft at sole `status:plan`.

---

# Tier-A — generated-asset repair at `7549d9fc052e604212f12e617b05085a061f9e0b`

| Field | Value |
| --- | --- |
| Head | `7549d9fc052e604212f12e617b05085a061f9e0b` — local == remote == PR, clean |
| Prior head | `0fed4d7ff`; one commit `7549d9fc0 chore(docs): refresh agent docs bundle for query bridge` |
| Author state | idle ≥90 s before gates ran; gates were held until then because `gen:agent-docs-prose` writes `docs/site/_site` and racing an active author yields an untrustworthy verdict |
| Verdict | **PASS** |

## Scope — exactly the amendment, nothing more

`git diff --name-only 0fed4d7ff..7549d9fc0` = `.llm/assets/agent-docs/prose.json.gz`,
`.llm/assets/agent-docs/provenance.json`, and three run artifacts (`context-pack.md`,
`generated-assets-repair-report.md`, `worklog.md`).
`git diff --name-only … -- packages/ plugins/ docs/ tools/ deno.json deno.lock` is **empty**.
`baselines/public-surfaces.json` untouched.

**The prior product IMPL-EVAL PASS is preserved:**
`git diff 9a26c107a..7549d9fc0 -- packages/ plugins/ docs/ tools/ deno.json deno.lock` is **empty**,
so the product tree the evaluator judged is byte-identical at this head.

## Source-to-generated fidelity — corroborated against a pre-repair measurement

The strongest evidence here is that the expected output was computed **before the repair existed**.
When this orchestrator independently reproduced the failure at `0fed4d7ff`, the freshness check
reported the *fresh* provenance it expected:

```text
uncompressedBytes: 4753909    sha256: 6df99eb856ebf1cd8b1daf6bd610a6f3ee4db804c41e465ca5be500ef35853fe
```

The committed asset carries **exactly** those values. The regeneration therefore reproduces content
this session derived from the authorized source edit — not something taken on the author's word.

`provenance.json` delta is exactly what a faithful, targeted regeneration looks like:

| Field | Before | After |
| --- | --- | --- |
| `sourceCommit` | `504de3f67` | `0fed4d7ff` |
| `extractionTimestamp` | `2026-08-15T08:52:56.248Z` | `2026-08-15T15:32:16.221Z` |
| `uncompressedBytes` | 4753233 | 4753909 |
| `compressedBytes` | 1363117 | 1363396 |
| `sha256` | `a7c72177…` | `6df99eb8…` |

The `files` manifest is **unchanged** — no page added or removed. This is a content refresh of the
existing corpus, not a bulk rebuild sweeping in unrelated drift, which was the hard-stop condition in
the repair brief.

## Gates — executed by this review at the repair head

| Gate | Result |
| --- | --- |
| `deno task check:agent-docs-prose` | **exit 0**, `fresh: true`, `stalePaths: []`, `sourceCommit 0fed4d7ff` |
| `run-deno-lint.ts --root packages/sdk` | exit 0, 0 occurrences, 84 files |
| `run-deno-fmt.ts --root packages/sdk` | 0 findings, 84 files |
| raw `deno doc --lint` combined / cache entrypoint | exit 1 — exactly the six pinned diagnostics, unchanged |

The author's report claimed `check:agent-docs-prose` exit 0 / `fresh: true`, `docs/site verify`
exit 0, lint and fmt exit 0, and honestly reported doc-lint as **exit 1** on both invocations rather
than as a pass. The claims that matter were re-executed here and hold.

## Unchanged red gates

`surface:diff` (stale `baselines/public-surfaces.json`) and JSR `F-DOCT-5` (13 children at base and
head) remain red, untouched, and are not this leaf's to repair. Neither may be reported as green.

## Outcome

Repair Tier-A **PASS** at `7549d9fc0`. Next: a proportionate fresh delta evaluator confined to
source-to-generated fidelity and the repair artifact. No readiness, label reconciliation, or merge
until that verdict lands.

---

# Tier-A — full generated-asset closure at `9a2c74c41990c1e2a56c9714834fff97feb63466`

| Field | Value |
| --- | --- |
| Head | `9a2c74c41990c1e2a56c9714834fff97feb63466` — local == remote == PR, clean |
| Cascade commits | `7549d9fc0` (link 2), `27a64ea4c` (link 3), `9a2c74c41` (link 4) |
| Verdict | **PASS** — the four-link cascade is closed on one content head |

## The decisive check: all three gates fresh **simultaneously**

Each link had been green at some moment; nothing had yet shown they were green *together*. Run in a
detached worktree at `9a2c74c41` (never the leaf — `gen:assets-barrel` mutates the tree):

| Gate | Result |
| --- | --- |
| `deno task check:publish-assets` | **EXIT 0** |
| `deno task check:assets-barrel` | **EXIT 0** |
| `deno task check:agent-docs-prose` | **EXIT 0**, `"fresh":true`, `"stalePaths":[]` |
| `git status --porcelain` **after all three generators ran** | **empty** |

That final empty line is the closure proof: three independent generators executed against this head
and produced byte-identical output to what is checked in. Because `gen:publish-assets` *consumes* the
CLI barrel (`generate-publish-assets.ts:34-37`), a clean tree here also proves the links converged
rather than each having been fixed against a different upstream state.

## Scope across the whole cascade

`git diff --name-only 7549d9fc0..9a2c74c41` = `packages/cli/src/kernel/assets/agent-docs.generated.ts`,
`packages/mcp/src/publish-assets.generated.ts`, and run artifacts. Nothing else.

Across the **entire PR** (`baf1cdf67..9a2c74c41`), the only non-generated `packages/**` files touched
are the eight S1–S3 authorized ones: `README.md`, `cache-provider.ts`, `cache-provider_test.ts`,
`cache-query.ts`, `cache-telemetry.ts`, `ports/cache-store.ts`, `tests/cache/cache-query-kv-limit_test.ts`,
`tests/cache/cache-telemetry_test.ts` — plus the granted `docs/site/web-layer/query-bridge.md`. No
hand-written source drifted while chasing generated mirrors.

## Repair diffs — minimal and exactly as predicted

- **Link 3** (`27a64ea4c`): one file, 6 insertions / 6 deletions — the six provenance fields flipping
  `504de3f67`→`0fed4d7ff`, `a7c72177…`→`6df99eb8…`, 4753233→4753909. Exactly what this orchestrator's
  isolated probe predicted **before** the repair was written.
- **Link 4** (`9a2c74c41`): **one line** — `sourceCommit: '504de3f67'` → `'0fed4d7ff'`. Nothing else.

## Fifth-mirror question — three independent agreements

1. This orchestrator's two-head probe: `check:mcp-export-corpus` stale at **base** as well as branch;
   `check:emitted-samples` passes; no other `check:*` has a checked-in mirror.
2. Shipped precedent PR #1652: `derivedAssetCascadePaths` is exactly these four paths, corroborated
   by its own diff.
3. The author's own downstream closure audit: "the checked-in cascade closes here; no fifth generated
   mirror was found."

**Closure holds.**

## Gates — executed by this review

| Gate | Result |
| --- | --- |
| `run-deno-check.ts --root packages/mcp` | 115 files, 0 occurrences, 0 failed batches |
| `deno lint packages/mcp/src/publish-assets.generated.ts` | exit 0 |
| `deno fmt --check` (same) | exit 0 |
| raw `deno doc --lint` combined / cache entrypoint | exit 1 — exactly the six pinned diagnostics, unchanged |

**Honest coverage note.** `run-deno-lint.ts --root packages/mcp` **failed to produce a verdict** —
it errored with `invalid type: string "packages/*", expected struct WorkspaceConfig`, a wrapper/config
incompatibility, not a lint finding. Rather than report a non-result, the file was linted directly
(exit 0). Separately, `packages/cli/src/kernel/assets/agent-docs.generated.ts` is **excluded from both
lint and fmt** by repo config (`lint.exclude` and `fmt.exclude` both list `packages/cli/`), so
`deno lint` on it returns "No target files found". That file's correctness is instead guaranteed by
`check:assets-barrel`, which asserts byte-exact regeneration equality — a stronger property than lint.

## Unchanged pre-existing reds

`surface:diff` (stale `baselines/public-surfaces.json`), JSR `F-DOCT-5` (13 children at base and
head), and `check:mcp-export-corpus` (stale at base) remain red, untouched, outside scope, and are not
to be reported as green.

## Outcome

Closure Tier-A **PASS** at `9a2c74c41`. Next and last gate: one proportionate delta evaluator over
asset-chain fidelity across the full cascade. No readiness, label change, or merge until that verdict.
