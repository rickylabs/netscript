# Plan: properly type `@netscript/contracts` quality boundaries

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q750-contracts--codex` |
| Branch | `quality/q750-contracts-h` |
| Phase | `plan` |
| Target | `packages/contracts` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Archetype

Archetype 4 is authoritative: doctrine currently assigns `@netscript/contracts` to the public
DSL/builder family because the package exposes CRUD contract generation and query/transform builder
surfaces in addition to schemas. This slice changes type expression inside that existing surface;
it does not restructure the builder.

## Current Doctrine Verdict

`Keep` — confirm the version-axis shape and retain the accepted root `crud/` subpath layout.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The published Zod input/output contract must be truthful before implementation convenience. |
| A2 | A real native schema type is simpler than a facade requiring double assertions. |
| A8 | Changes stay within existing schema, CRUD, query, and transform concerns. |
| A9 | The existing Archetype 4 surface and accepted `crud/` layout remain intact. |
| A14 | Scanner, scoped wrappers, semantic tests, doc lint, and publish dry-run prove the type repair. |

## Goal

Reach zero scanner findings and no more than eight allowances—driving toward zero—by expressing
Zod input/output/default/coercion variance and CRUD composition with real generics rather than
`as unknown as`, while preserving runtime behavior and the four public entrypoints.

## Scope

- Replace the output-only custom schema facade at internal composition boundaries with native Zod
  generics that preserve input and output.
- Derive schema value contracts with `z.output<typeof schema>` and use `z.input` where defaults or
  coercion make the accepted input different.
- Give exported schema constants and helper factories explicit declaration-safe types.
- Type generic paginated-output and CRUD schema factories so returned objects already carry their
  composed shapes.
- Replace application `any`/blanket ignores with `unknown`-safe records and typed transformation.
- Add focused type/semantic tests if existing tests do not prove input/output and CRUD inference.
- Maintain the required harness artifacts and allowance accounting.

## Non-Scope

- No runtime behavior, route, validation-rule, dependency, version, export-map, folder-layout, or
  README redesign.
- No changes to `deno.lock`, no cache reload, and no `deno-lint-ignore`.
- No PR creation, per owner directive.
- No cleanup of the 12 pre-existing oRPC `private-type-ref` doc diagnostics unless the typing repair
  naturally removes them without expanding scope.

## Hidden Scope

- `schema-types.ts` is public through `src/public/mod.ts`; compatibility of its exported helper type
  names must be checked through `deno doc` and consumer type-checks.
- `crud/create-crud-contract.ts` encodes schema types into both `__netscriptSchemas` and `~orpc`
  markers; those projections must keep exact `z.output` types.
- Native inferred Zod types can violate JSR slow-type analysis, so explicit exported annotations are
  part of correctness rather than formatting.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Native Zod 4 schema types are the source of truth for schema input/output and object shape. | The current facade is what creates the casts; duplicating Zod method signatures cannot stay variance-correct. |
| L2 | Preserve public helper names where practical, but redefine them in terms of real Zod generics and `z.input`/`z.output`; do not preserve false generic semantics merely for source compatibility. | The owner explicitly requires proper typing, and the package is already Zod-backed. |
| L3 | Output-facing domain aliases derive from schema output. Defaults/coercions are represented separately through schema input types where needed. | This states guaranteed parsed values without lying about accepted input. |
| L4 | Generic object composition uses `T extends z.ZodObject`/shape-preserving returns, not a cast back from a minimal facade. | Zod's `extend` generic preserves the merged shape directly. |
| L5 | Generic non-object schemas use `T extends z.ZodType` and `z.output<T>`/`z.input<T>`. | This retains exact schemas through pagination and CRUD route metadata. |
| L6 | A quality allowance may survive only after a concrete typed attempt proves a named upstream structural limitation. Each survivor is individually documented; target is zero. | Eight is a ceiling, not a quota. |
| L7 | Runtime values and public entrypoint names remain unchanged; add compile-time assertions/tests for inference rather than weakening types to make checks pass. | Prevents a scanner-only green result. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Named Zod shape alias vs explicit factory return per schema | safe to defer | Both implement L1/L3 and must pass isolated-declaration publish analysis. |
| Whether a structurally irreducible oRPC marker refinement needs one local allowance | safe to defer | Attempt exact generic typing first; any survivor must meet L6 and final ceiling. |
| Broader oRPC private-type-ref cleanup | safe to defer | Pre-existing, acceptance requests recording rather than zero, and not caused by the scanner repair. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Public `ContractSchema` helper consumers regress. | Preserve exported names, run full package checks/tests and focused consumer checks; inspect final `deno doc`. |
| Defaults/coercions make inferred inputs unexpectedly optional or unknown. | Assert both `z.input` and `z.output` in type tests and keep output aliases derived from schemas. |
| Generic CRUD markers lose exact entity/update/filter output types. | Keep schema generics through factory construction and add compile-time/semantic CRUD tests. |
| Explicit Zod types become slow/private published types. | Annotate exported declarations, run full export-map doc lint and raw package publish dry-run. |
| Casts are merely moved into a helper. | Run the scanner across the entire package and substantively review every remaining cast/allowance. |
| A validation command mutates `deno.lock`. | Compare `deno.lock` to baseline after every slice; never accept churn. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-9 | existing risk | Do not add a second facade; use upstream Zod generics directly. |
| AP-14 | risk | Import Zod types internally without re-exporting the upstream library wholesale. |
| AP-20 | existing quality issue | Remove unsafe double assertions and explicit `any`; no lint suppression. |
| AP-22 | accepted debt adjacent | Preserve the owner-accepted root `crud/` subpath; create no new barrels. |
| AP-25 | risk | Keep schema/type modules pure and side-effect free. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-4 | yes for Archetype 4 | `deno task arch:check` plus manual diff review |
| F-5 | yes | `deno doc`/`doc:lint`, unchanged four-entrypoint surface |
| F-6 | yes | package `deno publish --dry-run --allow-dirty` succeeds without slow-type flag |
| F-7 | yes | `doc:lint` recorded; no new missing JSDoc or private-type diagnostics |
| F-8..F-12 | yes | `arch:check`, package config review, scoped lint/tests |
| F-14..F-18 | yes | `arch:check` and manual diff review; accepted root `crud/` debt unchanged |
| F-19 | yes | scoped wrapper evidence for check/lint/fmt |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `packages/contracts/crud — accepted root subpath layout` | none | Layout and export path remain unchanged. |
| `packages/contracts — T4 slow-type publish carve-out` | none | Already closed; this slice must keep the normal publish bar green. |
| New cast allowance debt | none expected | A survivor is allowed only under L6 and is documented in the worklog, not normalized as strategy. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Quality | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/contracts --max-allow 8` | `ok:true`, zero findings, allowance count minimized |
| 2 | Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/contracts --ext ts,tsx` | zero diagnostics |
| 3 | Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/contracts --ext ts,tsx` | zero findings, no lint ignores |
| 4 | Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/contracts --ext ts,tsx` | zero findings |
| 5 | Tests | `(cd packages/contracts && deno task test)` | package tests green |
| 6 | Docs | `deno task doc:lint --root packages/contracts --pretty` | recorded; no regression from 12 baseline private refs / 0 missing docs |
| 7 | Publish | `(cd packages/contracts && deno publish --dry-run --allow-dirty)` | green without `--allow-slow-types` |
| 8 | Doctrine | `deno task arch:check` | no new contracts violation |
| 9 | Consumer | focused checks/tests for packages importing the changed public schema helpers | green |
| 10 | Hygiene | raw Git diff/status against `3b3d615b` | no `deno.lock`, no unrelated files, no `deno-lint-ignore` |

## Commit Slices

1. **Application boundary typing** — replace query/transform `any` and blanket ignores; prove with
   scanner delta, scoped wrappers, and package tests. Files:
   `src/application/paginated-query.ts`, `src/application/transform-helpers.ts`, focused tests,
   `worklog.md`, `context-pack.md`.
2. **Native Zod input/output model** — type schema aliases, static schemas, pagination factories,
   filters, and helper factories with concrete Zod generics; prove with scanner delta, schema/type
   tests, scoped wrappers, doc lint, and publish dry-run. Files: `src/domain/schema-types.ts`,
   `src/domain/schemas.ts`, `src/application/zod-helpers.ts`, `schemas/filters.ts`,
   `schemas/pagination.ts`, exports/tests as required, run artifacts.
3. **CRUD generic composition and final gate** — carry native schema/object types through CRUD
   route construction and exact markers, then run all acceptance and consumer gates. Files:
   `crud/create-crud-contract.ts`, focused tests/exports if required, run artifacts.

Execution note (2026-07-12): slices 2 and 3 are landing as one sign-off unit. Replacing the public
schema alias immediately changes the type checked at the pre-existing CRUD cast sites, so the
schema model cannot form an independently green commit without either preserving or moving a cast.
Combining them keeps the branch compiling and avoids the exact suppression/cast-relocation strategy
the owner rejected. Scope and final gates are unchanged; see `drift.md`.

## Deferred Scope

- Broader package restructuring and the accepted root `crud/` layout.
- Existing oRPC doc private-reference cleanup beyond any direct regression caused here.
- Schema facade migrations in other packages; this slice owns only `packages/contracts`.

## Drift Watch

- Log if native Zod typing requires a public export rename, if allowance count cannot reach eight,
  if doc/publish diagnostics regress, or if consumer checks expose cross-package migration scope.
