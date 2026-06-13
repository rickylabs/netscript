# Plan: 5d2 builders — `definePage` DSL decomposition

## Run Metadata

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Run ID         | `feat-package-quality-wave5-apps--5d2-builders`      |
| Branch         | `feat/package-quality-wave5-apps-5d2-builders`       |
| PR             | #35                                                  |
| Phase          | `plan`                                               |
| Target         | `packages/fresh/builders`                            |
| Archetype      | A3 Runtime/Behavior + A4 DSL/Builder + SCOPE-frontend |
| Scope overlays | frontend                                             |

## Archetype

Primary **Archetype 3 — Runtime/Behavior** with **SCOPE-frontend** overlay.
`definePage` itself is a public DSL/Builder, so A4 design vocabulary applies for builder state, factory, validation, and type catalog splits.
Browser validation is required because the DSL drives Fresh route output.

## Doctrine Verdict

This plan remediates **AP-1 Monolithic file** on `packages/fresh/builders/mod.ts`,
`builders/define-page/builder.tsx`, `types.ts`, `navigation.tsx`, and `runtime.tsx` by splitting
each into role-named files under `builder/`, `runtime/`, and `navigation/`.

It respects **A1 Public types first** by keeping the public type catalog in `types.ts` and moving
implementation helpers into non-public modules.

It honors **A8 One concern per folder** by assigning each new folder a single role:
`builder/` (definition-time fluent API), `runtime/` (request-time execution), `navigation/`
(Preact context and link helpers).

It contains no cross-package inheritance, no new `utils/`/`helpers/` folders, and no upstream
re-exports beyond the existing `zod` schemas in `search-params.ts`.

## Axioms in Play

| Axiom | Application in this plan |
| ----- | ------------------------ |
| A1 Public types first | Public type catalog kept in `types.ts`; helpers moved to `internal.ts` or role modules. |
| A2 Simple over easy at boundaries | Public surface unchanged; no new public symbols. |
| A3 80 percent path is one chained call | `definePage()` chain preserved; no signature change. |
| A4 Base classes are stub-only contracts | No new class hierarchy introduced. |
| A5 Composition over inheritance | Builder split by composition, not inheritance. |
| A6 Helpers must be justified | Each new file owns one concern; no generic helper folders. |
| A7 Web Platform / `@std/*` first | Existing `URLSearchParams` / `@std/path` usage preserved. |
| A8 One concern per folder / one reason per file | `builder/`, `runtime/`, `navigation/` each single-role. |
| A9 Archetype drives shape | A4 minimum folder shape used inside `define-page/`. |
| A10 Composition root over container | Fresh route wiring remains explicit; no new DI. |
| A11 Name extension axes before abstraction | Folder names (`builder`, `runtime`, `navigation`) name real seams. |
| A12 Durable workflows are state machines | N/A for this refactor. |
| A13 Crash boundaries are explicit | Error handling preserved in `runtime/handlers.ts`. |
| A14 Tests and gates preserve doctrine | Slice-level gates + final `deno task arch:check`. |

## Goal

Decompose the over-cap `./builders` cluster into a layered folder shape that honors the umbrella
architecture, preserves every public export specifier/type name, and clears doc-lint
private-type-ref + missing-jsdoc + file-size debt — without any behavior change.

## Scope

- `packages/fresh/builders/` folder restructuring under 20K source caps.
- Public surface unchanged (same exports from `builders/mod.ts`).
- Move builder/runtime/navigation/search-params internal helpers to role-named subfolders.
- Split `define-page.test.tsx` along the same seams.
- Clear all doc-lint errors from `builders/mod.ts` combined export.
- Make the necessary form-package surface changes (public visibility + JSDoc) so the builders barrel
  can re-export form-state types without JSR private-type-ref violations.
- Update `packages/fresh/deno.json` only if subpath exports must change (none expected).
- Add/update browser-validation fixture routes in `apps/playground` to exercise SSR, navigation,
  pending states, and error boundaries.

## Non-Scope

- No new DSL features (`definePage` signature stays identical).
- No new public subpaths (umbrella allows only `./testing` as growth).
- No RFC 14 unified-mode implementation (only protection seams documented in `design.md`).
- No streaming primitive changes (streaming lives in `packages/fresh/server/stream.ts`; 5d4 owns it).
- No query/island-bridge implementation (5d6 owns it; context shape sized for future extension).
- No form-field/validation behavior changes (5d5 owns behavior; 5d2 only adjusts visibility/JSDoc).

## Hidden Scope

