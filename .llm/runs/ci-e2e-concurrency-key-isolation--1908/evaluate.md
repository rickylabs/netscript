# Evaluation: #1908 / PR #1910 — runtime concurrency-key isolation

Independent IMPL-EVAL. The generator session (Codex · GPT-5.6 Sol · high, thread
`01a0607f-b1df-7b33-8f3f-cdb1b872b49b`, per `codex-thread-ids.md`) is never the evaluator session.
**Two** separate evaluator sessions produced this record, and both ran their own commands with real
captured exits:

- **Evaluator session 1** evaluated frozen head `0250dded1…` and drafted this artifact. While it
  ran, the concurrent documentation-correction commit `68294e6de` landed, and session 1's artifact
  was then committed as `bb2b60bd4`.
- **Evaluator session 2 (final verdict, this document)** performed the incremental final-head
  evaluation: verified the delta, re-ran the cheap static gates at the promoted head, and re-bound
  the verdict. Sessions 1 and 2 are distinct sessions, and both are distinct from the generator —
  no lane self-certifies.

## Metadata

| Field             | Value                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| Run ID            | `ci-e2e-concurrency-key-isolation--1908`                                  |
| Target            | PR #1910 (`fix(ci): isolate runtime concurrency from stale workflow branches`) closing issue #1908 |
| **Evaluated head (final verdict)** | **`bb2b60bd4c91f0a80681fe9296b815748e10b8c4`** — = local worktree HEAD (verified by `git rev-parse`) = live PR #1910 `head_sha` (verified via API during session 2); worktree clean at evaluation time |
| Evaluated head (session 1) | `0250dded1ecc82a861f4e111b87ef3b968d6095f`                        |
| Head lineage      | `0250dded1` → `68294e6de` (concurrent docs-only correction) → `bb2b60bd4` (session-1 artifact committed). Session 2 verified delta `0250dded1..68294e6de` and re-bound the verdict to `bb2b60bd4`. |
| Baseline          | `d5c5810db` (`main` at dispatch; merge-base with `bb2b60bd4` is exactly `d5c5810db`, so `d5c5810db...HEAD` is exactly the branch delta) |
| Archetype         | N/A — `.github/workflows` + run artifacts only; no `packages/**`/`plugins/**` surface |
| Scope overlays    | none                                                                      |
| Evaluator         | separate-session IMPL-EVAL, 2026-09-02; final binding by incremental session 2 |
| Release-gate class | **n/a** — not a release cut/publish run (no version, branch, tag, or publish surface touched; protocol rule 14 n/a branch) |

### Evaluator route identity

| Session        | Head bound  | Requested                                                                                     | Observed                                                                                              | Verdict |
| -------------- | ----------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------- |
| 1              | `0250dded1` | `formal_impl_evaluation` quota-block fallback (drift D-08, owner-reported native Fable 5 limit): local Claude/OpenRouter · `z-ai/glm-5.3-flash` · effort `max` | local Claude Code + OpenRouter transport · `z-ai/glm-5.3-flash` (session runtime identity) · `max` per dispatch attestation | matched |
| 2 (final)      | `bb2b60bd4` | same fallback route: local Claude/OpenRouter · `z-ai/glm-5.3-flash` · effort `max`            | local Claude Code + OpenRouter transport · `z-ai/glm-5.3-flash` (session runtime identity) · `max` per dispatch attestation | matched |

Transport is an approved open-model relay (lane-policy invariant 6). Generator family
(OpenAI/Codex) ≠ evaluator family (GLM/OpenRouter) in both sessions, and session 2 ≠ session 1.

## Incremental delta verification (session 2, at the final head)

