# Drift Log: Slice G consumer guidance and hosted acceptance hook

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state documentation.

## 2026-09-03 — No implementation drift at bootstrap

- **What:** The locked seven-file product touch set is sufficient on the exact Slice F baseline.
- **Source:** Raw branch/status inspection and focused E2E/CLI source reads.
- **Expected:** Existing captured stdout and runtime composition seams require no extra file.
- **Actual:** `CommandGateDefinition.stdoutIncludes`, `createScaffoldGates()`, and `RUNTIME_GATES` provide those seams.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `packages/cli/e2e/src/domain/gate-definition.ts`, `packages/cli/e2e/src/application/gates/command-gate.ts`, `packages/cli/e2e/suites/scaffold/capability-suites.ts`

## 2026-09-03 — Captured-stdout reachability requires file eight

- **What:** Selecting `scaffold.resource-rerun` in `RUNTIME_GATES` makes its required `stdoutIncludes` assertion execute in the existing runtime-suite runner unit test. That test's nominal-success fake returns empty stdout for every successful command, so the suite report becomes false.
- **Source:** Full structured `packages/cli` unit run: 1715 passed, 1 failed; focused Slice G regressions: 46 passed, 0 failed.
- **Expected:** The locked seven-file touch set would be sufficient for captured stdout and runtime reachability.
- **Actual:** `packages/cli/e2e/tests/application/runner/suite-runner_test.ts` must return the exact skip-only summary for the rerun request, requiring an eighth product file.
- **Severity:** high
- **Action:** stop and request a plan/file-ceiling update; do not weaken the gate assertion or edit the unauthorized file.
- **Evidence:** failing test `suite runner skips cleanup phase when cleanup is disabled`; expected stdout `Resource slice applied: 0 written, 11 skipped, 0 conflicts.`

## 2026-09-03 — Rescope authorized and applied

- **What:** PR #1891 amended locked Slice G to ceiling 8 and explicitly enumerated `packages/cli/e2e/tests/application/runner/suite-runner_test.ts` as item 8.
- **Source:** `origin/feat/cli-resource-slice-plan` at `8896b3b768798593e3078b3db07170d148550aac` after an explicit fetch.
- **Expected:** The runner's nominal-success fake emits the rerun gate's captured skip-only output, with no helper or parallel suite.
- **Actual:** Only that fake's `stdout` expression changed; `generate resource` requests now receive `Resource slice applied: 0 written, 11 skipped, 0 conflicts.`.
- **Severity:** significant
- **Action:** accept the owner-authorized rescope and resume the remaining author-lane gates.
- **Evidence:** amended Slice G item 8 and the full/focused unit reruns recorded in `worklog.md`.

## 2026-09-03 — Slice F base advanced with evidence-only commits

- **What:** `origin/feat/cli-resource-slice-activate` advanced from the dispatched product baseline `8c27ffe164fc8dab8e16796e602693e6dea95c1e` to `63b23dae2b9d3bae0fede98dcf035779a10c3234` before PR creation.
- **Source:** Explicit fetch plus raw left/right log review.
- **Expected:** Slice G starts from the dispatched Slice F product head and targets Slice F's branch.
- **Actual:** The three newer base commits modify only Slice F harness evaluation/evidence artifacts; Slice G's product baseline and eight-file scope are unchanged. PR #1958 targets the current Slice F branch as required.
- **Severity:** minor
- **Action:** accept; preserve the dispatched implementation ancestry and let the stacked PR merge against the current base.
- **Evidence:** commits `de042d23e`, `dcf2c4bdf`, and `63b23dae2` contain only `.llm/runs/feat-cli-resource-slice-activate--1354-f/` changes.

## 2026-09-03 — IMPL-EVAL cycle 1 exposed untraced runtime prerequisites

