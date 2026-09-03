# Plan — scaffold-generated-output-correctness

## Status

**PLAN-EVAL CYCLE 2 PASS; IMPLEMENTATION ACTIVE THROUGH SLICE 5.** Research is complete and the
design remains binding. Coordinator comment `5286194892` authorizes the exact generator/scaffolder
seams below, and evaluator commit `b8fc5eb53a530d337602f7dc377239651a57d428` records cycle-2
`PASS` against evaluated head `5b3c6fcf21b0b4947a770d8e67ea5cc8082724d5`. Slices 2–5 may
proceed in order. Slice 6 remains prohibited until the singleton expensive-gate lease is granted.

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
  generator. Test both concrete-model and empty-schema branches independently. The empty-schema
  branch is a **generator-level direct-call contract**: its input is an omitted optional
  `modelName` when calling `generateDatabaseSeed` directly. It is not scaffold-level behavior,
  because `DatabaseScaffolder` resolves `options.modelName ?? 'ExampleRecord'` and therefore always
  exercises the concrete-model branch.
- Acceptance item 3 is verified-by-inspection in scope: `docs/site/data-persistence/database.md`
  already describes `netscript db seed` as populating "baseline rows." No docs edit is required;
  the implementation makes that existing tutorial claim truthful, and the one shared runtime
  acceptance later verifies the generated behavior.

### 2. Defined missing-row behavior and preserved OpenAPI projection (#1263)

- Import the existing `notFound` contract helper into the generated persistent router only.
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

## Authorized boundary amendment

Research established that the original file list could not express the locked design. Coordinator
comment `5286194892` authorizes the generator/scaffolder amendment. Combined with the original
asset/template and `packages/cli/e2e` surfaces, the exact planned product files are:

- `packages/cli/src/kernel/assets/database/connection-helpers.ts.template`;
- `packages/cli/src/kernel/assets/database/seed.ts.template`;
- `packages/cli/src/kernel/assets/generated/database/generate-prisma-config-1.ts.template`;
- `packages/cli/src/kernel/assets/service/routers/v1.ts.template`;
- `packages/cli/src/kernel/assets/embedded.generated.ts`;
- `packages/cli/src/kernel/adapters/database/scaffolder.ts`;
- `packages/cli/src/kernel/adapters/database/scaffolder_test.ts`;
- `packages/cli/src/kernel/templates/database/database-generators.ts`;
- new `packages/cli/src/kernel/templates/database/generate-database-seed.ts`;
- new `packages/cli/src/kernel/templates/database/generate-database-seed_test.ts`;
- `packages/cli/src/kernel/templates/database/generate-engine-mod.ts`;
- `packages/cli/src/kernel/templates/database/generate-prisma-config.ts`;
- `packages/cli/src/kernel/templates/database/generators_test.ts`;
- new `packages/cli/e2e/tests/application/gates/generated-router-template_test.ts`;
- `packages/cli/e2e/src/application/gates/scaffold/verify-live-db-endpoint.ts`; and
- `packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts`.

Every product file above is covered by the amended `leaf-contracts.json` `fileSurfaces`. The
amendment does not authorize contract-package changes: the already-green #1263 OpenAPI projection
is preserved through regression coverage only. The memory showcase template is intentionally not
in this implementation list. No implementation begins until PLAN-EVAL PASS.

## Open decisions

No unresolved **must resolve now** decision remains.

| ID   | Disposition   | Decision                                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OD-1 | resolved now  | **Option (b), out of scope.** Remove memory routers from #1263's locked design and slice 4. `contract.memory.ts.template` has no error map and `v1.memory.ts.template` exposes no CRUD by-id surface; prescribing Prisma `P2025` translation there would be false. The memory template is deferred rather than edited.                                                                                  |
| OD-2 | resolved now  | The empty-schema seed branch is a generator-level contract driven by a direct `generateDatabaseSeed` call with no `modelName`; its focused direct-call test proves the truthful no-model output. `DatabaseScaffolder` always supplies `options.modelName ?? 'ExampleRecord'`, so the branch is not claimed as scaffold-level behavior.                                                             |
| OD-3 | safe to defer | Whether provider selection is represented as split provider assets or extracted generator fragments. Either mechanism remains within the exact file boundary, must emit byte-stable selected-provider output, and is judged by the same four-engine required/forbidden-symbol matrix. The implementer may choose the smaller mechanism without changing public behavior, slice order, or gates. |

## Ordered reviewable slices

1. **Harness/bootstrap (this commit):** research, red-first evidence, design, plan, drift, and draft
   PR only.
