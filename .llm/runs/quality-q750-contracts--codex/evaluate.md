# Evaluation: `@netscript/contracts` typed quality repair

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                          |
| -------------- | ------------------------------------------------------------- |
| Run ID         | `quality-q750-contracts--codex`                               |
| Target         | `packages/contracts`                                          |
| Archetype      | `4 — Public DSL / Builder`                                     |
| Scope overlays | `none`                                                        |
| Evaluator      | Claude Opus 4.8 (Anthropic), separate opposite-family IMPL-EVAL session — 2026-07-12 |

Generator: OpenAI GPT-5.6 Sol (`gpt-5.6-sol`), high effort. Generator ≠ evaluator confirmed;
PLAN-EVAL and both Tier-A slice reviews were also separate Claude sessions. Owner no-PR override
applied per `supervisor.md`/`drift.md`; the commit trail is the force-pushed branch history plus run
artifacts, and the user slice brief / run acceptance is the close-gate contract.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                 |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` = `PASS`; commit order (re-run) plan `f66e5767` 15:00 → plan-eval `e2f71600` 15:03 → slice1 `9a6bd419` 15:08 → slice2+3 `22c608f2` 15:31. No package code before PASS. |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` (Public Surface / Domain Vocabulary / Ports / Constants / Fluent API / Commit Slices / Contributor Path).       |
| Commit slices match design plan        | PASS   | Slice 1 = application typing; slices 2+3 combined per documented minor drift (`drift.md`, `plan.md` execution note). Order preserved.    |
| Each slice has a passing gate          | PASS   | Slice 1: scanner 50→41 / allow 0 + scoped wrappers + 5 tests. Slices 2+3: scanner 41→0 / allow 0 + 8 tests + publish + doc + consumers.  |
| No speculative seams (unused files)    | PASS   | Diff is exactly the 10 planned package files + run artifacts; one new test file. No dead code (`git diff --stat`).                        |
| Constants used for finite vocabularies | PASS   | Filter operator + sort-order vocabularies remain single-source Zod enums; no cast-duplicated literal sets (`schemas/filters.ts`, `pagination.ts`). |

## Static Gates

| Gate             | Command or check                                                                 | Result | Evidence                                                                 | Notes |
| ---------------- | -------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ | ----- |
| Narrow typecheck | `run-deno-check.ts --root packages/contracts --ext ts,tsx`                       | PASS   | 21 files, 1 batch, 0 diagnostics (re-run)                                | strict `--unstable-kv` |
| Slice typecheck  | `deno check --unstable-kv` consumers + 4 entrypoints                             | PASS   | SDK ports, plugin contract-base, plugin adapter, mod/crud/query/transform → RC=0 (re-run) | |
| Format           | `run-deno-fmt.ts --root packages/contracts --ext ts,tsx`                         | PASS   | 21 files, 0 findings (re-run)                                            | |
| Lint             | `run-deno-lint.ts --root packages/contracts --ext ts,tsx`                        | PASS   | 21 files, exit 0, 0 findings; no `deno-lint-ignore` remains in src (grep) | |
| Doc lint         | `deno task doc:lint --root packages/contracts --pretty`                          | PASS   | 9 private-type-ref (all pre-existing oRPC), 0 missing-JSDoc; improved from 12 baseline (re-run) | no new diagnostic |
| Publish dry-run  | `deno publish --dry-run --allow-dirty`                                           | PASS   | `Success`, RC=0, **without `--allow-slow-types`**; intended file set only (re-run) | primary JSR risk retired |
| Link/path check  | run-artifact + diff paths                                                        | PASS   | All 10 files + test map to plan slices; `context-pack` file table accurate | |

## Fitness Gates

