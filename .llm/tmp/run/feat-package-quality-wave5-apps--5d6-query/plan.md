# 5d6 PLAN-phase proposed slice lock — `./query` + `./server` + final package surface

Run: `openhands/pr-39/run-27467331167-1` · Branch: `feat/package-quality-wave5-apps-5d6-query`
Scope: **PLAN ONLY** — proposed commit-slice lock ≤30. Zero implementation.

---

## Reuse statement

Measurements are reused from committed run artifacts in this directory (`research.md`, `doc-lint-aggregate.json`, per-module `doc-lint-*.log`, `dry-run.log`). No new `deno doc --lint`, `deno check`, or `deno publish --dry-run` is executed.

---

## Archetype and gate matrix

- **Primary archetype:** Archetype 3 — Runtime/Behavior, with SCOPE-frontend overlay.
- **Justification:** `@netscript/fresh` is the runtime/framework piece that wires server loaders, islands, streaming, and query hydration; the frontend overlay applies to island/browser validation.
- **Gate matrix:** every gate required by Archetype 3 is listed below. Gates that do not apply are marked N/A with rationale; applicable gates are mapped to the slice(s) that retire them.

### Fitness-gate table

| Gate | Applicability | Retiring slice(s) | Evidence at slice |
|---|---|---|---|
| F-1 File-size lint | required | 5, 14, 21, 27 | Over-cap files decomposed or retired per cluster. |
| F-2 Helper-reinvention scan | required | 1, 10, 19 | Use SDK factories; no local duplication of Transport/query-client logic. |
| F-3 Layering check | required | 1, 2, 10 | Fresh depends on SDK/ports; no reverse imports. |
| F-4 Inheritance audit | required | 6, 15, 25 | `StreamErrorBoundary` class reviewed; no deep inheritance. |
| F-5 Public surface audit | required | 2, 6, 11, 16, 22, 28 | F-16 entrypoint list enforced; no kitchen-sink root. |
| F-6 JSR publishability | required | 3, 8, 13, 18, 24, 29 | `deno publish --dry-run` clean per slice cluster; final slice whole-package. |
| F-7 Doc-score gate | required | 4, 9, 12, 17, 20, 23, 26, 30 | JSDoc coverage and doc-lint 0. |
| F-8 Workspace lib check | required | 29, 30 | Root check includes `packages/fresh`; no lib mismatches. |
| F-9 Permission decl check | required | 1, 10, 19 | Package `deno.json` permissions reviewed for new runtime helpers. |
| F-10 Test-shape audit | required | 7, 14, 21, 28 | Unit + browser/consumer tests per touched seam. |
| F-11 Forbidden-folder lint | required | 5, 14, 21, 27 | `internal`/`_internal` used correctly; no new `utils`/`helpers` forks. |
| F-12 Naming-convention lint | required | all | Naming follows `kebab-case` files, `PascalCase` components, `camelCase` helpers. |
| F-13 Saga/runtime invariants | N/A — no sagas/workers in `@netscript/fresh` | — | Not applicable to this frontend/runtime package. |
| F-14 Console-log lint | required | all | No stray `console.log`; telemetry-aware logging only. |
| F-15 Re-export-upstream lint | required | 4, 9, 12, 17, 20, 23, 26 | Stop raw upstream hook re-exports; explicit package-owned types. |
| F-16 Folder-cardinality lint | required | 5, 14, 21, 27 | 13 entrypoints locked; no unapproved surface growth. |
| F-17 Abstract-derived co-location | required | 6, 15, 25 | Abstract/derived types co-located with implementations. |
| F-18 Sub-barrel lint | required | 2, 11, 16, 22, 28 | Sub-barrels export only public symbols; private helpers moved to `_internal/`. |

### Other gate families

| Gate family | Applicability | Retiring slice(s) |
|---|---|---|
| Static gates | required | all (evidence recorded per slice) |
| Runtime/Aspire validation | required (A3) | 14, 21, 28, 30 |
| Browser validation | subtype (SCOPE-frontend) | 7, 14, 21, 28 |
| Consumer import validation | required | 7, 14, 21, 28, 30 |

