# Evaluation: #1908 / PR #1910 — runtime concurrency-key isolation

Independent IMPL-EVAL. Evaluator is a separate session from the generator (Codex · GPT-5.6 Sol ·
high, thread `01a0607f-b1df-7b33-8f3f-cdb1b872b49b`, per `codex-thread-ids.md`). All commands below
were run by this evaluator session with real captured exits.

## Metadata

| Field             | Value                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| Run ID            | `ci-e2e-concurrency-key-isolation--1908`                                  |
| Target            | PR #1910 (`fix(ci): isolate runtime concurrency from stale workflow branches`) closing issue #1908 |
| Evaluated head    | `0250dded1ecc82a861f4e111b87ef3b968d6095f` (= live PR #1910 head; merge-base with `d5c5810db` is `d5c5810db`, so `d5c5810db...HEAD` is exactly the branch delta) |
| Baseline          | `d5c5810db` (`main` at dispatch)                                          |
| Archetype         | N/A — `.github/workflows` + run artifacts only; no `packages/**`/`plugins/**` surface |
| Scope overlays    | none                                                                      |
| Evaluator         | separate-session IMPL-EVAL, 2026-09-02                                    |
| Release-gate class | **n/a** — not a release cut/publish run (no version, branch, tag, or publish surface touched; protocol rule 14 n/a branch) |

### Evaluator route identity

| Field     | Value                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------- |
| Requested | `formal_impl_evaluation` quota-block fallback (drift D-08, owner-reported native Fable 5 limit): local Claude/OpenRouter · `z-ai/glm-5.3-flash` · effort `max` |
| Observed  | local Claude Code + OpenRouter transport · model `z-ai/glm-5.3-flash` (session runtime identity) · effort `max` per dispatch attestation |
| Verdict   | matched. Transport is an approved open-model relay (lane-policy invariant 6); generator family (OpenAI/Codex) ≠ evaluator family (GLM/OpenRouter) |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                                            |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate satisfied before implementation | PASS | `PLAN-EVAL: N/A` recorded with concrete justification in `worklog.md` (mechanical fix; literals, trade-off, non-scope, gates locked in `plan.md` committed `74e8757ae`/`1af59770b` before implementation commit `541eb914b`) |
| Design section exists in worklog       | PASS   | `## Design` with all 7 required elements: public surface (Queue policy contract), domain vocabulary, ports, constants (v1→v2 table), commit slices, deferred scope, contributor path |
| Commit slices match design plan        | PASS   | 5 commits (`74e8757ae`, `1af59770b`, `541eb914b`, `5fe82956d`, `0250dded1`), every commit touches the run dir. Deviation noted as finding F-1: design S1+S2 landed in one commit (`541eb914b`) |
| Each slice has a passing gate          | PASS   | S1/S2: focused regression test 60/60 + exact diff evidence; S3: captured-exit evidence in worklog (E1–E5); co-author slice `5fe82956d` tightened the gate itself |
| No speculative seams (unused files)    | PASS   | No new files outside the run dir; product delta is one workflow edit and one existing test file edit (`git diff --name-only d5c5810db...HEAD -- .github/`) |
| Constants used for finite vocabularies | PASS   | v1/v2 key generations defined as constants in the Design table; GitHub Actions YAML cannot import constants, so the regression test asserts the exact newline-terminated literals as the enforcement point |
| Agent brief carries `use harness` + `## SKILL` | PASS | `implement.md` lines 1–8 (protocol rule 13; PR bodies exempt)                                                                                              |

## Static Gates

| Gate               | Command or check                                                                 | Result | Evidence                                                                                       |
| ------------------ | -------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| Focused regression | `deno test --allow-read --allow-write --allow-env .github/scripts/ci-classify-changes.test.ts` | PASS | `ok | 60 passed | 0 failed`, `REAL_EXIT=0` (deno test type-checks the touched module on execution) |
| Whitespace         | `git diff --check d5c5810db...HEAD`                                              | PASS   | exit 0                                                                                          |
| Format             | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .github/scripts --ext ts` | PASS | 11 files, 0 findings, exit 0 (wrapper-sourced)                                                   |
| Lint               | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .github/scripts --ext ts` | PASS | 11 files, 0 occurrences, exit 0 (wrapper-sourced)                                                |
| Lock hygiene       | `git diff --stat d5c5810db...HEAD -- deno.lock`                                  | PASS   | empty diff, exit 0; evaluator never touched the lock or ran dependency resolution               |
| Workflow scope     | diff accounting of `e2e-cli.yml`                                                 | PASS   | 2 removed / 22 added lines; after excluding comment lines, exactly the two group-literal pairs — no other directive moved |
| Concurrency directives | read-back of all three `concurrency:` blocks at HEAD                         | PASS   | top-level `e2e-cli-${{ github.workflow }}-${{ github.ref }}` + `cancel-in-progress: true` unchanged; tiers `e2e-scaffold-runtime-global-v2` / `e2e-scaffold-runtime-sqlite-global-v2`, each still `cancel-in-progress: false` + `queue: max` |
| Test tightening    | `git diff` of `ci-classify-changes.test.ts`                                      | PASS   | both v2 assertions require newline-terminated literals; explicit absence assertions for both v1 literals added (v1 spelling is not a substring of the v2 literal, so the assertions are meaningful) |
| YAML validity      | GitHub's own parser executed the workflow at this content                        | PASS   | workflow content identical from `5fe82956d` through `0250dded1` (empty diff); hosted runs + check-runs (`classify changes`, `core CI lane visibility`, `quality`, `build`, `check-test` all completed) parsed and executed this file. See finding F-4 for the local-parse limitation |
| Doc lint / publish dry-run | N/A                                                                      | N/A    | no package export surface touched                                                               |

## Runtime Gates

Re-derived from the GitHub API by this evaluator (attempt-1 job receipts fetched explicitly via
`/attempts/1/jobs`; the run summary alone shows the later attempt-2 re-run, which is a cancelled
~2-minute re-run and is not the acceptance receipt).

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Mixed-generation concurrency isolation | Hosted fixed-v2 vs stale-v1 scheduler exercise (attempt 1 receipts) | PASS | **Fixed v2** run [`33598546960`](https://github.com/rickylabs/netscript/actions/runs/33598546960) attempt 1 @ `5fe82956d`, branch `ci/e2e-concurrency-key-isolation` (attempt started 2026-09-02T06:22:24Z): docker job `100147054107` started 06:22:57Z → terminal **failure** 06:32:43Z (9m46s, non-cancelled); sqlite job `100147054142` started 06:22:56Z → operator-cancelled 06:40:02Z (17m06s, i.e. 16m19s past the stale arrival). **Stale v1** run [`33596134134` attempt 2](https://github.com/rickylabs/netscript/actions/runs/33596134134/attempts/2) @ `e72da5161`, branch `fix/aspire-13-5-s9-skills-mcp-alignment` (attempt started 06:23:22Z): docker job `100147234478` and sqlite job `100147234673` both started 06:23:43Z → operator-cancelled 06:24:26Z |
| Decisive ordering | window comparison | PASS | Fixed jobs started 06:22:56/57Z, 46–47s **before** the stale arrival started 06:23:43Z, and both stale tier jobs **ran concurrently** with the fixed tier jobs (overlapping windows, two jobs per tier). Under a shared mutex concurrent execution is impossible; cross-generation concurrency is the discriminating observable of key separation, and both fixed jobs reached their own conclusions after the arrival |
| Stale-branch classification | content fetch of `e2e-cli.yml` @ `e72da5161` | PASS | Stale branch verifiably carries the v1 literals `e2e-scaffold-runtime-global` / `e2e-scaffold-runtime-sqlite-global` (genuinely pre-#1846). See finding F-2 for its cancel directive |
| `runtime.wait.garnet` failure classification | real job log, job `100147054107` (236 KB, fetched via `gh api …/logs --allow-escape-sequences`) | PASS (classified, out-of-scope) | `FAILED GATE: runtime.wait.garnet`; `aspire wait garnet --status healthy --timeout 300` exited 1; `Summary: passed=46 failed=1 skipped=0`. This is an honest runtime failure — **not green, not infrastructure noise, not a #1908 concurrency failure**. Owned by open PR [#1858](https://github.com/rickylabs/netscript/pull/1858) (`fix(cli,e2e): make Garnet readiness deterministic…`, head `ebe818b70`, `gate:e2e`+`ci:full`), whose run [`33597731881`](https://github.com/rickylabs/netscript/actions/runs/33597731881) (06:10:45Z→06:18:58Z) completed **both** runtime tiers successfully (sqlite `100144561733` success 06:16:45Z; docker `100144561746` success 06:18:49Z). It therefore does not block this plan; the isolation PASS and the pre-#1858 runtime-baseline FAIL are kept as separate verdicts (drift D-07) |
| Local `scaffold.runtime` | rerun | NOT_RUN | Explicitly out of scope for this eval per dispatch (would test application runtime, not GitHub concurrency admission, and would duplicate the hosted receipt) |
| `e2e-cli-gate` label hygiene | live PR labels | PASS | No gate label present at head; runtime tiers correctly `skipped` in CI at `0250dded1` so evidence/evaluator commits do not repeat the expensive gate |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| GitHub Actions scheduler (sole consumer of the group literals) | hosted mixed-generation exercise above | PASS | Real scheduler admitted four runtime jobs (two per tier) across two key generations concurrently; fixed jobs unaffected by the v1 arrival |
| Workflow regression test (consumes workflow text) | focused suite | PASS | 60/60, exit 0, including the new exact-v2/absent-v1 assertions |

## Fitness Gates

F-1…F-19: **N/A as a set.** The delta touches no `packages/**`/`plugins/**` path and no product
source; the archetype gate matrix columns govern package/plugin product archetypes. The only
TypeScript file touched is `.github/scripts/ci-classify-changes.test.ts`, covered by the focused
test/format/lint wrappers above. No `quality:gate` obligation (that bar is for framework source).

## Anti-Pattern Check

AP-1…AP-25: **N/A as a set.** Out of scope — no doctrine-governed product surface was created or
modified (workflow infrastructure + run artifacts only). No `arch-debt.md` interaction.

## Arch-Debt Delta

| Metric                | Count | Evidence                                    |
| --------------------- | ----- | ------------------------------------------- |
| New entries           | 0     | no doctrine violation introduced or deepened |
| Resolved entries      | 0     | no debt entry touched                        |
| Deepened violations   | 0     | scope containment proven by diff accounting  |
| Unrecorded violations | 0     | doctrine/archetype N/A recorded in worklog with justification |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | **F-1 — slice granularity.** Design slices S1 (literals) and S2 (header) landed as a single commit `541eb914b` instead of two; S3 evidence spans `5fe82956d`+`0250dded1`. | `git show --stat 541eb914b` | none — content matches the design; each slice still touched the run dir and carried gate evidence |
| low | **F-2 — evidence-fidelity nuance (preserve).** The exercised stale branch (`e72da5161`) carries v1 group keys but `cancel-in-progress: false` **without** `queue:` (verified verbatim at its workflow lines 254/342) — not the eviction-capable `cancel-in-progress: true` that the S8/S10/S11 branches carried in the #1889 incident (run `33592310517`). Had the keys been shared, *this* arrival would have pended rather than evicted, so the fixed jobs' non-cancellation alone does not discriminate fixed vs unfixed for this arrival type. The discriminating observable is the cross-generation **concurrent execution** (impossible under a shared mutex) plus the fixed jobs' own conclusions; with disjoint groups, GitHub's documented concurrency semantics close the mechanism for any arrival configuration, including `cancel-in-progress: true`. The worklog sentence "the stale-v1 arrival would have shared and applied the old concurrency behavior" is loose for this branch. | stale-branch content fetch; API job windows; `plan.md` incident proof | none blocking — acceptance box 1 is literally satisfied (run IDs + per-job conclusions demonstrate a fixed-branch run not cancelled by a pre-#1846 arrival). Optionally tighten the wording in a follow-up docs pass |
| low | **F-3 — receipt wording.** Worklog labels the stale jobs "pending 06:23:43Z"; the API shows `started_at` 06:23:43Z (they ran ~43s, concurrently). | `/attempts/2/jobs` fetch | none — does not change the ordering or the conclusion |
| low | **F-4 — local YAML parse not independently reproducible.** No YAML module exists in the locked graph and adding one would violate lock hygiene, so this evaluator could not run a local full parse. Compensated: (a) GitHub's own parser executed this exact content at head (check-runs completed), (b) the diff changes only scalar values inside existing mapping entries plus comment lines, which cannot break YAML structure, (c) the generator's recorded parse (worklog E4, exit 0). | evaluator attempts (`@std/yaml` absent from `deno.lock`; no PyYAML) | none |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| A concurrency-isolation acceptance exercise should select an arrival whose configuration is eviction-capable (`cancel-in-progress: true`) when the mechanism under test is eviction; otherwise record the arrival's actual configuration and identify which observable discriminates (here: cross-generation concurrency). | hosted mixed-generation acceptance design | CI/workflow-infra harness runs | medium |

## Close-gate state (live at evaluated head)

- PR #1910: open, not draft, `mergeable_state: blocked`, head `0250dded1`; labels `type:fix`,
  `status:impl`, `area:tooling`, `priority:p1`, `orchestrator:internals`; milestone `0.0.7`; body
  carries `Closes #1908` → close-gated.
- PR Acceptance: box 1 unchecked (hosted demonstration), boxes 2–3 checked. PR Definition of Done:
  box 1 checked; boxes 2–4 unchecked (exact hosted acceptance receipt attached / IMPL-EVAL PASS /
  required CI + close-gate at immutable head). Issue #1908: open, both close-gated acceptance boxes
  unchecked.
- Check-runs at `0250dded1`: `check-test`, `quality`, `build`, `fresh-ui-quality`, all `classify`
  lanes, `core CI lane visibility` → **success**; runtime tiers and non-applicable jobs → skipped;
  **`close-gate` → failure** — this is the enforcement working as designed at `status:impl`, not a
  defect: merge must not proceed until the hosted receipt is attached to the PR, the PR DoD boxes
  and issue acceptance boxes are checked with linked evidence, and the PR reaches
  `status:ready-merge`.
- Commit trail: 5 commits + one `[PHASE: IMPL]` comment (2026-09-02T06:21:42Z, comment id
  `5505389845`).

## Verdict

| Field     | Value                                    |
| --------- | ---------------------------------------- |
| Verdict   | **PASS**                                 |
| Rationale | Approved scope is complete and proven: exactly the two repo-wide tier group literals changed to v2 with `cancel-in-progress: false` + `queue: max` untouched and the top-level per-ref group unchanged (mechanical diff accounting); the header documents the transition, the v1-cancellation diagnostic rule, and the operator guidance, extending rather than replacing the #1839 queue-policy paragraph; the regression test was tightened so the concurrency-key claim is real (exact v2 + explicit v1 absence). The hosted mixed-generation exercise — re-derived by this evaluator from attempt-1 receipts — proves key separation with real run/job IDs and timestamps, and the fixed jobs' conclusions survived the pre-#1846 arrival. The docker job's `runtime.wait.garnet` failure is an honest runtime baseline failure owned out-of-scope by #1858 (green two-tier run `33597731881`); it neither blocks this plan nor is relabelled green. Fidelity nuances are recorded as low findings F-1–F-4 with no required action. No doctrine violation, no debt delta, artifacts sufficient for resume. Blockers: none for this verdict. Pre-merge prerequisites remain open and are enforced by the failing `close-gate`: attach the hosted receipt, check the PR DoD and issue acceptance boxes with linked evidence, then advance the status lifecycle. |