- Internal import re-targeting after moves.
- Test file imports and test-name prefixes must follow the new file paths.
- `deno publish --dry-run` must remain clean after re-exports move.
- New sub-barrels under `define-page/` need `// arch:barrel-ok` comments and audit-registry entries
  to satisfy F-18.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| L-1 | Keep public surface identical | Umbrella plan F-16/F-18 and handover require zero export/type-name change. |
| L-2 | Use role-named subfolders inside `define-page/` | A4 minimum folder shape: builder / runtime / navigation / types / internal. |
| L-3 | Split by cohesion, not byte target alone | Each new file owns one concern; avoids folder bloat and satisfies F-16. |
| L-4 | Test decomposition mirrors source seams | Easier gate-per-slice and keeps test files under cap. |
| L-5 | Browser validation uses `apps/playground` fixture routes | Handover A4-Browser obligation; existing playground is the canonical target. |
| L-6 | **One plan, not two** | Measurements fit in 28 coherent slices (under the 30 cap). Two plans would create merge conflicts, duplicate gate overhead, and split the tightly coupled decomposition/JSR-cleanup work. Rationale: 5 over-cap source files + 1 test file + 40 doc-lint errors can be sequenced in a single lock because source splits (slices 4–15) precede barrel/doc cleanup (slices 16–19) and tests (slices 20–23). |
| L-7 | **5d2 fixes the 19 form-package private-type-ref / missing-jsdoc leaks** | The leaks surface through `builders/mod.ts` public re-exports and block JSR publishability of the builders package. The fix is limited to exporting the already-public-in-practice form types with JSDoc (no behavior change). This is scope bleed from 5d5 and is recorded as drift entry D-5d2-1. |
| L-8 | **No new subpath exports in `packages/fresh/deno.json`** | Existing `./builders` export is sufficient; internal role folders stay internal. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| One plan or two plans | **RESOLVED** | One plan (L-6). |
| 5d2 fixes form leaks or defers to 5d5 | **RESOLVED** | 5d2 fixes visibility/JSDoc only (L-7); drift entry D-5d2-1. |
| Whether `types.ts` can be split into `types/*.ts` | safe to defer | Keep single `types.ts` (<18K). If a future unit needs sub-split, it is non-breaking. |
| Exact fixture route names | safe to defer | Chosen during slice 24; design names the categories. |
| Whether to mark any types as intentionally slow for JSR | safe to defer | Decide during slice 27 after `deno publish --dry-run` output. |

## Risk Register

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Public surface accidentally changes during moves | High | Slice 1 creates a surface snapshot test; every subsequent slice runs it. |
| Private-type-refs propagate through re-export moves | High | `deno doc --lint` is the proving gate for every barrel-changing slice (7, 11, 15, 16, 18, 27). |
| Form-package leak fix touches 5d5 scope | Medium | 5d2 changes only visibility/JSDoc (no behavior); drift entry D-5d2-1 records the cross-unit touch. |
| Runtime response assembly breaks during split | High | `runtime.test.tsx` covers pipeline execution; slice 11 verifies before navigation split begins. |
| Fixture browser tests flaky in CI | Low | Routes are deterministic; no external services. If Playwright is unavailable, record manual gate evidence. |
| Merge conflicts with 5d1 support branch | Medium | Implementation waits for 5d1 merge; dependency stated in plan. |
| New sub-barrels violate F-18 | Medium | Each sub-barrel gets `// arch:barrel-ok` comment and audit-registry entry; checked in slice 26. |
| Slow-type warnings in JSR publish | Low | Enumerated in jsr-audit rubric; can be accepted with explicit `slowTypes` declaration if needed. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-1 builder barrel monolith | existing | Split into `builder/*.ts`, `runtime/*.ts`, `navigation/*.ts`. |
| AP-7 long positional args | existing risk | Preserve current options shape; no new positional APIs. |
| AP-9 premature typestate | risk | Do not add typestate; keep current generic-only builder. |
| AP-11 hidden globals | risk | Runtime context remains explicit argument. |
| AP-14 re-export upstream DSL | existing | `zod` schemas are exported from `search-params.ts`; keep, do not expand. |
| AP-15 impl-role names | existing risk | New files use caller vocabulary (`render`, `handlers`, `link`). |
| AP-16 generic folders | avoided | No `utils/`, `helpers/`, `common/`, `lib/` created. |
| AP-22 useless sub-barrel | managed | Sub-barrels genuinely aggregate role modules; opt-out comments + registry entries. |

