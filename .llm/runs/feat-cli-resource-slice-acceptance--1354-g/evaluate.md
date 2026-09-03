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

---

# Evaluation cycle 2: Slice G — consumer guidance and hosted acceptance hook (#1354, PR #1958)

**Verdict: PASS_IMPL**

## Metadata

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Cycle          | 2 of 2 (re-evaluation after cycle-1 `FAIL_IMPL`)                                        |
| Evaluator      | Claude (Fable 5.1) independent IMPL-EVAL session, 2026-09-03                            |
| Checkout       | `/home/agent/projects/netscript/worktrees/007-eval-1354-g` (detached, read-only)        |
| Base / HEAD    | `8c27ffe16` → `178df1726` (`fix(cli): sequence resource acceptance after codegen`, final head; author worker exited) |
| Fix touch set  | `resource-slice-gates.ts`, `resource-slice-gates_test.ts`, `scaffold-gates.ts`, `capability-suites.ts` + run artifacts (`worklog.md`, `drift.md`, `context-pack.md`) |

## Process Verification

| Check                                   | Result | Evidence |
| --------------------------------------- | ------ | -------- |
| Touch set still ⊆ the 8 enumerated files | PASS  | `git diff --stat 8c27ffe16 HEAD -- . ':!.llm'`: exactly the 8 `packages/cli` files (273+/1−); nothing else under `packages/` or `plugins/` |
| `deno.lock` unchanged                   | PASS   | `git diff 8c27ffe16 HEAD -- deno.lock | wc -l` = 0 |
| Fix commit scope                        | PASS   | `git show 178df1726 --stat`: 4 product files (all inside the ceiling) + 3 run artifacts |
| Cycle-1 Finding 1 (sequencing)          | FIXED  | `capability-suites.ts:83-86`: `DATABASE_CODEGEN`, `GENERATED_SERVICE_CLIENT_CONTRACT`, `SCAFFOLD_RESOURCE_GENERATE`, `SCAFFOLD_RESOURCE_RERUN`, then `BEHAVIOR_PROJECT_BOUNDARY_DEV` … `GENERATED_QUALITY_NEGATIVE`/`GENERATED_DENO_CHECK` later — both ids after codegen and before generated quality/type-check |
| Cycle-1 Finding 2 (name collision)      | FIXED  | `resource-slice-gates.ts:7` `RESOURCE_NAME = 'people'`; `--client users --procedure list --partial` retained |
| Cycle-1 Finding 3 (test prerequisite)   | FIXED  | `resource-slice-gates_test.ts:74-80` asserts `selectedDatabaseCodegen < selectedFirstRun` on `RUNTIME_GATES` directly and `:83-96` asserts `databaseCodegen < firstRun`, `rerun < generatedQuality`, `rerun < generatedCheck` on the resolved `scaffold.runtime` suite |
| Composition mirrors selected order      | PASS   | `scaffold-gates.ts:119-135`: `...createResourceSliceGates()` now directly follows the `GENERATED_SERVICE_CLIENT_CONTRACT` gate; test `:51-62` pins `firstRun == serviceClientContract + 1`, `rerun == firstRun + 1` |
| Codegen→contract adjacency preserved    | PASS   | `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts:917-918` still holds (that file is outside the ceiling and was not touched); drift.md records why the pair sits after the probe rather than between codegen and probe |
| `EXPECTED_COMMAND` / item 8 consistency | PASS   | `resource-slice-gates_test.ts:12-28` = `generate resource people --client users --procedure list --partial --app prod-local-test-web`; `EXPECTED_RERUN_STDOUT` and the suite-runner fake (`suite-runner_test.ts:124-125`, matches on `generate`+`resource`, name-agnostic) both emit `Resource slice applied: 0 written, 11 skipped, 0 conflicts.` |
| Cycle-1 Finding 4 (drift record)        | PASS   | `drift.md` "IMPL-EVAL cycle 1 exposed untraced runtime prerequisites" records both failures verbatim, the fix, and the design-time lesson; a further entry records the adjacency constraint discovered during the cycle-2 edit |

## Static Gates (eval checkout, `TMPDIR=$HOME/tmp`, all run fresh on `178df1726`)