- **What:** The initial design placed both resource gates before `database.codegen` in the executed `RUNTIME_GATES` list and generated a resource named `users`.
- **Source:** Separate-session IMPL-EVAL cycle 1 and its stock-init CLI reproduction in `evaluate.md`.
- **Expected:** The first run would resolve client `users` procedure `list`, write 11 files, and the identical rerun would report 11 skips.
- **Actual:** Procedure resolution imports the generated `@database/zod` CRUD contract, which does not exist before database codegen; after codegen, resource `users` collides with init's existing `appRoutes.users` alias. The exact failures were `Query procedure 'list' does not exist on client 'users'` and `appRoutes.users already has another value.`
- **Severity:** high
- **Action:** move `scaffold.resource-generate` and `scaffold.resource-rerun` after `database.codegen` in `RUNTIME_GATES`, preserving the existing invariant that `generated.service-client-contract` remains immediately adjacent to codegen and putting the resource pair immediately after that probe; mirror the same order in `scaffold-gates.ts`, generate non-colliding resource `people`, and encode both prerequisites plus adjacency in focused tests.
- **Evidence:** evaluator control with `people` produced `Resource slice applied: 11 written, 0 skipped, 0 conflicts.` followed by `Resource slice applied: 0 written, 11 skipped, 0 conflicts.`.
- **Lesson:** Runtime prerequisites were not traced at design time. Future shell-out gate placement must trace dynamic imports and generated namespace collisions against the stock scaffold before relying on hosted runtime proof.

## 2026-09-03 — Existing service-client adjacency constrains the cycle-2 insertion point

- **What:** The first cycle-2 edit placed the resource pair directly between `database.codegen` and `generated.service-client-contract`, as requested by the evaluator handoff.
- **Source:** Full structured `packages/cli` test run after the first edit.
- **Expected:** All 1716 unit tests remain green with the resource pair directly adjacent to codegen.
- **Actual:** 1715 passed and 1 failed because `service-client-runtime-probe_test.ts` requires `generated.service-client-contract` to remain exactly one position after `database.codegen`; that test is outside the locked eight-file ceiling.
- **Severity:** significant
- **Action:** preserve the established codegen-to-contract adjacency and put the resource pair immediately after the contract probe. This still guarantees `database.codegen < scaffold.resource-generate`, remains before generated quality/type-check gates, and requires no ninth file.
- **Evidence:** failing assertion reported indices 21 and 23; the corrected selected order is `database.codegen`, `generated.service-client-contract`, `scaffold.resource-generate`, `scaffold.resource-rerun`.

## 2026-09-03 — Live-main hosted run exposes the UI data-screen ordering prerequisite

- **What:** After merging `origin/main` `e14322c511bbf26018c617c12f639474b6092c32`, the first full `scaffold.runtime` run reached `scaffold.resource-generate` only after `scaffold.ui-data-screen` had added a quoted `'data-screen'` entry to `appRoutes`.
- **Source:** Exact-head hosted command `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` at merge commit `008d3264c5352abf6d1e3798d580550ec98e7e7c`.
- **Expected:** Resource generation writes 11 files and its identical rerun reports 11 skips before generated-project quality gates.
- **Actual:** The suite exited 1 after 23 passes; `scaffold.resource-generate` failed with `The appRoutes object contains an unsupported entry shape.` Cleanup passed. The generated router showed the standard `ui:add` output `'data-screen': createRouteReference(...)`, while the resource reconciler intentionally rejects quoted/computed keys.
- **Severity:** high
- **Action:** Keep the fail-closed reconciler unchanged and within the locked eight-file ceiling. Move `scaffold.ui-data-screen` in `RUNTIME_GATES` to immediately after `scaffold.resource-rerun`, preserving `database.codegen` → `generated.service-client-contract` → resource first run → resource rerun → UI data screen, all before generated quality/type-check gates. Encode the ordering in `resource-slice-gates_test.ts`.
- **Evidence:** The correction changes only two already-enumerated Slice G files; focused resource/UI/suite reachability tests pass 68/68 before the full rerun.
- **Lesson:** Runtime prerequisites include mutations made by earlier acceptance gates, not only generated files imported by the command. Gate-order design must trace every prior mutation of reconciled shared files.
