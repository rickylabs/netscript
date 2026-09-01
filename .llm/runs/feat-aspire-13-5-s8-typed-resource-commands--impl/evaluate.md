# Evaluation: D-233 final IMPL-EVAL — PR #1754 typed database resource commands

Fill this template during evaluation. Allowed result values: `PASS`, `FAIL`, `N/A`,
`PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`. Anti-pattern status values: `CLEAR`, `VIOLATION`,
`DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Run ID         | `feat-aspire-13-5-s8-typed-resource-commands--impl`                                                       |
| Target         | D-233 delta `927d24beddfb80ea96f1f3ba4df4fd269325a6f2..9c5fa1b0b193bc915bd0bc162c2b8c89400f3f85` (PR #1754) |
| Archetype      | `6 — CLI / tooling` (`packages/cli`, Keep verdict)                                                        |
| Scope overlays | `none`                                                                                                    |
| Evaluator      | separate opposite-family session — Claude Code on `z-ai/glm-5.3-flash` (sanctioned GLM 5.3 Flash max IMPL preset), reasoning trace present, 2026-09-01; implementation lane was OpenAI GPT-5.6 Sol / Codex per `supervisor.md` |

Evaluated head equals the live remote head at read time
(`git ls-remote` → `9c5fa1b0b193bc915bd0bc162c2b8c89400f3f85`, re-confirmed immediately before
push). PLAN-EVAL is recorded N/A before implementation (`plan.md`: ratified epic research plan +
owner-supplied diagnostic-first contract); no evaluator was self-dispatched by the generator.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                              |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` not applicable by ratification; `plan.md` records `PLAN-EVAL: N/A` with the owner-supplied D-233 contract before product bytes moved |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` + per-delta design checkpoints D-216/D-224/D-227/D-231/D-233 (incl. ports, constants, contributor path)         |
| Commit slices match design plan        | PASS   | `927d24bed..9c5fa1b0b` = exactly the three planned D-233 slices: `592a8e688` (diagnostic promotion), `a5f1ab7e0` (cross-stream retention), `9c5fa1b0b` (migrate→deploy repair) |
| Each slice has a passing gate          | PASS   | Per-commit PR trail comments 5486453123/5486543706/5486616000 record RED+GREEN+static gates; this evaluator independently re-ran the focused sets (9 tests incl. compile, 23 E2E builder tests) green at head |
| No speculative seams (unused files)    | PASS   | Diff touches only the two emitted templates, their tests, the Phase-B verifier, its test, the generated barrel, and run artifacts; no dead/unused files added |
| Constants used for finite vocabularies | PASS   | D-224 bounds unchanged (`MAX_ACTIONABLE_STDERR_LINES=32`, head 8 / tail 24, 16 KiB ceiling, derived 511-byte line allowance, `…` marker); task mapping is the single `dbTaskOperation` function, not scattered literals |

## Static Gates

| Gate             | Command or check                                                                    | Result | Evidence                                                                                                           | Notes |
| ---------------- | ------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------ | ----- |
| Narrow typecheck | `deno test --no-lock --unstable-kv --allow-all` on the three template/helper test files + E2E builder test | PASS   | Evaluator run: 9 tests / 0 failed (incl. emitted-helper compile test exit 0); 23 tests / 0 failed (`runtime-gates_test.ts`) | `--unstable-kv` per repo rule |
| Slice typecheck  | emitted-helper compile regression (`generated-helpers-compile_test.ts` → `deno check` of rendered `register-infrastructure.mts`, `db-cli-mode.mts`, `run-tool.mts`) | PASS   | Compile test green at head; contract deliberately omits `ReferenceExpression.getValue()` and asserts emitted output never calls it (D-231 guard retained) | D-227 coverage now also compiles the D-233-modified `run-tool.mts` |
| Format           | `deno fmt --check` on non-excluded changed files (`verify-typed-db-phase-b.ts`, `runtime-gates_test.ts`) | PASS   | `Checked 2 files`, exit 0                                                                                          | Configured wrappers intentionally exclude the template-test root (D-09/D-233 recorded); the excluded files are covered by the E2E-config policy evidence in the worklog |
| Lint             | `deno lint` on the same non-excluded changed files                                   | PASS   | `Checked 2 files`, exit 0, no findings                                                                             | Raw fallback per established config-exclusion practice |
| Doc lint         | `deno doc --lint` on `packages/cli/mod.ts`                                           | N/A    | No export, JSDoc, or package-metadata change in the delta (`git diff` shows `mod.ts`/`maintainer.ts`/`deno.json` untouched) | JSR audit N/A per plan |
| Publish dry-run  | `deno publish --dry-run`                                                             | N/A    | No public surface change; F-CLI-9/10 unaffected by template-only emission changes                                    | |
| Link/path check  | changed-file set cross-checked against templates/registries                          | PASS   | `embedded.generated.ts` delta is exactly the two regenerated template entries (run-tool, db-cli-mode-1)              | `check:assets-barrel` diff-clean recorded at each clean product head (worklog + CI `scaffold-static` success at `9c5fa1b0b`) |
| Quality          | `deno task quality:scan`                                                             | PASS   | Evaluator run: `ok: true`, `findings: []`, 7 pre-existing allowances unchanged, `allowanceFailures: []`             | Closes the #745 wrapper-only hole |
| Doctrine         | `deno task arch:check`                                                               | PASS   | Evaluator run: exit 0, every root `FAIL=0` (WARN=9/INFO=2 inventory only; the two `packages/cli/e2e` F-16/size warnings pre-date S8) | |
| Dependency churn | `git diff` on `deno.lock`, root/workspace `deno.json` over the delta and full PR base | PASS   | Empty — no dependency, catalog, or lock change (the D-233 slice's transient 7.10 lock inspection was restored exactly per worklog) | |

## Fitness Gates

| Gate | Function                        | Result         | Evidence                                                                                                   | Violations |
| ---- | ------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint                  | PASS (manual)  | Changed non-template files ≤ 297 LOC; templates are `kernel/assets/**`-exempt (F-CLI-2 carve-out)          | none       |
| F-2  | Helper-reinvention scan         | PASS           | No new abstraction added; D-233 reuses D-224's retention policy, the existing runner port, and the existing `<db>-cli` executable | none       |
| F-3  | Layering check                  | PASS           | No kernel↔surface import added; changes stay inside emitted templates, their tests, and the E2E runtime adapter | none       |
| F-4  | Inheritance audit               | N/A            | No new abstract or subclass in the delta                                                                   | none       |
| F-5  | Public surface audit            | PASS           | No `mod.ts`/export/package-metadata change over the full PR base (`6c195acaf` merge-base diff empty for those files) | none       |
| F-6  | JSR publishability gate         | N/A            | No published-surface change in the delta                                                                   | none       |
| F-7  | Doc-score gate                  | N/A            | No JSDoc-bearing export changed                                                                            | none       |
| F-8  | Workspace `lib` override check  | N/A            | No workspace/lib change                                                                                    | none       |
| F-9  | Permission declaration check    | N/A            | No permission vocabulary change (emitted runner flags unchanged)                                           | none       |
| F-10 | Test-shape audit                | PASS           | New tests are black-box subprocess fixtures asserting semantic records (no giant string snapshots; AP-18 clear) | none       |
| F-11 | Forbidden-folder lint           | PASS           | No new folders created in the delta                                                                        | none       |
| F-12 | Naming-convention lint          | PASS           | Existing names retained (`*-test.ts`, `verify-typed-db-phase-b.ts`, template names unchanged)              | none       |
| F-13 | Saga and runtime invariants     | N/A            | No saga/runtime surface touched                                                                            | none       |
| F-14 | Console-log lint                | PASS           | `console.*` remains only inside the emitted runtime edge (`run-tool.mts` `import.meta.main`) — allowed adapter/binary position | none       |
| F-15 | Re-export-of-upstream lint      | N/A            | No re-exports added                                                                                        | none       |
| F-16 | Folder-cardinality lint         | PASS (delta)   | `arch:check` exit 0; the two flagged E2E F-16 warnings (46-child gate dir, 538-line `verify-live-db-endpoint.ts`) pre-date S8 and were not touched by this delta | pre-existing inventory |
| F-17 | Abstract-derived co-location    | N/A            | No new abstract with concrete in the delta                                                                 | none       |
| F-18 | Sub-barrel lint                 | PASS           | No barrel files added/removed under `src/**`                                                               | none       |
| F-19 | Scoped source gate runners      | PASS           | Scoped check/lint/fmt runs executed on changed files (above) plus worklog-recorded scoped runs per slice   | none       |
| F-CLI-1…31 | Archetype-6 gates          | PENDING_SCRIPT (unchanged policy) with manual/structural evidence | `arch:check` FAIL=0; changed files respect size/naming/layering rules; composition declarativity untouched (no `.command()`/`.option()`/`.action()` added) | none |

## Runtime Gates

| Gate     | Validation                                                                   | Result | Evidence                                                                                                                                                                     |
| -------- | ---------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `runtime.typed-db-phase-b` | Final CI at implementation head `9c5fa1b0b`: run `33454252626`, retry attempt 2, PostgreSQL job `99692856453` | PASS | Gate header PASSED **5416 ms** after 66 prior passes (verifier covers `migrate --help`, `reset --help`, `migrate --timeout 60` success, `reset` without `--confirm true` refusal, bounded unhealthy wait) |
| Later unrelated gate | Same run/job: `behavior.workers-executions` FAILED 29404 ms (`workers-api workers-executions probe failed after 30 attempts: http://localhost:35257: health-check execution has not completed yet`), `Summary: passed=66 failed=1`, cleanup gate PASSED | PASS (not S8) | Stack is `probe-plugin-resource.ts:39/174` — a workers-plugin probe, no S8 typed-DB code path; gate predates S8 (last touched by S6 `e17c96ed8`); identical failure in the SQLite tier |
| SQLite tier | Run `33454252626`, retry job `99692856575` (`scaffold-runtime-sqlite`)       | PASS (not S8) | `Summary: passed=61 failed=1` — advanced past `database.init`/`database.generate`/`database.seed`/`runtime.aspire-restart-after-db`, then failed the same `behavior.workers-executions` probe; `runtime.wait.garnet` also fails attempt 1 on both tiers and on main's own run `33413386485` (job `99558292332`) |
| Prior diagnostic runs | `33452657304` (job `99685895308`, 58 passes, Prisma preamble rendered, stdout empty) and `33453461545` (job `99688348865`, 58 passes, decisive line surfaced) | PASS (evidence chain) | Establishes D-13 (one-line rendering + stdout transport) and D-14 (headless authoring cause); see Finding E-1 below |

## Consumer Gates

| Consumer                    | Validation                                                                                | Result | Evidence                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| Generated AppHost helpers   | Emitted helper compile against the restored 13.5.3 SDK contract (D-227 regression)         | PASS   | Compile test green at head; `db-cli-mode.mts` renders graph-injected annotations and never an in-callback resolver call |
| Generated database CLI      | Typed-command result parsing/validation of the additive record (`parseDbCliResult`)        | PASS   | `generate-db-cli-mode_test.ts` asserts `actionableStdout` in the runner contract and the ` | `-joined presentation; green at head |
| Generated workspace runtime | CI `scaffold-static` (deno-only) success + runtime gates at `9c5fa1b0b`                    | PASS   | Run `33454252626` job `99692857050`; `generated.deno-check`/`generated.deno-lint`/`generated.deno-fmt-check` class gates pass in both tiers before the unrelated later failure |

## D-233 Challenge Points (owner-mandated audit)

| # | Requirement                                                                                                  | Verdict | Evidence                                                                                                                                                                                                                                                                                                                                                       |
| - | ------------------------------------------------------------------------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Generic failure-shaped promotion; no Prisma-specific classifier                                              | PASS    | `run-tool.ts.template` `FAILURE_MESSAGE_SHAPE` is tool-agnostic error grammar (`error|failed|failure|fatal|exception|panic|invalid|cannot|can't|could not|unable|denied|unsupported|not supported|not found|timed? out|exited? with (?:code|status)` + generic `[A-Z]\d{3,}` code shape) with first-line fallback (`selectFailureMessage`); the only `NETSCRIPT_PRISMA_*` strings are the pre-existing request-field names. Black-box fixtures use generic wording ("Loaded command configuration from tool.config.ts."), zero Prisma vocabulary |
| 2 | D-224 bounds/head-tail, D-227 compile coverage, D-231 graph injection intact                                                 | PASS    | D-224: 32/8/24 + 16 KiB + 511-byte per-line allowance + UTF-8-boundary truncation unchanged in the template, stderr path byte-identical, and both D-224 fixtures (`retains structured identifiers beyond the actionable stderr head`, `bounds persisted actionable stderr by UTF-8 bytes`) green at head. D-227: compile regression still runs and now also compiles the D-233-modified `run-tool.mts`. D-231: `withEnvironment('DATABASE_URL', target.resource)` + `withReference` + `waitFor` + staged request + atomic result + callback-read-before-nonzero-fallback all retained; `getValue`/`connectionStringExpression()` remain absent from emitted output and the compile contract keeps rejecting them |
| 3 | Bounded context through Aspire's one-line result boundary; Phase-B must not mask one outer stream behind the other         | PASS    | `presentDbCliResult` joins promoted message + remaining bounded context with ` | ` on one Aspire-visible line; success path returns the record message unchanged. Phase-B `formatCommandFailure` labels and renders `stderr:` and `stdout:` blocks (never `stderr || stdout`); its test (`typed database Phase-B failures surface both captured streams`) is green. Runtime proof: run `33453461545` log shows the labeled dual-stream output carrying the decisive line |
| 4 | Surfaced CI cause reported literally from run `33453461545`                                                    | PASS    | Job `99688348865` line: `❌ Failed to execute command 'migrate' on resource 'postgres-cli': This headless session could not create a migration. Run this command in an interactive terminal: netscript db migrate --name <migration-name>` — a headless session could not create a migration and requested interactive `netscript db migrate --name ...`. `database.seed` PASSED 2268 ms immediately before; `Summary: passed=58 failed=1`; failure gate `runtime.typed-db-phase-b` |
| 5 | Public action `migrate` kept; internal task mapped to existing `db:deploy:<engine>` for Container/External/SQLite; seed/reset unchanged | PASS    | `dbTaskOperation()` maps only `migrate→deploy` (identity otherwise); public command list still `{ name: 'migrate', displayName: 'Migrate database', … }`; Container request record carries `NETSCRIPT_PRISMA_TASK_OPERATION: dbTaskOperation(operation)`; direct External/SQLite path renders `` db:${dbTaskOperation(operation)}:${target.taskSuffix} ``; runner consumes `taskOperation ?? operation` (backward-compatible). `db:deploy:<engine>` → `db:migrate:deploy` → `prisma migrate deploy` is pre-existing generated output (`generate-db-deno-json.ts` untouched by the PR); generated `db:migrate` itself was not altered; reset-confirmation gate and seed/reset identity verified by still-green tests |
| 6 | Preamble and migrate-routing contracts RED before fixes and green now; no new `any`, casts, lint ignores, dependency/lock churn, or public-surface change | PASS    | RED: both new test blocks are absent at `927d24bed` (grep count 0), and the base code provably could not satisfy them — base returned `{success, message}` only (no diagnostic arrays), derived `message` from `actionableStderr.join('\n')`/`actionableStderr[0]` (preamble-first, stderr-only), and always rendered `db:${operation}:${taskSuffix}`; the executed RED runs are recorded in `worklog.md` and PR trail (preamble: exit 1, 4 passed/1 failed; migrate routing: exit 1, 14 passed/3 failed). GREEN: evaluator re-ran 9 focused tests (incl. all three new blocks) and 23 E2E builder tests, 0 failed. `any`/casts/suppressions: zero added lines matching `as unknown as`/`deno-lint-ignore`/`@ts-ignore`/`as any` outside the generated barrel; the lone compat `as unknown as` (line 629) pre-dates the PR base; compat template's only PR change is `DbCliModeExcludeFromMcp: true`. `deno.lock`/`deno.json` empty diff; no public/package surface change |
| 7 | No local Aspire/Docker/AppHost/`e2e:cli`; CI runtime authority; final run `33454252626` incl. retries `99692856453`/`99692856575` | PASS    | Evaluator ran none of those commands. Final run `33454252626` at `9c5fa1b0b` attempt 2: `runtime.typed-db-phase-b` PASSED 5416 ms, then the unrelated `behavior.workers-executions` failure after 66 passes; SQLite advanced to 61 passes before the same later failure. Attempt 1 (jobs `99690779256`/`99690779278`) failed earlier at `runtime.wait.garnet` (46/42 passes) — the retry justification. No runtime was dispatched or retried by this evaluator |

## Anti-Pattern Check

| AP    | Status       | Evidence | Notes |
| ----- | ------------ | -------- | ----- |
| AP-1  | N/A          | No monolith introduced; bounded template deltas only | |
| AP-2  | N/A          | No port widening | |
| AP-3  | CLEAR        | Result record fields are additive and validated (`parseDbCliResult` rejects malformed records) | |
| AP-4  | N/A          | No domain growth | |
| AP-5  | N/A          | No registry change | |
| AP-6  | N/A          | No abstract orchestration added | |
| AP-7  | N/A          | Spine untouched | |
| AP-8  | N/A          | No repository change | |
| AP-9  | N/A          | No naming drift | |
| AP-11 | CLEAR        | All new IO stays in the emitted runtime edge (`run-tool.mts`) and the E2E runtime adapter; generators remain pure renderers | |
| AP-13 | CLEAR        | Presentation mapping is a named function beside D-224 retention, not scattered literals | |
| AP-14 | N/A          | No asset relocation | |
| AP-15 | N/A          | No static/network surface change | |
| AP-16 | N/A          | No factory change | |
| AP-18 | CLEAR        | New fixtures assert semantic result records, not giant string snapshots | |
| AP-19 | N/A          | No permission vocabulary change | |
| AP-20 | N/A          | No environment-key drift (existing `NETSCRIPT_PRISMA_*` names extended additively) | |
| AP-21 | N/A          | No presentation folder growth | |
| AP-22 | N/A          | No barrel added | |
| AP-23 | N/A          | Composition files untouched (declarative shape preserved) | |
| AP-24 | N/A          | No tagged-union switch added (task mapping is one function) | |
| AP-25 | CLEAR        | All `Deno.*`/`console.*` in the delta remain in the emitted edge / E2E runtime adapter | |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                                       |
| --------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| New entries           | 0     | `arch-debt.md` untouched across the full PR base diff; no new doctrine violation introduced     |
| Resolved entries      | 0     | No entry claimed closed in this delta; the `_aspire-compat.mts` seam entry remains open, owner S12 |
| Deepened violations   | 0     | Compat seam unchanged except the pre-planned `DbCliModeExcludeFromMcp` default                  |
| Unrecorded violations | 0     | `quality:scan` findings `[]`; `arch:check` FAIL=0 on every root                                 |

## Findings

| Severity            | Finding                                                                                                                            | Evidence                                                                                                    | Required action                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| (blocker, outside D-233) | `behavior.workers-executions` is red on both runtime tiers in the final head's suite, so `scaffold.runtime` is not green and merge readiness cannot be asserted from this run | Run `33454252626` attempt 2 jobs `99692856453` (passed=66) and `99692856575` (passed=61); `probe-plugin-resource.ts` workers probe timing out after 30 attempts | Diagnose/repair on a separately owned slice; do not attribute to S8 — the gate predates S8 (`e17c96ed8`) and both tiers fail identically after the typed-DB gates pass |
| (blocker, outside D-233) | Close-gate is not satisfied: issue #1720 carries six unchecked acceptance boxes and the PR body's Definition-of-Done has one unchecked box, while the PR carries `Closes #1720` | Issue #1720 body (`## Acceptance`, 6 unchecked), PR body DoD box "Every issue acceptance/gate box has lease-backed evidence" | Before `status:ready-merge`, complete the close-gate: the final run's Phase-B receipt already evidences the `--help`, `migrate --timeout 60`, and reset-refusal boxes; box out + mirror acceptance evidence, and resolve the workers-executions red |
| Low (advisory)      | `runtime.wait.garnet` flaked on attempt 1 of both tiers and on main's own run `33413386485` (job `99558292332`) — retry pressure unrelated to S8 | Job logs `99690779256`/`99690779278` (46/42 passes) and main run job log | Track as separate runtime-infra work; not an S8 finding |
| Low (advisory)      | `waitForDbCliResult`'s poll fallback returns the record without the `presentDbCliResult` context join, so a failure surfaced only through polling shows the promoted line without appended bounded context | `generate-db-cli-mode-1.ts.template:259` vs `:338` | Acceptable: the decisive promoted `message` is still a single visible line; optional later polish only |
| Low (advisory)      | Per-stream bounded diagnostics mean the joined Aspire-visible line can reach ~2× the D-224 16-KiB ceiling worst-case (each stream independently capped by design) | `run-tool.ts.template` separate head/tail arrays; drift D-13 records the independently-bounded-stdout decision | Bounded and intentional per the recorded decision; no action required |
| Low (advisory)      | The PR still carries the `impl-eval:skip` flag label applied by the earlier coordinator ruling, now superseded by this executed final IMPL-EVAL | PR labels list | Supervisor/owner may retire the flag when advancing lifecycle; evaluator did not touch labels |

## Lessons for Promotion

| Lesson                                                                  | Pattern                                                                     | Applies to      | Confidence |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------- | ----------- |
| Promote the decisive failure line, keep the full bounded array, and render every captured stream | Generic failure-shape selection + dual-stream presentation beats per-vendor parsing | Archetype 3/6 runtime edges | high |
| Declaration-level compile success is not runtime capability evidence    | The D-227→D-231 chain proved compile-clean `getValue()` was an unsupported runtime capability | Archetype 6 generated edges | high |
| One-line result boundaries require deliberate flattening upstream       | `presentDbCliResult`'s ` | `-joined single line vs Aspire's first-newline rendering | Aspire command results | high |

## Verdict

| Field     | Value                                   |
| --------- | ---------------------------------------- |
| Verdict   | **PASS**                                 |
| Rationale | All seven owner-mandated D-233 challenge points verified at the exact implementation head `9c5fa1b0b193bc915bd0bc162c2b8c89400f3f85` (equal to the live remote head): the failure promotion is genuinely tool-agnostic with a first-line fallback; D-224's 32-line 8/24 16-KiB bounds, D-227's emitted-helper compile regression, and D-231's graph-injected `<db>-cli` mechanism are intact and exercised by still-green focused tests; the typed failure path surfaces bounded stderr/stdout context on one Aspire-visible line and Phase-B renders both captured streams; the surfaced cause is reported literally from run `33453461545` and proves the S8-owned migrate-routing defect; the repair keeps the public `migrate` action while mapping its internal task to the pre-existing `db:deploy:<engine>` (`prisma migrate deploy`) path for Container requests and direct External/SQLite execution with seed/reset untouched; both regression contracts were RED before their fixes (absent at `927d24bed` with base behavior provably unable to satisfy them, plus recorded RED runs) and are green now; the delta adds no `any`, cast, lint suppression, dependency/lock churn, or public-surface change; and the final CI run `33454252626` proves `runtime.typed-db-phase-b` passes in 5416 ms at the repaired head with the only later failure being the unrelated `behavior.workers-executions` probe on both tiers. D-233 itself has no blockers. The remaining red suite gate and the unchecked #1720 close-gate boxes are outside D-233 scope and are recorded as the merge-readiness blockers that must be resolved before `status:ready-merge`. |
