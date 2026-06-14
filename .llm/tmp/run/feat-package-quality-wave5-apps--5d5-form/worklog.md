# Worklog — 5d5-form

Append-only. One entry per slice / decision.

## 2026-06-14 - Supervisor sync after 5d3 merge

- Merged `origin/feat/package-quality-wave5-apps-5d-fresh` at `07a1f70` into 5d5 before starting implementation.
- Merge included evaluated 5d3 route changes and prior 5d supervisor ancestry; no textual conflicts.
- No 5d5 implementation changes made in this sync commit.

## 2026-06-14 - Slice 1 baseline and form docs scaffold

- Re-read AGENTS.md, harness workflow, Plan-Gate PASS, form plan/design, relevant doctrine, and
  frontend scope overlay before implementation.
- Re-baselined `packages/fresh/form` after supervisor sync:
  - `deno doc --lint packages/fresh/form/mod.ts` passed with 0 errors.
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx`
    passed with 0 occurrences.
  - File-size scan found `types.ts` 753 LOC, `schema-adapter.ts` 576 LOC, and
    `field-descriptors.ts` 518 LOC.
- Recorded baseline drift as `D-5d5-6` before edits because `types.ts` and doc-lint no longer match
  the PLAN-phase measurement.
- Added package-local form docs:
  - `packages/fresh/form/README.md`
  - `packages/fresh/docs/form/getting-started.md`
  - `packages/fresh/docs/form/architecture.md`
  - `packages/fresh/docs/form/fresh-ui-recipe.md`
- Updated `packages/fresh/docs/README.md` with form doc links.

### Slice 1 gates

| Gate | Command | Result |
|------|---------|--------|
| Baseline doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Baseline scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS |
| F-1 baseline | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr` | DRIFT: `types.ts` 753 LOC; `schema-adapter.ts` 576 LOC; `field-descriptors.ts` 518 LOC |
| Docs format | `deno fmt --check packages/fresh/form/README.md packages/fresh/docs/README.md packages/fresh/docs/form/getting-started.md packages/fresh/docs/form/architecture.md packages/fresh/docs/form/fresh-ui-recipe.md` | PASS |
| Link/path existence | `test -f` for new form docs and form README | PASS |

## 2026-06-14 - Slice 2 types.ts split

- Split the 753 LOC `packages/fresh/form/types.ts` into a small public type manifest plus focused
  package-local `_internal/*-types.ts` files:
  - `_internal/value-types.ts`
  - `_internal/prop-types.ts`
  - `_internal/intent-reply-types.ts`
  - `_internal/descriptor-types.ts`
  - `_internal/runtime-types.ts`
  - `_internal/page-types.ts`
  - `_internal/types.ts`
- Preserved the public import path and export names by re-exporting all existing type names through
  `packages/fresh/form/types.ts`.
- Closed `D-5d5-6`: `types.ts` is now under the file-size cap and public doc-lint remains clean.
- Remaining over-cap files are the planned slice 3 and 4 targets:
  - `schema-adapter.ts` 576 LOC
  - `field-descriptors.ts` 518 LOC

### Slice 2 gates