2. **Provider-selected output (#1588).**
   - **Proves:** all four engines emit only their selected URL/normalization path; SQLite retains
     direct `SQLITE_URI ?? DATABASE_URL ?? file fallback`, `PrismaLibSql`, and the generated typed
     client in both engine module and Prisma config output.
   - **Decisive gate:** one structured focused test invocation:
     `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all
     packages/cli/src/kernel/templates/database/generators_test.ts`.
   - **Files:**
     `packages/cli/src/kernel/assets/database/connection-helpers.ts.template`,
     `packages/cli/src/kernel/assets/generated/database/generate-prisma-config-1.ts.template`,
     `packages/cli/src/kernel/templates/database/generate-engine-mod.ts`,
     `packages/cli/src/kernel/templates/database/generate-prisma-config.ts`,
     `packages/cli/src/kernel/templates/database/generators_test.ts`, and
     `packages/cli/src/kernel/assets/embedded.generated.ts`.
3. **Truthful seed (#1262).**
   - **Proves:** the known model produces a typed idempotent representative row, the direct
     generator call with no `modelName` produces a truthful no-model message, and normal scaffolding
     continues to pass its resolved model name.
   - **Decisive gate:** one structured focused test invocation:
     `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all
     packages/cli/src/kernel/templates/database/generate-database-seed_test.ts
     packages/cli/src/kernel/adapters/database/scaffolder_test.ts`.
   - **Files:** `packages/cli/src/kernel/assets/database/seed.ts.template`,
     `packages/cli/src/kernel/templates/database/generate-database-seed.ts`,
     `packages/cli/src/kernel/templates/database/generate-database-seed_test.ts`,
     `packages/cli/src/kernel/templates/database/database-generators.ts`,
     `packages/cli/src/kernel/adapters/database/scaffolder.ts`,
     `packages/cli/src/kernel/adapters/database/scaffolder_test.ts`, and
     `packages/cli/src/kernel/assets/embedded.generated.ts`.
4. **Defined persistent-router 404 behavior (#1263).**
   - **Proves:** generated persistent GET-by-id maps a null row to the contract's defined
     `NOT_FOUND`; PATCH/DELETE translate only Prisma `P2025`; other errors escape; and the already
     present OpenAPI 404 declarations remain in the generated template for all three operations.
   - **Decisive gate:** one structured focused test invocation:
     `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all
     packages/cli/e2e/tests/application/gates/generated-router-template_test.ts`.
   - **Files:** `packages/cli/src/kernel/assets/service/routers/v1.ts.template`,
     `packages/cli/e2e/tests/application/gates/generated-router-template_test.ts`, and
     `packages/cli/src/kernel/assets/embedded.generated.ts`.
5. **Shared grouped acceptance preparation (#1262, #1263).**
   - **Proves:** the existing verifier is ready to check a seeded representative list row, missing
     GET/PATCH/DELETE defined 404s, and their OpenAPI projection in the one later runtime execution.
     Cheap structured check/test/lint/fmt, asset freshness, `quality:gate`, `arch:check`, applicable
     JSR/doc-lint/publish-dry-run receipts are prerequisites, not substitutes for the runtime gate.
   - **Decisive gate:** one structured focused test invocation:
     `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all
     packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts`.
   - **Files:**
     `packages/cli/e2e/src/application/gates/scaffold/verify-live-db-endpoint.ts` and
     `packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts`.
6. **Leased merge-readiness.**
   - **Proves:** all three issues compose in a generated running project and consume exactly one
     shared runtime verdict, followed by exact resource-cleanup evidence, Tier-A review, mandatory
     opposite-family IMPL-EVAL, and coordinator handoff.
   - **Decisive gate:** after an explicit singleton lease only, exactly one
     `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, preserving its JSON/domain
     report as the grouped verdict.
   - **Files:** no additional product-source file is edited; this evidence-only commit updates
     `.llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0/worklog.md`,
     `.llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0/context-pack.md`,
     `.llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0/drift.md`, new
     `.llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0/receipts/scaffold-runtime.json`,
     and new
     `.llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0/receipts/leak-check.json`.

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
- The memory showcase router: its contract template carries no error map and its router has no CRUD
  by-id surface, so it is not a truthful target for #1263 or Prisma `P2025` translation.
- Seed fixtures for arbitrary user-edited schemas after initial scaffold.
- Dependency upgrades, public export changes, publication, merge, or milestone mutation.

## Plan gate

Decision: **PLAN-EVAL required and satisfied**. Cycle 1 recorded `FAIL_PLAN`; the same-thread repair
resolved its three binding findings. A fresh native opposite-family evaluator then recorded cycle-2
`PASS` in `plan-eval.md` at evaluator commit `b8fc5eb53a530d337602f7dc377239651a57d428`.
That verdict authorizes ordered implementation slices 2–5 only; it does not grant the singleton
lease required by slice 6 and does not replace Tier-A review or the mandatory IMPL-EVAL.
