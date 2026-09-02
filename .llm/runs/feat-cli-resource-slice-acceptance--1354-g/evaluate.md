# Evaluation: Slice G — consumer guidance and hosted acceptance hook (#1354, PR #1958)

**Verdict: FAIL_IMPL**

## Metadata

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Run ID         | `feat-cli-resource-slice-acceptance--1354-g`                                            |
| Target         | `packages/cli` (E2E suite definitions + app conventions template)                       |
| Archetype      | 6 — CLI tooling                                                                         |
| Scope overlays | none                                                                                    |
| Evaluator      | Claude (Fable 5.1) independent IMPL-EVAL session, 2026-09-03                            |
| Checkout       | `/home/agent/projects/netscript/worktrees/007-eval-1354-g` (detached, read-only)        |
| Base / HEAD    | `8c27ffe16` (Slice F evaluated head) → `6182a266c` (`97ad667cc` product, `6182a266c` docs) |
| Plan           | `origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md`, Slice G (ceiling 8, items 1–8 incl. the 2026-09-03 amendment) |

## Process Verification

| Check                                  | Result | Evidence                                                                                                          |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | Upstream plan PLAN-EVAL PASS; run records `PLAN-EVAL: N/A` (worklog.md:83, supervisor.md:25) before implementation |
| Design section exists in worklog       | PASS   | `## Design` with Public Surface / Domain Vocabulary / Ports / Constants / Commit Slices / Deferred Scope / Contributor Path |
| Commit slices match design plan        | PASS   | One product commit `97ad667cc` + one docs commit `6182a266c`                                                      |
| Touch set within ceiling               | PASS   | `git diff --stat 8c27ffe16 6182a266c`: exactly the 8 enumerated `packages/cli` files + 7 run artifacts; `deno.lock` diff = 0 lines; nothing else under `packages/` |
| No parallel suite / no split command   | PASS   | Both ids added to the existing `RUNTIME_GATES`; no new suite id; `scaffold.runtime` command unchanged             |
| Item 8 scope                           | PASS   | `suite-runner_test.ts` diff is +2 lines: only the nominal fake's stdout branch for `generate`+`resource`           |
| Constants used for finite vocabularies | PASS   | Gate ids live in `GATE` (`cli-surface.ts:74-75`); guidance is a single `RESOURCE_GENERATION_GUIDANCE` constant     |

## Static Gates (run from the eval checkout, `TMPDIR=$HOME/tmp`)

