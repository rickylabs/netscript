# Plan: [5d5] `@netscript/fresh/form` — RFC 15 forms consuming fresh-ui seams

## Run Metadata

| Field          | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Run ID         | `27465201406-1`                                             |
| Branch         | `feat/package-quality-wave5-apps-5d5-form`                  |
| Phase          | `plan`                                                      |
| Target         | `@netscript/fresh/form` (RFC 15 forms system)               |
| Archetype      | **A3 Runtime/Behavior** with **A4-Browser** obligation      |
| Scope overlays | `SCOPE-frontend`                                            |
| PR             | #38 (base: `feat/package-quality-wave5-apps-5d-fresh`)      |

## Archetype justification

`@netscript/fresh/form` owns long-running form state, server/client intent processing, CSRF/idempotency, and the island enhancement hook. This is Archetype 3 (Runtime/Behavior). It also exposes a fluent schema-adapter DSL (`createZodAdapter`, `createStandardSchemaAdapter`), which adds Archetype 4 flavor, but A3 is the larger fit because lifecycle/state/pipeline dominate. The A4-Browser obligation applies because the form system must prove real Fresh routes and browser workflows in `apps/playground`.

## Current Doctrine Verdict

From `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`: `@netscript/fresh` is under active Wave-5d reconstruction. `form/` is part of the reconstruction target. Verdict for this sub-gate: **Refactor/Restructure — split monolithic files, close public-surface doc gaps, preserve RFC 15 contract.**

## Axioms in Play

| Axiom | Why it matters |
|-------|----------------|
| A-1 (fitness functions enforce doctrine) | File-size, doc-lint, and JSR gates are the deliverable, not afterthoughts. |
| A-4 (narrow public surface) | `mod.ts` stays curated; internals move to `_internal/` and new sub-folders. |
| A-7 (no cross-package imports) | fresh and fresh-ui must not import each other; seam is value/attribute contract. |
| A-14 (no re-export upstream) | Standard Schema is a protocol, not a vendored library export. |
| A-19 (permissions declared) | README will document required permissions for playground routes if any. |

## Goal

Deliver a 30-slice-or-fewer implementation plan that closes form-internal quality gates for `@netscript/fresh/form`: file-size caps, doc-lint clean public surface, explicit return types, and real-route browser validation in `apps/playground`. The root workspace exclusion (`packages/fresh/` in root `deno.json`) is **not** resolved here; it is tracked as drift `D-5d5-1` for the umbrella close.

## Scope

- Decompose `schema-adapter.ts`, `field-descriptors.ts`, and `types.ts` while preserving every public export path/name.
- Add `createStandardSchemaAdapter` for Standard Schema interop (Zod/Valibot/ArkType).
- Re-export or narrow private types so `deno doc --lint` reports 0 errors for `./form`.
- Add explicit return types to public functions flagged by dry-run.
- Update/produce form README + architecture/concept docs to satisfy F-7 doc-score gate.
- Add/adjust playground routes proving no-JS submit, enhanced submit, server validation errors through fresh-ui, pending/idempotency, and CSRF.
- Merge 5d4 landing into this branch before implementation starts (umbrella sequence).

## Non-Scope

- Lifting the root workspace `packages/fresh/` exclusion (umbrella 5d6 owner).
- New lockfile changes; no `deno cache --reload`.
- Production-ready Valibot/ArkType constraint introspection (deferred to a follow-up slice once stable introspection APIs are validated).
- Client-side `onBlur`/`onChange` async validation via Standard Schema (deferred).
- Multi-step wizard pagination integration with fresh-ui (pagination surface stays as-is).

## Hidden Scope

