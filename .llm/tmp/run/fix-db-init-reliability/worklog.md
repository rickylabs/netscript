# Worklog — db-init reliability

## Design

- Public surface:
  - `netscript db init --project-root <project> --db <target> --name <migration>`.
  - Existing `@netscript/database/scripts` exports: `runMigration`, `runMigrationCli`, `runPrismaWithRetry`, `isRetriableMigrationFailure`.
- Domain vocabulary:
  - `MigrationOptions`, `PrismaInvocation`, `PrismaSpawnResult`, `PrismaSpawn`, `RunPrismaWithRetryOptions`.
  - Transient schema-engine/process lifecycle failure versus non-transient schema/database failure.
  - DB CLI target, Aspire executable resource, Prisma migration operation.
- Ports:
  - Existing injectable `PrismaSpawn` and `sleep` seams are the test seams for retry policy.
  - Existing `AspireCommandExecutor` seam remains the CLI operation runner test seam if CLI changes are needed.
- Constants:
  - Retry attempt budget and backoff.
  - Transient signature patterns.
  - Gate IDs: `database.init`, `scaffold.runtime`.
- Commit slices:
  1. Harness research/plan.
  2. Migration retry/readiness fix.
  3. Optional CLI/generated wiring fix if required by evidence.
  4. Runtime evidence and debt closure.
- Deferred scope:
  - No CLI prod-scaffold fixes.
  - No broad package restructuring.
- Contributor path:
  - Start at `packages/database/scripts/migrate.ts` for Prisma retry/readiness policy.
  - Read `packages/database/tests/migrate-retry_test.ts` for classifier and retry behavior.
  - If the failure is upstream of Prisma invocation, read `packages/cli/src/kernel/templates/aspire/helpers/generate-db-cli-mode.ts` and `packages/cli/src/kernel/adapters/database/operation-runner.ts`.

## Evidence

| Time | Step | Result | Notes |
| --- | --- | --- | --- |
| 2026-06-26 | Bootstrap | PASS | Required skills and doctrine/harness files read. |
| 2026-06-26 | Static research | PASS | Existing retry and db-init command path inspected. |
| 2026-06-26 | PLAN-EVAL #1 | FAIL_PLAN | Open decisions, concrete slices, full gate set, and JSR planned-surface scan needed tightening. |
| 2026-06-26 | Full scaffold runtime baseline | DB INIT PASS / SUITE FAIL LATER | `database.init` passed in 31297ms; `database.generate` and `database.seed` passed; suite failed later at `runtime.aspire-start` exit 2. |
| 2026-06-26 | PLAN-EVAL #2 | FAIL_PLAN | Remaining blocker: gate set omitted explicit Archetype 2 gates F-4/F-6/F-7/F-9/F-17 and conditional publish/doc posture. |
| 2026-06-26 | PLAN-EVAL #3 | FAIL_PLAN | Remaining blocker: gate set omitted explicit Archetype 2 F-14 console-log lint posture. |
| 2026-06-26 | PLAN-EVAL pass | PASS | Final approved plan gates recorded in `plan-eval.md`; implementation started after PASS. |
| 2026-06-26 | Root cause classification | TRANSIENT PRISMA ENGINE LIFECYCLE | Captured prior source is Prisma `schema-engine-windows.exe cli can-connect-to-database` emitting `ERR_STREAM_PREMATURE_CLOSE` / `Premature close` / `Schema engine exited` after Aspire waited for Postgres/database resources to become healthy and ready. Residual local reproduction also showed `database.init` timing out after 309069ms with `Error: Timed out waiting for Aspire resource prisma-init-postgres to complete.` That timeout was proof-run contaminated by concurrent leftover Aspire AppHosts holding fixed dashboard port `18891`, but it exposed the missing guard: a hung non-interactive Prisma child could leave the Aspire executable non-terminal until the outer operation timeout. |
| 2026-06-26 | Implementation | DONE | Repaired `packages/database/scripts/migrate.ts`: widened the evidenced schema-engine command signature, added a bounded non-interactive child timeout that emits a classifier-owned transient diagnostic, set a 5-attempt budget with capped exponential backoff, kills hung non-interactive Prisma children after 45000ms, and logs explicit retry/exhaustion diagnostics. Interactive Prisma runs still execute once and are not retried. No test-layer retry added. |
| 2026-06-26 | Supervisor steering | RECORDED | Do not use Deno test retries. Use `deno test --repeats=N --fail-fast` only as focused reproduction/proof; full `scaffold.runtime` still loops through shell. |
| 2026-06-26 | IMPL-EVAL #1 | FAIL_FIX | Evaluator found standalone `Schema engine exited` overmatched the approved transient predicate. Classifier was narrowed so schema-engine exits retry only when coupled with the evidenced `schema-engine ... cli can-connect-to-database` lifecycle command, while explicit premature-close markers and the script-owned timeout diagnostic remain retriable. Negative test added for unrelated `Schema engine exited.` |
| 2026-06-26 | IMPL-EVAL #2 | PASS | Separate evaluator reran focused/static/public checks and accepted the narrowed predicate, timeout/backoff behavior, no test-layer retry, no-new-casts scan, and runtime proof artifacts. |

