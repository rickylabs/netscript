# Plan: isolate SDK cache writes and settle telemetry contracts

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cache-surface-and-telemetry--0.0.7-wave3` |
| Branch | `fix/sdk-cache-surface-and-telemetry` |
| Phase | `plan` — hard stop before implementation |
| Target | `packages/sdk` published cache/ports surface |
| Archetype | `3 — runtime behavior` for this slice; package inventory remains Archetype 2 |
| Scope overlays | none |

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
- invalidation records error/incomplete evidence, skips that report, and may retain other valid
  bounded tier evidence without throwing.

The existing test at `cache-telemetry_test.ts:237` will be **amended, not deleted**: the same
unbounded report must still mark the span `error`/incomplete, but the loader must execute and its
payload must return. Add write and invalidation malformed-report cases so changing the shared
helper does not silently weaken the other two guards.

Remove descriptor validation from pre-span attribute construction. Add an internal validation
step invoked as the first operation inside each cache span callback; a bad descriptor records an
error/incomplete event on the created span and proceeds fail-safe. A test uses a non-conforming
custom descriptor and asserts both normal data return and a recorded span problem. Document this
explicitly in `packages/sdk/README.md`.

### D3 — #1620: runtime cardinality budget with fixed overflow

Keep public `QueryParams.operationId?: string` unchanged; a branded type would be a breaking compile
change and requires the prohibited `query-options.ts` scope. Instead add an internal process-wide
runtime budget in `cache-telemetry.ts`:

- syntax normalization remains lowercase/80-character bounded;
- retain at most **256** distinct normalized namespaces;
- the first normalized id that crosses the budget is mapped to fixed **`overflow`** and emits one
  `cache.namespace.overflow` span event naming that offending normalized id;
- all later over-budget ids map to `overflow` without retaining or emitting their raw ids; a single
  boolean plus the 256-entry admitted set keeps memory and telemetry cardinality bounded;
- the warning is a span event, not `console.warn`, so published runtime code remains structured and
  AP-13 compliant.

Apply the budget at both the package-owned `CacheQuery` and unowned `CacheProvider` boundary. Keep
`normalizeCacheNamespace()`'s public string signature stable. Tests reset only the private registry,
fill 256 stable values, assert the 257th collapses and names the offender exactly once, and prove
repeats/new overflow values remain fixed. Existing factory tests must stay green unchanged:
`resource.action`, normalized composite default, and `composite` all remain admitted static values.

This is a patch-level behavior hardening, not a TypeScript breaking change. It intentionally trades
fine-grained telemetry beyond 256 operation families for bounded backend cost.

### D4 — #1598: API-adjacent module-identity diagnostic

Keep `_provider` module-local and change only the error wording. Include the evaluated
`import.meta.url`, then say: “If initialization already ran, one possibility is that two
`@netscript/sdk` module instances are loaded; check that `@netscript/fresh`, its subpaths, and
`@netscript/sdk` resolve to one version.” This is explicitly a hypothesis, not a diagnosis.

The adjacent test asserts the resolved module URL and both-instance/version-coherence hint.
Evaluating `import.meta.url` for the message is allowed; no runtime asset or filesystem read is
introduced.

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

Product changes are limited to the four declared files. Required README/tests and the pre-existing
doc-lint problem are enumerated in `scope-boundary.md`; implementation cannot start without the
topic orchestrator's ruling.

Non-scope: `no-store`, branded operation IDs, provider ownership/global singleton changes, KV
provider implementation, Fresh/CLI/template edits, Aspire/Docker/e2e, canary/release, and unrelated
doc-lint cleanup.

Hidden consumer scope: SDK internal query factories/barrels, Fresh imports/re-exports, the KV
backend exercised by the real RED, CLI generated-import assertions and embedded template mirror,
MCP generated docs, and the release public-surface baseline. The repo-root test task covers the
asserting packages.

## Open-decision sweep

| Decision | Status | Resolution / owner |
| --- | --- | --- |
| Failure isolation seam | resolved now | Post-loader `store.set()` only; D1 |
| Evidence validation contract | resolved now | Fail-safe with error/incomplete span signal; D2 |
| Namespace mechanism/bound/warning | resolved now | Runtime 256 / `overflow` / first-offender one-time span event; D3 |
| Diagnostic wording | resolved now | Module URL plus hypothesis and coherence check; D4 |
| JSDoc shapes | resolved now | Mandatory report shapes; D5 |
| README/test files outside declared surface | **must resolve before implementation** | Topic orchestrator scope ruling |
| Existing full-export doc-lint red baseline | **must resolve before implementation** | Authorize remediation surface or accept exact no-regression debt |
| Per-action `no-store` | safe to defer | Requires wider published query/factory design |
| Branded `operationId` | safe to defer | Breaking alternative rejected for this patch |
| Provider ownership across duplicate SDK copies | safe to defer | Diagnostic must not pre-empt architecture decision |

## Commit slices after PLAN-EVAL and scope approval

| # | Slice / proof | Files | Proving gates |
| --- | --- | --- | --- |
| 1 | Make evidence validation fail-safe inside spans and bound namespace cardinality; amend the deliberate guard and document the contract. | declared `cache-telemetry.ts`, `cache-query.ts`, `cache-provider.ts`; pending `cache-telemetry_test.ts`, `README.md` | focused cache telemetry tests; structured SDK check/lint/fmt; doc/surface checks |
| 2 | Isolate real KV persistence-limit failure after successful loader data. | declared `cache-query.ts`; pending new `cache-query-kv-limit_test.ts` | behavioral RED-before/GREEN-after real Deno KV test; SDK/root tests |
| 3 | Improve duplicate-module diagnostic and repair mandatory-evidence JSDoc. | declared `cache-provider.ts`, `cache-store.ts`; pending `cache-provider_test.ts` | focused diagnostic test; ports doc sweep; doc/publish checks |
| 4 | Merge-readiness evidence only: run full static/runtime-consumer/JSR/doctrine gates and update run artifacts/PR comments. | run directory only | complete validation table below; separate IMPL-EVAL remains mandatory |

All slices stay below 30 and each updates `worklog.md`/`context-pack.md` in its commit. No product
slice may begin until PLAN-EVAL passes and the scope ruling is recorded.

## Risk register

| Risk | Mitigation |
| --- | --- |
| A broad catch hides source or lookup failures | Catch only `store.set()` after `data` resolves; explicit write APIs and loader failures remain fail-loud. |
| Telemetry recorder continues into invalid arrays after removing `throw` | Explicit early returns/skip behavior per recorder; direct tests for lookup, write, invalidation. |
| Invalid descriptor still fails before span | Remove validation from argument construction and run it first inside span callbacks; assert span existence. |
| Cardinality registry becomes a memory leak | Cap admitted set at 256 and retain only one overflow-warning boolean; never retain later offending ids. |
| Cardinality state makes tests order-dependent | Direct-file internal test reset around cardinality tests; no public reset export. |
| Legitimate app has >256 operation families | Fixed `overflow` preserves application behavior; documented telemetry tradeoff and one actionable event. |
| Error event leaks request/tenant data | Only the first normalized over-budget id is emitted; guidance forbids identifiers; later raw ids are neither stored nor emitted. |
| Public/export or sibling consumer regression | `surface:diff`, root structured `check` and `test`, Fresh/CLI assertions, publish dry run, exact-pin guard. |
| Existing doc-lint failures are mistaken for new success | Preserve exact baseline evidence and require orchestrator ruling; never report current FAIL as PASS. |

## Debt implications

No new architecture debt is planned. Existing SDK doc-lint failures are unregistered/pre-existing
at this base and require the explicit ruling in `scope-boundary.md`. If baseline acceptance is
chosen, the orchestrator must authorize a named debt entry/closing gate; this leaf will not invent
one before PLAN-EVAL.

## Validation plan

Use wrappers as verdict sources and do not run Aspire, Docker, or `e2e:cli`.

| Order | Gate | Command | Expected result |
| --- | --- | --- | --- |
| 1 | Focused SDK check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts,tsx --pretty` | PASS; wrapper includes `--unstable-kv` by default |
| 2 | Focused RED/GREEN tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all <focused test files>` | Current real-limit test RED for Deno KV rejection before fix; all focused tests PASS after fix |
| 3 | SDK lint/fmt | structured `run-deno-lint.ts` and `run-deno-fmt.ts` with `--root packages/sdk --ext ts,tsx` | PASS |
| 4 | Repo-root assertions | `deno task test` | PASS; covers SDK, Fresh, KV, CLI, MCP/generated/tool assertions |
| 5 | Repo-root check | `deno task check` | PASS |
| 6 | Public surface diff | `deno task surface:diff` | Patch/non-breaking; no undeclared major change |
| 7 | Exact NetScript pins | `deno task check:netscript-jsr-specifiers` | PASS, zero ranges/failures |
| 8 | JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/sdk --text` | No new finding relative to captured baseline |
| 9 | Full export docs | `deno task doc:lint --root packages/sdk --pretty` | Outcome per orchestrator ruling: clean after authorized remediation, or exact accepted baseline with no new diagnostics; current state is FAIL |
| 10 | Publish dry run | `deno task publish:dry-run` and package-local `deno publish --dry-run --allow-dirty` as needed for attribution | PASS; SDK publish list/types clean relative to approved bar |
| 11 | Code quality | `deno task quality:scan` | PASS/no new finding |
| 12 | Architecture | `deno task arch:check` | PASS/no unaccepted debt |

PLAN-EVAL and IMPL-EVAL are separate-session gates owned by the topic orchestrator. This session
does not launch either.