- The optional `htmlFor` prop on `fresh-ui` `FormField` is a cross-package seam contract change; if rejected it must be documented as a fresh-ui follow-up.
- Internal barrels in `schema-adapter/mod.ts` and `field-descriptors/mod.ts` need `// arch:barrel-ok` justifications.
- `telemetry.ts` in `form/` may need alignment with 5d1's final telemetry convention; plan includes a sweep slice.
- README doctests must be wired through `tests/_fixtures/docs-examples_test.ts` (or form-local equivalent) if umbrella 5d1 scaffold is not yet available.

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| L-5d5-1 | Keep fresh ↔ fresh-ui seam value-level; no cross-package imports. | Matches L0 attribute contract and 5c deliverables. |
| L-5d5-2 | Decompose over-cap files by audience/responsibility, not by symbol. | Preserves public API while closing F-1. |
| L-5d5-3 | `FormSchemaAdapter` is canonical; add `createStandardSchemaAdapter`. | Market bar and library-agnostic DX without vendor lock-in. |
| L-5d5-4 | No export specifier or public type name changes without umbrella drift. | F-16 lock from umbrella plan. |
| L-5d5-5 | Root workspace exclusion is out of scope; tracked as D-5d5-1. | 5d6/umbrella owns lifting the exclude. |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| Add `htmlFor` prop to fresh-ui `FormField` | safe to defer | Plan documents it as a fresh-ui follow-up; seam works without it. |
| Valibot/ArkType introspection adapters | safe to defer | No runtime dep; files can be added later. |
| Client-side async validation | safe to defer | Follow-up slice after core submit path is solid. |
| Exact playground route count | must resolve during slice 1 | One route is enough if it covers all five browser gates. |

## Risk Register

| Risk | Mitigation |
|------|------------|
| Standard Schema error-shape parity | Unit-test `toFormErrors` parity before replacing Zod adapter path. |
| `private-type-ref` persists after type split | Per-slice doc-lint gate; re-export or narrow every leaking signature. |
| Sub-barrel lint objections | Mark internal barrels with `// arch:barrel-ok` and record in debt registry if needed. |
| 5d4 branch state unknown | Slice 0 = merge 5d4 into 5d5 branch and re-baseline; if conflict, escalate. |
| fresh-ui `htmlFor` rejected | Fallback recipe uses `name={field.id}`; no 5d5 code depends on the prop. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| AP-1 Monolithic file | existing | Split `schema-adapter.ts`, `field-descriptors.ts`, `types.ts`. |
| AP-14 Re-export upstream | risk | Do not `export { z } from 'zod'` or export Standard Schema types as public. |
| AP-22 Useless sub-barrel | risk | Internal barrels are justified aggregation files. |
| AP-25 Side effect in non-edge | existing/risk | Keep `csrf.ts` crypto at module edge; no new non-edge effects. |

## Fitness Gates

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| F-1 File-size lint | yes | All `packages/fresh/form/**/*.ts(x)` ≤475 LOC after decomposition. |
| F-2 Helper-reinvention scan | yes | No new wrappers of `@std/*` or Web Platform primitives; manual scan. |
| F-3 Layering check | yes | No cross-package implementation imports; imports stay inside `fresh/form` or from allowed deps (`@std/*`, `preact`, `fresh`, `zod`). |
| F-4 Inheritance audit | yes | No new class hierarchies; existing code is interfaces/functions. |
| F-5 Public surface audit | yes | `deno doc --lint packages/fresh/form/mod.ts` reports 0. |
| F-6 JSR publishability | yes (internal) | Form-internal `deno publish --dry-run` from `packages/fresh/` reports 0 form-specific errors except those caused by D-5d5-1 workspace exclusion. |
| F-7 Doc-score gate | yes | README + docs have JSDoc summaries, `@param`, `@returns`, `@example` on every public export. |
| F-8 Workspace lib check | yes | `packages/fresh/deno.json` `compilerOptions.lib` already includes `deno.unstable`; unchanged. |
| F-9 Permission decl check | yes | README "Required permissions" block updated if playground route needs net/KV. |
| F-10 Test-shape audit | yes | No test file >500 LOC; split if needed. |
| F-11 Forbidden-folder lint | yes | New folders use role vocabulary (`schema-adapter/`, `field-descriptors/`, `_internal/`); no `utils/`, `helpers/`, `common/`, `interfaces/`. |
| F-12 Naming-convention lint | yes | No `I*` interfaces, `*T` types, `*Impl` classes introduced. |
| F-13 Saga/runtime invariants | n/a | No sagas/workers in form package. |
| F-14 Console-log lint | yes | No `console.*` in published package code; telemetry uses structured events. |
| F-15 Re-export-upstream lint | yes | No `export *` from `npm:zod` or other upstream packages. |
| F-16 Folder-cardinality lint | yes | New sub-folders keep ≤12 immediate children; form root stays under cap. |
| F-17 Abstract-derived co-location | yes | No abstract classes; trivially satisfied. |
| F-18 Sub-barrel lint | yes | Internal `mod.ts` files justified with `// arch:barrel-ok`. |