## Reproduction Runs

| Run | Command | Exit | Signature |
| --- | --- | --- | --- |
| 1 | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 1 | `database.init` passed. Suite failed later at `runtime.aspire-start` with Aspire exit 2; unrelated to db-init. |
| 2 | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 0 | Full suite passed, `Summary: passed=47 failed=0`; `database.init` passed in ~30.6s. |
| 3 | Loop run 2 of `for i in 2 3 4 5; do rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty || exit $?; done` | 1 | Residual flake captured: `database.init` failed after 309069ms with stderr `Error: Timed out waiting for Aspire resource prisma-init-postgres to complete.` |
| Proof 1 | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 0 | `Summary: passed=47 failed=0`; `database.init` passed in 30857ms. |
| Proof 2 | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 0 | `Summary: passed=47 failed=0`; `database.init` passed in 33324ms. |
| Proof 3 | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 0 | `Summary: passed=47 failed=0`; `database.init` passed in 32995ms. |
| Proof 4 | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 0 | `Summary: passed=47 failed=0`; `database.init` passed in 36449ms. |
| Proof 5 | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 0 | `Summary: passed=47 failed=0`; `database.init` passed in 33083ms. |
| 4 | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 1 | After fix: `database.init` passed in 51293ms, `database.generate` passed, `database.seed` passed; suite failed later at `runtime.aspire-start` exit 2 with discarded detached AppHost diagnostics. |
| 5 | Focused generated-project `db init` loop | 0 | Five focused `db init` runs passed: `db-init-loop-1.log`, `db-init-loop-2.log`, `db-init-loop-3.log`, `db-init-loop-4-final.log`, `db-init-loop-5-final.log`; each reached `Applying migration ...` and `db init completed successfully.` |

## Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused retry test | PASS | `deno test --allow-all packages/database/tests/migrate-retry_test.ts` — 2 tests / 8 steps passed. |
| Focused repeat proof | PASS | `deno test --allow-all --repeats=100 --fail-fast packages/database/tests/migrate-retry_test.ts` — 100 repeats passed, no flaky marker/failure. |
| Scoped check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/database --ext ts,tsx` — 20 files selected, 0 findings. |
| Scoped lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/database --ext ts,tsx` — 20 files selected, 0 findings. |
| Scoped fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/database --ext ts,tsx` — 20 files selected, 0 findings. |
| Public surface doc | PASS | `deno doc packages/database/scripts/mod.ts` rendered the updated `MigrationOptions` / retry option docs. |
| Script doc lint | PASS | `deno doc --lint packages/database/scripts/mod.ts` — `Checked 1 file`. |
| Publish dry-run | PASS | `deno publish --dry-run --allow-dirty` from `packages/database` — dry run complete, no slow-type failure. |
| Full scaffold runtime proof | PASS | Five consecutive `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` runs passed with `Summary: passed=47 failed=0`; db-init durations: 30857ms, 33324ms, 32995ms, 36449ms, 33083ms. |
| Fitness evidence | PASS | LOC: `migrate.ts` 373, `migrate-retry_test.ts` 198. No touched classes/extends. Only existing `console.log.bind(console)` remains as CLI/script edge reporter; no new `console.*` added. |
| Focused db-init proof | PASS | Five generated-project `db init` runs passed with no db-init failures; Aspire ports were clear afterward (`aspire ps` returned `[]`). |
| Architecture gate | FAIL / PRE-EXISTING | `deno task arch:check` still fails before doctrine fitness on pre-existing `DEPS-JSR-CENTRALIZATION` drift for `@netscript/aspire` and `@netscript/plugin` ranges; this slice does not edit dependency declarations. |