| Gate | Function                          | Result | Evidence                                                          | Violations |
| ---- | --------------------------------- | ------ | ---------------------------------------------------------------- | ---------- |
| F-1  | File-size lint                    | PASS   | `arch:check` contracts FAIL=0; no new oversized file in diff      | none |
| F-2  | Helper-reinvention scan           | PASS   | Facade replaced with upstream Zod generics, not a second facade   | none |
| F-3  | Layering check                    | PASS   | `arch:check` FAIL=0; domain/application/schemas boundaries intact | none |
| F-4  | Inheritance audit                 | N/A    | No classes introduced (type-only)                                 | n/a |
| F-5  | Public surface audit              | PASS   | Four entrypoints unchanged; `deno doc` names preserved; additive `ContractSchemaInput/Output` | none |
| F-6  | JSR publishability gate           | PASS   | Raw dry-run RC=0 without slow-type flag; slow-type carve-out stays closed | none |
| F-7  | Doc-score gate                    | PASS   | 0 missing-JSDoc; private-type-ref 12→9 (no regression)            | none |
| F-8  | Workspace `lib` override check    | PASS   | `arch:check` FAIL=0                                               | none |
| F-9  | Permission declaration check      | N/A    | No new runtime/permission surface                                 | n/a |
| F-10 | Test-shape audit                  | PASS   | New `schema-types_test.ts` is behavioral (parse) + type-level; 8 pass | none |
| F-11 | Forbidden-folder lint             | PASS   | No new folders; accepted root `crud/` unchanged                   | none |
| F-12 | Naming-convention lint            | PASS   | `arch:check` FAIL=0                                               | none |
| F-13 | Saga/runtime invariants           | N/A    | No runtime/state surface                                          | n/a |
| F-14 | Console-log lint                  | PASS   | No console added (diff review)                                    | none |
| F-15 | Re-export-of-upstream lint        | PASS   | Zod imported as `type`/values internally; not re-exported wholesale | none |
| F-16 | Folder-cardinality lint           | PASS   | No folder changes                                                 | none |
| F-17 | Abstract-derived co-location lint | N/A    | No abstracts                                                      | n/a |
| F-18 | Sub-barrel lint                   | PASS   | No new barrels; `crud.ts`/`query.ts`/`mod.ts` only add additive type re-exports | none |
| F-19 | Scoped source gate runners        | PASS   | All evidence via scoped wrappers, re-run independently            | none |

## Runtime Gates

| Gate                   | Validation              | Result | Evidence                                       |
| ---------------------- | ----------------------- | ------ | ---------------------------------------------- |
| Runtime/Aspire/browser | none — type-only slice  | N/A    | No runtime/route/validation-rule behavior changed |

## Consumer Gates

| Consumer                                             | Validation                          | Result | Evidence                                    |
| ---------------------------------------------------- | ----------------------------------- | ------ | ------------------------------------------- |
| `@netscript/sdk` service-client / ports              | `deno check --unstable-kv` (re-run) | PASS   | RC=0; `~orpc`/`__netscriptSchemas` markers resolve against enriched dual-generic types |
| `@netscript/plugin` contract-base + adapter contract | `deno check --unstable-kv` (re-run) | PASS   | RC=0                                        |
| Contracts four entrypoints                           | `deno check --unstable-kv` (re-run) | PASS   | RC=0; helper names + export map unchanged   |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | CLEAR  | `arch:check` FAIL=0; no oversized new file | pre-existing file-size WARNs on contract-definition files are out of this slice |
| AP-9  | CLEAR  | Facade removed; native `z.ZodType`/`z.input`/`z.output` used directly — no second parallel abstraction | primary target |
| AP-14 | CLEAR  | Zod imported internally (`import type { z }`), not re-exported wholesale | |
| AP-16 | N/A    | `helpers/` debt already closed 2026-06-06; no generic folder added | |
| AP-20 | CLEAR  | 48 cast-bearing lines removed, 0 added; scanner `ok:true` 0/0; no `deno-lint-ignore` remains | owner rejection criteria met |
| AP-22 | DEBT_ACCEPTED | Accepted root `crud/` subpath unchanged; matching open entry in `arch-debt.md` | no new barrel |
| AP-25 | CLEAR  | Schema/type modules remain pure, side-effect free | |
| others | N/A   | Outside the type-only scope of this slice | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | `arch-debt.md` not in diff; no new violation to record (scanner 0/0, arch:check FAIL=0) |
| Resolved entries      | 0     | T4 slow-type carve-out already closed 2026-07-12 at baseline; this slice keeps the normal bar green |
| Deepened violations   | 0     | Accepted `crud/` layout untouched; no new cast/suppression added |
| Unrecorded violations | 0     | No `any`/`as unknown as`/`deno-lint-ignore` introduced (diff grep + scanner) |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | Two of four agent briefs — `q750-slice1-review-prompt.md`, `q750-slice23-review-prompt.md` — lack a literal `## SKILL` chapter (protocol rule 13). | `.llm/tmp/q750-slice{1,23}-review-prompt.md` open with `use harness` and name the exact skills to read inline (`netscript-harness`; harness + `netscript-doctrine` + `jsr-audit`), but not under a `## SKILL` heading. The plan-eval and impl-eval briefs each carry the chapter. | Non-blocking. Tighten future review briefs to use the `## SKILL` heading; functional intent (skill selection) was met and both reviews were genuinely performed. |

