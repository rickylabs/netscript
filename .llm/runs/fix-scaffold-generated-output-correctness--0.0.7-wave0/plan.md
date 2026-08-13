# Plan — scaffold-generated-output-correctness

## Status

**DESIGN LOCKED; IMPLEMENTATION BLOCKED.** Research is complete and proves a substantive separate
PLAN-EVAL is required. The evaluator may run only after the orchestrator/coordinator resolves the
two frozen-boundary gaps below. No product source edit is authorized in the meantime.

## Frozen boundary

Own only #1262, #1263, and #1588 as one grouped leaf, on the exact file surfaces declared by
milestone `leaf-contracts.json`. Report drift before crossing that boundary. Preserve one shared
`scaffold.runtime` verdict.

## Locked design

### 1. Model-aware, truthful generated seed (#1262)

- Add one generator seam that emits either:
  - a typed, idempotent seed for the known generated model (`findFirst`, then `create` a
    representative row only when absent); or
  - an explicit no-model message for an empty schema, without claiming that rows were written.
- The generated model path uses the generated typed Prisma client/delegate and the scaffolded
  model's `name` field; no Prisma runtime metadata reflection, `any`, or raw SQL writes.
- Keep the template as the source asset and render the model-specific fragment through the
  generator. Test both concrete-model and empty-schema branches independently.

### 2. Defined missing-row behavior and preserved OpenAPI projection (#1263)

- Import the existing `notFound` contract helper into generated persistent and memory routers.
- Get-by-id translates a null record directly to `notFound`.
- Update/delete translate only Prisma's expected `P2025` missing-record condition at the handler
  boundary. Other failures continue to escape to the existing error system. This is race-safe and
  avoids a preflight read.
- Add generated-source/focused behavior tests for GET, PATCH, and DELETE missing rows.
- Assert the already-present 404 response remains projected in generated OpenAPI for all three
  operations. No redundant contract-layer change is planned.

### 3. Emit only the selected provider's connection logic (#1588)

- Make connection-helper generation provider-aware.
- SQLite runtime uses direct `SQLITE_URI ?? DATABASE_URL ?? file fallback` resolution, contains no
  PostgreSQL/MySQL/MSSQL parsers, and retains `PrismaLibSql` plus the generated typed client.
- PostgreSQL, MySQL, and MSSQL output each retains only its own normalization/parsing path.
- Apply the same provider selection to `prisma.config.ts`; tests generate all four engines and
  assert both required and forbidden symbols.

### 4. One existing acceptance path and one expensive verdict

- Extend the existing `verify-live-db-endpoint.ts` flow after database deploy/codegen/seed: verify a
  representative list row exists; a definitely missing ID returns a defined 404 for GET, PATCH, and
  DELETE; and OpenAPI projects 404 for those operations.
- Do not add a new root scaffold gate or sibling directory.
- After the explicit singleton lease, run exactly one full one-pass
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` for the grouped leaf. Preserve
  its JSON/domain report and follow it with the scoped read-only leak checker.

## Required boundary decision

The approved file list cannot express the locked design without crossing its boundary:

1. `packages/cli/src/kernel/templates/database/generate-prisma-config.ts` must select and pass the
   provider-specific helper fragment; the declared template has no conditional syntax.
2. Model-aware versus empty-schema seed output requires a generator-level conditional. The narrow
   requested surface is: `packages/cli/src/kernel/adapters/database/scaffolder.ts` plus a new
   `packages/cli/src/kernel/templates/database/generate-database-seed.ts` (and its focused test
   under the same templates directory).

The coordinator must issue a replacement/amended leaf contract naming these surfaces, or choose a
different acceptance-preserving design within the existing boundary. This implementation session
will not infer authority.

## Ordered reviewable slices

1. **Harness/bootstrap (this commit):** research, red-first evidence, design, plan, drift, and draft
   PR only.
2. **Provider-selected output (#1588):** focused generator tests red, provider-aware runtime and
   Prisma config emission, embedded-asset refresh.
3. **Truthful seed (#1262):** generator tests for model and empty schema, typed idempotent seed
   implementation, focused scaffold assertions.
4. **Defined 404 behavior (#1263):** persistent and memory templates plus focused source/behavior
   and OpenAPI regression tests.
5. **Shared acceptance:** extend the existing live DB endpoint verifier, then run cheap structured
   reporters and durable contract gates. No Aspire/Docker/runtime execution yet.
6. **Leased merge-readiness:** exactly one shared `scaffold.runtime`, leak check, Tier-A review,
   opposite-family IMPL-EVAL, and coordinator handoff.

Each product slice is intended to stay below the harness reviewability threshold. If a slice grows
beyond that bound, stop and record drift rather than silently combining work.

## Gate family and receipts

Before expensive E2E:

- structured targeted Deno check, test, lint, and source-only fmt reporters;
- `check:assets-barrel` after regenerating embedded assets;
- durable `quality:gate` and `arch:check` receipts;
- applicable CLI JSR audit, `deno doc --lint`, and publish dry run, with durable JSON receipts;
- raw Git verification only for repository state, never as gate verdict evidence.

After explicit lease:

- exactly one full `scaffold.runtime --cleanup --format pretty` execution and its JSON/domain
  report;
- `agentic:leak-check -- --slice-dir
  .llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0 --worktree
  /home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness`;
- no separate per-issue runtime runs.

## Risk register

| Risk                                                 | Control                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| Seed becomes non-idempotent or lies on empty schemas | Typed `findFirst`/`create` branch plus explicit empty branch tests |
| Catch-all masks real Prisma failures                 | Narrow `P2025` guard; rethrow all other errors                     |
| SQLite trimming removes required adapter/client      | Positive assertions for `PrismaLibSql` and typed generated client  |
| Other engines lose required normalization            | Four-engine required/forbidden symbol matrix                       |
| Embedded asset mirror drifts                         | Repo-native generation plus `check:assets-barrel`                  |
| E2E directory debt deepens                           | Extend existing verifier; add no new gate sibling                  |
| Three issues receive inconsistent runtime evidence   | One leased grouped `scaffold.runtime` receipt only                 |

## Deferred scope

- General template-engine conditional syntax.
- Refactoring the over-cap scaffold E2E directory.
- Contract package changes for an OpenAPI defect that current main cannot reproduce.
- Seed fixtures for arbitrary user-edited schemas after initial scaffold.
- Dependency upgrades, public export changes, publication, merge, or milestone mutation.

## Plan gate

Decision: **PLAN-EVAL required**. The design is non-mechanical and crosses multiple generated
runtime/template seams. A fresh separate evaluator must review this plan after the boundary decision
and write `plan-eval.md`. Implementation may resume only on an unqualified PASS committed to this
branch; NEEDS_WORK returns to this same implementation thread for plan revision.