---

## Proposed slice lock (≤30)

Each slice lists: files touched, gates retired, and the doc-lint/over-cap/private-type-ref budget it removes.

### Phase A — Query bridge foundation

#### Slice 1 — Query types + layering scaffold
- **Files:** `query/query-types.ts` (new), `query/mod.ts` (type re-exports), `deno.json` (exports if needed).
- **What:** Package-owned `QueryOptions`, `MutationOptions`, `InfiniteQueryOptions`, `QueryObserverResult`, `MutationObserverResult` aliases. `LoaderData<T>` helper.
- **Retires:** F-2, F-3, F-9.
- **Budget impact:** prepares retirement of ~49 `./query/hooks.ts` private-type-refs and 2–3 missing-JSDoc.
- **Gate evidence:** `deno doc --lint ./query/mod.ts` shows new type aliases clean.

#### Slice 2 — Hook wrappers (replaces raw upstream re-exports)
- **Files:** `query/hooks.ts` (rewrite), `query/mod.ts`.
- **What:** Implement `useIslandQuery`, `useIslandMutation`, `useIslandInfiniteQuery`; add backward-compatible `useQuery`/`useMutation`/`useInfiniteQuery` aliases behind verification.
- **Retires:** F-5, F-6, F-7, F-15, F-18.
- **Budget impact:** removes **49** private-type-refs from `@tanstack/preact-query`/`@tanstack/react-db`; removes 12 missing-JSDoc.
- **Gate evidence:** `deno doc --lint ./query/mod.ts` has 0 upstream private-type-ref.

#### Slice 3 — `QueryIsland` + hydration explicit types
- **Files:** `query/query-island.tsx`, `query/hydration.ts`, `query/query-client.ts`.
- **What:** Explicit return types on `dehydrateQueryClient`, `hydrateFromDehydrated`, `getIslandQueryClient`; alias `ComponentChildren`/`VNode`/`DehydratedState`; explicit `QueryIslandProps`.
- **Retires:** F-1, F-4, F-6, F-7.
- **Budget impact:** removes 6 private-type-refs, 1 missing-return-type, 0 missing-JSDoc in `query-island.tsx`/`hydration.ts`/`query-client.ts`.
- **Gate evidence:** `./query/mod.ts` doc-lint total drops by 7.

#### Slice 4 — Dehydration script components (advanced path)
- **Files:** `query/hydration-script.tsx` (new), `query/hydration-boundary.tsx` (new), `query/mod.ts`.
- **What:** `QueryHydrationScript` emits JSON state; `HydrationBoundary` reads it and hydrates.
- **Retires:** F-5, F-7, F-10, F-12.
- **Budget impact:** net-new surface must start at 0 doc-lint errors.
- **Gate evidence:** component tests + `deno doc --lint` clean.

#### Slice 5 — Query cluster over-cap + sub-barrel cleanup
- **Files:** `query/mod.ts`, split any file > cap into `query/_internal/` helpers.
- **What:** Ensure no `query/` file exceeds F-1 cap; move non-public helpers to `_internal/`.
- **Retires:** F-1, F-11, F-16, F-18.
- **Budget impact:** 0 net doc-lint change, but clears over-cap debt.
- **Gate evidence:** file-size scan clean for `query/`.

### Phase B — `defineFreshApp` extension points

#### Slice 6 — `DefineFreshAppOptions` alpha seams
- **Files:** `server/define-fresh-app.ts`, `server.ts`.
- **What:** Add optional `createApp`, `staticFiles`, `fsRoutes`, `preConfigure`, `telemetry` fields. Update `defineFreshApp` implementation to honor them with unchanged defaults.
- **Retires:** F-5, F-7, F-17.
- **Budget impact:** removes 5 missing-JSDoc on `DefineFreshAppOptions`; adds explicit return type if missing.
- **Gate evidence:** `deno doc --lint ./server.ts` clean; unit tests pass.