## jsr-audit Publishability Rubric

### Baseline

- 21 `private-type-ref` errors
- 19 `missing-jsdoc` errors
- Total: 40 doc-lint errors

### Breakdown by source

| Source file | ptr errors | missing-jsdoc errors | Retiring slice |
| ----------- | ---------- | -------------------- | -------------- |
| `builders/define-page/types.ts` | 2 (`InferDefinePageLayerLoaderProps` → `ResolveDefinePageLayerLoaderOutput`, `DefinePageLayerProps`) | 1 (`InferDefinePageLayerLoaderProps`) | Slice 2 |
| `form/types.ts` (leaked via `builders/mod.ts`) | 19 (`RuntimeFormState` references `FormValues`; many member types are non-exported) | 18 (`RuntimeFormState` interface + members) | Slice 3 |

### Slow-type risk listing

| Symbol | File | Slow-type reason | Blocks JSR publishing? |
| ------ | ---- | ---------------- | ---------------------- |
| `InferDefinePageLayerLoaderProps<TLoader>` | `builders/define-page/types.ts` | Conditional `infer` over function return type; high inference depth. | Only while `ResolveDefinePageLayerLoaderOutput` is private. After slice 2, it is publishable but may be flagged slow. |
| `FieldDescriptorMap<T>` | `form/types.ts` | Recursive mapped type over `T`. | Yes if exported without slow-type opt-in; once public it is a slow type and should be declared as such. |
| `RuntimeFormState<TValues>` | `form/types.ts` | Uses recursive `FieldDescriptorMap<TValues>`. | Same as above; slow type, not a hard block if declared. |
| `DefinePageLayerConfigFor<TTypes,TProps,THasRoute>` | `builders/define-page/types.ts` | Multiple generic parameters and conditional `THasRoute`. | Not a private-type-ref; slow-type only if inference explodes. |
| `DefinePageLayerLoaderFor<...>` | `builders/define-page/types.ts` | Complex generic over type state and loader output. | Same as above. |

**Verdict:** The only hard JSR blockers are the private-type-refs. Once those are resolved by
making referenced types public, the recursive `FieldDescriptorMap` types become slow-type
warnings, not publishability failures. Slice 27 will decide whether to add an explicit slow-type
opt-in in `packages/fresh/deno.json`.

## Fitness Gate Set

A3 + SCOPE-frontend requires the following gates. Slices below map each applicable gate.

### Fitness gates

| Gate | Applies | Verification |
| ---- | ------- | ------------ |
| F-1 File-size lint | All source files | Slice 26: `deno run --allow-read .llm/tools/check-file-sizes.ts --root packages/fresh/builders` |
| F-2 Helper-reinvention scan | New helper files | Slice 26: `deno task arch:check:helper-reinvention` |
| F-3 Layering check | New imports | Slice 26: `deno task arch:check:layering` |
| F-4 Inheritance audit | N/A (no new classes) | Slice 26: skip with rationale |
| F-5 Public surface audit | Barrels and public types | Slices 1, 16, 17, 18, 27 |
| F-6 JSR publishability | Whole package | Slice 27: `deno publish --dry-run` in `packages/fresh` |
| F-7 Doc-score gate | Whole package | Slice 27: `deno doc --lint` clean |
| F-8 Workspace lib override check | `packages/fresh/deno.json` | Slice 19: verify `compilerOptions.lib` includes `deno.unstable` |
| F-9 Permission declaration check | README | Slice 19: verify README "Required permissions" unchanged |
| F-10 Test-shape audit | Split test files | Slices 20–23: each new test <500 LOC |
| F-11 Forbidden-folder lint | New folders | Slices 4–15: role names only (`builder`, `runtime`, `navigation`) |
| F-12 Naming-convention lint | New files | Slices 4–15: no `I*`, `*T`, `*Impl`, `Abstract*` |
| F-13 Saga/runtime invariants | N/A | No sagas/workers in builders; skip with rationale |
| F-14 Console-log lint | Moved code | Slice 26: `deno task arch:check:console` |
| F-15 Re-export-upstream lint | Barrel | Slice 16: no new upstream re-exports |
| F-16 Folder-cardinality lint | `define-page/` | Slice 26: ≤12 immediate children |
| F-17 Abstract-derived co-location | N/A | No abstract classes; skip with rationale |
| F-18 Sub-barrel lint | New sub-barrels | Slices 7, 11, 15, 18: `// arch:barrel-ok` + registry entry |

### Static gates

