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

## 2026-09-03 — Shared-host Aspire proxy mismatch blocks the final runtime tail

- **What:** Two unsplit `scaffold.runtime` runs at exact product head `a2366577fd8232c8e08e078b03d1e3cc84793b92` passed 42 gates, including both resource gates and all generated-project check/lint/fmt gates, then timed out only in `runtime.aspire-start`; cleanup passed both times.
- **Source:** Raw suite receipts plus live `aspire ps`, `aspire logs`, and Docker mapping inspection during the second retry.
- **Expected:** Aspire's advertised TCP endpoints converge with the Docker-published host ports and the remaining runtime/browser gates execute.
- **Actual:** Postgres, Garnet, and Redis containers were healthy and listening internally, but Aspire-advertised proxy ports were refused. Garnet and Redis advertised ports differed from their Docker-published ports on the shared host. The identical 300-second convergence timeout repeated without a product change.
- **Severity:** infrastructure
- **Action:** Preserve both raw failures and cleanup evidence; do not change #1354 product code around the DCP host fault. Obtain the required green one-pass receipt from the PR's isolated hosted lane before advancing lifecycle.
- **Evidence:** Each exact-head run reported `passed=42 failed=1 skipped=0`; the sole failing gate was `runtime.aspire-start` with `aspire describe --follow did not converge: timed out after 300s`.

## 2026-09-03 — Isolated hosted browser probe still targets retired Slice F showcase states

- **What:** The isolated GitHub Actions run and its failed-jobs retry both completed the resource first run, zero-write rerun, generated-project check/lint/fmt, runtime startup, and cleanup, but both PostgreSQL and SQLite tiers failed later at `behavior.app-reference`.
- **Source:** E2E CLI workflow run `33717890456`, original jobs `100530896255` / `100530896105` and retry jobs `100532599146` / `100532599296` at pushed evidence head `0cc736365c1a3886129920e8599d9e61895a40f0`.
- **Expected:** The one-pass hosted suite exits 0 after proving the generated resource and its browser/runtime surface.
- **Actual:** PostgreSQL reported `passed=89 failed=1 skipped=0`; SQLite reported `passed=84 failed=1 skipped=0`; both raw commands exited 1 only because `/examples/users?preview=loading` did not render `data-state="loading"`. Cleanup passed. Merged Slice F deliberately retired the init-only viewer/showcase assets that supplied the preview-state DOM, while `probe-app-reference.ts` still asserts them.
- **Severity:** high, merge-readiness blocker outside Slice G ceiling
- **Action:** Stop at the locked eight-product-file boundary. Do not remove the unrelated behavior gate or recreate retired showcase output. The owning follow-up must reconcile `packages/cli/e2e/src/application/gates/scaffold/runtime/probe-app-reference.ts` with final Slice F before the hosted `scaffold.runtime` gate and #1354 close gate can be green.
- **Evidence:** `git diff e14322c511^ e14322c511 -- packages/cli/src/kernel/assets/app` shows the preview/showcase assets removed by Slice F; `probe-app-reference.ts` is a ninth, unenumerated product path. The identical failure reproduced across two database tiers and a full failed-jobs retry.

## 2026-09-03 — Final #1354 matrix found no generator-specific missing-app-root negative test

- **What:** The final issue-acceptance audit mapped each #1354 checkbox to merged tests or hosted receipts.
- **Source:** Repository-wide search across `packages/cli/**/*_test.ts` plus the full 1788-test receipt.
- **Expected:** A negative generator test removes/fails app-root resolution and proves the command does not write outside `apps/<app>/`.
- **Actual:** The implementation has an explicit `if (!appRoot)` failure in `generate-resource.ts`, and shared UI app-root tests prove the resolver boundary, but no generator-specific negative test exercises an unresolved app root. This test would belong beside the generator command/use-case tests, outside Slice G's eight-file set.
- **Severity:** acceptance blocker outside Slice G ceiling
- **Action:** Leave the corresponding issue checkbox unchecked and keep `Refs #1354`; do not claim the leaf closes #1354 or advance to `status:ready-merge`.
- **Evidence:** `rg` found the guard at `packages/cli/src/public/features/generate/resource/generate-resource.ts:119` and no matching resource-generator test; `ui-app-root-command_test.ts` covers the shared resolver but not this verb's negative path.

## 2026-09-03 — OS-restart resume: hosted tail belongs to Slice G acceptance

- **What:** Final exact-head hosted run `33719217078` failed both database tiers at
  `behavior.app-reference`; PostgreSQL reported 89 pass / 1 fail and SQLite 84 pass / 1 fail. Both
  decisive errors were `desktop reference probe /examples/users?preview=loading did not render
  data-state="loading"` at `probe-app-reference.ts:74`.
- **Source:** Complete GitHub Actions job logs for PostgreSQL job `100534800206` and SQLite job
  `100534800209`, plus the `e14322c511^..e14322c511` Slice F diff.
- **Expected:** Hosted acceptance would execute the generated resource pair and complete the
  canonical browser tail.
- **Actual:** The browser probe predates Slice F (`9464ab223`) and still asserts seven preview
  states. Slice F `e14322c511` removed the showcase templates that emitted those states and replaced
  `/examples/users` with the neutral planner resource, while explicitly deferring hosted acceptance
  to Slice G. #1958 also generates `/people`, but the probe did not exercise it.
- **Severity:** significant
- **Action:** owner-authorized post-hosted amendment: expand the final product ceiling from eight to
  eleven existing files; probe `/examples/users` and `/people`, pin resource-rerun before the browser
  gate, and add the missing unresolved-app-root zero-write command regression. Do not recreate the
  retired showcase and do not run a new PLAN-EVAL.