#### Slice 7 — `defineFreshApp` seam tests
- **Files:** `server/define-fresh-app.test.ts`, `tests/` fixtures.
- **What:** Unit tests for each adapter override and default ordering; browser/consumer-import smoke.
- **Retires:** F-10, F-12, runtime/Aspire subtype, browser validation, consumer import.
- **Budget impact:** no doc-lint change.
- **Gate evidence:** tests pass.

#### Slice 8 — Server streaming type fixes
- **Files:** `server/stream.ts`, `server/stream-error-boundary.tsx`, `server.ts`.
- **What:** Explicit return types on `renderToStream`, `createStreamingResponse`; alias `VNode` and `JSX.Element`; expose `StreamErrorBoundaryState` correctly.
- **Retires:** F-6, F-7, F-15, F-17.
- **Budget impact:** removes **8** private-type-refs and 5 missing-JSDoc from `./server.ts`.
- **Gate evidence:** `./server.ts` doc-lint 0.

#### Slice 9 — Server.ts sub-barrel + re-export audit
- **Files:** `server.ts`.
- **What:** Ensure all re-exports are explicit; no raw upstream types leak; `TelemetryOptions` stub type exported.
- **Retires:** F-5, F-15, F-18.
- **Budget impact:** 0 regression.
- **Gate evidence:** `./server.ts` doc-lint 0 and F-18 check clean.

### Phase C — Cross-cluster private-type-ref retirement

#### Slice 10 — `./utils` cache-entry leak
- **Files:** `utils/mod.ts`.
- **What:** Export `type CacheEntry`.
- **Retires:** F-6, F-7, F-15.
- **Budget impact:** removes **4** private-type-refs from `./utils/mod.ts` and inherited root errors.
- **Gate evidence:** `./utils/mod.ts` doc-lint 0.

#### Slice 11 — `./builders` private-type-ref pass
- **Files:** `builders/mod.ts`, `builders/define-page/*.ts`, `builders/navigation.tsx`, `builders/runtime.tsx`.
- **What:** Export contract/builder helper types, decompose over-cap files, clean sub-barrels.
- **Retires:** F-1, F-5, F-6, F-7, F-15, F-16, F-18.
- **Budget impact:** removes **21** private-type-refs and 19 missing-JSDoc.
- **Gate evidence:** `./builders/mod.ts` doc-lint 0.

#### Slice 12 — `./defer` private-type-ref + telemetry consolidation
- **Files:** `defer/mod.ts`, `defer/policy.ts`, `defer/DeferIsland.tsx`, `defer/DeferPage.tsx`, `defer/telemetry.ts` (move to shared convention).
- **What:** Export policy types, alias JSX types, consolidate per-cluster telemetry into one shared convention.
- **Retires:** F-3, F-5, F-6, F-7, F-11, F-15.
- **Budget impact:** removes **14** private-type-refs and 46 missing-JSDoc from `defer/`.
- **Gate evidence:** `./defer/mod.ts` doc-lint 0.

#### Slice 13 — `./form` private-type-ref pass
- **Files:** `form/mod.ts`, `form/types.ts`, `form/handler-context.ts`, `form/runtime-state.ts`.
- **What:** Export public form types, alias upstream types, JSDoc fill.
- **Retires:** F-5, F-6, F-7, F-15, F-18.
- **Budget impact:** removes **11** private-type-refs, 60 missing-JSDoc, 3 other errors.
- **Gate evidence:** `./form/mod.ts` doc-lint 0.

#### Slice 14 — `./streams` upstream type wrapping
- **Files:** `streams/mod.ts`, `streams/create-stream-db.ts`.
- **What:** Introduce package-owned `StreamDb` / `StreamRecord` interfaces; wrap `@durable-streams/state` and `@tanstack/react-db` types.
- **Retires:** F-2, F-5, F-6, F-7, F-15.
- **Budget impact:** removes **24** private-type-refs and 8 missing-JSDoc.
- **Gate evidence:** `./streams/mod.ts` doc-lint 0; Aspire/consumer-import smoke.

