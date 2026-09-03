# Independent stable-cut review — bounded mechanical delta

Continue the existing independent GLM evaluation session, not the author/coordinator.
Repository AGENTS and release/tooling skills apply. This is a new, narrowly bounded release diff,
not another evaluation of #1983 or a new product implementation. Do not spawn workers.

PR #1984: release/cut-0.0.7 at b8fb15bc1, parent a2d5b8b75083769b946c03ab772e08f2634e2b35.
Evaluator worktree is /home/agent/projects/netscript/worktrees/007-eval-readme-cold, detached at
the exact release head. Preserve its four untracked prior verdicts. No product/source edits,
commits, pushes, PR mutations, container operations, or publication are authorized here.

The canonical release:cut command succeeded: all 64 changed files are intended coordinated
0.0.6 -> 0.0.7 version surfaces and native generated assets. Full source acceptance already passed:
canary publish 33762898477, exact production 33763460542 (README13/0, runtime104/0,
quickstart9/0), and same-version supplemental cleanup 33765493143 with all four counts zero.
All three final issue-only acceptances are closed. Do not repeat expensive runtime suites.

Review only the release delta for accidental non-version/source/dependency changes and whether
the native semantic generated-output verifier accepts the green canary inheritance. Use focused
git diff and the native release verifier/tests as appropriate, not broad speculative feature audits.
The read-only `release:publish -- v0.0.7 --notes-file <intro> --prev-tag v0.0.6 --dry-run`
is allowed if useful; never omit --dry-run. Intro resides at
/home/agent/projects/netscript/worktrees/007-primary/.llm/runs/release-0.0.7--orchestration/release-0.0.7-intro.md.
GitHub auth config is /home/agent/.config/netscript-release-gh; never print tokens.

Known note-only caveat: native closed-issue collection stops at 100; coordinator will reconcile
the public note with all paginated issues using the existing formatter. This is not product content
drift or a reason for another canary. Stable publication and pinned stable E2E remain mandatory.

Within one bounded turn, write
.llm/runs/readme-cold-release-proof--0.0.7/evaluate-stable-cut.md via apply_patch (or Edit),
with [PHASE: IMPL-EVAL] [VERDICT: PASS] or FAIL_FIX, immutable full head, exact checks and any
actual blocker. Do not wait for CI; coordinator independently verifies CI before merging.
