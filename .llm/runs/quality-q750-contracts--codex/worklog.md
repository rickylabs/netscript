# Worklog: properly type `@netscript/contracts`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q750-contracts--codex` |
| Branch | `quality/q750-contracts-h` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Design

### Public Surface

- Existing entrypoints remain `.`, `./crud`, `./query`, and `./transform`.
- Existing schema constants, domain value aliases, helper factory names, CRUD factory names, query
  functions, and transformer functions remain exported.
- `ContractSchema`/`ContractObjectSchema` helper names remain available but express native Zod
  input/output/object types rather than a lossy hand-written method facade.
- No route path, runtime parse rule, or export-map change is planned.

### Domain Vocabulary

- `ContractSchema<TOutput, TInput>` — native Zod schema boundary retaining both directions.
- `ContractObjectSchema<...>` — actual Zod object/shape boundary retaining composition methods.
- `ContractSchemaOutput<TSchema>` / input counterpart as required — projections based on
  `z.output`/`z.input`.
- Pagination/filter/error value aliases — guaranteed parsed outputs derived from their schemas.
- CRUD schema markers — exact input/output schema instances retained through generated routes.
- Prisma query argument bag — `Record<string, unknown>`, narrowed only where read.
- Transformer pipeline accumulator — `unknown` between heterogeneous stages, typed at endpoints.

### Ports

- None. Zod and oRPC are published schema/builder dependencies, not new package-owned IO ports.

### Constants

- Existing pagination and integer bounds remain unchanged.
- Existing filter operator literals remain the finite operator vocabulary; schema and type derive
  from one source rather than duplicating via cast.

### Fluent API Shape and Validation

- `baseContract.route(...).input(...).output(...)` and the CRUD factories retain their existing
  caller-facing chains.
- Validation continues to fire in the existing Zod schemas; the type repair makes accepted input
  and parsed output explicit without changing rules.
- No new typestate is needed: the problem is schema variance, not builder call order.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Remove application `any` and lint suppression | scanner delta + scoped wrappers + package tests | `src/application/paginated-query.ts`, `src/application/transform-helpers.ts`, tests/run artifacts |
| 2 | Express schemas/factories with native Zod input/output generics | scanner delta + schema tests + doc/publish gates | `src/domain/schema-types.ts`, `src/domain/schemas.ts`, `src/application/zod-helpers.ts`, `schemas/*.ts`, exports/tests/run artifacts |
| 3 | Preserve exact schema types through CRUD composition and close acceptance | final scanner `--max-allow 8`, all package/consumer/doctrine gates | `crud/create-crud-contract.ts`, tests/exports if required, run artifacts |

### Deferred Scope

- Root `crud/` layout — accepted debt and no import churn authorized.
- Existing oRPC private-type-ref doc debt — record baseline and prevent regression.
- Other packages' independent schema facades — outside `packages/contracts`.

### Contributor Path

To add a contract schema, define a concrete Zod schema with an explicit declaration-safe schema
type, derive its parsed value with `z.output<typeof Schema>` (and accepted input with `z.input` when
different), compose object schemas through their actual shapes, export through the existing public
module, then add a parse and type-inference test. Never cast a Zod value into a parallel facade.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-12 | bootstrap | preflight | Hard reset confirmed exact baseline and branch. |
| 2026-07-12 | research | baseline | Fresh scanner: 50 findings, 0 allowances; rejected pass: 41 allowances. |
| 2026-07-12 | plan | Plan-Gate | Separate Claude Opus 4.8 session `b2f5d950-e468-4fde-8177-0460ffada95e` returned PASS; no package implementation preceded it. |
| 2026-07-12 | 1 | application typing | Replaced Prisma argument `any` bags and heterogeneous transformer `any` accumulation with `unknown`-safe types; scanner reduced 50 → 41, allowances remain 0. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Archetype 4 / Keep | Current doctrine explicitly assigns contracts to the public DSL/builder family. | doctrine file 10 |
| Native Zod generics, not facade suppression | Zod already models the exact input/output/shape variance erased by the custom aliases. | plan L1-L5; Zod 4 docs |
| Target zero allowances | Owner rejected suppression; eight is only the hard ceiling. | owner directive; plan L6 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Owner forbids the harness's normal PR/comment trail | minor | yes |
| Agentic launch reported remote control disabled | minor | yes |

## Gate Results

### Research Baselines