| Gate | Verification |
| ---- | ------------ |
| Type-check clean | Every TS-touching slice runs `deno check` on changed files. Slice 27 runs `deno check packages/fresh/builders/mod.ts` with `--unstable-kv`. |
| Publish dry-run | Slice 27: `deno publish --dry-run --allow-dirty` from `packages/fresh`. |

### Runtime / SCOPE-frontend validation

| Gate | Verification |
| ---- | ------------ |
| Browser fixture routes | Slice 24: add `/playground/builders/*` routes; run `deno check` and manual/Playwright verification. |
| Full test suite | Slice 25: `deno task test` for `packages/fresh` builders area. |

## Commit Slice Lock

### Slice 1 — Snapshot public surface and local doc-lint fixes

- **Purpose:** Lock the public surface contract and retire the builders-local doc-lint debt.
- **Files touched:**
  - `packages/fresh/builders/define-page/types.ts`
  - new `packages/fresh/builders/define-page/surface.test.ts` (snapshot of public exports)
- **Changes:**
  - Create a test that snapshots every export specifier and public type name from
    `builders/mod.ts`, `builders/define-page/mod.ts`, and `builders/define-page/types.ts`.
  - Make `ResolveDefinePageLayerLoaderOutput` and `DefinePageLayerProps` public (or refactor
    `InferDefinePageLayerLoaderProps` so it no longer references private types).
  - Add JSDoc to `InferDefinePageLayerLoaderProps`.
- **Proving gates:**
  - `deno test packages/fresh/builders/define-page/surface.test.ts`
  - `deno doc --lint packages/fresh/builders/define-page/types.ts` → 0 errors
- **Budget retired:** 2 private-type-ref errors, 1 missing-jsdoc error.

### Slice 2 — Fix form-package leak for builders barrel

- **Purpose:** Retire the 19 form-package private-type-refs and 18 missing-jsdoc errors that surface
  through `builders/mod.ts`.
- **Files touched:**
  - `packages/fresh/form/types.ts`
  - `packages/fresh/form/mod.ts` (if re-exports need adjustment)
- **Changes:**
  - Export `FormValues`, `FormFieldErrors`, `FormFieldDescriptorMap`, `FormElementProps`,
    `FormCsrfInputProps`, `CollectionKeyInputProps`, `LabelProps`, `ErrorProps`,
    `DescriptionProps`, `ControlProps`, `IntentButtonProps`, `FieldConstraints`,
    `FormIntent`, `FormIntentResult`, `FormReplyInit`, `CollectionDescriptor`,
    `FieldDescriptor` (all already referenced by public `RuntimeFormState`).
  - Add JSDoc summaries to each newly exported symbol and to `RuntimeFormState` members.
- **Proving gates:**
  - `deno doc --lint packages/fresh/form/types.ts` → 0 errors
  - `deno doc --lint packages/fresh/builders/mod.ts` → 0 errors
- **Budget retired:** 19 private-type-ref errors, 18 missing-jsdoc errors.
- **Drift:** D-5d2-1 records cross-unit touch.

### Slice 3 — Create builder state module

- **Purpose:** Extract definition-time state types/helpers from `builder.tsx`/`types.ts`.
- **Files touched:**
  - new `packages/fresh/builders/define-page/builder/state.ts`
  - `packages/fresh/builders/define-page/types.ts`
  - `packages/fresh/builders/define-page/builder.tsx`
- **Changes:**
  - Move builder-state interfaces (`DefinePageBuilderState`, `DefinePageBuilderMethods`,
    `NormalizeDefinePageTypeState`, etc.) and type helpers into `builder/state.ts`.
  - Update imports in `types.ts` and `builder.tsx`.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/builder/state.ts`
  - file-size check: `state.ts` < 14K
- **Budget retired:** moves ~6K out of `builder.tsx` and `types.ts`.

### Slice 4 — Create builder factory

- **Purpose:** Extract the `build()` factory and definition helpers.
- **Files touched:**
  - new `packages/fresh/builders/define-page/builder/factory.ts`
  - `packages/fresh/builders/define-page/builder.tsx`
- **Changes:**
  - Move `createDefinePageDefinition`, `buildDefinePage`, route wiring helpers into
    `factory.ts`.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/builder/factory.ts`
  - file-size check: `factory.ts` < 14K
- **Budget retired:** moves ~12K out of `builder.tsx`.

### Slice 5 — Create builder validators

- **Purpose:** Extract option/runtime validation helpers.
- **Files touched:**
  - new `packages/fresh/builders/define-page/builder/validators.ts`
  - `packages/fresh/builders/define-page/builder.tsx`