## Verified Against the Owner's Named Concerns

- **PLAN-EVAL preceded implementation** — confirmed by commit timeline (re-run).
- **All 50 findings eliminated by typing, not suppression** — baseline re-run on a `3b3d615b` worktree = 50 findings (43 unsafe-cast + 7 any) / allow 0; final scanner `ok:true` 0 findings / allow 0; diff grep of added lines shows **zero** `as unknown as`/`as any`/`: any`/`deno-lint-ignore`/`quality-allow`; 48 cast-bearing lines removed vs 0 added.
- **Rejected prior count was 41** — recovered `git show 11a2e3fe:…/worklog.md` records "0 findings; 41 audited allowances"; this run reaches 0 findings / 0 allowances (genuine, not green-by-suppression).
- **Zod input/output/default/coercion sound** — `ContractSchema = z.ZodType<TOutput,TInput>`, `ContractSchemaInput = z.input`, `ContractSchemaOutput = z.output`; explicit declaration-safe input annotations on pagination schemas; test proves `{limit:'25',offset:'5'}` (input) → `{limit:25,offset:5}` (output).
- **CRUD generics sound** — `CrudIdInput/CrudListInput/CrudListOutput/CrudUpdateInput` gained the input type param; `createPaginatedOutput`/`createCursorPaginatedOutput` are dual-generic and cast-free; CRUD test proves a configured `z.string().uuid()` idSchema flows into `getById['~orpc']['inputSchema']`.
- **Runtime filter merge semantics preserved** — `PaginationInputSchema.merge(filter)` → `z.object({ ...PaginationInputSchema.shape, ...filterSchema.shape })`; every pagination/filter schema is a plain `z.object`/`z.enum`/`z.array` (no strict/passthrough/catchall), so spread order gives identical B-wins override + default strip semantics; `idSchema` default-param `=` → `??` is equivalent for the schema-required option.
- **Gate evidence** — scoped check/lint/fmt (21 files, 0/0/0), 8 tests pass, raw publish dry-run `Success` without `--allow-slow-types`, doc-lint recorded (9 pre-existing private refs, 0 missing JSDoc, improved from 12), consumers RC=0, `arch:check` FAIL=0, `deno.lock` unchanged — all re-run independently.
- **Every brief contains `## SKILL`** — partial: 2/4 briefs lack the literal chapter (see Findings, low severity, non-blocking).
- **No new/deepened debt** — `arch-debt.md` untouched; no unrecorded violation.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Replace an output-only schema facade with `z.ZodType<Out,In>` + `z.input`/`z.output` projections and explicit declaration-safe annotations to erase `as unknown as` at composition sites while keeping the JSR no-slow-types bar green. | Native-generic variance repair | Archetype 4 (schema/DSL packages) | high |
| For plain object schemas, `z.object({ ...A.shape, ...B.shape })` is a behaviorally exact, cast-free substitute for `.merge()` (B-wins + strip). Only holds when neither schema sets strict/passthrough/catchall — verify before substituting. | Merge→spread equivalence | Zod-backed contract packages | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Approved Archetype-4 scope is complete and the owner's core mandate is met and independently re-verified: all 50 baseline findings are eliminated by real native-Zod typing (final scanner `ok:true`, 0 findings, 0 allowances; 48 casts removed, 0 added, 0 suppressions), not by the 41-allowance suppression the prior pass was rejected for. Zod input/output/default/coercion variance and CRUD dual-generic composition are sound and test-proven; runtime filter merge/override and defaults are preserved (plain-object merge→spread equivalence); publish stays green without `--allow-slow-types`; consumers, doc-lint, doctrine, and lock hygiene all pass on independent re-run. PLAN-EVAL preceded implementation and generator≠evaluator held throughout. The only finding — 2 of 4 review briefs omit the literal `## SKILL` chapter while naming the skills inline — is low-severity process bookkeeping on ephemeral scratch briefs; it does not affect scope, any gate, debt, or resumability and is not verdict-blocking. Recommend adding the `## SKILL` heading to future review briefs. |
