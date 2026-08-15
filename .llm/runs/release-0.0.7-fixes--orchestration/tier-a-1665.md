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

`normalizeCacheNamespace` is called at **12 sites, and every one evaluates it as an argument, before
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

1. **T-1** — specify the deferral seam that lets the overflow event reach a span, at all 12 call
   sites, and state explicitly what happens at `composite-query.ts:42` where no span exists.
2. **T-2** — decide and state whether partial `invalidationsByTier` entries from a rejected report
   are rolled back or retained; commit to a test for the partial-failure case specifically.
3. **T-3** — replace step 9's evidence command with raw `deno doc --lint` capture (combined **and**
   cache entrypoint), and pin the six named diagnostics above as the strict no-regression baseline.
4. **T-4** — record the `docs/site/web-layer/query-bridge.md:98` drift as named accepted debt with a
   follow-up, or request a grant widening. Do not leave it undeclared.

Plan-only repair. No product code, no evaluator, PR stays draft.