- **Changes:**
  - Move option merging, schema validation, and runtime-option normalization helpers.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/builder/validators.ts`
  - file-size check: `validators.ts` < 12K
- **Budget retired:** moves ~8K out of `builder.tsx`.

### Slice 6 — Replace `builder.tsx` with `builder/mod.ts`

- **Purpose:** Complete builder split and create the public builder barrel.
- **Files touched:**
  - new `packages/fresh/builders/define-page/builder/mod.ts`
  - delete `packages/fresh/builders/define-page/builder.tsx`
  - update imports in `runtime/`, `navigation/`
- **Changes:**
  - `builder/mod.ts` contains the `definePage` overload set and re-exports from `state.ts`,
    `factory.ts`, `validators.ts`.
  - Add `// arch:barrel-ok A4-aggregate: defines `definePage` from role modules under builder/`.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/builder/mod.ts`
  - `deno doc --lint packages/fresh/builders/define-page/builder/mod.ts` → 0 errors
  - file-size check: `builder/mod.ts` < 16K
- **Budget retired:** `builder.tsx` retired (38.4K → 0).

### Slice 7 — Create runtime context module

- **Purpose:** Extract request-time context helpers.
- **Files touched:**
  - new `packages/fresh/builders/define-page/runtime/context.ts`
  - `packages/fresh/builders/define-page/runtime.tsx`
- **Changes:**
  - Move `searchParamsToObject`, telemetry helpers, context-value construction.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/runtime/context.ts`
  - file-size check: `context.ts` < 10K
- **Budget retired:** moves ~7K out of `runtime.tsx`.

### Slice 8 — Create runtime render module

- **Purpose:** Extract render-to-stream / response assembly.
- **Files touched:**
  - new `packages/fresh/builders/define-page/runtime/render.tsx`
  - `packages/fresh/builders/define-page/runtime.tsx`
- **Changes:**
  - Move `createStreamingResponse`, `createIncrementalStreamingResponse`, `renderPageBody`,
    `DeferPage`/`Deferred` injection.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/runtime/render.tsx`
  - file-size check: `render.tsx` < 10K
- **Budget retired:** moves ~7K out of `runtime.tsx`.

### Slice 9 — Create runtime handlers module

- **Purpose:** Extract GET/POST/loader/action wiring.
- **Files touched:**
  - new `packages/fresh/builders/define-page/runtime/handlers.ts`
  - `packages/fresh/builders/define-page/runtime.tsx`
- **Changes:**
  - Move handler factories and request dispatch.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/runtime/handlers.ts`
  - file-size check: `handlers.ts` < 10K
- **Budget retired:** moves ~7K out of `runtime.tsx`.

### Slice 10 — Replace `runtime.tsx` with `runtime/mod.ts`

- **Purpose:** Complete runtime split.
- **Files touched:**
  - new `packages/fresh/builders/define-page/runtime/mod.ts`
  - delete `packages/fresh/builders/define-page/runtime.tsx`
  - update imports
- **Changes:**
  - `runtime/mod.ts` re-exports from `context.ts`, `render.tsx`, `handlers.ts`.
  - Add `// arch:barrel-ok A4-aggregate: assembles runtime pipeline from role modules`.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/runtime/mod.ts`
  - `deno doc --lint packages/fresh/builders/define-page/runtime/mod.ts` → 0 errors
  - file-size check: `runtime/mod.ts` < 1K
- **Budget retired:** `runtime.tsx` retired (18.4K → 0).

### Slice 11 — Create navigation context module

- **Purpose:** Extract navigation context provider and value types.
- **Files touched:**
  - new `packages/fresh/builders/define-page/navigation/context.ts`
  - `packages/fresh/builders/define-page/navigation.tsx`
- **Changes:**
  - Move `wrapWithNavigationContext`, context value interface, provider component.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/navigation/context.ts`
  - file-size check: `context.ts` < 10K
- **Budget retired:** moves ~6K out of `navigation.tsx`.

### Slice 12 — Create navigation hooks module

- **Purpose:** Extract Preact hooks.
- **Files touched:**
  - new `packages/fresh/builders/define-page/navigation/hooks.ts`
  - `packages/fresh/builders/define-page/navigation.tsx`
- **Changes:**
  - Move `useCurrentRoute`, `usePagePath`, `usePageSearch`, `usePageLayerData`.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/navigation/hooks.ts`
  - file-size check: `hooks.ts` < 12K