#### Slice 15 — `./config/vite.ts` type + JSDoc pass
- **Files:** `config/vite.ts`.
- **What:** Export public Vite config types; complete JSDoc.
- **Retires:** F-6, F-7.
- **Budget impact:** removes **3** private-type-refs and 17 missing-JSDoc.
- **Gate evidence:** `./config/vite.ts` doc-lint 0.

### Phase D — Root barrel and wave closeout

#### Slice 16 — Root `mod.ts` curated surface
- **Files:** `mod.ts`.
- **What:** Re-export only primary public symbols; remove any deep/internal re-exports.
- **Retires:** F-5, F-15, F-16, F-18.
- **Budget impact:** removes 15 inherited private-type-refs and 8 missing-JSDoc.
- **Gate evidence:** `./mod.ts` doc-lint 0.

#### Slice 17 — Whole-package doc-lint 0
- **Files:** any remaining stragglers.
- **What:** Run combined `deno doc --lint` over all 13 entrypoints; fix last regressions.
- **Retires:** F-6, F-7, F-15.
- **Budget impact:** removes remaining errors to reach **0**.
- **Gate evidence:** `doc-lint-aggregate.json` shows 0 errors.

#### Slice 18 — JSR dry-run unblocked
- **Files:** `deno.json` (root), `packages/fresh/deno.json`.
- **What:** Lift `packages/fresh/` from root `deno.json` workspace `exclude`; ensure `publish.include` is correct; run `deno publish --dry-run --allow-dirty` from `packages/fresh/`.
- **Retires:** F-6, F-8.
- **Budget impact:** clears 58 `excluded-module` errors and 4 `missing-explicit-return-type` errors.
- **Gate evidence:** `deno publish --dry-run` passes including slow types.

#### Slice 19 — Root quality-gate union update
- **Files:** root `deno.json` (fmt/lint/check excludes), root `deno.json` tasks if needed.
- **What:** Add `packages/fresh` to the set of packages included in root check/fmt/lint excludes-union, mirroring `packages/sdk` and `packages/fresh-ui` precedent.
- **Retires:** F-8, F-12.
- **Budget impact:** none (configuration only).
- **Gate evidence:** `deno check` root passes with `packages/fresh` included; no lockfile churn.

#### Slice 20 — README + doctested getting-started
- **Files:** `README.md`, `docs/getting-started.md`, `tests/_fixtures/docs-examples_test.ts`.
- **What:** README ≥150 lines; getting-started examples are doctested.
- **Retires:** F-7, F-10.
- **Budget impact:** none.
- **Gate evidence:** `deno test tests/_fixtures/docs-examples_test.ts` passes.

#### Slice 21 — Consumer-import + Aspire runtime proof
- **Files:** `apps/playground/` (fixture), `tests/consumer-import_test.ts` (new or update).
- **What:** Import `@netscript/fresh/query` and `@netscript/fresh/server` in playground; run a route that uses the query bridge and `defineFreshApp` seams.
- **Retires:** runtime/Aspire validation, consumer import validation, browser validation.
- **Budget impact:** none.
- **Gate evidence:** consumer-import test passes; Aspire smoke passes.

#### Slice 22 — F-16 final surface audit
- **Files:** all 13 entrypoint barrels.
- **What:** Verify no new entrypoints, no kitchen-sink root, sub-barrels clean.
- **Retires:** F-5, F-16, F-18.
- **Budget impact:** 0.
- **Gate evidence:** entrypoint list matches umbrella plan.

#### Slice 23 — Test-shape + console-log sweep
- **Files:** all touched test files.
- **What:** Remove stray `console.log`; verify test naming, mocking (real code paths preferred), abort/cleanup coverage for streams/defer.
- **Retires:** F-10, F-14.
- **Budget impact:** none.
- **Gate evidence:** `deno task lint` clean; tests pass.

