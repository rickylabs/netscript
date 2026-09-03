# Plan: isolate SDK cache writes and settle telemetry contracts

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cache-surface-and-telemetry--0.0.7-wave3` |
| Branch | `fix/sdk-cache-surface-and-telemetry` |
| Phase | `plan` — hard stop before implementation |
| Target | `packages/sdk` published cache/ports surface |
| Archetype | `3 — runtime behavior` for this slice; package inventory remains Archetype 2 |
| Scope overlays | `SCOPE-docs` for the single authorized site quotation |

## Archetype and doctrine verdict

The slice uses Archetype 3 because it changes async failure isolation, cache persistence behavior,
and runtime telemetry. That is the stricter proof profile for #1637/#1619 even though the current
package-wide doctrine inventory calls SDK Archetype 2. Current verdict: **Keep** — preserve the
discovery/client/cache adapter boundaries
(`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:53`). No package restructure is
planned.

Relevant axioms:

| Axiom | Application |
| --- | --- |
| A1/A2 | Preserve `QueryParams`, `CacheStore`, and cache subpath compatibility; make failure contracts explicit before implementation. |
| A13 | The source-query/cache-persistence crash boundary is explicit: successful source data survives an optional persistence failure. |
| A14 | Behavioral tests, root consumers, doc lint, publish dry run, JSR audit, and architecture gates preserve the contract. |

Anti-patterns in scope: avoid AP-10 by isolating only the optional persistence boundary rather than
blanket-catching service/provider failures; avoid AP-11 by bounding module state; avoid AP-13 by
using a span event rather than `console.warn`; avoid AP-25 by introducing no asset/file/environment
read.

## Goal

Return successful source data even when cache persistence fails, make malformed telemetry evidence
fail-safe while remaining visible inside a span, mechanically cap namespace cardinality, improve
the two-SDK-instance diagnostic, and repair CacheStore mandatory-evidence JSDoc without breaking the
published TypeScript surface.

## Locked decisions

### D1 — #1637: isolate only post-loader persistence failure

In `CacheQuery.fetchAndCache()`, retain fail-loud behavior for `queryFn()` and cache lookup failures.
After `data` resolves, wrap only `store.set()`/write-report recording as the optional persistence
seam. A `store.set()` rejection will call `recordCacheProviderError` with operation `cache.read`,
event `cache.write`, outcome `error`, and `topology_complete=false`; the method will then return the
already-resolved `data`. No entry is written, so the result is simply uncached. Explicit
`setCachedData()` remains fail-loud because its requested outcome is persistence itself.

Behavioral RED: add `cache-query-kv-limit_test.ts`, initialize the shared KV singleton with
`getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true })`, construct a real
`KvCacheStore`/`CacheQuery`, and return a structured payload whose encoded value is safely above
Deno KV's 65,536-byte cap. On the current head the query rejects with the real `Value too large`
`TypeError`. After the fix it must return the exact payload, show one loader call, expose a
`cache.write` error event on the read span, and a subsequent KV/cache lookup must be a miss. This
proves the actual adapter/backend limit path and uncached result, not merely the presence of a
catch around a synthetic throw.

The proposed per-action `no-store` option is deferred. Failure isolation solves the outage class;
adding opt-out policy would require `query-options.ts` and factory surfaces outside this contract.

### D2 — #1619: choose fail-safe evidence validation

Choose **fail-safe**: observability may lose fidelity, but malformed evidence must not discard data
or turn an otherwise successful cache operation into an application failure. Change
`recordIncompleteTopology` from typed `never`/throwing to a recorder that returns normally.
Callers must explicitly short-circuit unsafe evidence processing:

- lookup records error/incomplete evidence and returns `CacheOutcomes.ERROR` without indexing an
  empty/invalid chain;
- write records error/incomplete evidence and returns before iterating the invalid report;
- invalidation stages each report into a fresh per-report map and merges that map into the aggregate
  only after the entire report passes descriptor, outcome, bound, and cross-report tier-consistency
  validation. A rejected report contributes **zero** tier events, including entries validated before
  its later failure. Valid reports remain emit-able, but the span-level final
  `topologyComplete` stays `false` if any report was rejected so the final attribute cannot overwrite
  the incomplete signal with `true`.

The existing test at `cache-telemetry_test.ts:237` will be **amended, not deleted**: the same
unbounded report must still mark the span `error`/incomplete, but the loader must execute and its
payload must return. Add write and invalidation malformed-report cases so changing the shared
helper does not silently weaken the other two guards. The invalidation case must fail partway
through one report: entries 1–2 are valid and entry 3 has an invalid descriptor/outcome (with a
valid report also present to prove isolation). Assert that entries 1–2 from the rejected report are
not emitted, valid-report evidence may remain, and the final span stays incomplete/error. A
first-entry failure is insufficient proof of rollback.

Remove descriptor validation from pre-span attribute construction. Add one internal span-prologue
helper invoked as the first operation inside each cache span callback; it flushes any pending
namespace-overflow event and then validates the descriptor while the span exists. A bad descriptor
records an error/incomplete event and proceeds fail-safe. This single prologue makes D2 and D3's
deferral order explicit rather than claiming two separate actions are each first. A test uses a
non-conforming custom descriptor and asserts both normal data return and a recorded span problem.
Document this explicitly in `packages/sdk/README.md`.

### D3 — #1620: runtime cardinality budget with fixed overflow

Keep public `QueryParams.operationId?: string` unchanged; a branded type would be a breaking compile
change and requires the prohibited `query-options.ts` scope. Instead split syntax normalization
from internal namespace admission in `cache-telemetry.ts`. Public
`normalizeCacheNamespace(): string` remains a pure, signature-compatible syntax normalizer. A new
non-re-exported admission helper returns an internal decision object containing the admitted
namespace plus an optional first-overflow id. That request-local decision—not a global pending raw
id—crosses the pre-span argument-evaluation seam:

- syntax normalization remains lowercase/80-character bounded;
- retain at most **256** distinct normalized namespaces;
- the first normalized id that crosses the budget is mapped to fixed **`overflow`** and carries a
  pending `cache.namespace.overflow` signal naming that offending normalized id;
- all later over-budget ids map to `overflow` without retaining or emitting their raw ids; a single
  boolean plus the 256-entry admitted set keeps memory and telemetry cardinality bounded;
- the mapped namespace is available for `createCacheSpanAttributes(...)`; the **first statement in
  the created span callback** invokes the D2/D3 span-prologue helper, which flushes the decision's
  pending signal and validates the descriptor inside the span. The decision is local to that
  invocation, so concurrent operations cannot steal or misattribute the offender;
- the warning remains a span event, not `console.warn`, so published runtime code is structured and
  AP-13 compliant.

Apply that deferral seam to every executable caller identified by the source census (12 source
occurrences: the function definition plus 11 calls):

- `cache-query.ts:85,305,329,361,389`: each operation obtains an admission decision before
  `withSpan`, uses `decision.namespace` in the span attributes, then flushes the pending signal as
  part of the first-statement span prologue. At `:85`, descriptor validation is also performed by
  that prologue; neither pre-span concern can emit before the span exists.
- `cache-provider.ts:125,141,159,169,176`: `traceUnsupported` accepts the admission decision rather
  than only a string, uses its namespace for attributes, and flushes it first inside its own span
  callback. This covers both the precomputed and inline current call shapes.
- `composite-query.ts:42`: there is intentionally **no admission and no event at factory/module
  time**, because no span or request exists. It performs syntax normalization only. The actual
  later `query`, `getCachedData`, `getCachedEntry`, or invalidation call is admitted and, if needed,
  warned at the package-owned query or unowned-provider boundary where a span exists. Constructing
  an unused composite therefore consumes no namespace budget and strands no warning.

Tests reset only the private registry, fill 256 stable values, assert the 257th span receives the
deferred event and names the offender exactly once, and prove repeats/new overflow values remain
fixed. Include a composite-factory test proving construction alone neither admits nor emits and its
first real operation is handled at the spanned boundary. Existing factory tests must stay green
unchanged: `resource.action`, normalized composite default, and `composite` all remain admitted
static values.

This is a patch-level behavior hardening, not a TypeScript breaking change. It intentionally trades
fine-grained telemetry beyond 256 operation families for bounded backend cost.

### D4 — #1598: API-adjacent module-identity diagnostic

Keep `_provider` module-local and change only the error wording. Include the evaluated
`import.meta.url`, then say: “If initialization already ran, one possibility is that two
`@netscript/sdk` module instances are loaded; check that `@netscript/fresh`, its subpaths, and
`@netscript/sdk` resolve to one version.” This is explicitly a hypothesis, not a diagnosis.

Lock the complete message template now, including punctuation and the SDK prefix:

```text
[NetScript SDK] Cache provider not initialized in module <resolved import.meta.url>. Add `import '@netscript/sdk/cache';` to your server entrypoint to register it, or call setCacheProvider(cacheQuery) during server bootstrap. If initialization already ran, one possibility is that two `@netscript/sdk` module instances are loaded; check that `@netscript/fresh`, its subpaths, and `@netscript/sdk` resolve to one version. If you see this in the browser, a server-only cache method (query, prefetch, getCachedData, getCachedEntry, invalidate) was called from client-side code — use queryOptions/mutationOptions/clientKey instead.
```

At runtime, the single token `<resolved import.meta.url>` is replaced by the evaluated module URL;
all other bytes are fixed. Rewrite the quotation at
`docs/site/web-layer/query-bridge.md:98` as the same single-line template. Adjacent prose states
that the angle-bracket token represents the install-specific resolved URL, so the published page
does not pin a machine path.

The adjacent `cache-provider_test.ts` test captures the real error, extracts and normalizes only
the resolved URL segment back to `<resolved import.meta.url>`, reads the authorized documentation
code block, and compares the normalized runtime message to that block byte-for-byte. It separately
asserts that the captured URL equals `new URL('./cache-provider.ts', import.meta.url).href`. This makes
the `[NetScript SDK] ` prefix, all stable wording/punctuation, the hypothesis, and the browser hint
an automated D4 acceptance item rather than an eyeball check. The docs read is test-only; published
runtime code performs no asset or filesystem read.

### D5 — #1623: mandatory-evidence JSDoc

Update only `cache-store.ts` docs:

- `get @returns`: `{ value: T | null, report: CacheReadTopologyReport }`, including miss behavior;
- `set @returns`: ordered `CacheWriteTopologyReport` write/promotion evidence;
- `delete @returns`: `CacheInvalidationTopologyReport` evidence.

The executed `ports/**` sweep found no other mandatory-evidence drift. These are documentation-only
changes to already-published signatures and are non-breaking.

## Public surface / publication assessment

- No export is added, removed, or renamed; `QueryParams`, `CacheStore`, `CacheQuery`, and
  `CacheTelemetry` signatures stay compatible.
- The cache-write and telemetry behaviors change at runtime, intentionally and as patch-level
  failure hardening. The error message and span event vocabulary are API-adjacent/observability
  changes, not TypeScript breaks.
- Internal helpers/constants for descriptor validation and cardinality are not re-exported from
  `src/cache/mod.ts` or the root barrel.
- No dependency is added. Existing exact `@netscript` pins remain; the specifier guard must remain
  zero-failure.
- `isolatedDeclarations` is preserved with explicit return types for any internal exported helper.
- No runtime asset, file, URL fetch, or `import.meta` filesystem read is introduced.

## Scope, non-scope, and hidden scope

Product changes are limited to the four declared files. The coordinator granted exactly five
additional paths: the README, three tests, and the single Query Bridge documentation page listed in
`scope-boundary.md`. Implementation still cannot start before PLAN-EVAL passes.

Non-scope: `no-store`, branded operation IDs, provider ownership/global singleton changes, KV
provider implementation, Fresh/CLI/template edits, every other `docs/site/**` path,
Aspire/Docker/e2e, canary/release, and unrelated doc-lint cleanup. Do not sweep or edit related site
prose elsewhere in this leaf; if another exact quotation is encountered incidentally, report it
without widening scope.

Hidden consumer scope: SDK internal query factories/barrels, Fresh imports/re-exports, the KV
backend exercised by the real RED, CLI generated-import assertions and embedded template mirror,
MCP generated docs, the release public-surface baseline, and
`docs/site/web-layer/query-bridge.md:98`, which quotes D4's exact current provider error. The
repo-root test task covers executable asserting packages. The site quote is now the fifth
authorized additional path and is updated in the D4 slice; the provider test performs the explicit
normalized byte comparison against the shipped documentation.

## Open-decision sweep

| Decision | Status | Resolution / owner |
| --- | --- | --- |
| Failure isolation seam | resolved now | Post-loader `store.set()` only; D1 |
| Evidence validation contract | resolved now | Fail-safe with error/incomplete span signal; D2 |
| Namespace mechanism/bound/warning | resolved now | Runtime 256 / `overflow` / first-offender one-time span event; D3 |
| Diagnostic wording | resolved now | Module URL plus hypothesis and coherence check; D4 |
| JSDoc shapes | resolved now | Mandatory report shapes; D5 |
| README/test/site-doc files outside declared surface | resolved | Topic orchestrator granted exactly the five paths in `scope-boundary.md`; no others |
| Existing full-export doc-lint red baseline | resolved for this leaf | Exact six named raw diagnostics accepted as the no-regression bar; zero new |
| Exact site-doc quote under D4 | resolved in scope | Rewrite the one authorized Query Bridge code block and prove normalized byte identity in `cache-provider_test.ts` |
| Per-action `no-store` | safe to defer | Requires wider published query/factory design |
| Branded `operationId` | safe to defer | Breaking alternative rejected for this patch |
| Provider ownership across duplicate SDK copies | safe to defer | Diagnostic must not pre-empt architecture decision |

## Commit slices after PLAN-EVAL and scope approval

| # | Slice / proof | Files | Proving gates |
| --- | --- | --- | --- |
| 1 | Make evidence validation fail-safe inside spans and bound namespace cardinality; amend the deliberate guard and document the contract. | declared `cache-telemetry.ts`, `cache-query.ts`, `cache-provider.ts`; granted `cache-telemetry_test.ts`, `README.md` | focused cache telemetry tests including partial-report rollback; structured SDK check/lint/fmt; doc/surface checks |
| 2 | Isolate real KV persistence-limit failure after successful loader data. | declared `cache-query.ts`; granted new `cache-query-kv-limit_test.ts` | behavioral RED-before/GREEN-after real Deno KV test; SDK/root tests |
| 3 | Improve duplicate-module diagnostic, synchronize its published quotation, and repair mandatory-evidence JSDoc. | declared `cache-provider.ts`, `cache-store.ts`; granted `cache-provider_test.ts`, `docs/site/web-layer/query-bridge.md` | focused diagnostic test including normalized byte-for-byte docs comparison; ports doc sweep; docs source-alignment/link check; doc/publish checks |
| 4 | Merge-readiness evidence only: run full static/runtime-consumer/JSR/doctrine gates and update run artifacts/PR comments. | run directory only | complete validation table below; separate IMPL-EVAL remains mandatory |

All slices stay below 30 and each updates `worklog.md`/`context-pack.md` in its commit. The exact
five-path scope ruling is recorded; no product slice may begin until PLAN-EVAL passes.

## Risk register

| Risk | Mitigation |
| --- | --- |
| A broad catch hides source or lookup failures | Catch only `store.set()` after `data` resolves; explicit write APIs and loader failures remain fail-loud. |
| Telemetry recorder continues into invalid arrays after removing `throw` | Lookup/write return explicitly; invalidation stages each report and merges only on full success. A third-entry failure test proves rejected partial entries cannot escape and final topology remains incomplete. |
| Invalid descriptor still fails before span | Remove validation from argument construction; make the combined D2/D3 prologue the first callback statement and assert span existence. |
| Cardinality registry becomes a memory leak | Cap admitted set at 256 and retain only one overflow-warning boolean; carry only the first request-local pending id and never retain later offending ids. |
| Overflow is detected before a span exists | Carry an internal admission decision into each span callback and flush first; composite factory construction only syntax-normalizes and defers admission to its first real operation. |
| Cardinality state makes tests order-dependent | Direct-file internal test reset around cardinality tests; no public reset export. |
| Legitimate app has >256 operation families | Fixed `overflow` preserves application behavior; documented telemetry tradeoff and one actionable event. |
| Error event leaks request/tenant data | Only the first normalized over-budget id is emitted; guidance forbids identifiers; later raw ids are neither stored nor emitted. |
| Public/export or sibling consumer regression | `surface:diff`, root structured `check` and `test`, Fresh/CLI assertions, publish dry run, exact-pin guard. |
| Runtime diagnostic and published quotation diverge | Keep the docs block single-line with only a dynamic URL token; the provider test normalizes that one segment and byte-compares the rest. |
| Existing doc-lint failures are mistaken for new success | Preserve exact baseline evidence and require orchestrator ruling; never report current FAIL as PASS. |

## Debt implications

No new architecture debt is planned. The coordinator accepted the exact six named raw doc-lint
diagnostics as this leaf's no-regression baseline; none may be described as a pass. The known
provider-message quotation is repaired in the same D4 slice under the fifth authorized path and is
fully owned by this leaf.

## Validation plan

Use wrappers as verdict sources and do not run Aspire, Docker, or `e2e:cli`.

| Order | Gate | Command | Expected result |
| --- | --- | --- | --- |
| 1 | Focused SDK check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts,tsx --pretty` | PASS; wrapper includes `--unstable-kv` by default |
| 2 | Focused RED/GREEN tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all <focused test files>` | Current real-limit test RED for Deno KV rejection before fix; all focused tests PASS after fix |
| 3 | SDK lint/fmt | structured `run-deno-lint.ts` and `run-deno-fmt.ts` with `--root packages/sdk --ext ts,tsx` | PASS |
| 3b | D4 runtime/docs identity | Focused `cache-provider_test.ts` through `run-deno-test.ts` | PASS; real runtime message normalized only at its URL segment equals the single-line Query Bridge quotation byte-for-byte, and actual URL is non-empty/module-correct |
| 4 | Repo-root assertions | `deno task test` | PASS; covers SDK, Fresh, KV, CLI, MCP/generated/tool assertions |
| 5 | Repo-root check | `deno task check` | PASS |
| 6 | Public surface diff | `deno task surface:diff` | Patch/non-breaking; no undeclared major change |
| 7 | Exact NetScript pins | `deno task check:netscript-jsr-specifiers` | PASS, zero ranges/failures |
| 8 | JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/sdk --text` | No new finding relative to captured baseline |
| 9a | Raw full-export docs | From `packages/sdk`: `deno doc --lint ./mod.ts ./src/auto-update/mod.ts ./src/desktop/mod.ts ./src/cache/mod.ts ./src/client/mod.ts ./src/collections/mod.ts ./src/discovery/mod.ts ./src/ports/mod.ts ./src/query/mod.ts ./src/query-client/mod.ts ./src/streams.ts ./src/telemetry/mod.ts` | Exit 1 with exactly diagnostics 1–3 below, by name/location, and no others; never report as PASS |
| 9b | Raw cache-entrypoint docs | From `packages/sdk`: `deno doc --lint ./src/cache/mod.ts` | Exit 1 with exactly diagnostics 4–6 below, by name/location, and no others; never report as PASS |
| 10 | Publish dry run | `deno task publish:dry-run` and package-local `deno publish --dry-run --allow-dirty` as needed for attribution | PASS; SDK publish list/types clean relative to approved bar |
| 11 | Code quality | `deno task quality:scan` | PASS/no new finding |
| 12 | Architecture | `deno task arch:check` | PASS/no unaccepted debt |

PLAN-EVAL and IMPL-EVAL are separate-session gates owned by the topic orchestrator. This session
does not launch either.

The raw doc-lint baseline was measured at plan head `20e7aed41`, whose product tree is
byte-identical to base `baf1cdf67`; both commands exit 1. Capture full unfiltered stderr/stdout and
the exit code for each invocation. The exact accepted diagnostics are:

1. `private-type-ref`: public type `QueryClientPort` references private type `QueryClient` —
   `packages/sdk/src/ports/query-client.ts:41:1`.
2. `private-type-ref`: public type `createNetScriptQueryClient` references private type
   `QueryClient` — `packages/sdk/src/query-client/query-client-factory.ts:44:1`.
3. `private-type-ref`: public type
   `DurableStreamProducerOptions["instrumentation"]` references private type
   `StreamsInstrumentation` — `packages/plugin-streams-core/src/application/create-durable-stream.ts:41:3`.
   This is outside `packages/sdk` and is not an SDK regression.
4. `private-type-ref`: `KvCacheStore` references private type `CacheStore` —
   `packages/sdk/src/cache/kv-cache-store.ts:48:1`.
5. `private-type-ref`: `KvCacheStore.prototype.get` references private type `CacheKey` —
   `packages/sdk/src/cache/kv-cache-store.ts:97:3`.
6. `private-type-ref`: `KvCacheStore.prototype.get` references private type `CacheStoreEntry` —
   `packages/sdk/src/cache/kv-cache-store.ts:97:3`.

The verdict is strict named comparison: both invocations must retain exit 1, all six expected
diagnostics must remain present in their respective runs, and any additional diagnostic is a leaf
regression. A fixed baseline diagnostic is separately explained, never silently hidden by a count.