- **Budget retired:** moves ~8K out of `navigation.tsx`.

### Slice 13 — Create navigation link module

- **Purpose:** Extract typed Link and link-prop helpers.
- **Files touched:**
  - new `packages/fresh/builders/define-page/navigation/link.tsx`
  - `packages/fresh/builders/define-page/navigation.tsx`
- **Changes:**
  - Move `Link`, `getLinkProps`, `ValidatedRouteHref`, `BoundLinkProps`, etc.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/navigation/link.tsx`
  - file-size check: `link.tsx` < 10K
- **Budget retired:** moves ~8K out of `navigation.tsx`.

### Slice 14 — Replace `navigation.tsx` with `navigation/mod.ts`

- **Purpose:** Complete navigation split.
- **Files touched:**
  - new `packages/fresh/builders/define-page/navigation/mod.ts`
  - delete `packages/fresh/builders/define-page/navigation.tsx`
  - update imports
- **Changes:**
  - `navigation/mod.ts` re-exports from `context.ts`, `hooks.ts`, `link.tsx`.
  - Add `// arch:barrel-ok A4-aggregate: exposes navigation hooks/links from role modules`.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/navigation/mod.ts`
  - `deno doc --lint packages/fresh/builders/define-page/navigation/mod.ts` → 0 errors
  - file-size check: `navigation/mod.ts` < 1K
- **Budget retired:** `navigation.tsx` retired (20.6K → 0).

### Slice 15 — Thin `builders/mod.ts`

- **Purpose:** Reduce the top-level barrel to a thin re-export surface.
- **Files touched:**
  - `packages/fresh/builders/mod.ts`
- **Changes:**
  - Replace inline definitions with re-exports from `define-page/mod.ts` and `define-partial.tsx`.
- **Proving gates:**
  - `deno check packages/fresh/builders/mod.ts`
  - `deno doc --lint packages/fresh/builders/mod.ts` → 0 errors
  - file-size check: `mod.ts` < 2K
- **Budget retired:** 41.4K → <2K; over-cap retired.

### Slice 16 — Trim `define-page/types.ts`

- **Purpose:** Keep only the public type catalog; move remaining helpers to internal/state modules.
- **Files touched:**
  - `packages/fresh/builders/define-page/types.ts`
  - `packages/fresh/builders/define-page/internal.ts` (if helpers move here)
- **Changes:**
  - Move non-public helper types into `internal.ts` or `builder/state.ts`.
  - Ensure every remaining exported type has JSDoc.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/types.ts`
  - `deno doc --lint packages/fresh/builders/define-page/types.ts` → 0 errors
  - file-size check: `types.ts` < 18K
- **Budget retired:** 22.4K → <18K; doc-lint clean.

### Slice 17 — Update `define-page/mod.ts` sub-barrel

- **Purpose:** Aggregate the new role modules without changing public exports.
- **Files touched:**
  - `packages/fresh/builders/define-page/mod.ts`
- **Changes:**
  - Re-export from `types.ts`, `builder/mod.ts`, `runtime/mod.ts`, `navigation/mod.ts`,
    `search-params.ts`, `internal.ts`.
  - Add `// arch:barrel-ok A4-aggregate: public define-page surface composed from role modules`.
- **Proving gates:**
  - `deno check packages/fresh/builders/define-page/mod.ts`
  - `deno doc --lint packages/fresh/builders/define-page/mod.ts` → 0 errors
  - surface snapshot test from slice 1 still passes
- **Budget retired:** 0 public surface drift.

### Slice 18 — Verify `packages/fresh/deno.json`

- **Purpose:** Ensure package subpath exports still resolve; no lockfile churn.
- **Files touched:**
  - `packages/fresh/deno.json` (read-only; edit only if required)
- **Changes:**
  - Confirm `./builders` still points to `./builders/mod.ts`.
  - Confirm `compilerOptions.lib` includes `deno.unstable`.
- **Proving gates:**
  - `deno check packages/fresh/builders/mod.ts`
  - `deno publish --dry-run --allow-dirty` from `packages/fresh`
- **Budget retired:** N/A.

### Slice 19 — Split tests: builder seam

- **Purpose:** Move builder-chain tests out of the monolithic test file.
- **Files touched:**
  - new `packages/fresh/builders/define-page/builder.test.tsx`
  - `packages/fresh/builders/define-page.test.tsx`
- **Changes:**
  - Move tests for `withRoute`, `withParams`, `withSearch`, `withLayer`, `withForm`, `build()`.
  - Prefix test names `[builder]`.