#### Slice 24 — Final doc-lint + dry-run regression gate
- **Files:** none (verification-only).
- **What:** Re-run combined `deno doc --lint` and `deno publish --dry-run`; confirm 0.
- **Retires:** F-6, F-7.
- **Budget impact:** confirms 0.
- **Gate evidence:** logs committed.

#### Slice 25 — Layering + inheritance final audit
- **Files:** none (verification-only).
- **What:** Verify no forbidden imports; no deep inheritance; abstract/derived co-location.
- **Retires:** F-3, F-4, F-17.
- **Budget impact:** none.
- **Gate evidence:** static scan / manual audit log.

#### Slice 26 — Permission decl + naming convention final audit
- **Files:** none (verification-only).
- **What:** Verify `deno.json` permission declarations for new runtime helpers; naming convention lint clean.
- **Retires:** F-9, F-12.
- **Budget impact:** none.
- **Gate evidence:** `deno task lint` clean.

#### Slice 27 — Over-cap file final sweep
- **Files:** any remaining >cap files.
- **What:** Decompose or justify remaining over-cap files.
- **Retires:** F-1, F-11.
- **Budget impact:** none.
- **Gate evidence:** file-size scan clean.

#### Slice 28 — Final consumer-import + browser validation
- **Files:** playground fixture.
- **What:** Full consumer-import and browser smoke with all 5d1–5d6 seams integrated.
- **Retires:** consumer import validation, browser validation.
- **Budget impact:** none.
- **Gate evidence:** E2E smoke passes.

#### Slice 29 — Root check/fmt/lint full pass
- **Files:** none (verification-only).
- **What:** Run root `deno check`, `deno fmt --check`, `deno lint` with `packages/fresh` included.
- **Retires:** F-8, F-12.
- **Budget impact:** none.
- **Gate evidence:** root gates pass.

#### Slice 30 — Wave closeout commit + context pack
- **Files:** `context-pack.md` (new/update), `commits.md`, `drift.md`.
- **What:** Final commit, update context pack, mark READY FOR IMPL-EVAL.
- **Retires:** all gates (final evidence rollup).
- **Budget impact:** none.
- **Gate evidence:** run artifact bundle complete.

---

## Dependency assumptions

- **5d1** — `./testing` entrypoint, error taxonomy, telemetry convention, docs scaffold, task layout are landed and stable.
- **5d2** — `./builders` and `./route` final surfaces are landed; this plan retires any residual private-type-refs in those clusters, not re-implements them.
- **5d3** — route-contract typing (`defineRoute`, contract algebra) is landed; the `LoaderData<T>` helper consumes it.
- **5d4** — `./defer`, `./streams`, and streaming SSR surfaces are landed; this plan retires residual doc-lint and over-cap issues.
- **5d5** — `./form` surface is landed; this plan retires residual doc-lint.
- **5b SDK** — `createServiceClient`, `createServiceQueryUtils`, `createNetScriptQueryClient`, and `DEFAULT_GC_TIME`/`DEFAULT_STALE_TIME` are available as described in `research.md`.

If any prior unit's landed surface differs from the assumptions above, the relevant slice is re-measured at implementation time and a drift entry is appended.

---

## Review map

| Stakeholder | Reviews |
|---|---|
| Supervisor (Fable 5) | Full plan; open questions in §5 of `design.md`. |
| SDK owner | Transport seam split (SDK owns factories, Fresh owns island consumption). |
| Fresh/Deno reviewer | Hook wrapper DX (`useQuery` aliases), island serialization, dehydration script. |
| Runtime/Aspire reviewer | `defineFreshApp` adapter seams, consumer-import/Aspire smoke slices. |

---

## Assumptions