- **Boundary:** The stale assertion is pre-existing; the incompatible rendered surface was
  introduced by merged Slice F; the correction belongs to Slice G because PR #1956 explicitly
  assigned hosted acceptance and #1354 closure to PR #1958.

## 2026-09-03 — Changed-head hosted run exposes the retired island-showcase probe

- **What:** After the `/examples/users` and `/people` browser-reference correction, changed-head
  hosted run `33731170586` passed `behavior.app-reference` in both database tiers and then failed at
  the next gate, `behavior.island-served-surface`.
- **Source:** Complete GitHub Actions logs for PostgreSQL job `100571302293` and SQLite job
  `100571302333` at product head `8341c07431cd333a9e109c5732c2958704334ab6`.
- **Expected:** The served-surface gate proves the island emitted by Slice G's generated `/people`
  resource and all Fresh module references return JavaScript successfully.
- **Actual:** The probe still fetched `/examples/users` and required the pre-Slice-F
  `ServiceShowcaseLab` marker/bundle. PostgreSQL reported 90 pass / 1 fail; SQLite reported 85 pass /
  1 fail; both raw commands exited 1 with `served HTML did not contain the Fresh ServiceShowcaseLab
  island marker`; cleanup passed. The resource first run/rerun, generated quality/type-check, app
  reference, runtime startup, and all preceding behavior gates passed.
- **Severity:** significant
- **Action:** Extend the owner-authorized hosted acceptance correction to thirteen existing product
  files. Point the existing served-surface probe to `/people` and `PeopleIsland`; update its existing
  semantic test to pin the Fresh marker, module URL, bundle hit, persisted failure receipt, and
  absence of the retired showcase identity. Do not recreate `ServiceShowcaseLab`, add a suite, split
  the runtime command, or run a new PLAN-EVAL.
- **Boundary:** The probe predates and was not modified by Slice F. The incompatible generated
  surface came from Slice F's intentional replacement of the showcase with the neutral planner
  resource. Slice G's public `generate resource people` output supplies the correct island for this
  hosted acceptance gate, so the correction remains in the accepted resource scope.

## 2026-09-03 — Remaining browser tail also encodes the retired mutation showcase

- **What:** After correcting the served-surface probe, a proactive trace of the immediately
  following gates found hydration still required a `data-state` list and Rename click, while the
  service-client refetch gate still navigated `/examples/users` and drove the same Rename mutation.
- **Source:** `RUNTIME_GATES` execution order plus history of
  `probe-island-hydration.ts`, `service-client-runtime-probe.ts`, and Slice F commit `e14322c511`.
- **Expected:** The browser tail proves the `PeopleIsland` generated by Slice G hydrates and its
  active `users.list` query can perform exactly one settled refetch.
- **Actual:** Both probes predated Slice F and referred to UI explicitly removed by Slice F. The
  generated neutral resource instead renders `<output>` inside `QueryIsland` and owns no mutation
  control, consistent with #1354's explicit deferral of the viewer-gated mutation showcase.
- **Severity:** significant
- **Action:** Cancel pending run `33732473476` before runtime execution rather than knowingly spend
  another failing cycle. Extend the accepted browser-tail correction from thirteen to eighteen
  existing product files: require a browser-reachable QueryClient at `/people`, invalidate the
  active `users.list` key, and require exactly one completed 2xx refetch. Keep the gate id and
  `RUNTIME_GATES` reachability; do not restore the showcase, alter generator output, add a suite, or
  split the hosted command.
- **Boundary:** The stale probes are baseline code; Slice F introduced the incompatible neutral
  output intentionally and assigned hosted acceptance to Slice G. The correction changes only E2E
  observations and tests, so the shipped Slice F resource implementation remains byte-preserved.
- **Lesson:** Runtime prerequisites and dependents were not traced end-to-end at design time. A
  generated-surface replacement must audit every later behavioral gate, not stop at the first
  failure exposed by serial execution.

## 2026-09-03 — Private Preact traversal is not a stable hydration seam

- **What:** First complete-tail hosted run `33735122923` passed the static lane and the corrected
  served-surface gate, but both database tiers timed out in `behavior.island-hydration` before the
  refetch gate.
- **Source:** SQLite job `100583852710` and PostgreSQL job `100583852866`, including their complete
  logs and uploaded reports.
- **Expected:** Finding a QueryClient by recursively walking private Preact-owned DOM objects would
  prove the generated `PeopleIsland` hydrated.
- **Actual:** The `<output>` and Fresh island/module surface were served successfully, but the
  private-object traversal never found the client. SQLite reported 86 pass / 1 fail / 0 skipped;
  PostgreSQL reported 91 pass / 1 fail / 0 skipped; both cleanup gates passed. The same timeout in
  both isolated tiers makes this an acceptance-observer defect, not a database-specific product
  failure.
- **Severity:** significant
- **Action:** Use the existing public `@netscript/fresh/query` contract instead. Browser evaluation
  imports its Vite module id, calls exported `getIslandQueryClient()`, requires the generated
  `users.list` entry, and uses that exact singleton for invalidation. Remove all private Preact graph
  traversal. Persist the last browser observation in timeout diagnostics and pin the public-module/
  no-`WeakSet` contract in the focused test.
- **Boundary:** No Fresh or generator code changes. This is a correction inside the already accepted
  hydration/refetch probe and test paths; the eighteen-file product ceiling does not move.