| Gate | Command | Result |
|------|---------|--------|
| Public doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Narrow typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | PASS |
| Scoped form check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS |
| Touched-file format | `deno fmt --check packages/fresh/form/types.ts packages/fresh/form/_internal/*.ts` | PASS |
| Touched-file lint | `deno lint packages/fresh/form/types.ts packages/fresh/form/_internal/*.ts` | PASS |
| File-size scan | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr` | PASS for slice target: `types.ts` 50 LOC; new `_internal/*` files all ≤219 LOC |
| Broad form fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/form --ext ts,tsx` | FAIL on pre-existing formatting findings in untouched files; not mutated in slice 2 |

## 2026-06-14 - Slice 3 field-descriptors.ts decomposition

- Split the 518 LOC `packages/fresh/form/field-descriptors.ts` implementation into focused
  role-named files under `packages/fresh/form/field-descriptors/`:
  - `descriptor.ts` owns scalar descriptor creation, descriptor options, value comparison, and
    object-shape guards.
  - `constraints.ts` owns constraint cloning, path normalization, and child-key discovery.
  - `collection.ts` owns collection descriptors, collection item keys, and collection intent button
    props.
  - `aria-data.ts` owns field IDs, control value formatting, and ARIA/data prop merging.
  - `mod.ts` owns descriptor-tree orchestration and carries the required `// arch:barrel-ok`
    justification.
- Preserved the existing `packages/fresh/form/field-descriptors.ts` import path as a one-line
  compatibility facade that re-exports `createFieldDescriptors`.
- Public `packages/fresh/form/mod.ts` exports were unchanged.
- Remaining over-cap implementation target is the planned Slice 4 file:
  - `schema-adapter.ts` 576 LOC.

### Slice 3 gates

| Gate | Command | Result |
|------|---------|--------|
| Public doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Narrow typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | PASS |
| Scoped form check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS |
| Touched-file format | `deno fmt --check packages/fresh/form/field-descriptors.ts packages/fresh/form/field-descriptors/*.ts` | PASS |
| Touched-file lint | `deno lint packages/fresh/form/field-descriptors.ts packages/fresh/form/field-descriptors/*.ts` | PASS |
| File-size scan | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr \| head -20` | PASS for slice target: facade 1 LOC; new descriptor files all ≤198 LOC; `schema-adapter.ts` remains 576 LOC for Slice 4 |

## 2026-06-14 - Slice 4 schema-adapter.ts decomposition

- Split the 576 LOC `packages/fresh/form/schema-adapter.ts` implementation into focused
  role-named files under `packages/fresh/form/schema-adapter/`:
  - `contract.ts` owns `FormSchemaAdapter` and parse-result contract types.
  - `zod.ts` owns the public `createZodAdapter` factory and delegates internals.
  - `zod-errors.ts` owns Zod field/form error normalization.
  - `zod-defaults.ts` owns default-value extraction and defensive cloning.
  - `zod-constraints.ts` owns conservative HTML constraint extraction.
  - `zod-internals.ts` owns Zod wrapper unwrapping helpers used by defaults and constraints.
  - `mod.ts` re-exports the contract and Zod adapter with `// arch:barrel-ok` justification.
- Preserved `packages/fresh/form/schema-adapter.ts` as a compatibility facade for existing imports.
- Kept `createStandardSchemaAdapter` out of this slice; it remains the planned additive public
  feature for later schema-adapter slices.
- Public `packages/fresh/form/mod.ts` exports were unchanged.
- All previously over-cap implementation files owned by slices 2-4 are now under the cap.

### Slice 4 gates

| Gate | Command | Result |
|------|---------|--------|
| Public doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Narrow typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | PASS |
| Scoped form check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS |
| Touched-file format | `deno fmt --check packages/fresh/form/schema-adapter.ts packages/fresh/form/schema-adapter/*.ts` | PASS |
| Touched-file lint | `deno lint packages/fresh/form/schema-adapter.ts packages/fresh/form/schema-adapter/*.ts` | PASS after bracketing moved switch cases for `no-case-declarations` |
| File-size scan | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr \| head -20` | PASS for slice target: facade 7 LOC; new schema-adapter files all ≤237 LOC |
| Focused regression test | `deno test --unstable-kv packages/fresh/form/schema-adapter.test.ts` | PASS: 14 passed, 0 failed |

## 2026-06-14 - Slice 5 explicit return-type verification

- Rechecked the plan-named public files for slow-type return annotations:
  - `packages/fresh/form/enhancement.tsx`
  - `packages/fresh/form/form.tsx`
  - `packages/fresh/form/form-region.tsx`
  - `packages/fresh/form/mod.ts`
- Current branch already has explicit public return annotations in the plan-named files, so this
  slice required no source changes.
- Ran `deno publish --dry-run --allow-dirty` from `packages/fresh`; the dry-run completed
  successfully with no `missing-explicit-return-type` findings. Output archived as
  `slice5-publish-dry-run.txt`.

### Slice 5 gates

| Gate | Command | Result |
|------|---------|--------|
| Public doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Narrow typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | PASS |
| Scoped form check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS |
| Touched-file format | `deno fmt --check packages/fresh/form/enhancement.tsx packages/fresh/form/form.tsx packages/fresh/form/form-region.tsx packages/fresh/form/mod.ts` | PASS |
| Touched-file lint | `deno lint packages/fresh/form/enhancement.tsx packages/fresh/form/form.tsx packages/fresh/form/form-region.tsx packages/fresh/form/mod.ts` | PASS |
| File-size scan | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr \| head -20` | PASS: no planned over-cap implementation files remain |
| Publish dry-run | `cd packages/fresh && deno publish --dry-run --allow-dirty` | PASS: no slow-type findings |

## 2026-06-14 - Slice 6 JSDoc/public-export sweep

- Rechecked the planned public-export files:
  - `state.ts`, `pipeline.ts`, `intent.ts`, `reply.ts`, `errors.ts`, `csrf.ts`,
    `idempotency.ts`, `pagination.ts`, `config.ts`, `handler-context.ts`.
- Current public doc-lint remained clean; no JSDoc additions were required.
- Touched-file gates surfaced focused hygiene findings in the planned files:
  - `state.ts`, `intent.ts`, and `reply.ts` needed formatting only.
  - `config.ts` imported Zod as a value even though it is used only in exported types; changed it
    to `import type { z } from 'zod';`.

### Slice 6 gates

| Gate | Command | Result |
|------|---------|--------|
| Public doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Narrow typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | PASS |
| Scoped form check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS |
| Touched-file format | `deno fmt --check packages/fresh/form/state.ts packages/fresh/form/pipeline.ts packages/fresh/form/intent.ts packages/fresh/form/reply.ts packages/fresh/form/errors.ts packages/fresh/form/csrf.ts packages/fresh/form/idempotency.ts packages/fresh/form/pagination.ts packages/fresh/form/config.ts packages/fresh/form/handler-context.ts` | PASS after formatting `state.ts`, `intent.ts`, and `reply.ts` |
| Touched-file lint | `deno lint packages/fresh/form/state.ts packages/fresh/form/pipeline.ts packages/fresh/form/intent.ts packages/fresh/form/reply.ts packages/fresh/form/errors.ts packages/fresh/form/csrf.ts packages/fresh/form/idempotency.ts packages/fresh/form/pagination.ts packages/fresh/form/config.ts packages/fresh/form/handler-context.ts` | PASS after type-only import fix in `config.ts` |
| File-size scan | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr \| head -20` | PASS: no planned over-cap implementation files remain |

## 2026-06-14 - Slice 7 telemetry alignment

- Cut `packages/fresh/form/telemetry.ts` over from its deprecated-in-place tracer fork to the
  shared 5d1 Fresh telemetry convention in `packages/fresh/_internal/telemetry.ts`.
- Preserved the existing `withFormSpan` and `emitFormError` signatures used by
  `packages/fresh/builders/define-page/builder/mod.tsx`.
- Normalized form spans through `withFreshSpan` with `scope: 'form'`, `form.phase`, and
  `netscript.operation` attributes.
- Replaced form error emission with `emitFreshError`, preserving structured error telemetry while
  removing duplicate direct tracer/event logic.
- Removed the submit failure `console.error` from the form builder path; structured telemetry and
  `normalizeFormError` remain the published failure behavior.

### Slice 7 gates

| Gate | Command | Result |
|------|---------|--------|
| Public doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Narrow typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | PASS |
| Scoped form check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS: 0 occurrences |
| Direct touched-file typecheck | `deno check --unstable-kv packages/fresh/form/telemetry.ts packages/fresh/builders/define-page/builder/mod.tsx` | PASS |
| Touched-file format | `deno fmt --check packages/fresh/form/telemetry.ts packages/fresh/builders/define-page/builder/mod.tsx` | PASS |
| Touched-file lint | `deno lint packages/fresh/form/telemetry.ts packages/fresh/builders/define-page/builder/mod.tsx` | PASS |
| F-14 console scan | `grep -R "console\\." -n packages/fresh/form packages/fresh/builders/define-page/builder/mod.tsx \| head -80` | PASS: no matches |
| File-size scan | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr \| head -30` | PASS: `telemetry.ts` 64 LOC; no over-cap form files |

## 2026-06-14 - Slice 8 mod.ts public surface audit

- Audited `packages/fresh/form/mod.ts` without source edits.
- `deno doc --json packages/fresh/form/mod.ts` reports 78 public symbols, counting value exports
  and all exported types.
- Public surface findings:
  - Missing declaration docs: 0.
  - Upstream declaration leaks: 0.
  - Deno doc-lint private-type refs: 0.
- Deno JSON still reports 42 public type declarations from `_internal/*-types.ts`; this matches the
  Slice 2 manifest split, where `types.ts` publicly re-exports those author-facing names while the
  implementation lives in focused internal files. No consumer import path or public export name
  changed.

### Slice 8 gates

| Gate | Command | Result |
|------|---------|--------|
| Public doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Narrow typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | PASS |
| Scoped form check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS: 0 occurrences |
| Public surface JSON audit | `deno doc --json packages/fresh/form/mod.ts` parsed for symbol count, missing docs, internal declarations, and upstream declarations | PASS: 78 symbols, 0 missing docs, 0 upstream declarations, 42 expected `_internal` declarations |
| Touched-file format | `deno fmt --check packages/fresh/form/mod.ts` | PASS |
| Touched-file lint | `deno lint packages/fresh/form/mod.ts` | PASS |
| Re-export-upstream scan | `grep -R "export .*from ['\\\"]\\(npm:\\|jsr:\\|zod\\|@std/\\|fresh\\|preact\\)" -n packages/fresh/form/mod.ts packages/fresh/form/*.ts packages/fresh/form/*.tsx \| head -80` | PASS: no matches |
| File-size scan | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr \| head -30` | PASS: `mod.ts` 93 LOC; no over-cap form files |

## 2026-06-14 - Slice 9 Standard Schema adapter

- Added `createStandardSchemaAdapter` for Standard Schema v1 compatible schemas.
- Added package-owned Standard Schema contract types and exported them through `schema-adapter.ts` and `form/mod.ts`.
- Preserved `createZodAdapter` on the existing `form/schema-adapter.ts` path without adding it to the root form public surface, avoiding Zod private-type leaks in `form/mod.ts` doc-lint.
- Added focused `schema-adapter-standard.test.ts` coverage for successful parses, field/form error normalization, aggregate parse errors, and Zod Standard Schema metadata compatibility.
- Documented schema-adapter contract result properties so public doc-lint remains clean.
- Reverted incidental `deno.lock` churn from an earlier root-config test run; package-config tests use the pinned `zod` import.

### Slice 9 gates

| Gate | Command | Result |
|------|---------|--------|
| Public doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Narrow typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | PASS |
| Scoped form check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS |
| Focused adapter tests | `deno test --config packages/fresh/deno.json --unstable-kv packages/fresh/form/schema-adapter-standard.test.ts packages/fresh/form/schema-adapter.test.ts` | PASS: 18 passed, 0 failed |
| Touched-file format | `deno fmt --check packages/fresh/form/mod.ts packages/fresh/form/schema-adapter.ts packages/fresh/form/schema-adapter/mod.ts packages/fresh/form/schema-adapter/standard.ts packages/fresh/form/schema-adapter/zod.ts packages/fresh/form/schema-adapter/contract.ts packages/fresh/form/schema-adapter-standard.test.ts` | PASS |
| Touched-file lint | `deno lint packages/fresh/form/mod.ts packages/fresh/form/schema-adapter.ts packages/fresh/form/schema-adapter/mod.ts packages/fresh/form/schema-adapter/standard.ts packages/fresh/form/schema-adapter/zod.ts packages/fresh/form/schema-adapter/contract.ts packages/fresh/form/schema-adapter-standard.test.ts` | PASS |
| File-size scan | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr \| head -20` | PASS: new files ≤171 LOC |

## 2026-06-14 - Slice 10 Zod adapter Standard Schema rebuild

- Rebuilt `createZodAdapter` parsing on the Zod schema's Standard Schema `~standard.validate()`
  path.
- Preserved the existing public `createZodAdapter` signature and import path.
- Preserved Zod-specific observable behavior:
  - `parse()` still rejects with `ZodError` for invalid Zod input.
  - `safeParse()` still normalizes errors through `z.flattenError(...)`, preserving the existing
    top-level field-error shape for nested collection issues.
  - Zod-specific defaults and HTML constraint introspection remain owned by the existing
    Zod introspector helpers.
- Added focused tests proving both `safeParse()` and `parse()` avoid the public
  `safeParseAsync()` method and validate through Standard Schema metadata.

### Slice 10 gates

| Gate | Command | Result |
|------|---------|--------|
| Public doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Narrow typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | PASS |
| Scoped form check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS |
| Focused adapter tests | `deno test --config packages/fresh/deno.json --unstable-kv packages/fresh/form/schema-adapter.test.ts packages/fresh/form/schema-adapter-standard.test.ts` | PASS: 20 passed, 0 failed |
| Touched-file format | `deno fmt --check packages/fresh/form/schema-adapter/zod.ts packages/fresh/form/schema-adapter.test.ts` | PASS |
| Touched-file lint | `deno lint packages/fresh/form/schema-adapter/zod.ts packages/fresh/form/schema-adapter.test.ts` | PASS |
| File-size scan | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr \| head -20` | PASS: touched test file 439 LOC; no form file over cap |

## 2026-06-14 - Slice 11 schema introspector contract

- Added the additive `SchemaIntrospector<TSchema, TValues>` contract to
  `packages/fresh/form/schema-adapter/contract.ts`.
- Exported the type through `schema-adapter/mod.ts`, the `schema-adapter.ts` compatibility facade,
  and the root `form/mod.ts` manifest.
- Updated form architecture docs and the form README to describe the current Standard Schema
  validation path plus vendor-specific introspection seam.
- No runtime adapter behavior changed; the interface exists so future Valibot/ArkType adapters can
  add conservative constraints/defaults without re-exporting upstream schema packages.

### Slice 11 gates

| Gate | Command | Result |
|------|---------|--------|
| Public doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Narrow typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | PASS |
| Scoped form check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS |
| Focused adapter tests | `deno test --config packages/fresh/deno.json --unstable-kv packages/fresh/form/schema-adapter.test.ts packages/fresh/form/schema-adapter-standard.test.ts` | PASS: 20 passed, 0 failed |
| Touched-file format | `deno fmt --check packages/fresh/form/mod.ts packages/fresh/form/schema-adapter.ts packages/fresh/form/schema-adapter/mod.ts packages/fresh/form/schema-adapter/contract.ts packages/fresh/form/README.md packages/fresh/docs/form/architecture.md` | PASS |
| Touched-file lint | `deno lint packages/fresh/form/mod.ts packages/fresh/form/schema-adapter.ts packages/fresh/form/schema-adapter/mod.ts packages/fresh/form/schema-adapter/contract.ts` | PASS |
| File-size scan | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr \| head -20` | PASS: no form file over cap |

## 2026-06-14 - Slice 12 fresh-ui seam recipe refresh

- Updated `packages/fresh/docs/form/fresh-ui-recipe.md` as a docs-only seam slice.
- Clarified that `@netscript/fresh/form` and `@netscript/fresh-ui` compose through copied registry
  components and descriptor values, not package imports.
- Corrected the copied registry import example to use `components/ui/control-props.ts` and
  `components/ui/form-field.tsx`, matching the current source registry paths.
- Added Standard Schema / `SchemaIntrospector` guidance so Fresh UI consumers treat descriptor props
  as the source of truth instead of inspecting upstream schema libraries.
- No playground/browser slice was attempted because this worktree has no `apps/playground`
  directory; this slice is limited to the plan's seam-doc recipe.

### Slice 12 gates

| Gate | Command | Result |
|------|---------|--------|
| Public doc lint | `deno doc --lint packages/fresh/form/mod.ts` | PASS |
| Narrow typecheck | `deno check --unstable-kv packages/fresh/form/mod.ts` | PASS |
| Scoped form check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx` | PASS |
| Touched-doc format | `deno fmt --check packages/fresh/docs/form/fresh-ui-recipe.md` | PASS |
| Link/path existence | `test -f packages/fresh-ui/registry/components/ui/control-props.ts && test -f packages/fresh-ui/registry/components/ui/form-field.tsx && test -f packages/fresh/docs/form/fresh-ui-recipe.md` | PASS |
| File-size scan | `find packages/fresh/form -name '*.ts' -o -name '*.tsx' \| xargs wc -l \| sort -nr \| head -20` | PASS: no form file over cap |