1. The 5b SDK surface described in `research.md` will not change incompatibly before 5d6 implementation.
2. Root workspace exclusion lift is approved as a 5d6 closeout action.
3. `deno doc --lint` and `deno publish --dry-run` behavior in the current Deno version matches the committed logs.
4. Prior 5d1–5d5 implementations land sequentially before 5d6 implementation begins.
5. No new public dependencies are added to `@netscript/fresh` beyond those already declared.

---

## Questions for supervisor

(See `design.md` §5 for full context.)

1. Should we keep backward-compatible `useQuery`/`useMutation` aliases that delegate to `useIslandQuery`?
2. Is `QueryHydrationScript` + `HydrationBoundary` implementation in scope for 5d6, or types-only this wave?
3. Confirm root workspace exclusion lift is owned by 5d6 closeout.
4. Should `./server/sse.ts` be promoted to public server exports or stay internal?
5. Does `@netscript/fresh/query` need a thin `createQueryFactories` helper, or direct SDK consumption?
6. Is the `telemetry?: boolean | TelemetryOptions` seam aligned with 5d1 telemetry schema?

---

## Dependencies & merge impact

- 5d6 implementation must merge the landed head of `feat/package-quality-wave5-apps-5d5-form` before starting.
- The root workspace exclusion lift (slice 18) will cause root check/fmt/lint to include `packages/fresh` for the first time; a one-time pass is budgeted in slices 19 and 29.
- No lockfile changes are expected; if Deno updates `deno.lock` during verification, restore it unless the change is explicitly reviewed.
- Public surface changes are limited to optional additions and type aliases; no breaking changes.

---

## Side-effect ledger

| Change | Side effect | Mitigation |
|---|---|---|
| Lift `packages/fresh` from root exclude | Root fmt/lint/check may flag pre-existing debt | Scoped passes with explicit excludes; restore lockfile if mutated. |
| Stop raw upstream hook re-exports | Consumers importing `useQuery` from `@netscript/fresh/query` may see a slightly narrower return type | Provide backward-compatible aliases and document in README. |
| Add `defineFreshApp` optional seams | Public interface grows but remains backward-compatible | Type-only additions; defaults unchanged. |
| Consolidate per-cluster telemetry | Imports of `defer/telemetry.ts` may need update | Move file to shared convention, update imports in same slice. |
| Promote dehydration helpers | Adds two small components to public surface | Mark as advanced in docs; keep recommended path as `initialData`. |

---

## MEASURE-FIRST table (reused)

| Entrypoint | Total errors | privateTypeRef | missingJSDoc | Other | Notes |
|---|---|---:|---:|---:|---:|
| `./query/mod.ts` | 88 | 64 | 23 | 1 | 49 refs upstream hooks in `./hooks.ts` |
| `./form/mod.ts` | 74 | 11 | 60 | 3 | Mostly `types.ts` |
| `./defer/mod.ts` | 60 | 14 | 46 | 0 | `policy.ts` + telemetry |
| `./builders/mod.ts` | 40 | 21 | 19 | 0 | Define-page cluster |
| `./streams/mod.ts` | 32 | 24 | 8 | 0 | `create-stream-db.ts` |
| `./mod.ts` | 23 | 15 | 8 | 0 | Inherited |
| `./server.ts` | 13 | 8 | 5 | 0 | Streaming boundary |
| `./config/vite.ts` | 20 | 3 | 17 | 0 | Vite config surface |
| `./route/mod.ts` | 0 | 0 | 0 | 0 | Clean (5d3) |
| `./error/mod.ts` | 0 | 0 | 0 | 0 | Clean |
| `./utils/mod.ts` | 0 | 0 | 0 | 0 | 4 private refs to retire |
| `./interactive.ts` | 0 | 0 | 0 | 0 | Clean |
| `./testing` | — | — | — | — | Per 5d1 |
| **Deduplicated total** | **276** | **115** | **157** | **4** | From `doc-lint-aggregate.json` |
| **Dry-run package** | **62** | — | — | — | 58 `excluded-module` + 4 slow types |

Target after all slices: **0** doc-lint errors, **0** dry-run errors.