- **Proving gates:**
  - `deno test packages/fresh/builders/define-page/builder.test.tsx`
  - file-size check: `builder.test.tsx` < 18K
- **Budget retired:** portion of 46K test file moved.

### Slice 20 — Split tests: runtime seam

- **Purpose:** Move pipeline/handler tests.
- **Files touched:**
  - new `packages/fresh/builders/define-page/runtime.test.tsx`
  - `packages/fresh/builders/define-page.test.tsx`
- **Changes:**
  - Move tests for `executePagePipeline`, handler wiring, response assembly, deferred layers.
  - Prefix test names `[runtime]`.
- **Proving gates:**
  - `deno test packages/fresh/builders/define-page/runtime.test.tsx`
  - file-size check: `runtime.test.tsx` < 18K
- **Budget retired:** portion of 46K test file moved.

### Slice 21 — Split tests: navigation seam

- **Purpose:** Move hook/link tests.
- **Files touched:**
  - new `packages/fresh/builders/define-page/navigation.test.tsx`
  - `packages/fresh/builders/define-page.test.tsx`
- **Changes:**
  - Move tests for `useCurrentRoute`, `Link`, `getLinkProps`, navigation context.
  - Prefix test names `[navigation]`.
- **Proving gates:**
  - `deno test packages/fresh/builders/define-page/navigation.test.tsx`
  - file-size check: `navigation.test.tsx` < 18K
- **Budget retired:** portion of 46K test file moved.

### Slice 22 — Split tests: search-params seam

- **Purpose:** Move pagination schema tests and retire the old test file.
- **Files touched:**
  - new `packages/fresh/builders/define-page/search-params.test.tsx`
  - delete `packages/fresh/builders/define-page.test.tsx`
- **Changes:**
  - Move pagination schema / fallback tests.
  - Prefix test names `[search-params]`.
- **Proving gates:**
  - `deno test packages/fresh/builders/define-page/search-params.test.tsx`
  - file-size check: `search-params.test.tsx` < 12K
- **Budget retired:** `define-page.test.tsx` retired (45.8K → 0).

### Slice 23 — Add playground fixture routes

- **Purpose:** Prove the builder pipeline on real Fresh routes.
- **Files touched:**
  - `apps/playground/routes/playground/builders/static-page.tsx`
  - `apps/playground/routes/playground/builders/routed-page/[id].tsx`
  - `apps/playground/routes/playground/builders/search-page.tsx`
  - `apps/playground/routes/playground/builders/layer-page.tsx`
  - `apps/playground/routes/playground/builders/form-page.tsx`
  - `apps/playground/routes/playground/builders/partial-page.tsx`
- **Changes:**
  - Add routes covering SSR, path/search params, layers/pending, forms, partials.
- **Proving gates:**
  - `deno check` over the new routes
  - Manual browser verification or Playwright run
- **Budget retired:** N/A.

### Slice 24 — Run full builders test suite

- **Purpose:** Confirm no regressions after decomposition.
- **Files touched:** none
- **Proving gates:**
  - `deno task test` in `packages/fresh` (builders area)
  - or `deno test --allow-all packages/fresh/builders`
- **Budget retired:** N/A.

### Slice 25 — Run architecture fitness gates

- **Purpose:** Verify doctrine compliance.
- **Files touched:** none
- **Proving gates:**
  - `deno task arch:check` (or individual scripts if composite task is unavailable)
  - F-1, F-10, F-11, F-12, F-16, F-18 must pass; F-4/F-13/F-17 skipped with rationale.
- **Budget retired:** N/A.

### Slice 26 — Final doc-lint + publish dry-run

- **Purpose:** Confirm JSR publishability and doc-score gate.
- **Files touched:** none
- **Proving gates:**
  - `deno doc --lint packages/fresh/builders/mod.ts` → 0 errors
  - `deno doc --lint packages/fresh/form/mod.ts` → 0 errors
  - `deno publish --dry-run --allow-dirty` from `packages/fresh`
- **Budget retired:** all 40 doc-lint errors, all private-type-refs.

### Slice 27 — Update drift ledger, context pack, worklog

- **Purpose:** Leave the run artifacts resume-ready.
- **Files touched:**
  - `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/drift.md`
  - `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/context-pack.md`
  - `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/worklog.md`
- **Changes:**
  - Append drift entries D-5d2-1 and D-5d2-2.
  - Update context-pack with final state, locked decisions, slice lock, gate set.
  - Add design checkpoint entry to worklog.
- **Proving gates:** Supervisor review.
- **Budget retired:** N/A.