| Gate | Result | Notes |
| --- | --- | --- |
| Scanner | FAIL expected | 50 findings, 0 allowances on clean baseline |
| Publish dry-run | PASS | No slow-type flag required |
| Doc lint | RECORDED | Exit 0; 12 combined private refs, 0 missing JSDoc |
| PLAN-EVAL | PASS | All eight Plan-Gate checks passed in separate opposite-family session |

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Scoped check | wrapper over `packages/contracts` | PASS | 20 files, 1 batch, 0 diagnostics |
| Scoped lint | wrapper over `packages/contracts` | PASS | 20 files, 0 findings; all explicit-any ignores removed |
| Scoped format | wrapper over `packages/contracts` | PASS | 20 files, 0 findings |
| Package tests | package `deno task test` | PASS | 5 passed, 0 failed |
| Publish/doc | plan validation commands | NOT_RUN | Final evidence after implementation |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1..F-12, F-14..F-19 | NOT_RUN | planned `arch:check`, quality scanner, wrappers, docs/publish | Archetype 4 set |

### Slice 1 Reconcile

- Scanner delta matches the plan: nine findings removed (seven explicit `any`/ignore findings and
  two related unsafe casts), leaving 41 schema/CRUD casts and zero allowances.
- No PR/comment reconciliation is possible under the owner no-PR override; branch/run artifacts are
  current and no new issue input was introduced.
- `deno.lock` remains unchanged. No plan or doctrine drift discovered.

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime/Aspire/browser | N/A | no runtime or UI behavior | Type-only package boundary slice |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Contracts exports and downstream schema consumers | NOT_RUN | focused post-implementation checks | Required because public helper types change |

## Handoff Notes

- PLAN-EVAL should inspect the facade mismatch in `src/domain/schema-types.ts` and verify that every
  baseline finding family has an implementation slice and proving gate.
- Final worklog must report prior allowance count 41 versus final count and justify every survivor
  individually; an empty survivor table is preferred.

## Slice Reviews

### Slice 1 — Application boundary typing — PASS

- **Reviewer:** Claude Opus 4.8 (Anthropic), separate Tier-A session — opposite family to the
  GPT-5.6 Sol generator. Reviewed 2026-07-12.
- **Scope reviewed:** `src/application/paginated-query.ts`, `src/application/transform-helpers.ts`,
  plus `worklog.md`/`context-pack.md` slice updates. Diff is exactly the four intended files; no
  unrelated churn, no `deno.lock` change.

**Correctness / type safety**

- `paginated-query.ts`: `Record<string, any>` → `Record<string, unknown>` at all three `findManyArgs`
  sites. `PrismaModelDelegate.findMany(args?: unknown)` accepts the record by widening, so no cast is
  introduced and runtime behavior is identical.
- `transform-helpers.ts` omit factory: the `(result as any)[key]` write and the `{} as Omit<T,K>`
  accumulator are replaced by a `Partial<T>` accumulator with a keyed write (`result[key] =
  input[key]`, `key: keyof T`) and a single `result as Omit<T,K>` return assertion. That surviving
  assertion is structurally justified — TS cannot track the runtime key exclusion — and mirrors the
  pre-existing accepted `{} as Pick<T,K>` pattern in `createPickTransformer`. It is a single
  assertion, not `as unknown as`, so the scanner does not flag it (file now reports 0 findings).
- `composeTransformers`: the `any/any` implementation signature becomes `unknown/unknown` with
  `reduce<unknown>`; the four typed public overloads are unchanged, so caller-facing inference is
  preserved. Variance is correct and `deno check --unstable-kv` (strict) passes with 0 diagnostics.
- Two `// deno-lint-ignore no-explicit-any` directives removed; none added. No new `as unknown as`.

**Evidence re-run (not trusting the reported gates)**

- Scanner `--root packages/contracts --max-allow 8`: `ok:false`, **41 findings / 0 allowances** —
  matches the reported 50→41 delta. All 41 residual findings are in slice 2/3 files
  (`crud/create-crud-contract.ts`, `schemas/filters.ts`, `schemas/pagination.ts`,
  `application/zod-helpers.ts`, `domain/schemas.ts`); **zero** remain in either Slice 1 file. The
  scanner is red only because slices 2–3 are unimplemented, which is expected for a partial slice —
  not a green-by-suppression result (allowCount is 0).
- Scoped check / lint / fmt over 20 files: 0 diagnostics / 0 findings / 0 findings.
- Package `deno task test`: 5 passed, 0 failed.
- `git status`: only the four intended files; `git diff --stat -- deno.lock` empty.

**Minor observations (non-blocking)**

- No new focused test was added for Slice 1. Acceptable here: the changes are type-only with
  identical runtime behavior, proven by strict `deno check`; input/output and CRUD inference tests
  are owned by slices 2–3 per the plan.

**Verdict:** `PASS`. Sign-off commit created by the Tier-A supervisor (not the implementer);
implementation lane did not self-certify.
