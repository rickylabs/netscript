# Worklog: fresh/sdk cache-tier convergence

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-fresh-cache-tier-convergence--1252` |
| Branch | `fix/fresh-cache-tier-convergence` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- `ActionQueryOptions` — server cache-policy plus client stale-time options for generated
  `queryOptions()`.
- `IslandQueryOptions.initialDataUpdatedAt` — age of the authoritative server snapshot.
- `IslandQueryResult.isFetching` / `.isRefetching` — refreshing-state affordance.
- `invalidateServerQueryCache()` — browser helper for the framework-owned invalidation endpoint.
- `DEFAULT_QUERY_CACHE_INVALIDATION_PATH` — stable default endpoint path.
- `DefineFreshAppOptions.queryCacheInvalidation` and `FreshQueryCacheInvalidationOptions` — app
  registration/configuration contract.

### Domain Vocabulary

- **server cache entry** — canonical SDK key stored behind `CacheProvider`/`CacheQuery`.
- **hydration initial data** — authoritative snapshot serialized into the current Fresh page.
- **client query entry** — tab-lifetime TanStack entry shared by Fresh islands.
- **cache invalidation key** — JSON array of primitive canonical key segments; exact key or prefix.
- **cache-tier precedence** — server query result → mount-time hydration seed → later client update.

### Ports

- Existing `CacheProvider` — server query/invalidation boundary; no new provider.
- Injected fetch callback on the browser helper — testability seam for the standard HTTP edge.

### Constants

- `DEFAULT_QUERY_CACHE_INVALIDATION_PATH` — reserved framework endpoint under `/_netscript/`.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| S0 | Lock research/design/D6 evaluation composition and open draft PR | artifact review + raw git status | run-dir artifacts |
| S1 | Make SDK query options cache-aware on server while remaining direct in browser; preserve cache policy | RED then focused SDK query tests + scoped check | SDK query types/factory/tests/docs; run artifacts |
| S2 | Make server hydration authoritative for first paint and expose timestamp/refresh state | RED then Fresh render/type tests + package test | Fresh query types/hooks/tests/docs; run artifacts |
| S3 | Absorb the bespoke invalidation route into Fresh app bootstrap and client helper; prove mutate→reload | RED then Fresh server integration test + package test | Fresh server/query modules/tests/docs; run artifacts |
| S4 | Run scoped/static/quality/JSR no-deepening gates and prepare draft→ready handoff | wrapper/quality/audit commands | run artifacts + PR evidence only |

### Deferred Scope

- Product-specific optimistic reconciliation — service responses and domain projections stay in the product.
- Full dehydration redesign — existing advanced API remains supported.
- App authentication policy — existing middleware protects or disables the standard endpoint.
- Merge-readiness E2E — milestone orchestrator gate.

### Contributor Path

For cache-backed Fresh pages: create generated queries in `@netscript/sdk/query`, load via
`queryOptions()` or the action, pass `initialData` plus `initialDataUpdatedAt`, render through
`@netscript/fresh/query`, and call `invalidateServerQueryCache()` plus QueryClient invalidation after
a committed mutation. Extend SDK factory semantics in `packages/sdk/src/query/`; extend browser
hydration in `packages/fresh/src/application/query/`; extend the HTTP edge in
`packages/fresh/src/runtime/server/`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | S0 | research | Read issue body/comments and exact Pulseboard `56accbb` patch before source work. |
| 2026-08-04 | S0 | re-baseline | Fast-forwarded branch from `3a267aef1` to current `origin/main` `9bcfd18f2`; preserved user-owned lock edit. |
| 2026-08-04 | S0 | design | Locked Archetype 4 + frontend contract and recorded D6 composed waiver. |
| 2026-08-04 | S0 | reconcile | Rebasing onto new main `26fe0da9b` changed the bootstrap commit to `e39c9c4d7`; explicit lease/refspec push preserved the remote commit trail and lock edit. |
| 2026-08-04 | S1 | RED | Corrected assertion compared item values; current direct queryFn then failed at the second read: `Expected before-mutation, got after-mutation` (2 pass, 1 fail). |
| 2026-08-04 | S1 | GREEN | Server query options now select the registered CacheProvider; browser/no-provider calls remain direct. Focused tests 3/3 and scoped SDK check pass. |
| 2026-08-04 | S1 | reconcile | Issue #1252 still has exactly the four specification comments already researched; PR #1265 has no external review/evaluator comment. Labels/milestone/closing keyword remain correct. |
| 2026-08-04 | S2 | RED | `initialDataUpdatedAt` failed type-check as an unknown option; a pre-populated shared client rendered `stale shared-client snapshot` instead of the server snapshot. |
| 2026-08-04 | S2 | GREEN | Fresh now seeds hydration data once before observer creation, preserves its server timestamp, and exposes fetching/refetching state. Focused tests 5/5 and scoped Fresh check pass. |
| 2026-08-04 | S3 | RED | A POST to the planned standard invalidation path returned 404 from current `defineFreshApp` (7 pass, 1 fail). |
| 2026-08-04 | S3 | GREEN | Fresh now owns the same-origin JSON endpoint and browser helper; the mutate→invalidate→reload integration test observes the committed value. Focused tests 13/13, scoped check, and source-format gate pass. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Framework owns endpoint rather than product route | The reference route contains no product behavior. | issue #1252 + Pulseboard patch + plan D5 |
| Mount seed wins once | Fixes first paint without clobbering optimistic/refetched state. | issue correction + plan D2 |
| Server queryOptions selects registered provider | Aligns read/invalidation targets without breaking browser bundles. | SDK cache-provider design + plan D1 |
| General endpoint replaces Pulseboard's product route | The reusable seam accepts canonical exact keys/prefixes, is middleware-protected and configurable, while product-specific mutation behavior remains userland. | reference patch + plan D5 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Pre-existing `deno.lock` edit | minor | yes |
| Branch started three commits behind main | minor | yes |
| D6 replaces local PLAN-EVAL | minor | yes |
| JSR/doc audits are not clean at baseline | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline branch/status | raw git commands | PASS | no upstream; one excluded user lock edit |
| Fresh structured doc lint | `run-deno-doc-lint.ts --root packages/fresh` | BASELINE_FAIL | 44 pre-existing diagnostics |
| SDK structured doc lint | `run-deno-doc-lint.ts --root packages/sdk` | BASELINE_FAIL | one transitive pre-existing diagnostic |
| S1 SDK focused tests | `deno test --allow-all packages/sdk/tests/query/query-factory_test.ts` | PASS | 3 passed; RED proof recorded above |
| S1 SDK scoped check | `run-deno-check.ts --root packages/sdk --ext ts` | PASS | 77 files; zero diagnostics |
| S2 Fresh focused tests | `deno test -A ...query-options.test.ts ...initial-data.test.tsx` | PASS | 5 passed; both RED proofs recorded above |
| S2 Fresh scoped check | `run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS | zero diagnostics |
| S3 Fresh focused tests | three invalidation/bootstrapping test files | PASS | 13 passed; default/override/disable, request validation, browser helper, and reload path |
| S3 Fresh scoped check | `run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS | 179 selected files; zero diagnostics |
| S3 Fresh source format | `run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | PASS | 179 selected files; zero findings after formatting owned files |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| JSR baseline Fresh | BASELINE_FAIL | `audit-jsr-package.ts` | dry-run OK; pre-existing module-tag/cardinality/slow-type findings |
| JSR baseline SDK | BASELINE_WARN | `audit-jsr-package.ts` | dry-run OK; pre-existing cardinality/slow-type warnings |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| First paint with pre-populated client | PASS | `initial-data.test.tsx` | server snapshot wins once; timestamp and active revalidation state preserved |
| Mutate → server invalidation → reload | PASS | `query-cache-invalidation.test.ts` | stale read before endpoint; committed value on next server read after endpoint |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Pulseboard pattern | RESEARCHED | exact commit patch | behavioral specification only |
| Browser queryOptions fallback | PASS | focused SDK test | two calls hit the typed client directly with no registered provider |

## Handoff Notes

- Inspect D1/D2/D5 and the RED proof entries first.
- Compare final structured doc/audit counts to the recorded baseline; do not accept new findings.
