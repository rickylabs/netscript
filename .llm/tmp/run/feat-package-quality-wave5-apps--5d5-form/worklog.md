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