| Check | Result | Evidence |
| --- | --- | --- |
| Delta `0250dded1..68294e6de` is comments + drift rows only | PASS | `git diff --stat`: `.github/workflows/e2e-cli.yml` (37+/14−) + run `drift.md` (4 appended rows). Filtering the workflow diff to non-comment lines returns **zero** lines (grep rc=1 on empty match) — every changed workflow line is a `#` comment |
| Workflow executable content unchanged `68294e6de` → `bb2b60bd4` | PASS | `git diff --quiet 68294e6de..bb2b60bd4 -- .github/workflows/e2e-cli.yml` → IDENTICAL |
| Workflow executable content at final head = content exercised by the hosted receipts | PASS | non-comment filter over `5fe82956d..bb2b60bd4` workflow diff is **empty**; the intervening commits touch only comments and run-dir artifacts. The receipts were captured at `5fe82956d` and remain binding at `bb2b60bd4` |
| Regression test unchanged since session 1 | PASS | `git diff --stat 0250dded1..bb2b60bd4 -- .github/scripts/` empty |
| Both v2 group literals present, queue directives untouched | PASS | read-back at head: `e2e-scaffold-runtime-global-v2` (line 301) and `e2e-scaffold-runtime-sqlite-global-v2` (line 388), each still followed verbatim by `cancel-in-progress: false` + `queue: max` |
| Top-level per-ref group unchanged | PASS | lines 129–131: `e2e-cli-${{ github.workflow }}-${{ github.ref }}` + `cancel-in-progress: true` |
| Non-comment branch delta vs baseline | PASS | over `d5c5810db..bb2b60bd4`: exactly the two group-literal pairs, nothing else |
| **Mechanism correction is accurate, not merely harmless** | PASS | `git show 6bb9c00f9` (#1846): **11 insertions, 0 deletions**; the only concurrency-relevant lines are two `+ queue: max` lines plus a comment. #1846 never touched `cancel-in-progress`, so the corrected header claim (pending displacement from a missing `queue: max`, not `cancel-in-progress: true` re-imposition) is verified against the actual commit |
| Corrected header statements all present at head | PASS | pending-displacement mechanism with the `steps: 0` explanation; `ci:skip-e2e` as a *policy*-level skip whose opted-in jobs still enter the group; GitHub **server-side merge** as the rescue path for the workflow-scope asymmetry; generation-scoped cancel-and-redispatch warning |
| Hosted acceptance applicability unchanged | PASS | the exercise design, run/job receipts, and the #1858 runtime-failure classification (drift D-07) are untouched; session 2 re-derived no new runtime evidence and ran no runtime tier (out of scope per dispatch) |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                                            |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate satisfied before implementation | PASS | `PLAN-EVAL: N/A` recorded with concrete justification in `worklog.md` (mechanical fix; literals, trade-off, non-scope, gates locked in `plan.md` committed `74e8757ae`/`1af59770b` before implementation commit `541eb914b`) |
| Design section exists in worklog       | PASS   | `## Design` with all 7 required elements: public surface (Queue policy contract), domain vocabulary, ports, constants (v1→v2 table), commit slices, deferred scope, contributor path |
| Commit slices match design plan        | PASS   | 5 implementation commits (`74e8757ae`, `1af59770b`, `541eb914b`, `5fe82956d`, `0250dded1`), every one touching the run dir; deviation noted as finding F-1 (design S1+S2 in one commit). Post-evaluation commits `68294e6de` (docs-only correction, verified above) and `bb2b60bd4` (session-1 artifact) complete the trail at 7 |
| Each slice has a passing gate          | PASS   | S1/S2: focused regression test 60/60 + exact diff evidence; S3: captured-exit evidence in worklog (E1–E5); co-author slice `5fe82956d` tightened the gate itself; docs-only commit `68294e6de` proven comments-only + static gates re-run at head |
| No speculative seams (unused files)    | PASS   | No new files outside the run dir; product delta is one workflow edit and one existing test file edit (`git diff --name-only d5c5810db...bb2b60bd4`) |
| Constants used for finite vocabularies | PASS   | v1/v2 key generations defined as constants in the Design table; GitHub Actions YAML cannot import constants, so the regression test asserts the exact newline-terminated literals as the enforcement point |
| Agent brief carries `use harness` + `## SKILL` | PASS | `implement.md` lines 1–8 (protocol rule 13; PR bodies exempt)                                                                                              |

## Static Gates

| Gate               | Command or check                                                                 | Result | Evidence                                                                                       |
| ------------------ | -------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| Focused regression (re-run at final head) | `deno test --allow-read --allow-write --allow-env .github/scripts/ci-classify-changes.test.ts` | PASS | `ok`, 60 passed / 0 failed, `REAL_EXIT=0` (session 2; deno test type-checks the touched module on execution) |
| Whitespace (re-run) | `git diff --check d5c5810db...bb2b60bd4`                                        | PASS   | exit 0 (session 2)                                                                             |
| Format (re-run)    | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .github/scripts --ext ts` | PASS | 11 files, 0 findings, exit 0 (session 2, wrapper-sourced)                                       |
| Lint (re-run)      | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .github/scripts --ext ts` | PASS | 11 files, 0 occurrences, exit 0 (session 2, wrapper-sourced)                                    |
| Lock hygiene       | `git diff --stat d5c5810db...bb2b60bd4 -- deno.lock`                              | PASS   | empty diff, exit 0 (sessions 1 and 2); neither evaluator touched the lock or ran dependency resolution |
| Test tightening    | `git diff` of `ci-classify-changes.test.ts`                                       | PASS   | inherited (file unchanged since session 1): both v2 assertions require newline-terminated literals; explicit absence assertions for both v1 literals (v1 spelling is not a substring of the v2 literal, so the assertions are meaningful) |
| YAML validity at final head | GitHub's own parser executed the workflow at `bb2b60bd4`                 | PASS   | `e2e-cli` run `33602233935` (completed/skipped) and `ci` run `33602233938` (in progress) were created from this exact content, event `pull_request`. This extends finding F-4's compensation to the final head |
| Doc lint / publish dry-run | N/A                                                                      | N/A    | no package export surface touched                                                               |

## Runtime Gates

Re-derived by evaluator session 1 from the GitHub API (attempt-1 job receipts fetched explicitly
via `/attempts/1/jobs`; the run summary alone shows the later attempt-2 re-run, a cancelled
~2-minute re-run, not the acceptance receipt). Session 2 ran **no** runtime tier (explicitly out of
scope); the receipts remain binding because the workflow's executable content at `bb2b60bd4` is
identical to `5fe82956d`, the head they were captured at (verified above).

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Mixed-generation concurrency isolation | Hosted fixed-v2 vs stale-v1 scheduler exercise (attempt 1 receipts) | PASS | **Fixed v2** run [`33598546960`](https://github.com/rickylabs/netscript/actions/runs/33598546960) attempt 1 @ `5fe82956d`, branch `ci/e2e-concurrency-key-isolation` (attempt started 2026-09-02T06:22:24Z): docker job `100147054107` started 06:22:57Z → terminal **failure** 06:32:43Z (9m46s, non-cancelled); sqlite job `100147054142` started 06:22:56Z → operator-cancelled 06:40:02Z (17m06s, i.e. 16m19s past the stale arrival). **Stale v1** run [`33596134134` attempt 2](https://github.com/rickylabs/netscript/actions/runs/33596134134/attempts/2) @ `e72da5161`, branch `fix/aspire-13-5-s9-skills-mcp-alignment` (attempt started 06:23:22Z): docker job `100147234478` and sqlite job `100147234673` both started 06:23:43Z → operator-cancelled 06:24:26Z |
| Decisive ordering | window comparison | PASS | Fixed jobs started 06:22:56/57Z, 46–47s **before** the stale arrival started 06:23:43Z, and both stale tier jobs **ran concurrently** with the fixed tier jobs (overlapping windows, two jobs per tier). Under a shared mutex concurrent execution is impossible; cross-generation concurrency is the discriminating observable of key separation, and both fixed jobs reached their own conclusions after the arrival |
| Stale-branch classification | content fetch of `e2e-cli.yml` @ `e72da5161` | PASS | Stale branch verifiably carries the v1 literals `e2e-scaffold-runtime-global` / `e2e-scaffold-runtime-sqlite-global` (genuinely pre-#1846). See finding F-2 for its cancel directive |
| `runtime.wait.garnet` failure classification | real job log, job `100147054107` (236 KB, fetched via `gh api …/logs --allow-escape-sequences`) | PASS (classified, out-of-scope) | `FAILED GATE: runtime.wait.garnet`; `aspire wait garnet --status healthy --timeout 300` exited 1; `Summary: passed=46 failed=1`. Honest runtime failure — **not green, not infrastructure noise, not a #1908 concurrency failure**. Owned by open PR [#1858](https://github.com/rickylabs/netscript/pull/1858) (`fix(cli,e2e): make Garnet readiness deterministic…`, head `ebe818b70`, `gate:e2e`+`ci:full`), whose run [`33597731881`](https://github.com/rickylabs/netscript/actions/runs/33597731881) (06:10:45Z→06:18:58Z) completed **both** runtime tiers successfully (sqlite `100144561733` success 06:16:45Z; docker `100144561746` success 06:18:49Z). It therefore does not block this plan; the isolation PASS and the pre-#1858 runtime-baseline FAIL are kept as separate verdicts (drift D-07) |
| Local `scaffold.runtime` | rerun | NOT_RUN | Explicitly out of scope for both sessions per dispatch (would test application runtime, not GitHub concurrency admission, and would duplicate the hosted receipt) |
| `e2e-cli-gate` label hygiene | live PR labels + runs at final head | PASS | No gate label present; `e2e-cli` workflow at `bb2b60bd4` (run `33602233935`) shows the tier jobs skipped — evidence/evaluator/doc commits do not repeat the expensive gate |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| GitHub Actions scheduler (sole consumer of the group literals) | hosted mixed-generation exercise above | PASS | Real scheduler admitted four runtime jobs (two per tier) across two key generations concurrently; fixed jobs unaffected by the v1 arrival |
| Workflow regression test (consumes workflow text) | focused suite at the final head | PASS | 60/60, exit 0 at `bb2b60bd4` (session 2) |

## Fitness Gates

F-1…F-19: **N/A as a set.** The delta — including the `68294e6de` correction — touches no
`packages/**`/`plugins/**` path and no product source; the archetype gate matrix columns govern
package/plugin product archetypes. The only TypeScript file touched is
`.github/scripts/ci-classify-changes.test.ts`, covered by the focused test/format/lint wrappers
above. No `quality:gate` obligation (that bar is for framework source).

## Anti-Pattern Check

AP-1…AP-25: **N/A as a set.** Out of scope — no doctrine-governed product surface was created or
modified (workflow infrastructure + run artifacts only). No `arch-debt.md` interaction.

## Arch-Debt Delta

| Metric                | Count | Evidence                                    |
| --------------------- | ----- | ------------------------------------------- |
| New entries           | 0     | no doctrine violation introduced or deepened |
| Resolved entries      | 0     | no debt entry touched                        |
| Deepened violations   | 0     | scope containment proven by diff accounting across both sessions |
| Unrecorded violations | 0     | doctrine/archetype N/A recorded in worklog with justification |

## Findings

### Resolved at the final head

| Severity | Finding | Resolution evidence |
| -------- | ------- | ------------------- |
| medium (was open at session-1 start) | **R-1 — header mechanism mis-attribution.** The header originally attributed the defect to pre-#1846 branches bringing `cancel-in-progress: true` into the shared tier group. Session 1's sweep of all 147 origin branches found `cancel-in-progress: false` on the tier groups everywhere; #1846's diff only ever added `queue: max` (the supervisor's per-branch grep had counted the **top-level per-ref** group's `cancel-in-progress: true`, line 131 at head, as the tier's). The true mechanism is **pending displacement**: without `queue: max` a branch falls back to one-running-plus-one-pending admission and each arrival cancels the previously pending entry — exactly why every observed eviction showed `steps: 0`. | Corrected in the workflow header by `68294e6de` and recorded as corrected drift D-06. Session 2 verified the correction against `git show 6bb9c00f9` (11 insertions, 0 deletions; only `queue: max` added) and confirmed all four corrected statements are present at head. The `-v2` keying removes the shared group entirely, so the change itself is unaffected by which mechanism is stated |

### Remaining (all low, none blocking)

| Severity | Finding | Status at `bb2b60bd4` | Required action |
| -------- | ------- | --------------------- | --------------- |
| low | **F-1 — slice granularity.** Design slices S1 (literals) and S2 (header) landed as a single commit `541eb914b` instead of two; S3 evidence spans `5fe82956d`+`0250dded1`. | unchanged (`git show --stat 541eb914b`) | none — content matches the design; each slice still touched the run dir and carried gate evidence |
| low | **F-2 — arrival-configuration fidelity nuance (preserve).** The exercised stale branch (`e72da5161`) carries v1 group keys but `cancel-in-progress: false` **without** `queue:` (verified verbatim at its workflow lines 254/342) — not an eviction-capable arrival. With the R-1 correction the nuance now reads cleanly: the harm a v1 arrival poses is **pending displacement** of other v1-generation queued jobs, and v2 keying removes the shared group for any arrival configuration. The discriminating observable recorded for this exercise remains the cross-generation **concurrent execution** (impossible under a shared mutex). The worklog sentence "the stale-v1 arrival would have shared and applied the old concurrency behavior" is superseded by the corrected header + drift D-06. | preserved as recorded | none blocking — acceptance box 1 is literally satisfied (run IDs + per-job conclusions demonstrate a fixed-branch run not cancelled by a pre-#1846 arrival) |
| low | **F-3 — receipt wording.** Worklog labels the stale jobs "pending 06:23:43Z"; the API shows `started_at` 06:23:43Z (they ran ~43s, concurrently). | unchanged (`/attempts/2/jobs` fetch) | none — does not change the ordering or the conclusion |
| low | **F-4 — local YAML parse not independently reproducible.** No YAML module exists in the locked graph and adding one would violate lock hygiene. | **further compensated at the final head**: GitHub's own parser created runs from the `bb2b60bd4` content (`e2e-cli` `33602233935`, `ci` `33602233938`); the delta over the already-parsed `0250dded1` content is comments-only, which cannot change YAML structure; the generator's recorded parse (worklog E4, exit 0) | none |
| low | **F-5 — CI in flight at observation (lifecycle, not a head defect).** At the observed time (2026-09-02 ~07:09–07:16Z) the `ci` run `33602233938` at `bb2b60bd4` was `in_progress` with `check-test` running ~6 min (started 07:10:29Z); combined commit status `pending`. | the `close-gate` check-run at the same head already reports **success**; the in-flight check runs on identical content, not a head change | none for this verdict — merge must simply await current-CI completion |
| low | **F-6 — duplicate drift row IDs.** The appended correction rows reuse ids D-06/D-07/D-08 with different severity labels ("evidence error, corrected" / "doc accuracy"), so the append-only drift table contains two rows each for D-06, D-07, and D-08. | observed in the `bb2b60bd4` drift table; severity labels disambiguate the pairs | none — optional renumber in a follow-up artifacts pass; content of every row is accurate |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| A concurrency-isolation acceptance exercise should select an arrival whose configuration is eviction-capable (`cancel-in-progress: true`) when the mechanism under test is eviction; otherwise record the arrival's actual configuration and identify which observable discriminates (here: cross-generation concurrency). | hosted mixed-generation acceptance design | CI/workflow-infra harness runs | medium |
| When a correction commit lands while an independent evaluation is in flight, the existing verdict is **not promotable** until re-bound to the new immutable head. For a comments/doc-only delta, the incremental re-binding needs only: filtered-diff proof that no directive/test moved, verification that the correction itself is accurate against the cited source, and a re-run of the cheap static gates at the new head — not a hosted re-run, whose receipts stay binding while executable content is unchanged. | incremental final-head evaluation | any harness run whose evaluated head moves mid-evaluation | high |

## Close-gate state (live at the final head, observed 2026-09-02 ~07:09–07:16Z)

- PR #1910: open, not draft, `mergeable_state: blocked` (normal while `ci` is in progress), head
  `bb2b60bd4…` exactly; labels `type:fix`, **`status:ready-merge`**, `area:tooling`, `priority:p1`,
  `orchestrator:internals`; milestone `0.0.7`; body carries `Closes #1908` → close-gated.
- Lifecycle advanced since session 1: `status:impl` → `status:ready-merge`, with a
  `[PHASE: MERGE-PACKET] [STATUS: READY]` comment (2026-09-02T07:09:14Z, id `5505854986`) joining
  the `[PHASE: IMPL]` comment (06:21:42Z, id `5505389845`).
- Issue #1908: open, `status:ready-merge`, milestone `0.0.7`; **both acceptance boxes checked**
  (hosted demonstration with run IDs and per-job conclusions; transition documented in the header).
- PR Acceptance: all three boxes checked. PR Definition of Done: all four boxes checked, including
  the exact hosted acceptance receipt and the independent IMPL-EVAL PASS.
- Check-runs at `bb2b60bd4`: **`close-gate` → success** (was `failure` at `0250dded1` — the gate
  enforced the open DoD at `status:impl` as designed, and now passes at `status:ready-merge`);
  `quality`, `build`, `fresh-ui-quality` → success; all `classify` lanes and
  `core CI lane visibility`/`scaffold CI lane visibility` → success/skipped as designed;
  `check-test` → in_progress on `ci` run `33602233938`; runtime tiers, `scaffold-static`, deploy,
  desktop, and non-applicable jobs → skipped (`e2e-cli-gate` label absent).
- Remaining pre-merge (lifecycle, not verdict blockers): current CI on `bb2b60bd4` completing
  (in-flight at observation), then the owner merge from a credential that may push the branch or
  perform the server-side merge.

## Verdict

| Field     | Value                                    |
| --------- | ---------------------------------------- |
| Verdict   | **PASS** |
| Bound head | `bb2b60bd4c91f0a80681fe9296b815748e10b8c4` |
| Rationale | The final head adds only workflow header comments, four drift rows, and the session-1 evaluation artifact on top of the state session 1 already passed: filtered diffs prove no group literal, queue directive, top-level group, regression-test line, or acceptance surface moved, and the workflow's executable content is byte-identical to `5fe82956d`, the head the hosted receipts were captured at — so those receipts remain binding without a re-run. The concurrent correction is not merely safe, it makes the artifact more truthful: the corrected pending-displacement mechanism is verified this session against #1846's actual 11-insertion diff, and all four corrected statements are present at head. Cheap static gates re-run green at the final head (focused test 60/60, fmt/lint clean, whitespace clean, lock untouched). Scope containment, no doctrine surface, no debt delta. Finding R-1 is resolved; F-1–F-6 remain, all low, none requiring action. Close-gate now passes at the head with every issue-acceptance and PR DoD box checked and the lifecycle at `status:ready-merge`. Blockers: none for this verdict. Pre-merge steps that remain are lifecycle only: in-flight CI on this exact head completing, then the owner merge. |