## Static Gates

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| Narrow typecheck | yes | `deno check --unstable-kv packages/fresh/form/mod.ts` and changed files pass. |
| Slice typecheck | yes | Use `.llm/tools/run-deno-check.ts --root packages/fresh/form` per slice. |
| Format check | yes | `deno task fmt --check` on touched files passes. |
| Lint | yes | `deno task lint` on `packages/fresh/form` passes (or scoped equivalent). |
| Doc lint | yes | `deno doc --lint packages/fresh/form/mod.ts` = 0. |
| Publish dry-run | yes (scoped) | Run `deno publish --dry-run` from `packages/fresh/` and document remaining errors (all from D-5d5-1). |
| Link/path check | yes | Docs link checks for new `schema-adapter/` and `field-descriptors/` paths. |

## Runtime / Browser / Consumer Gates

| Gate family | Gate | Required | Evidence |
|-------------|------|----------|----------|
| Runtime/Aspire | Lifecycle start/stop | n/a | No long-running loops. |
| Runtime/Aspire | Cancellation propagation | n/a | No async IO loops touched. |
| Runtime/Aspire | Aspire health | n/a | No distributed resources changed. |
| Runtime/Aspire | Failure path | yes | Unit tests prove server validation errors and CSRF/idempotency failures. |
| Browser | Route check | yes | Playground form route renders with representative data. |
| Browser | Browser validation | yes | Playwright or manual browser log proving no-JS + enhanced submit. |
| Browser | Loading/empty/error states | yes | Verify pending, validation-error, and initial-empty states. |
| Browser | Responsive check | yes | Mobile + desktop render checked on playground route. |
| Browser | Contract check | yes | Playground route typechecks against `@netscript/fresh/form` and `@netscript/fresh-ui`. |
| Consumer | Package imports | yes | `apps/playground` imports `./form` and `./fresh-ui` components without type errors. |
| Consumer | README examples | yes | README example compiles or is marked with documented reason. |

## Arch-Debt Implications