## Validation Plan

| Step | Command | When |
| ---- | ------- | ---- |
| Type-check changed file | `deno check --unstable-kv <file>` | Every slice that touches TS |
| Doc-lint changed barrel | `deno doc --lint <file>` | Slices 1, 2, 6, 10, 14, 15, 16, 17, 26 |
| File-size lint | `deno run --allow-read .llm/tools/check-file-sizes.ts --root packages/fresh/builders` | Slices 3–23, 25 |
| Surface snapshot | `deno test packages/fresh/builders/define-page/surface.test.ts` | Slices 1, 15, 16, 17 |
| Full test suite | `deno test --allow-all packages/fresh/builders` | Slice 24 |
| Architecture fitness | `deno task arch:check` | Slice 25 |
| Publish dry-run | `deno publish --dry-run --allow-dirty` (from `packages/fresh`) | Slices 18, 26 |

## Dependencies

- **5d1 support branch (PR #34):** error taxonomy, telemetry convention, `./testing` entrypoint,
  and docs scaffold are binding. **Implementation waits for 5d1 merge.**
- `packages/fresh/server/stream.ts`: streaming primitives consumed as-is; no change.
- `packages/fresh/defer/DeferPage.tsx`: imported by builder; no change.
- `packages/fresh/form/types.ts`: 5d2 makes referenced form types public with JSDoc; behavior
  changes remain 5d5 scope.
- `packages/fresh/route/contract.ts`: imported by builder; no change.

## Merge Impact

- 5d2 does not add new public subpaths; consumers of `@netscript/fresh/builders` are unaffected.
- Internal imports under `builders/define-page/` will change paths; any in-flight branch touching
  those files should rebase after 5d2 lands.
- 5d4 streams and 5d6 query bridge are not blocked; the decomposition isolates Fresh-specific
  runtime code so future adapters can replace `runtime/render.tsx` and `navigation/context.ts`
  without touching the builder API.

## Drift Watch

- Any public export change.
- Any new dependency added to `builders/`.
- Any file that remains >20K after decomposition.
- JSR slow-type opt-in required.

## Side-Effect Ledger

| Non-source file | Change |
| --------------- | ------ |
| `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/drift.md` | Append D-5d2-1, D-5d2-2. |
| `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/context-pack.md` | Update to resume-ready state. |
| `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/worklog.md` | Add design checkpoint entry. |
| `.llm/arch-debt.md` (or audit registry) | Add F-18 sub-barrel opt-out entries. |
| `packages/fresh/deno.json` | Read-only verification; no expected edits. |
| `deno.lock` | **No changes**; do not run `deno cache --reload`. |

---

## Review Map

The generator self-verified:

- AGENTS.md read.
- netscript-doctrine and jsr-audit skills consulted.
- Existing research.md, plan-eval.md, and measurement artifacts read.
- Doctrine fitness gates F-1 through F-18 mapped to slices.
- design.md completed with all seven required sections.

No implementation code has been changed.

## Assumptions

- 5d1 merges before 5d2 implementation begins.
- `deno task arch:check` and its per-gate scripts exist and are runnable.
- Playwright E2E infrastructure, if present, is optional for this plan; manual browser verification
  evidence is acceptable.
- The umbrella plan's "0 doc-lint errors over all exports combined" target applies at wave close;
  5d2 resolves the builders contribution and the immediate form leaks it surfaces.

## Questions for Supervisor

1. Does the supervisor accept 5d2 touching `form/types.ts` visibility/JSDoc (drift D-5d2-1), or
   should the form leaks be strictly deferred to 5d5?
2. Should the playground fixture routes be expanded to include error-boundary behavior that depends
   on 5d1, or kept deterministic without 5d1?
3. If `deno publish --dry-run` reports slow types on `FieldDescriptorMap`, should 5d2 add an
   explicit slow-type declaration in `packages/fresh/deno.json`?

## Dependencies & Merge Impact (summary)

- Waits on 5d1.
- No public subpath changes.
- Cross-unit touch on 5d5 form surface logged as drift.

## PLAN VERDICT

**REVISED and READY FOR PLAN-EVAL.**

All five blocking findings from PLAN-EVAL have been addressed:
1. One-plan decision locked (L-6).
2. Actionable 28-slice commit lock provided.
3. Slow-type / JSR-blocking private-type-ref risks enumerated.
4. design.md completed with all 7 required sections.
5. Protocol omissions fixed: verdict/decision sections present, gate set selected, tail section complete.
