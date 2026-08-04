use harness

# Slice (owner-priority): stop the CI matrix on draft PRs — #1207 (p1)

Implementation supervisor for the PR closing #1207. Read the issue first. Owner directive:
draft PRs must stop firing e2e suites, non-code checks, lint, and above all close-gate —
cloud compute is being burned on every draft push of every slice.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-tools` (workflow/gate conventions)

## Milestone-run evaluator rule

Per milestone-run.md § Evaluator protocol + orchestrator ruling D6: no local formal PLAN-EVAL;
composed evaluation; mark the row accordingly; plan then implement in one run.

## Deliverable = the six issue boxes

Design constraints that matter:
- The branch-protection-required contexts (quality, check-test, deps-report) MUST materialize
  on the `ready_for_review` flip and on non-draft pushes — add `ready_for_review` to the
  `pull_request` event types wherever you gate with `github.event.pull_request.draft == false`;
  a required context that silently never runs strands PRs UNSTABLE (this run has paid that tax
  repeatedly — see #1187's evidence trail).
- close-gate: non-draft only; draft→ready stays the evaluation trigger.
- Preserve the capability-vector scoping (#1152) and the label overrides (`ci:skip-e2e` etc.) —
  compose, don't replace.
- Choose and record the minimal draft-push set (recommendation: fast check-test only, or
  nothing; state the rationale).
- RED-first evidence on a real draft PR; compute-delta estimate from this milestone's run
  history.

## Anticipated files

`.github/workflows/{ci,e2e-cli,code-quality,e2e-cli-prod-local,desktop,openhands-agent}.yml` —
sweep ALL workflows for pull_request triggers; per-job draft guards; docs note in the workflow
headers. No `packages/**`. Scoped wrappers for anything scripted; no new lint-ignores; no
`deno.lock` churn.

## PR contract

Branch `ci/no-matrix-on-drafts` (worktree provided), target `main`. Labels: `type:fix`,
`area:tooling`, `priority:p1`, exactly one `status:`; milestone `0.0.5`. `Closes #1207` with
truthfully-ticked boxes + quoted RED/AFTER evidence; authoritative `## Definition of Done`
fully ticked where truthful; no keyword-adjacent issue references. Note the self-reference
trap: YOUR OWN PR is a draft while you develop it — use it as the RED/AFTER demonstration
vehicle. Slice worklog/drift here; explicit-refspec push.
