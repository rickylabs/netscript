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
