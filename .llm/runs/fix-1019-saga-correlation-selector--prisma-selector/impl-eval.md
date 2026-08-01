# IMPL-EVAL — fix-1019-saga-correlation-selector--prisma-selector

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Issue: rickylabs/netscript#1019 · PR #1032 · Branch `fix/1019-saga-correlation-selector` · Head `95b1c048e` · Base `3ab64720f`

Every row below was re-executed by the evaluator in the worktree. Nothing is carried over from the
slice's own report.

## Diff actually inspected

| Commit | What it really does |
| --- | --- |
| `8b5675809` | Run artifacts only (plan/research/context/supervisor/worklog). No product code. |
| `5f3d0a9cf` | Harness bookkeeping only — the (superseded) blocked-evaluator drift note. |
| `2d3cff1dc` | Harness bookkeeping only — accepts the authorized PLAN-EVAL. |
| `95b1c048e` | The fix. `plugins/sagas/database/sagas.prisma` one line `name:` → `map:`; `prisma-saga-store.ts` introduces `SAGA_RUNTIME_CORRELATION_SELECTOR` and routes the delegate type and both call sites through it; `prisma-saga-store_test.ts` adds the ungated schema-derived guard and rewires the fake to the same constant; new `prisma-saga-store_integration_test.ts`. |

Product diff is confined to `plugins/sagas/database/sagas.prisma` (1 line) and
`packages/plugin-sagas-core/src/stores/` (store + 2 test files). No other package touched.

## Conditions from PLAN-EVAL

| Cond | Verdict | Evidence |
| --- | --- | --- |
| C1 — ungated, DB-free regression guard | **MET** | `prisma-saga-store_test.ts` "PrismaSagaStore selector is derived from the shipped schema fragment" reads `plugins/sagas/database/sagas.prisma`, parses the `@@unique`, and returns the explicit `name:` if present else `fields.join('_')`. Evaluator mutation-probe replayed the parser verbatim against both fragment variants: post-fix (`map:`) → `sagaId_correlationKey` (matches the constant, passes); pre-fix (`name:`) → `saga_runtime_correlation_saga_key` (mismatch, **fails**). The guard therefore genuinely catches a recurrence, with no DB and no env gate. |
| C2 — disclose deployed-database consequence | **MET** | PR body Direction section states the `db push` index drop/recreate on an already-provisioned 0.0.2 database. Evaluator confirmed the claim is factually right: after `db push`, `\d saga_runtime_correlation` shows `"saga_runtime_correlation_saga_key" UNIQUE, btree (saga_id, correlation_key)` — i.e. `map:` does rename the physical index away from Prisma's default. |
| C3 — trace for the latent sibling | **MET** | PR body records the unchanged `@@id([instanceId, version], name: "saga_runtime_transition_instance_version")` and states what a future compound-ID lookup must do. |

## Acceptance boxes (the ISSUE's boxes)

| Box | Verdict | Evidence |
| --- | --- | --- |
| The store's selector and the shipped schema fragment agree. | **MET** | One constant now drives the delegate type, both production call sites, and the fake; the fragment generates that same key. Evaluator confirmed via live `prisma generate` inside the round-trip run. |
| A real Prisma saga-store round-trip test runs against the **shipped** fragment (not a hand-written test schema) and passes. | **MET** | Evaluator ran it independently against a throwaway `postgres:18.3`: real `db push` ("Your database is now in sync with your Prisma schema"), real `Generated Prisma Client (7.8.0)`, then `1 passed, 0 failed`. The wrapper reads the shipped fragment with `Deno.readTextFile` and prepends only generator/datasource blocks — the models are never retyped, which is exactly the failure mode the issue named. |

## Gates re-run by the evaluator

| Gate | Command | Result |
| --- | --- | --- |
| scoped check | `run-deno-check.ts --root packages/plugin-sagas-core --root plugins/sagas --ext ts` | PASS — 178 files, 0 findings |
| scoped lint | `run-deno-lint.ts` same roots | PASS — 178 files, 0 findings |
| scoped fmt | `run-deno-fmt.ts` same roots `--ignore-line-endings` | PASS — 0 findings |
| scoped tests | `deno test --allow-all packages/plugin-sagas-core/ plugins/sagas/` | PASS — 84 passed, 0 failed, 1 ignored (the live test, correctly gated) |
| live round-trip | integration test with `SAGA_PRISMA_TEST_DATABASE_URL` against real Postgres 18.3 | PASS — 1 passed, 0 failed |
| publish surface | `deno publish --dry-run --allow-dirty` in `packages/plugin-sagas-core` | PASS — "Dry run complete"; no slow-type finding from the computed property key |

CLI E2E deliberately not run: the change touches no scaffold output, plugin scaffolding, DB wiring or
Aspire helper generation.

## Public surface

No entrypoint change. `SAGA_RUNTIME_CORRELATION_SELECTOR` is exported from the module file but is
**not** re-exported by `src/stores/mod.ts`, so it is unreachable through any `exports` map entry. The
publicly exported `SagaRuntimeCorrelationDelegate` changed spelling only — the computed key resolves
to the identical literal `sagaId_correlationKey`, so the resolved type is unchanged and the JSR
dry-run confirms it. Both new test files are excluded from publish by `**/*_test.ts`, so the
`npm:@prisma/adapter-pg` import and the monorepo-relative fragment path never ship.

## Residual notes (non-blocking)

- `shippedSagaSchemaPath()` and the integration wrapper resolve the fragment with `new URL(...).pathname`,
  which yields a leading-slash drive path on Windows. Both callers are test-only and excluded from
  publish, and CI is Linux, so this cannot affect consumers; `fromFileUrl` would be the portable form
  if these are ever run on Windows.
- The sibling transition `@@id` remains on `name:` by design (D2), now disclosed rather than silent.

## Verdict

**PASS.**

The fix is minimal and correct, the mechanism — not just the instance — is now guarded in CI, and
both acceptance boxes are evidenced by the evaluator's own execution rather than the slice's report.