| Gate                            | Command                                                                                                                  | Exit | Evidence |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---- | -------- |
| CLI typecheck                   | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx`                        | 0    | 980 files, 9 batches, 0 failed, 0 diagnostics |
| Touched tests (+ adjacency test) | `run-deno-test.ts -- --allow-all resource-slice-gates_test.ts agent-conventions_test.ts suite-runner_test.ts service-client-runtime-probe_test.ts` | 0 | 40 passed / 0 failed |
| Full `packages/cli` suite       | `run-deno-test.ts -- --allow-all packages/cli`                                                                           | 0    | 1716 passed / 0 failed / 0 ignored (78.9 s) |
| Lint (4 fix files)              | `deno lint <4 files>`                                                                                                    | 0    | Checked 4 files |
| Format (4 fix files)            | `deno fmt --check <4 files>`                                                                                             | 0    | Checked 4 files |
| Assets barrel                   | `deno task check:assets-barrel`                                                                                          | 0    | |
| Publish assets                  | `deno task check:publish-assets`                                                                                         | 0    | |
| Architecture                    | `deno task arch:check`                                                                                                   | 0    | pre-existing F-5/F-6 `export default` WARNs only, none in touched files |
| Quality gate                    | `deno task quality:gate`                                                                                                 | 0    | `"ok":true` |
| README fences                   | `deno task docs:readme-fences`                                                                                           | 0    | `PASS readmes=36 fences=169 checked=74` |
| JSDoc examples                  | `deno task docs:jsdoc-examples`                                                                                          | 0    | `deferredCensus={"unboundName":116,"typeError":14}` — ≤116 ceiling held |

## Runtime reproduction (same method as cycle 1; no Aspire/Docker/browser)

Stock project created under `$HOME/tmp/eval-g2` with the CLI from this checkout and the suite's exact init flags, then the suite's `database.codegen` step, then the exact gate commands.

| Step | Command (cwd)                                                                                                                       | Exit | Output |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| init | `netscript init evalg --path $HOME/tmp/eval-g2 --db sqlite --cache=false --service --service-name users --ci --yes --no-git --force` | 0 | |
| service generate | `netscript service generate --project-root <project>`                                                                      | 0    | `Wrote 0 Aspire helper files.` |
| database.codegen | `deno eval <STANDALONE_DATABASE_CODEGEN_SCRIPT> file:./sqlite.db SQLITE_URI` (cwd `database/sqlite`)                    | 0    | `schema/.generated/zod/crud.ts` produced |
| first-run gate | `netscript generate resource people --client users --procedure list --partial --app evalg-web` (cwd project root)          | 0    | 11 `WRITE` lines (`.generated/manifest.ts`, `.generated/routes.ts`, `router.ts` [shared] + 8 `routes/people/**` [absent]); **`Resource slice applied: 11 written, 0 skipped, 0 conflicts.`** |
| rerun gate | identical command                                                                                                              | 0    | 11 `SKIP` lines (3 `[shared]`, 8 `[exact]`); **`Resource slice applied: 0 written, 11 skipped, 0 conflicts.`** — exact match of `stdoutIncludes` (N = 11) |
| router check | `router.ts` after first run                                                                                                   | —    | `users: generatedRoutes.examples.users.$route` (init) and `people: generatedRoutes.people.$route` coexist; no alias collision |
| generated check (bonus) | `deno check --unstable-kv router.ts routes/people/index.tsx routes/people/index.route.ts` in `apps/evalg-web`     | 0    | generated slice type-checks with the stock init project |
| cleanup | `rm -rf $HOME/tmp/eval-g2`                                                                                                       | —    | directory absent afterwards |

## Anti-Pattern Check / Arch-Debt Delta

Unchanged from cycle 1: no new AP violations in the touched files; 0 new / 0 resolved / 0 deepened / 0 unrecorded debt entries.

## Findings

| # | Severity | Finding | Evidence | Required action |
| - | -------- | ------- | -------- | --------------- |
| — | none     | Both cycle-1 high findings and both low findings are resolved inside the 8-file ceiling; the exact gate commands now succeed on the suite's own stock project with the expected first-run and skip-only rerun summaries. | tables above | none |

Observation (not a finding): `scaffold-gates.ts` composition order is not the executed order for `scaffold.runtime` (which follows `RUNTIME_GATES`); the author mirrored both anyway and the tests pin both, so the two cannot silently diverge.

## Lessons for Promotion

Cycle-1 lessons stand (trace a shell-out gate's runtime prerequisites; a cheap stock-init CLI repro falsifies gate definitions before the hosted run). Cycle 2 adds: when re-sequencing gates, check existing adjacency assertions in tests outside the ceiling (`service-client-runtime-probe_test.ts:917`) before choosing the insertion point — drift.md records this correctly.

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | **PASS_IMPL** (cycle 2 of 2) |
| Rationale | Head `178df1726` keeps the touch set at exactly the 8 enumerated files with `deno.lock` unchanged; both resource gate ids now execute after `database.codegen` (immediately after the codegen-adjacent service-client probe) and before generated quality/type-check gates, mirrored in composition and pinned by tests; the resource name `people` no longer collides with init's `users` alias and `EXPECTED_COMMAND`/stdout expectation/item-8 fake agree. All author-lane gates are green (check 0/980, touched 40/40, CLI suite 1716/1716, lint/fmt/assets/publish/arch/quality/fences/jsdoc all exit 0, jsdoc deferred 116 ≤ 116). The exact first-run and rerun gate commands were reproduced on a stock init project after codegen: `11 written, 0 skipped, 0 conflicts` then `0 written, 11 skipped, 0 conflicts`, both exit 0; drift.md records both cycle-1 findings and the runtime-prerequisite design gap. Hosted `scaffold.runtime` proof remains the merge-readiness gate per the plan and is outside this lane. |

---

# Evaluation cycle 3: live-main merge readiness

**Verdict: PASS_IMPL** (lifecycle still awaits the independent isolated hosted runtime receipt)

## Evaluator identity and route

| Field | Value |
| ----- | ----- |
| Requested evaluator | Native Anthropic Claude, Fable 5 family, medium effort (`formal_impl_evaluation` primary route, `supervisor.md` route table) |
| Primary route attempt | **FAILED before an evaluation turn**: the fresh native Anthropic Fable 5 medium launch in session `885a699a-4550-4d38-a533-b16d91a763d1` failed with `unrecognized_model` / HTTP 404 |
| Observed evaluator (this session) | **Claude transport, OpenRouter provider, `z-ai/glm-5.3-flash`, effort `max`** — the lane-policy-approved fresh fallback session (`preset=claude-evaluator-glm-5-3-flash`, `condition=open_model_route`, `lane-policy.md:181`; fallback column of `formal_impl_evaluation`: "GLM 5.3 Flash · max for third opinion/native quota limit") |
| Fresh-session statement | This is a brand-new evaluator session, separate from the generator (Codex/GPT-5 author session per `supervisor.md`), separate from the cycle-1/2 evaluator sessions (`worktrees/007-eval-1354-g`), and it ran no implementation. The native Fable identity is **not** claimed; the fallback identity above is the observed route |
| Effort note | `max` is claimed only for this GLM 5.3 Flash OpenRouter session; the lane-policy capability table confirms this model returns a real reasoning trace and a verified agentic turn, so gate-running is genuine. No OpenHands run is involved and no `max`-effort claim is made for any OpenHands lane |

## Scope and prohibitions honored

Evaluation only. No product code modified, no commit, no push, no merge, no GitHub mutation (all GitHub reads via read-only `gh api`). The only new file in the worktree is gitignored scratch `.llm/tmp/eval-1354-g-noexclude.json` (the no-exclusion lint/fmt config used for evidence). The only mutation to tracked files is this appended cycle-3 receipt; it is **uncommitted** by design — the author/coordinator lane commits run artifacts.

## Exact state (all verified live)

| Field | Required | Observed | Result |
| ----- | -------- | -------- | ------ |
| Branch | `feat/cli-resource-slice-acceptance` | same | PASS |
| Evidence HEAD | `0cc736365c1a3886129920e8599d9e61895a40f0` | same (`git rev-parse HEAD`) | PASS |
| Product HEAD | `a2366577fd8232c8e08e078b03d1e3cc84793b92` | same (evidence commit's sole parent) | PASS |
| Merged main baseline | `e14322c511bbf26018c617c12f639474b6092c32` | same, and equals current `origin/main` | PASS |
| Main merge commit | `008d3264c5352abf6d1e3798d580550ec98e7e7c` | same | PASS |
| Working tree | clean | clean (run-dir receipt excluded) | PASS |

## Process verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| PLAN-EVAL disposition | PASS | `PLAN-EVAL: N/A` recorded before implementation with owner justification (`supervisor.md:25`, `worklog.md` Decisions) |
| Design checkpoint | PASS | `worklog.md` `## Design` carries surface, domain vocabulary, ports, constants, command/composition contract, commit slices, deferred scope, contributor path (Archetype-6 expectations) |
| Slice/commit trail | PASS | Product commits `97ad667cc` (S1) → `178df1726` (cycle-2 fix) → `008d3264c` (main merge) → `a2366577f` (live-main ordering fix) → `0cc736365` (evidence); each recorded in `worklog.md` Progress Log with named gates |
| Generator ≠ evaluator | PASS | Author = Codex/GPT-5 session (`supervisor.md`); cycles 1–2 evaluated in separate sessions/worktrees; this cycle is a fresh third session |
| Evaluator route recorded | PASS | Requested native Fable 5 medium + failed primary + observed GLM 5.3 Flash max fallback recorded in this receipt (above) |
| PR surface honest | PASS | PR #1958 open, non-draft, base `main`, head `0cc736365`; labels exactly one `status:` (`status:impl-eval`), milestone `0.0.7`; DoD leaves the two genuinely-pending boxes **unchecked**; body uses `Refs #1354` without a closing keyword (correct — full resolution not yet proven); body's lock SHA claim matches `sha256sum deno.lock` = `6c8f90a26375dcc0cec969f01e5bfb9e474216adb10f1cfbf68df5edab6b94d6` |

## Touch-set, ceiling, and lock checks (live-main delta `origin/main` → `a2366577`)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Eight-product-file ceiling | PASS | `git diff --name-status e14322c51 a2366577f -- packages/`: exactly 8 product paths — `resource-slice-gates.ts` (A), `resource-slice-gates_test.ts` (A), `scaffold-gates.ts` (M), `cli-surface.ts` (M), `capability-suites.ts` (M), `suite-runner_test.ts` (M), `agent-conventions.ts` (M), `agent-conventions_test.ts` (A). Nothing else under `packages/` or `plugins/` |
| `deno.lock` unchanged | PASS | `git diff e14322c51 a2366577f -- deno.lock` = 0 lines; SHA-256 `6c8f90a2…` matches the PR body claim |
| Merge preserved final Slice F, no rebase | PASS | Merge commit `008d3264c` has two parents (`8631b8386` branch head + `e14322c51` origin/main) — a true merge, no rebase; `origin/main` is an ancestor of HEAD; the main→product delta touches **no** Slice F file, so main's final Slice F content is byte-preserved |
| Run artifacts outside product ceiling | PASS | Only `.llm/runs/feat-cli-resource-slice-acceptance--1354-g/*` added besides product files (9 files incl. `leak-report.md`) |

## Plan-item verification (items 1–8, cycle-1 findings, live-main ordering)

| Item | Check | Result | Evidence |
| ---- | ----- | ------ | -------- |
| 1 | Stable ids `scaffold.resource-generate` / `scaffold.resource-rerun` in `GATE` | PASS | `cli-surface.ts:77-78` |
| 2 | Exact command `generate resource people --client users --procedure list --partial --app <app>`; first run unwritten-stdout, rerun capture | PASS | `resource-slice-gates.ts:7-10,45-59` (`RESOURCE_NAME='people'`, `outputMode:'capture'`, rerun `stdoutIncludes` exact `Resource slice applied: 0 written, 11 skipped, 0 conflicts.`) |
| 3 | Semantic tests pin exact arrays/cwd/capture/stdout | PASS | `resource-slice-gates_test.ts:12-49` (`EXPECTED_COMMAND` with app `prod-local-test-web`) |
| 4 | Composition mirrors selection: resource pair directly after the codegen-adjacent service-client probe, before quality/type-check | PASS | `scaffold-gates.ts:135` (`...createResourceSliceGates()` after the `GENERATED_SERVICE_CLIENT_CONTRACT` probe, before `SCAFFOLD_AGENT_INIT`); test `:51-62` pins `firstRun == serviceClientContract + 1`, `rerun == firstRun + 1` |
| 5 | Direct `RUNTIME_GATES` membership + materialized `scaffold.runtime` reachability/order | PASS | `capability-suites.ts:62` (exported), `:83-85` (pair after codegen/contract), `:86` (UI moved here); suite `scaffold.runtime` materializes `gates: RUNTIME_GATES` (`capability-suites.ts:229`) so the test's `resolveSuite(SCAFFOLD.RUNTIME)` assertions are non-vacuous; test `:64-102` pins membership (duplicate-detecting filter), codegen/contract/firstRun/rerun/dataScreen adjacency, and `rerun < GENERATED_QUALITY_NEGATIVE` / `rerun < GENERATED_DENO_CHECK` on both the raw list and the resolved suite |
| 6 | Rendered guidance in both generated convention documents, before manual steps | PASS | `agent-conventions.ts:52-53` single `RESOURCE_GENERATION_GUIDANCE` constant rendered in `buildAppAgentsMarkdown` ("## Default architecture") and `buildWebLayerMarkdown` ("## One-screen path") (G6 byte-consistency) |
| 7 | Referenced-path tests with and without example service | PASS | `agent-conventions_test.ts` 3 tests: guidance presence + ordering in both renders, exact referenced-path lists for service and service-free inputs (path existence is additionally covered by the pre-existing full-suite stat checks — full suite green below) |
| 8 | Item-8 nominal fake, nothing else | PASS | `suite-runner_test.ts` diff is +2 lines: only the fake's stdout branch for `generate`+`resource` requests, emitting the exact 11-skip summary |
| live-main | `scaffold.ui-data-screen` moved after resource rerun | PASS | `capability-suites.ts` diff: `SCAFFOLD_UI_DATA_SCREEN` removed from its pre-plugin position and placed immediately after `SCAFFOLD_RESOURCE_RERUN`; test pins `selectedDataScreen == selectedRerun + 1` and `dataScreen == rerun + 1` on the resolved suite |

## Independent gate execution (this session, exact head `0cc736365`/`a2366577`, `TMPDIR=/var/tmp`)

| Gate | Command | Result |
| ---- | ------- | ------ |
| Focused regressions | `run-deno-test.ts -- --allow-all resource-slice-gates_test.ts agent-conventions_test.ts suite-runner_test.ts service-client-runtime-probe_test.ts` | **PASS** exit 0; 46 passed / 0 failed |
| Full CLI unit suite | `run-deno-test.ts -- --allow-all packages/cli` | **PASS** exit 0; 1788 passed / 0 failed / 0 ignored (76.5 s) |
| CLI type-check | `run-deno-check.ts --root packages/cli --ext ts,tsx` | **PASS** exit 0; 1004 files, 9 batches, 0 failed, 0 diagnostics |
| Lint (8 files) | `run-deno-lint.ts --config .llm/tmp/eval-1354-g-noexclude.json --file <8 paths>` | **PASS** exit 0; 8 selected / 8 processed / 0 findings / 0 refusals |
| Format (8 files) | `run-deno-fmt.ts --config .llm/tmp/eval-1354-g-noexclude.json --file <8 paths>` | **PASS** exit 0; 8 selected / 8 processed / 0 findings / 0 refusals |
| `arch:check` | `deno task arch:check` | **PASS** exit 0; every reported root `FAIL=0` (pre-existing WARN/INFO only) |
| `quality:gate` | `deno task quality:gate` | **PASS** exit 0 (chained scan + second green `arch:check`) |

Note: the root `deno.json` lint/fmt sections exclude `packages/cli/` entirely (the package owns its own surface), so the wrapper's default config refuses those files (`partial-exclusion`/`all-excluded` — fail-closed, observed). The no-exclusion temporary-config method above is the same one the author used; both wrapper verdicts are non-refused and clean.

## Review of the three one-pass runtime receipts (evidence read, not rerun)

Per the brief, the expensive Aspire/browser suite was **not** rerun here. The recorded receipts were cross-checked for internal consistency across `worklog.md` (Runtime Gates), `drift.md`, `context-pack.md`, and the PR body:

| Receipt | Recorded result | Consistency check |
| ------- | --------------- | ----------------- |
| Merge-head product finding | `scaffold.runtime` at `008d3264c` exit 1 after 23 passes; `scaffold.resource-generate` failed on `The appRoutes object contains an unsupported entry shape.` from `scaffold.ui-data-screen`'s quoted router key | Consistent across drift entry, worklog, and PR body; the fix (`a2366577f`) moves only the already-enumerated gate ordering, and the new tests pin the corrected order |
| In-ceiling fix | `a2366577f` moves `SCAFFOLD_UI_DATA_SCREEN` to immediately after the resource rerun within the eight-file ceiling | Verified in source (above); fail-closed reconciler unchanged |
| Two exact-head retries | Each: 42 passed / 1 failed (`runtime.aspire-start`, 300 s convergence timeout) / cleanup passed; all #1354 resource/UI/quality/type-check gates passed before the timeout; live diagnostics showed healthy Postgres/Garnet/Redis with divergent Aspire-advertised vs Docker-mapped proxy ports | Consistent across both runs, recorded as infrastructure drift with the "isolated hosted receipt required" action; no product code was changed to chase the shared-host fault |

## Product correctness vs the still-pending hosted tail

- **Product correctness at exact head is proven to the static/test ceiling this lane owns:** ceiling, lock, merge topology, executed/composed order, membership/reachability, command/stdout/item-8, guidance, and all independent gate runs above are green.
- **The isolated hosted tail is still open and is honestly recorded as such:** PR #1958 is opted into the isolated `e2e-cli-gate`; at evaluation time (2026-09-03) the `scaffold-runtime (aspire + docker + postgres)` and `scaffold-runtime-sqlite (aspire + sqlite + garnet)` check runs at the evidence head were **in_progress**, not green. CI at the same head shows Code quality success and the **close-gate red at step "Referenced issue acceptance gate"** — the expected pre-receipt state, because issue #1354's acceptance boxes and its `gate: deno task e2e:cli run scaffold.runtime --cleanup` box are unchecked pending that receipt. No green runtime result is claimed or inferred here.
- **Merge-readiness remains blocked by design:** close-gate red + two unchecked PR DoD boxes are correct until the hosted receipt lands and issue-acceptance evidence is mirrored. Lifecycle must not advance to `status:ready-merge` before both.

## Resource hygiene note

`leak-report.md` lists one `unproven`/`unknown`-owner `aspire ps` process (pid 498233). Per the run doctrine it was reviewed and **left alone** — no ownership proof to this run, no mutation attempted.

## Findings

| # | Severity | Finding | Required action |
| - | -------- | ------- | --------------- |
| — | none (product) | No falsifying defect found in the live-main delta. Every falsification target in the evaluation brief was independently checked and held: eight-product-file ceiling, unchanged `deno.lock`, merge-without-rebase preservation of final Slice F, exact `people` command, executed + composed ordering, direct and materialized reachability, captured summaries, item-8 fake, and rendered guidance. | none |
| 1 | informational (lifecycle) | The isolated hosted `scaffold.runtime` one-pass receipt is still pending (two hosted check runs in_progress at the evidence head at evaluation time), and issue #1354's acceptance/gate boxes remain unchecked, keeping the close-gate red. | Owner/coordinator: await the isolated hosted receipt; only then check the DoD/issue `gate:` boxes with linked evidence and advance lifecycle. Do not claim merge readiness before it. |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | **PASS_IMPL** (evaluation cycle 3 of 3; harness class: `PASS`) |
| Rationale | All approved-scope product work at the pushed live-main head is complete and independently verified: exactly the eight authorized product files over `origin/main`, `deno.lock` byte- and hash-unchanged, final Slice F preserved through a true merge, executed `RUNTIME_GATES` order `database.codegen → generated.service-client-contract → scaffold.resource-generate → scaffold.resource-rerun → scaffold.ui-data-screen → generated quality/type-check` mirrored in composition and pinned by direct + resolved-suite tests, exact command and rerun-captured summary, minimal item-8 fake, shared-sentence guidance in both convention documents with exact referenced paths. Independent fresh runs at this session reproduce the author's Tier-A evidence (focused 46/46, full CLI 1788/1788, check 1004 files/0 diagnostics, lint/fmt 8/8 clean, `arch:check` and `quality:gate` exit 0 with FAIL=0). No unrecorded doctrine violation; no new or deepened debt; run artifacts are resume-complete. This PASS explicitly does **not** assert a green runtime suite: the isolated hosted `scaffold.runtime` receipt was still in flight at evaluation time, the close-gate is red on the pending issue-acceptance boxes, and both PR DoD boxes for those facts remain honestly unchecked. Lifecycle may advance only after the independent hosted receipt lands and the acceptance evidence is mirrored. |
