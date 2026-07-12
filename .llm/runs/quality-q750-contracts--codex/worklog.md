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
| 2026-07-12 | 2+3 | schema/CRUD typing | Replaced the output-only facade with Zod input/output generics, typed schema factories and CRUD composition, and added variance/inference tests; scanner reduced 41 → 0 with 0 allowances. |
| 2026-07-12 | 2+3 | slice review | Separate Claude Opus 4.8 Tier-A review returned PASS and created sign-off commit `22c608f2`. |

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
| Scoped check | wrapper over `packages/contracts` | PASS | 21 files, 1 batch, 0 diagnostics |
| Scoped lint | wrapper over `packages/contracts` | PASS | 21 files, 0 findings; no explicit-any ignore remains |
| Scoped format | wrapper over `packages/contracts` | PASS | 21 files, 0 findings |
| Package tests | package `deno task test` | PASS | 8 passed, 0 failed, including input/output and CRUD inference coverage |
| Publish dry-run | package `deno publish --dry-run --allow-dirty` | PASS | Green without `--allow-slow-types`; intended 21-file publish set |
| Doc lint | `deno task doc:lint --root packages/contracts --pretty` | RECORDED / IMPROVED | 9 combined private refs vs 12 baseline; 0 missing JSDoc |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Code-quality scanner | PASS | `ok:true`, 0 findings, allowCount 0 under `--max-allow 8` | No suppression |
| F-1..F-12, F-14..F-19 | PASS with baseline warnings | package doctrine check: FAIL=0, WARN=2, INFO=1; root `arch:check` exit 0 | Existing README/Result/docs warnings are outside this typing slice |
| F-6 JSR publishability | PASS | raw package dry-run exit 0; JSR audit exit 0 | Audit helper counts the banner text as one informational slow-type line; raw authority has no slow-type failure |

### Slice 1 Reconcile

- Scanner delta matches the plan: nine findings removed (seven explicit `any`/ignore findings and
  two related unsafe casts), leaving 41 schema/CRUD casts and zero allowances.
- No PR/comment reconciliation is possible under the owner no-PR override; branch/run artifacts are
  current and no new issue input was introduced.
- `deno.lock` remains unchanged. No plan or doctrine drift discovered.

### Slices 2+3 Reconcile

- The public helper names and four entrypoints remain; `ContractSchemaInput` and
  `ContractSchemaOutput` are now consistently exported so consumers can name the two directions.
- Three focused schema tests became eight total package tests and prove coerced input versus parsed
  output, generic paginated factory variance, and custom CRUD identifier inference.
- The schema alias change and CRUD cast removal were combined to keep every sign-off commit
  compiling; this minor execution drift is recorded in `plan.md` and `drift.md`.
- No PR/comment reconciliation is possible under the owner override. No new issue input or scope
  expansion was introduced. `deno.lock` remains unchanged.

## Allowance Accounting

| Measure | Count | Evidence |
| --- | ---: | --- |
| Rejected prior Sol-low pass | 41 | recovered worklog at unreachable commit `11a2e3fe` |
| Fresh re-dispatch baseline | 0 | baseline had 50 unsuppressed findings |
| Final | **0** | scanner `ok:true`, no findings, `allowCount:0` |

### Surviving Allowances

None. No structural upstream limitation required a `quality-allow` marker.

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime/Aspire/browser | N/A | no runtime or UI behavior | Type-only package boundary slice |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Contracts exports and downstream schema consumers | PASS | targeted `deno check --unstable-kv` over package/plugin routes using `@netscript/contracts` | 7 consumer entry files green |

## Handoff Notes

- IMPL-EVAL should inspect `schema-types.ts`, the generic pagination/CRUD paths, the new inference
  tests, and the empty allowance table first.

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

### Slices 2+3 — Native Zod input/output model + CRUD generic composition — PASS

- **Reviewer:** Claude Opus 4.8 (Anthropic), separate Tier-A session — opposite family to the
  GPT-5.6 Sol generator. Reviewed 2026-07-12.