| Entry | Action | Notes |
|-------|--------|-------|
| `D-5d5-1` root workspace exclusion | update | Add final retirement gate (umbrella 5d6). |
| Internal justified barrels | create if needed | `schema-adapter/mod.ts`, `field-descriptors/mod.ts` with `// arch:barrel-ok`. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
|-------|------|------------------|-----------------|
| 1 | F-1 | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' | xargs wc -l` | all files ≤475 |
| 2 | F-5 / Doc lint | `deno doc --lint packages/fresh/form/mod.ts` | 0 errors |
| 3 | Static typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | 0 errors |
| 4 | Scoped check | `.llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | 0 errors |
| 5 | Publish dry-run | `cd packages/fresh && deno publish --dry-run` | form-internal errors 0; only D-5d5-1 exclusion errors remain |
| 6 | Format/lint | `deno task fmt --check && deno task lint` scoped to touched files | 0 |
| 7 | Browser route | `deno task start` in `apps/playground` + manual/Playwright check | form route renders and submits with/without JS |
| 8 | Consumer import | `deno check apps/playground/routes/form-demo.tsx` | 0 errors |

## Proposed Slice Lock (≤30)

Each slice lists files touched, the gate(s) it retires, and the doc-lint / over-cap / private-type-ref budget it consumes.

### Foundation slices

| # | Slice | Files touched | Gates retired | Budget retired |
|---|-------|---------------|---------------|----------------|
| 0 | **Rebase/merge** 5d4 landing into 5d5 branch; re-run baseline checks. | branch metadata only | — | re-baselines MEASURE-FIRST |
| 1 | **README + docs scaffold** for form package (`packages/fresh/form/README.md`, `packages/fresh/docs/form/getting-started.md`, `packages/fresh/docs/form/architecture.md`). | `README.md`, `docs/form/*.md` | F-7, Static link/path | 0 doc-lint errors introduced; doc-score target set |
| 2 | **types.ts split** — move internals to `_internal/types.ts`; keep public `types.ts` under cap and re-export/narrow private refs. | `types.ts`, `_internal/types.ts`, `mod.ts` | F-1, F-5, Static doc-lint | 62 doc-lint errors → 0 on `types.ts`; 11 private-type-refs resolved |
| 3 | **`field-descriptors.ts` decomposition** into `field-descriptors/{descriptor,constraints,collection,aria-data,mod}.ts`. | `field-descriptors.ts` → new files, `mod.ts` imports updated | F-1, F-11, F-18 | 518 LOC file eliminated; no public surface change |
| 4 | **`schema-adapter.ts` decomposition** into `schema-adapter/{contract,standard,zod,mod}.ts`; `createZodAdapter` preserved. | `schema-adapter.ts` → new files, `mod.ts` imports updated | F-1, F-11, F-14, F-15, F-18 | 576 LOC file eliminated; no upstream re-exports |
| 5 | **Explicit return types** on public functions flagged by dry-run (`enhancement.tsx`, `form.tsx`, `form-region.tsx`, plus any in mod.ts). | `enhancement.tsx`, `form.tsx`, `form-region.tsx`, `mod.ts` | Static dry-run | 4 missing-explicit-return-type errors → 0 |
| 6 | **JSDoc sweep** on remaining public exports in `state.ts`, `pipeline.ts`, `intent.ts`, `reply.ts`, `errors.ts`, `csrf.ts`, `idempotency.ts`, `pagination.ts`, `config.ts`, `handler-context.ts`. | listed `.ts` files | F-5, F-7 | remaining `missing-jsdoc` → 0 |
| 7 | **Telemetry alignment** with 5d1 convention; remove or align `form/telemetry.ts`. | `telemetry.ts` | F-14, Static lint | no `console.*`, no stale telemetry |
| 8 | **`mod.ts` public surface audit** — ensure all 39 symbols have JSDoc and no private leaks. | `mod.ts` | F-5, F-15 | public surface clean |

### Schema/Adapter slices

| # | Slice | Files touched | Gates retired | Budget retired |
|---|-------|---------------|---------------|----------------|
| 9 | **Add `createStandardSchemaAdapter`** in `schema-adapter/standard.ts`; unit tests. | `schema-adapter/standard.ts`, `schema-adapter.test.ts` | F-5, F-10 | new public function documented and tested |
| 10 | **Zod adapter rebuild on Standard Schema** in `schema-adapter/zod.ts`; keep `createZodAdapter` signature stable. | `schema-adapter/zod.ts`, `schema-adapter.test.ts` | F-5, F-10, Consumer import | parity tests pass |
| 11 | **Schema introspector plugin interface** in `schema-adapter/contract.ts`; enables future Valibot/ArkType. | `schema-adapter/contract.ts` | F-5 | additive interface documented |

### fresh-ui seam slices

| # | Slice | Files touched | Gates retired | Budget retired |
|---|-------|---------------|---------------|----------------|
| 12 | **Document seam recipe** in `packages/fresh/docs/form/fresh-ui-recipe.md` (ID mapping, `controlProps`, `FormField`, pending state). | `docs/form/fresh-ui-recipe.md` | F-7, Static link/path | no code changes |
| 13 | **(Optional) fresh-ui `FormField htmlFor` prop** — add optional `htmlFor` defaulting to `name` in `packages/fresh-ui/registry/components/ui/form-field.tsx`. | `form-field.tsx` | Browser contract check | backward-compatible; if rejected, convert to documented follow-up |
| 14 | **`control-props.ts` parity check** — verify emitted `controlProps()` bag covers all props fresh-ui narrows; add missing tests/docs. | `control-props.ts` (read-only unless gap found), form tests/docs | F-5, Browser contract | seam contract complete |

### Playground/browser slices

| # | Slice | Files touched | Gates retired | Budget retired |
|---|-------|---------------|---------------|----------------|
| 15 | **Playground route scaffold** — `apps/playground/routes/form-demo.tsx` + server handler. | new route, handler | Browser route, Contract check | no package changes |
| 16 | **No-JS submit path** — route action parses `FormData`, runs Standard Schema adapter, returns reply state. | route handler, reply.ts integration | Browser validation | works with JS disabled |
| 17 | **Enhanced submit path** — island wraps form with `useFormEnhancement`; proves pending + idempotency. | route island component | Browser validation, Loading state | works with JS enabled |
| 18 | **Server validation errors rendered through fresh-ui** — map `FormState` fields to `FormField`/`getInputProps`. | route JSX | Browser validation, Error state | fresh-ui contract exercised |
| 19 | **CSRF/idempotency UX proof** — hidden inputs, token rotation, double-submit guard. | route component/handler | Browser validation, Failure path | tokens present and verified |
| 20 | **Responsive + mobile check** — verify route on narrow viewport. | route CSS/recipe only | Browser responsive | no code changes |

### Cleanup/gate closure slices

| # | Slice | Files touched | Gates retired | Budget retired |
|---|-------|---------------|---------------|----------------|
| 21 | **Test-shape sweep** — split any test file >500 LOC (`schema-adapter.test.ts` 404 LOC currently safe; recheck after additions). | test files if needed | F-10 | all tests ≤500 LOC |
| 22 | **Final doc-lint + typecheck** on `packages/fresh/form`. | all touched files | F-5, Static typecheck | 0 errors |
| 23 | **Final publish dry-run from `packages/fresh/`** and update `drift.md` with residual errors (D-5d5-1 only). | `drift.md` | F-6 (scoped) | documented residual |
| 24 | **Final format + lint sweep** scoped to touched files. | all touched files | Static format/lint | 0 errors |
| 25 | **README doctest wiring** (or local equivalent) if umbrella 5d1 scaffold not present. | `README.md`, test fixture | F-7 | examples compile |
| 26 | **Gate evidence capture** — screenshots/browser logs, command outputs archived in `.llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/`. | evidence files | all gates | audit trail |
| 27 | **Context-pack update** and plan finalization. | `context-pack.md`, `plan.md` | — | handoff ready |
| 28 | **Reserved buffer** for Plan-Gate feedback fixes. | — | — | ≤2 slice budget |
| 29 | **Reserved buffer** for merge-prep after 5d4 dependencies. | — | — | ≤2 slice budget |

**Total locked slices:** 30 (including 2 reserved buffers).

## Gate-to-Slice Map

| Gate | Slices that retire it |
|------|-----------------------|
| F-1 File-size lint | 2, 3, 4 |
| F-2 Helper-reinvention scan | 3, 4, 7 (manual evidence per slice) |
| F-3 Layering check | 2, 3, 4, 7, 8, 12 |
| F-4 Inheritance audit | n/a (no class hierarchies) |
| F-5 Public surface audit | 2, 5, 6, 8, 9, 10, 11 |
| F-6 JSR publishability | 23 (scoped; residual D-5d5-1 documented) |
| F-7 Doc-score gate | 1, 6, 9, 11, 12, 25 |
| F-8 Workspace lib check | n/a (no change to `compilerOptions.lib`) |
| F-9 Permission decl check | 1, 25 |
| F-10 Test-shape audit | 9, 10, 21 |
| F-11 Forbidden-folder lint | 3, 4 |
| F-12 Naming-convention lint | all slices (no violations introduced) |
| F-13 Saga/runtime invariants | n/a |
| F-14 Console-log lint | 4, 7 |
| F-15 Re-export-upstream lint | 4, 8 |
| F-16 Folder-cardinality lint | 3, 4 |
| F-17 Abstract-derived co-location | n/a |
| F-18 Sub-barrel lint | 3, 4 |
| Static — Narrow typecheck | 5, 22 |
| Static — Slice typecheck | all implementation slices |
| Static — Format check | 24 |
| Static — Lint | 24 |
| Static — Doc lint | 2, 22 |
| Static — Publish dry-run | 23 |
| Static — Link/path check | 1, 12 |
| Runtime — Failure path | 16, 19 |
| Browser — Route check | 15 |
| Browser — Browser validation | 16, 17, 18, 19 |
| Browser — Loading/empty/error states | 17, 18 |
| Browser — Responsive check | 20 |
| Browser — Contract check | 13, 14, 15 |
| Consumer — Package imports | 15 |
| Consumer — README examples | 25 |

## Review map

- **Supervisor review points:** Standard Schema adapter shape; optional fresh-ui `htmlFor` prop; playground route scope.
- **Plan-Gate checklist location:** `.llm/harness/gates/plan-gate.md` will be applied by PLAN-EVAL.
- **Evidence archive:** `.llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/`.

## Assumptions

1. 5d4 implementation lands and is merged into the 5d umbrella branch before 5d5 implementation starts (umbrella sequence).
2. 5d1 error taxonomy and telemetry conventions are available on the umbrella branch.
3. fresh-ui `form-field.tsx` and `control-props.ts` remain stable except for the optional `htmlFor` slice.
4. Standard Schema support in Zod 4 (already a package dependency) is sufficient; no new dependency version bump needed.
5. The root workspace `packages/fresh/` exclusion is intentionally left in place for 5d6; 5d5 does not attempt to remove it.

## Questions for supervisor

1. Is the optional `htmlFor` prop on `fresh-ui` `FormField` acceptable as a 5d5 slice, or should it be deferred to a fresh-ui follow-up?
2. Should the playground route be a single comprehensive demo, or split into multiple routes (no-JS vs enhanced)?
3. Are Valibot/ArkType introspection adapter stubs welcome as deferred files in `schema-adapter/`, or should they be omitted entirely from 5d5?
4. Does the umbrella want 5d5 to attempt partial README doctest wiring now, or rely on 5d1's `tests/_fixtures/docs-examples_test.ts` scaffold?

## Dependencies & merge impact

- **5d4:** must merge into 5d5 branch before implementation (slice 0).
- **5d1:** error taxonomy + telemetry conventions assumed landed; form `errors.ts` and `telemetry.ts` align.
- **5c (fresh-ui):** no merge dependency, but seam recipe depends on current 5c file contents.
- **5d6:** owns lifting root workspace exclusion; 5d5 drift `D-5d5-1` is the handoff.
- **Merge impact:** No public API breaks; additive `createStandardSchemaAdapter`. Playground route is new.

## Side-effect ledger

- New directories: `packages/fresh/form/schema-adapter/`, `packages/fresh/form/field-descriptors/`, `packages/fresh/form/_internal/`.
- New docs: `packages/fresh/form/README.md`, `packages/fresh/docs/form/*.md`.
- Optional fresh-ui change: `packages/fresh-ui/registry/components/ui/form-field.tsx` (`htmlFor` prop).
- Playground addition: `apps/playground/routes/form-demo.tsx` (+ handler/island).
- No lockfile changes. No dependency additions. No export specifier removals.
