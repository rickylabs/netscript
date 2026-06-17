# Drift — 5d umbrella

Append-only.
- D-5d-0: sub-branches forked in parallel from c64cb16 instead of split-strategy "fork off prior merge" chain; implementation phases must merge prior landings before starting (recorded in plan.md sequencing).

## D-5d-1 — PLAN dispatch run 1 produced zero artifacts (2026-06-12)
- All six OpenHands Kimi K2.7 runs on PRs #34-#39 ended without writing any run-dir files; only workflow trace commits landed.
- Root cause: SDK default max_iteration_per_run=500 exhausted during exploration (5d3-5d6 hit the hard limit; 5d1/5d2 finished with artifacts still pending). agent_runner returned 0 regardless, and the summary-retry prompt led cut-off agents to describe unwritten files as delivered ("Commit hash: TBD"). The 5d4/5d5/5d6 "READY FOR PLAN-EVAL" comments are therefore NOT trustworthy as completion claims, though their measured findings (e.g. 5d4: 113 combined doc-lint errors, abort-propagation gaps in createIncrementalStreamingResponse, plugin-streams coupling divergence) are real exploration output and reusable.
- Fix: PR #41 to main (iterations= trigger knob, truthful cutoff reporting + exit 3, always() commit-back preserving partial work, early-artifact contract line).
- Disposition: re-dispatch all six PLAN triggers after PR #41 merges, with iterations raised and/or scope split per trigger.

## D-5d-2 — WSL shell lacks reusable GitHub push credentials

- **What:** 5d1 and 5d4 implementation/evaluator agents repeatedly produced valid local commits but
  `git push` failed from WSL with `fatal: could not read Username for 'https://github.com': No such
  device or address`.
- **Expected:** Subagents commit and push regularly, then comment PR handoff.
- **Actual:** Source/evaluator state sometimes required GitHub connector comments or connector
  publication by the supervisor. Connector commits do not preserve local commit SHAs, so artifacts
  must record both local and remote IDs.
- **Policy:** Future subagents must attempt push once. If credentials are unavailable, they must
  record the blocker and hand off publication; the supervisor owns connector publication or PR
  comment fallback before launching the next dependent subwave.
- **Status:** open environment/process drift for Wave 5d.

## D-5d-3 — supervisor branch push blocked after local merge

- **What:** The local supervisor branch merged 5d1 and 5d4 successfully, but `git push origin
  feat/package-quality-wave5-apps-5d-fresh` failed from WSL.
- **Evidence:** Push failed with `fatal: could not read Username for 'https://github.com': No such
  device or address` after merge commit `3ae35dc`.
- **Impact:** Remote PR/branch does not yet contain the supervisor merge. Local native WSL worktrees
  can still merge the local supervisor branch before subwave implementation starts.
- **Action:** Supervisor owns publication fallback; subagents must not assume normal push credentials
  exist in their shell.


## D-5d-4 — 5d2 evaluator fallback due app-server usage limit

- **What:** The separate 5d2 IMPL-EVAL app-server session was launched from the native WSL worktree,
  but Codex app-server returned `usageLimitExceeded` before any evaluator work ran.
- **Disposition:** Supervisor ran the IMPL-EVAL gates directly from
  `/home/codex/repos/netscript-wave5-apps-5d2-builders` and posted the PASS verdict to PR #35 as
  comment `4700202752`.
- **Evidence:** Evaluated head `aa310dc`; builders tests, builders/form doc-lint, scoped builders
  check/lint/fmt, scoped builders doctrine scan, and `packages/fresh` publish dry-run all passed.
- **Impact:** Evaluation independence was preserved operationally by separating implementation from
  the supervisor-run evaluation evidence, but not by a second active app-server model turn.
- **Follow-up:** When app-server credits/rate limit reset, prefer a true separate app-server
  evaluator again. If unavailable, record the fallback and keep all evidence in PR comments.

## D-5d-5 — WSL GitHub SSH publication restored

- **What:** Earlier 5d supervisor and subagent pushes failed through the HTTPS credential helper.
- **Fix:** WSL Git remotes now use `git@github.com:rickylabs/netscript.git` with SSH key
  `/home/codex/.ssh/id_ed25519_netscript_wave5` authenticated as `rickylabs`.
- **Impact:** Future implementation agents must push after every slice from their native WSL
  worktree. Supervisor should still verify `git ls-remote` after each slice because app-server
  sessions can hit usage limits before final handoff.
- **Status:** D-5d-2/D-5d-3 are resolved for current WSL worktrees unless a specific worktree remote
  regresses to HTTPS.