- **Scope reviewed:** the entire current uncommitted diff — `src/domain/schema-types.ts`,
  `src/domain/schemas.ts`, `src/application/zod-helpers.ts`, `schemas/pagination.ts`,
  `schemas/filters.ts`, `crud/create-crud-contract.ts`, the three public re-export barrels
  (`crud.ts`, `query.ts`, `src/public/mod.ts`), the new `tests/schema-types_test.ts`, and the run
  artifacts. No unrelated churn; `deno.lock` unmodified.

**Type soundness — genuine native projections (owner's first named concern)**

- `ContractSchema<TOutput, TInput> = z.ZodType<TOutput, TInput>` — the hand-written
  `{ parse; safeParse; optional; describe }` facade that manufactured the casts is gone. The
  contract type is now the real Zod class type.
- `ContractSchemaInput<TSchema> = z.input<TSchema>` and `ContractSchemaOutput<TSchema> =
  z.output<TSchema>` are literal native projections — not re-derived structural clones. Verified by
  a bidirectional type-equality assertion (`[A] extends [B] ? [B] extends [A]`): for
  `PaginationInputSchema`, the projected input/output **exactly equal** `z.input`/`z.output` of an
  independently reconstructed identical `z.object` (compiled clean under `deno check --unstable-kv`).
  Zod 4 marks both `ZodType` params covariant, so the explicit `= z.object({...})` assignments
  enforce declared-input ⊇ true-input; the equality assertion additionally proves the declared
  inputs are faithful (not loosely over-widened).
- `ContractParseResult<TOutput> = z.ZodSafeParseResult<TOutput>` replaces the previous facade
  result shape. This is the *truthful* type of what a real Zod `.safeParse` returns; the old
  `{ success; data?; error? }` was the lie. It is public via `mod.ts` but has no structural external
  consumer (grep: re-exports only).

**Zod input/output/default/coercion variance**

- Coercion divergence is real and tested: `OffsetPaginationQuerySchema` accepts `{ limit: '25',
  offset: '5' }` (string input) and parses to `{ limit: 25, offset: 5 }` (number output); the type
  test binds both `ContractSchemaInput` and `ContractSchemaOutput` and the runtime `assertEquals`
  passes.
- Default-driven optionality is represented in the explicit input annotations (`page?: unknown`,
  `sortOrder?: 'asc'|'desc'`, etc.); confirmed exact against `z.input` as above.
- Helper factories (`positiveInt`/`paginationLimit`/`boundedString`/`stringToNumber`/…) dropped all
  `as unknown as ContractNumberSchema/ContractSchema<number>` — return types are now the real
  `z.ZodNumber | z.ZodDefault<z.ZodNumber>` / `z.ZodString` / `z.ZodCodec<...>`. Codec `encode`
  signature correctly widened to `value: number | undefined` to match a defaulted output schema.

**Generic pagination / CRUD composition**

- `createPaginatedOutput<TOutput, TInput>` / `createCursorPaginatedOutput` are now dual-generic and
  return their composed object shape with no trailing cast; the generic-factory type test proves an
  item schema's coerced input (`id: '7'`) and parsed output (`id: 7`) both survive composition.
- CRUD marker types (`CrudIdInput`, `CrudListInput`, `CrudListOutput`, `CrudUpdateInput`) gained a
  second (input) type parameter, so downstream SDK client typing now sees distinct accepted-input
  vs parsed-output — a strict improvement over the prior input≡output markers.
- The SDK extraction path (`packages/sdk/src/ports/service-client.ts` →
  `ProcedureInputFromNode`/`ProcedureOutputFromNode` reading `__netscriptSchemas`/`~orpc`) still
  type-checks against the enriched markers.

**Runtime semantics — CRUD filter composition preserves merge/override (owner's second named concern)**

- Prior code: `PaginationInputSchema.merge(filterSchema as unknown as z.ZodObject)`. New code:
  `z.object({ ...PaginationInputSchema.shape, ...filterSchema.shape })`. Proven behaviorally
  identical at runtime: on a colliding key (`sortBy`), the filter's schema overrides pagination's
  (spread order `...pagination, ...filter` = merge's B-wins), a bad enum value is rejected by both,
  and pagination defaults (`page:1`, `limit:10`, `sortOrder:'desc'`) are preserved by both. `.shape`
  is why `Pick<z.ZodObject,'shape'>` was added to `ContractObjectSchema`.
- `idSchema` default is unchanged runtime (`z.coerce.number().int().positive()`); the change only
  moved it from a cast-laden default parameter to a `??` fallback, removing `as unknown as TId`.
- `idInputSchema`/`updateInputSchema` are now plain `z.object({...})` with no `as unknown as
  z.ZodTypeAny` on the members. The two surviving single-`as` boundaries (`asSchema`,
  `crudOperation`) are **pre-existing at HEAD** (unchanged by this diff) and are documented sound
  widenings, not relocated casts.

**Green-by-suppression audit (owner rejection criteria)**

- Diff grep for added `deno-lint-ignore` / `as unknown as` / `as any` / `: any` / `<any>` /
  `quality-allow`: **none**. Cast-bearing added lines: 0; cast-bearing removed lines: 48. Casts were
  deleted, not moved.
- Scanner `--root packages/contracts --max-allow 8`: `ok:true`, **0 findings, 0 allowances** — no
  survivor allowance, target-zero met (not merely under the eight ceiling).

**Evidence re-run independently (not trusting reported gates)**

- Scanner: `ok:true` 0/0. Scoped check: 21 files, 0 diagnostics. Scoped lint: 21 files, 0 findings
  (0 lint-ignores). Scoped fmt: 21 files, 0 findings.
- Package tests: **8 passed / 0 failed** (incl. the 3 new variance/factory/CRUD-marker tests).
- Publish dry-run: `Success` **without `--allow-slow-types`** — JSR slow-type bar intact.
- `arch:check`: exit 0, zero `FAIL=` across all reported packages; contracts layout unchanged so no
  per-package doctrine regression is possible.
- Consumers: `deno check --unstable-kv` over SDK client/ports, `@netscript/plugin` contract-base,
  and the workers/sagas/triggers service routers — exit 0.
- `doc:lint`: 9 errors, **all** pre-existing oRPC `private-type-ref`s (`AnySchema`,
  `BaseContractErrors`, `ContractProcedureBuilder*`, `Schema`, `oc`); baseline with this diff
  stashed = 12, so this slice *removed* 3 and introduced **zero** new missing-JSDoc/private-type
  diagnostics. The new public types produce no doc-lint diagnostic. Matches the plan's explicit
  scope-out of the oRPC doc debt.
- `deno.lock`: `git status`/`diff` clean — unmodified.

**Public compatibility**

- Four entrypoints (`.`, `./crud`, `./query`, `./transform`) intact. Existing helper names
  preserved; `ContractSchemaInput`/`ContractSchemaOutput` added as additive exports;
  `ContractDefaultableSchema` retained (now `z.ZodType`-backed). Publish file set and export map
  unchanged.

**Minor observations (non-blocking)**

- `ContractObjectSchema` retains `'merge'` in its `Pick<z.ZodObject, …>` though the generator no
  longer calls `.merge()` (Zod 4 deprecates it in favor of `.extend`/shape-spread). Harmless and
  keeps source-level compatibility for any external caller; not worth a follow-up in this slice.
- Marker types remain phantom (declared via `crudOperation`'s return-type inference, as at HEAD).
  Unchanged design; the improvement here is removing the `as unknown as` at every schema
  construction site.

**Verdict:** `PASS`. This is a genuine native-Zod variance repair — casts removed (not relocated or
suppressed), runtime merge/override and defaults preserved, publish/doc bars intact, `deno.lock`
untouched. Sign-off commit created by the Tier-A supervisor (not the implementer); the
implementation lane did not self-certify.