| Gate                         | Command                                                                                                       | Result | Evidence                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| CLI typecheck                | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx`             | PASS   | exit 0; 980 files, 9 batches, 0 failed, 0 diagnostics       |
| Touched tests                | `run-deno-test.ts -- --allow-all resource-slice-gates_test.ts agent-conventions_test.ts suite-runner_test.ts` | PASS   | exit 0; 15 passed / 0 failed                               |
| Full `packages/cli` unit suite | `run-deno-test.ts -- --allow-all packages/cli`                                                              | PASS   | exit 0; 1716 passed / 0 failed / 0 ignored                 |
| Lint (8 touched files)       | `deno lint <8 files>`                                                                                         | PASS   | exit 0                                                     |
| Format (8 touched files)     | `deno fmt --check <8 files>`                                                                                  | PASS   | exit 0                                                     |
| Assets barrel                | `deno task check:assets-barrel`                                                                               | PASS   | exit 0                                                     |
| Publish assets               | `deno task check:publish-assets`                                                                              | PASS   | exit 0                                                     |
| Architecture                 | `deno task arch:check`                                                                                        | PASS   | exit 0 (pre-existing A13/A3 WARNs only, none in touched files) |
| Quality gate                 | `deno task quality:gate`                                                                                      | PASS   | exit 0; `"ok":true`, 37 members, 0 uncovered               |
| README fences                | `deno task docs:readme-fences`                                                                                | PASS   | exit 0; `PASS readmes=36 fences=169 checked=74`             |
| JSDoc examples               | `deno task docs:jsdoc-examples`                                                                               | PASS   | exit 0; `deferredCensus={"unboundName":116,"typeError":14}` (≤116 ceiling held) |

## Plan-item verification

| Item | Check                                                                                                     | Result | Evidence |
| ---- | --------------------------------------------------------------------------------------------------------- | ------ | -------- |
| 1    | Stable ids `scaffold.resource-generate` / `scaffold.resource-rerun` in `GATE`                             | PASS   | `packages/cli/e2e/src/domain/cli-surface.ts:74-75` |
| 2    | Gate factory: verb after init's generated client, `--partial`, rerun stdout asserts skip-only summary      | FAIL   | Command array is correct (`generate resource users --client users --procedure list --partial --app <app>`, `outputMode: 'capture'`, rerun `stdoutIncludes: ['Resource slice applied: 0 written, 11 skipped, 0 conflicts.']`), but the chosen resource name and the runtime position make the first-run gate fail on a stock init project — see Findings 1 and 2 |
| 3    | Test pins exact arrays, order, client/procedure, partial, stdout                                            | PASS (weak) | `resource-slice-gates_test.ts:12-47`; ordering assertion covers `service-client-generate < first-run` but not `database.codegen` (Finding 1) |
| 4    | Composition in `scaffold-gates.ts` after init/service discovery, before generated quality/type-check        | PASS   | `scaffold-gates.ts:148` (after `SERVICE_LIST`, before `CONTRACT_ADD`); note composition order is not execution order — `RUNTIME_GATES` order is (`capability-suites.ts:293-307`) |
| 5    | Both ids in `RUNTIME_GATES` + direct reachability assertion                                                | PASS   | `capability-suites.ts:69-70` (export added for the test); `resource-slice-gates_test.ts:60-79` resolves `scaffold.runtime` and asserts both ids reachable before `generated.quality-negative` / `generated.deno-check` |
| 6    | `agent-conventions.ts` points `AGENTS.md` and `WEB-LAYER.md` one-screen guidance to `generate resource`    | PASS   | `agent-conventions.ts:52-53,150,188`; guidance precedes the numbered manual steps in both renders |
| 7    | New `agent-conventions_test.ts` covers rendered text and referenced paths                                   | PASS   | 3 tests; referenced paths resolve on this head via the pre-existing `public-command-tree_test.ts:444-460` stat check (full suite green) |
| 8    | Suite-runner nominal fake emits the rerun output; nothing else                                              | PASS   | `suite-runner_test.ts:124-125` (+2 lines only) |

## Runtime Gates

Not run (Aspire/Docker/browser/`e2e:cli` prohibited for this lane). To validate the gate definition
independently without the hosted lane, the evaluator scaffolded a stock init project in
`$HOME/tmp` with the same init flags the suite uses (`--service --service-name users`, `--db sqlite`,
`--cache=false`) and executed the exact gate command with the CLI from this checkout. That is a plain
CLI invocation, not the runtime suite. Results:

| Step                                                                                        | Exit | Output |
| ------------------------------------------------------------------------------------------- | ---- | ------ |
| `netscript init ... --service --service-name users` + `service generate`                    | 0    | router.ts contains `users: generatedRoutes.examples.users.$route` |
| gate command **before** `db:generate` (the `RUNTIME_GATES` position)                       | 1    | `Error: Query procedure 'list' does not exist on client 'users'.` |
| `deno task db:generate` in `database/sqlite`                                                | 0    | `schema/.generated/zod/crud.ts` produced |
| gate command **after** `db:generate`                                                        | 1    | `Error: appRoutes.users already has another value.` |
| control: same command with resource `people` (first run)                                    | 0    | `Resource slice applied: 11 written, 0 skipped, 0 conflicts.` |
| control: same command with resource `people` (rerun)                                        | 0    | `Resource slice applied: 0 written, 11 skipped, 0 conflicts.` |

The control run confirms the `11 skipped` expectation is correct for `core+partial` (8 leaves + 2
Fresh-derived + `router.ts`) and that the rerun summary string matches the assertion exactly.

## Anti-Pattern Check

| AP        | Status | Notes |
| --------- | ------ | ----- |
| AP-1..25  | N/A / CLEAR | Slice adds E2E definitions, a template constant, and tests; `arch:check` reports no new violations in the touched files. |

## Arch-Debt Delta

| Metric                | Count |
| --------------------- | ----- |
| New entries           | 0     |
| Resolved entries      | 0     |
| Deepened violations   | 0     |
| Unrecorded violations | 0     |

## Findings

| # | Severity | Finding | Evidence | Required action |
| - | -------- | ------- | -------- | --------------- |
| 1 | **high** (blocks the hosted merge-readiness gate) | `scaffold.resource-generate` is sequenced in `RUNTIME_GATES` **before** `database.codegen`. The command's procedure resolution (`public-command-dependencies.ts:509-541`) `deno eval`-imports the selected client module, which imports `contracts/versions/v1/users.contract.ts` → `@database/zod` (`database/<engine>/schema/.generated/zod/crud.ts`). That file only exists after `database.codegen` (`RUNTIME_GATES` index 23; resource gates are at 6–7). On a stock suite project the first-run gate therefore fails with `Query procedure 'list' does not exist on client 'users'` (reproduced, exit 1). Execution order is the `RUNTIME_GATES` order (`capability-suites.ts:297`), not the `scaffold-gates.ts` composition order, and the existing `GENERATED_SERVICE_CLIENT_CONTRACT` probe is deliberately placed after `DATABASE_CODEGEN` for the same reason. | `packages/cli/e2e/suites/scaffold/capability-suites.ts:69-70` vs `:85`; repro above | **fix**: move both resource ids in `RUNTIME_GATES` to after `GATE.DATABASE_CODEGEN` (still before `RUNTIME_SERVICE_ENV_FIXTURE`/`GENERATED_QUALITY_NEGATIVE`, satisfying "before generated-project quality/type-check"), and extend the reachability test to assert `databaseCodegen < firstRun`. No file outside the ceiling is needed. |
| 2 | **high** (blocks the hosted merge-readiness gate) | The gate generates resource `users` with the default route `/users`, so `routeAlias` = `users` and the router requirement is `users: generatedRoutes.users.$route`. The suite's init (`--service-name users`) already emits `users: generatedRoutes.examples.users.$route` (`write-app-files.ts:48-52`), so `reconcileAppRoutes` (`reconcile-app-routes.ts:46-55`) returns `appRoutes.users already has another value.` and `transformSharedSources` throws (`generate-resource.ts:219`) → exit 1, zero writes. Reproduced after codegen. A different resource name (control: `people`) produces the expected `11 written` then `0 written, 11 skipped`. | `packages/cli/e2e/src/application/gates/scaffold/resource-slice-gates.ts:7` (`RESOURCE_NAME = 'users'`); repro above | **fix**: choose a resource name that does not collide with the init example alias (e.g. `people`, keeping `--client users --procedure list`), or pass an explicit non-colliding `--route`; update `EXPECTED_COMMAND` in `resource-slice-gates_test.ts:12-26`. Within the ceiling. |
| 3 | low | The reachability test asserts ordering relative to `scaffold.service-client-generate` only; it does not encode the real prerequisite (`database.codegen`), which is why Finding 1 passed the author lane. | `resource-slice-gates_test.ts:69-78` | fold into the Finding 1 fix |
| 4 | low | `worklog.md` "Runtime Gates" records the hosted prohibition correctly, but the design did not trace the command's runtime prerequisites (db codegen, router alias namespace) before placing the gate. | `worklog.md:122-127` | record in `drift.md` with the fix |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Suite placement must follow the command's runtime prerequisites, not the composition file | When adding a gate that shells out to a CLI verb, trace what that verb dynamically imports/evaluates and place it after the gates that materialize those inputs; `RUNTIME_GATES` order is the executed order, `scaffold-gates.ts` order is not | Archetype 6 / E2E suite authors | high |
| A cheap local CLI repro catches hosted-only failures | Running the exact gate command on a stock `init` project (no Aspire/Docker) is enough to falsify a gate definition before spending a hosted `scaffold.runtime` run | Archetype 6 | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | **FAIL_IMPL** (harness class: `FAIL_FIX`, cycle 1 of 2) |
| Rationale | All author-lane gates are green (check 0/980 files, 15/15 touched tests, 1716/1716 CLI suite, arch/quality/assets/publish/readme/jsdoc all exit 0; touch set exactly the 8 enumerated files; item 8 minimal; guidance and reachability tests correct). However the slice's purpose is a hosted acceptance hook, and the gate as defined cannot pass on the suite's own project: (1) it runs before `database.codegen`, so procedure resolution fails, and (2) resource `users` collides with init's `users` router alias, so even after codegen the first run exits 1 with zero writes. Both were reproduced with the exact command on a stock init project; the `people` control proves the `11 skipped` rerun expectation is otherwise correct. Both fixes fit inside the 8-file ceiling (`resource-slice-gates.ts`, its test, `capability-suites.ts`). |
