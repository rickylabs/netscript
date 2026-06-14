# Plan — 5d1 support spine (`@netscript/fresh`)

Run: `feat/package-quality-wave5-apps-5d1-support` (PR #34)  
Status: **PROPOSED slice lock** — awaiting PLAN-EVAL.

## Authority and scope

- Derives from BINDING umbrella `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md`.
- Reuses Phase-1 research: `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/research.md`.
- Design decisions locked in: `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/design.md`.
- Archetype: **A3 Runtime/Behavior + SCOPE-frontend overlay**; 5d1 behaves like A4 utilities.

## MEASURE-FIRST budget retired by this plan

| Budget item | Baseline | 5d1 target | Notes |
|-------------|----------|------------|-------|
| `missing-jsdoc` in 5d1-owned exports | 25 (scoped combined) | 0 | Retires all JSDoc gaps on error, utils, vite, interactive, telemetry, testing, root. |
| `private-type-ref` in 5d1 scope | 6 | 0 | `config/vite.ts` × 3 + `components/ErrorDisplay.tsx` × 3. |
| `private-type-ref` out of scope | 8 | unchanged | `defer/` × 6, `form/` × 2 → 5d4/5d5. |
| Files > 500 LOC / > 800 LOC | 0 / 0 | 0 / 0 | Split `error/handler.ts` for spine hygiene. |
| `deno publish --dry-run` slow types | 4 historical | 0 | Add explicit return types (`Plugin`, etc.). |
| Root workspace `packages/fresh` exclusion | excluded | **propose un-exclude** | Drift entry D-5d1-003; final call by supervisor. |

## Slice lock (24 slices)

Slices are ordered to keep the tree buildable after each commit. Each slice names files touched, the gate it proves, and the doc-lint / cap / private-type-ref budget it retires.

### Foundation slices

#### S1 — `deno.json` task hygiene
- **Files**: `packages/fresh/deno.json`
- **What**: Add `doc-lint`, `fmt`, `lint`, `dry-run` tasks; update `check` and `test` to enumerate every current entrypoint; add `./testing` placeholder to `check` once S12 lands.
- **Gate**: F-6 (JSR publishability — task hygiene), F-8 (workspace lib check).
- **Budget**: 0 — infrastructure only.
- **Drift**: Updates D-5d1-003 if root exclusion is touched.

#### S2 — docs scaffold + publish include
- **Files**: `packages/fresh/docs/README.md`, `docs/getting-started.md`, `docs/architecture.md`, `docs/concepts.md`, `docs/recipes/.gitkeep`, `docs/reference/.gitkeep`, `packages/fresh/deno.json` (publish include).
- **What**: Create docs scaffold and add `docs/**` to `publish.include`.
- **Gate**: F-7 (doc-score gate), `package-quality-archetype.md` items 6–7.
- **Budget**: 0.

#### S3 — doctest fixture scaffold
- **Files**: `packages/fresh/tests/_fixtures/docs-examples_test.ts`
- **What**: Stub fixture that imports the README quick-start symbols; body filled when README example is stable.
- **Gate**: F-10 (test-shape audit), F-7 (doctests).
- **Budget**: 0.

### Error taxonomy slices

#### S4 — split `error/handler.ts` into typed modules
- **Files**: `packages/fresh/error/types.ts` (new), `error/classify.ts` (new), `error/extract.ts` (new), `error/handler.ts` (shrink), `error/mod.ts` (update barrel).
- **What**: Move `ErrorType`/`ErrorData` to `types.ts`, classification helpers to `classify.ts`, extraction helpers to `extract.ts`, keep orchestrator in `handler.ts`.
- **Gate**: F-1 (file-size lint), F-5 (public surface unchanged), F-7 (doc-lint).
- **Budget**: Cap: all error files < 300 LOC. JSDoc: ~10 symbols in handler split remain to be documented in S5.

#### S5 — JSDoc error core
- **Files**: `packages/fresh/error/types.ts`, `error/classify.ts`, `error/extract.ts`, `error/handler.ts`, `error/primitives.ts`.
- **What**: Add JSDoc to every exported symbol in error core.
- **Gate**: F-7.
- **Budget**: Retires ~10 `missing-jsdoc` errors.

#### S6 — relocate `ErrorDisplay` into `error/`
- **Files**: `packages/fresh/components/ErrorDisplay.tsx` → `error/ErrorDisplay.tsx` (git mv), `error/mod.ts` (export), `mod.ts` (update import), delete `components/`.
- **What**: Dissolve `components/` folder; move view into error surface.
- **Gate**: F-16 (folder-cardinality lint), F-5, F-11 (forbidden-folder lint).
- **Budget**: 0 new doc errors; clears 3 `private-type-ref` in S7.

#### S7 — `ErrorDisplay` private-type-ref + JSDoc
- **Files**: `packages/fresh/error/ErrorDisplay.tsx`, `error/mod.ts`.
- **What**: Re-export `ComponentChildren` from `preact` through `error/mod.ts`; add JSDoc to `ErrorDisplayProps`, `ErrorDisplay`, `InlineError`.
- **Gate**: F-7, F-5.
- **Budget**: Retires 3 `private-type-ref` + 4 `missing-jsdoc`.

### Vite wrapper slices

#### S8 — public type fixes for `config/vite.ts`
- **Files**: `packages/fresh/config/vite.ts`.
- **What**: Export `NetScriptViteAlias`; re-export `NetScriptRouteManifestOptions`; annotate `createNetScriptVitePlugin` return type `Plugin`; re-export `Plugin` from `vite`.
- **Gate**: F-6, F-5, F-7.
- **Budget**: Retires 3 `private-type-ref` + prevents slow-type regression.

#### S9 — JSDoc for `config/vite.ts`
- **Files**: `packages/fresh/config/vite.ts`.
- **What**: Add JSDoc to `NetScriptVitePluginOptions`, every field, `NetScriptViteAlias`, `NetScriptViteEnvMapping`, `createNetScriptVitePlugin`.
- **Gate**: F-7.
- **Budget**: Retires ~15 `missing-jsdoc` errors.

### Interactive / utils slices

#### S10 — dissolve `hooks/` and relocate `use-promise.ts`
- **Files**: `packages/fresh/hooks/use-promise.ts` → `interactive/use-promise.ts` (git mv), `interactive.ts` (update import), delete `hooks/`.
- **What**: Move hook into interactive seam; keep `interactive.ts` as curated barrel.
- **Gate**: F-16, F-5, F-11.
- **Budget**: 0.

#### S11 — JSDoc interactive + utils
- **Files**: `packages/fresh/interactive/use-promise.ts`, `interactive.ts`, `utils/mod.ts`, `utils/cache-entry.ts`.
- **What**: Add JSDoc to `usePromise`, `resolvedPromise`; normalize `CacheEntryLike<T>` and document helpers.
- **Gate**: F-7, F-2 (helper-reinvention scan).
- **Budget**: Retires remaining ~6 `missing-jsdoc` errors in 5d1-owned files (interactive + utils).

### Telemetry spine slices

#### S12 — scaffold shared telemetry convention
- **Files**: `packages/fresh/_internal/telemetry.ts` (new).
- **What**: Implement `createFreshTracer`, `withFreshSpan`, `emitFreshError`, `FreshSpanOptions`, `FreshSpanAttributeMap`, plus OTel/NetScript naming convention.
- **Gate**: F-5 (internal surface not exported), F-7 (documented), F-15 (wrap upstream tracer, don’t reinvent).
- **Budget**: 0 — new internal module, no doc-lint errors expected.

#### S13 — migrate `defer/telemetry.ts` to shared convention
- **Files**: `packages/fresh/defer/telemetry.ts`.
- **What**: Keep public function signatures, delegate attribute/span emission to `_internal/telemetry.ts`; rename cluster-prefixed attributes to `netscript.operation` + span-name scoping.
- **Gate**: F-5, F-7, F-15.
- **Budget**: 0 new doc-lint errors; does not touch the 6 out-of-scope defer private-type-refs.

#### S14 — debt entry for `form/telemetry.ts` cutover
- **Files**: `.llm/harness/debt/arch-debt.md`, `packages/fresh/form/telemetry.ts` (add deprecation comment only).
- **What**: Mark `form/telemetry.ts` as deprecated-in-place; schedule cutover for 5d5.
- **Gate**: F-5 (surface unchanged), debt registry.
- **Budget**: 0.

### Root / public-surface slices

#### S15 — drop defer symbols from root `mod.ts`
- **Files**: `packages/fresh/mod.ts`.
- **What**: Remove `DeferComponent`, `DeferPage`, `DEFER_POLICY`, `DEFER_STALE_MS`, `DETAIL_FORCE_REFRESH_POLICY`, `resolveDetailDeferConfig` from root barrel.
- **Gate**: F-5, F-18 (sub-barrel lint).
- **Budget**: 0.
- **Drift**: New umbrella drift entry required; see Side-effect ledger.

#### S16 — JSDoc root + testing scaffold
- **Files**: `packages/fresh/mod.ts`, `testing.ts` (new).
- **What**: Add JSDoc to root `@module` and re-exports; scaffold `testing.ts` with `createMockRouteContext`, `createMockDeferPolicy`, `@module` doc.
- **Gate**: F-7, F-10.
- **Budget**: Retires any remaining missing-JSDoc on root/testing; 0 if already clean.

### Quality-verification slices

#### S17 — `deno check` over 5d1 entrypoints
- **Files**: all 5d1 entrypoints.
- **What**: Run `deno task check` inside `packages/fresh`; fix any type regressions introduced by moves/splits.
- **Gate**: F-8 (workspace lib check).
- **Budget**: 0.

#### S18 — `deno doc --lint` over 5d1 entrypoints
- **Files**: all 5d1 entrypoints.
- **What**: Run `deno task doc-lint`; verify 0 errors on 5d1-owned exports; document remaining inherited errors with drift.
- **Gate**: F-7.
- **Budget**: Retires 25 `missing-jsdoc` + 6 `private-type-ref` in scope.

#### S19 — `deno publish --dry-run`
- **Files**: `packages/fresh/deno.json`, publish config.
- **What**: Run `deno publish --dry-run --allow-dirty`; fix slow types / excluded-module issues inside 5d1 scope.
- **Gate**: F-6.
- **Budget**: Retires historical 4 `missing-explicit-return-type` risks.

#### S20 — `deno fmt` + `deno lint`
- **Files**: source files touched above.
- **What**: Run `deno task fmt` and `deno task lint`; apply fixes only to 5d1-owned files.
- **Gate**: F-12 (naming-convention lint), F-14 (console-log lint), static gates.
- **Budget**: 0.

#### S21 — tests for error split and telemetry wrapper
- **Files**: `packages/fresh/error/*.test.ts` (new/updated), `defer/telemetry.test.ts` (update), `_internal/telemetry.test.ts` (new).
- **What**: Unit tests for classification/extraction helpers; telemetry wrapper tests (attribute emission, error recording).
- **Gate**: F-10.
- **Budget**: 0.

#### S22 — consumer import validation
- **Files**: `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/tests/consumer-imports_test.ts` or similar fixture.
- **What**: Assert that consumers can import from `@netscript/fresh`, `@netscript/fresh/error`, `@netscript/fresh/utils`, `@netscript/fresh/interactive`, `@netscript/fresh/vite`, and the new `./testing`.
- **Gate**: Consumer import validation (required for A3/A4).
- **Budget**: 0.

#### S23 — README ≥ 150 lines + doctest wiring
- **Files**: `packages/fresh/README.md`, `tests/_fixtures/docs-examples_test.ts`.
- **What**: Expand README to ≥ 150 lines with quick-start example; wire doctest fixture to execute it.
- **Gate**: F-7, umbrella README target.
- **Budget**: 0.

#### S24 — root workspace un-exclusion decision gate
- **Files**: root `deno.json` (optional), `packages/fresh/deno.json`.
- **What**: If supervisor approves D-5d1-003, remove `packages/fresh` from root workspace exclude and run root `deno task check` / `deno task doc-lint` to prove no new root failures. If not approved, leave excluded and record accepted drift.
- **Gate**: F-8, F-6.
- **Budget**: 0.

## Gate-to-slice map

| Gate | Slices | Evidence / note |
|------|--------|-----------------|
| F-1 File-size lint | S4, S6, S10 | Split `error/handler.ts`; dissolve `components/` and `hooks/`; no file > 500 LOC. |
| F-2 Helper-reinvention scan | S11 | Normalize `CacheEntryLike<T>` against SDK; document rationale. |
| F-3 Layering check | S1, S4, S12, S16 | Internal helpers in `_internal/`; error surface layers separate from adapters. |
| F-4 Inheritance audit | n/a | No class inheritance in 5d1 scope. |
| F-5 Public surface audit | S4, S6, S7, S8, S12, S13, S14, S15, S16 | Every surface change recorded; root defer drop is the only breaking change. |
| F-6 JSR publishability | S1, S8, S9, S19, S24 | Explicit return types, publish include, dry-run pass. |
| F-7 Doc-score gate | S2, S3, S5, S7, S9, S11, S12, S16, S18, S23 | JSDoc on every 5d1-owned export; docs scaffold; doctests. |
| F-8 Workspace lib check | S1, S17, S24 | `check` task enumerates every entrypoint; root un-exclusion if approved. |
| F-9 Permission decl check | n/a | No new Deno permissions required in 5d1 support spine. |
| F-10 Test-shape audit | S3, S16, S21, S22 | Unit tests, telemetry tests, consumer-import tests, doctest fixture. |
| F-11 Forbidden-folder lint | S2, S4, S6, S10, S12 | Dissolve `components/` and `hooks/`; `_internal/` is allowed; docs/ is allowed. |
| F-12 Naming-convention lint | S20 | `deno lint` pass on touched files. |
| F-13 Saga/runtime invariants | n/a | No sagas/runtime state in 5d1 support spine. |
| F-14 Console-log lint | S20 | `deno lint` catches `console.log` leaks. |
| F-15 Re-export-upstream lint | S12, S13 | Telemetry wraps `@netscript/telemetry/tracer`; does not duplicate upstream. |
| F-16 Folder-cardinality lint | S2, S4, S6, S10 | Docs subfolders created; `components/` and `hooks/` dissolved; error split creates sibling files. |
| F-17 Abstract-derived co-location | n/a | No abstract classes in scope. |
| F-18 Sub-barrel lint | S15 | Drop defer symbols from root barrel; root no longer duplicates `./defer`. |
| Static gates | S17, S18, S19, S20 | Type, doc, publish, lint, fmt. |
| Runtime/Aspire validation | n/a for 5d1 | Runtime behavior belongs to 5d2/5d3/5d4/5d5; no Aspire touches in support spine. |
| Browser validation | n/a | 5d1 has no browser-only route surfaces; A4-browser subtype deferred to 5d2/5d5. |
| Consumer import validation | S22 | Explicit consumer-import test for every 5d1 entrypoint + `./testing`. |

## Review map

| Artifact | Purpose | Hot spots for reviewer |
|----------|---------|------------------------|
| `design.md` | Locked decisions and rationale | Error split, telemetry convention, root defer drop, `_internal/telemetry.ts` location. |
| `plan.md` (this file) | Slice lock + gate map | S15 public-surface change, S24 root un-exclusion, budget retirement claims. |
| `context-pack.md` | Resumable summary | Entrypoints, file moves, open questions. |
| `drift.md` | Reality vs plan | D-5d1-003 workspace exclusion, D-5d1-009 inherited doc-lint errors. |

## Assumptions

1. Phase-1 research numbers are current and authoritative; no re-measurement was performed.
2. Zero external consumers of `@netscript/fresh` root defer symbols (alpha latitude).
3. `_internal/` is doctrine-allowed for genuinely internal composition (A8/AP-16).
4. `deno publish --dry-run` 58 `excluded-module` errors are caused by root workspace exclusion, not by `packages/fresh` publish config itself.
5. `error/handler.ts` split does not change runtime behavior because helpers are pure functions.
6. `form/telemetry.ts` can remain a shim in 5d1 because its public functions are not called by 5d1 code.

## Questions for supervisor

1. **Root defer drop**: May 5d1 remove `defer/` symbols from root `mod.ts` now, or defer to 5d4?
2. **Root workspace exclusion**: May 5d1 attempt controlled un-exclusion of `packages/fresh` from root `deno.json` once 5d1 entrypoints pass, or must it wait for 5d6?
3. **`error/handler.ts` split**: Split even though F-1 flag is 500 LOC, or accept 411 LOC under a support-spine opt-out?
4. **`./testing` scope**: Should 5d1 scaffold only Fresh-local fixtures, or re-export an existing SDK/telemetry memory adapter?
5. **Telemetry attribute prefix**: Confirm `netscript.operation` as the cross-cutting logical-operation attribute, vs a different namespace.

## Dependencies & merge impact

- **Depends on**: Phase-1 research committed on this branch; umbrella plan committed on `feat/package-quality-wave5-apps--5d-fresh`.
- **Blocks**: 5d2 builders, 5d3 route, 5d4 streaming, 5d5 form, 5d6 query — all inherit the telemetry convention, docs scaffold, `./testing`, task layout, and root-barrel policy.
- **Merge target**: `feat/package-quality-wave5-apps--5d-fresh` via `--no-ff` after IMPL-EVAL.
- **Public surface changes** (require umbrella drift entry):
  - Root `mod.ts` no longer re-exports defer symbols.
  - `NetScriptViteAlias` becomes public.
  - `ComponentChildren` re-exported from `@netscript/fresh/error`.
- **Non-breaking changes**: file moves inside `error/` and `interactive/`, JSDoc additions, `_internal/` creation.

## Side-effect ledger

| Change | Side effect | Mitigation |
|--------|-------------|------------|
| Move `components/ErrorDisplay.tsx` → `error/ErrorDisplay.tsx` | Internal imports in tests/apps may break | Migration map in design.md; search-and-replace in `packages/fresh` only. |
| Remove defer symbols from root `mod.ts` | Any app importing defer via `@netscript/fresh` root breaks | Update to `@netscript/fresh/defer`; assume alpha/zero consumers. |
| Create `_internal/telemetry.ts` | Future sub-gates must use it; `defer/telemetry.ts` deprecated | Document in `docs/architecture.md`; enforce in 5d4/5d5 plan reviews. |
| Re-export `Plugin` from `vite` | Adds `vite` type to public surface | Already a dependency; explicit return type improves JSR score. |
| Add `docs/` to publish include | Slightly larger tarball | Docs are required for JSR score and package-quality bar. |
| Un-exclude `packages/fresh` from root workspace | Root `deno check`/`doc-lint` may surface inherited errors from other clusters | Slice S24 gates this; if too noisy, leave excluded and record drift. |

---

*Plan ready for PLAN-EVAL.*
