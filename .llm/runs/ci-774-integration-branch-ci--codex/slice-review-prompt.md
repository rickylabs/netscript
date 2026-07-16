use harness

Perform the Amendment A1 substantive slice review for uncommitted implementation slice 1 in
NetScript run `.llm/runs/ci-774-integration-branch-ci--codex/`, worktree
`/home/codex/repos/b10-774-ci`, branch `ci/774-integration-branch-ci`.

## SKILL

- `netscript-harness` — enforce the slice review gate and no-self-certification rule.
- `netscript-tools` — assess gate evidence, raw diff scope, and lock hygiene.
- `netscript-pr` — verify #774 scope, closing keyword, lifecycle, and required PR evidence.
- `rtk` — compress read-heavy git/grep inspection.

Read the named skills completely, then the approved `plan.md`, `plan-eval.md`, `worklog.md`,
`context-pack.md`, `drift.md`, and the full uncommitted diff. Review correctness, coherence with the
approved slice, gaps, overreach, GitHub Actions expression validity, lane-summary truthfulness,
preservation of classifier/label gating, and absence of lock/unrelated churn. Spot-check the recorded
validation as needed.

Write only `.llm/runs/ci-774-integration-branch-ci--codex/slice-review.md` with one verdict:
`PASS` or `FAIL_FIX`, plus concrete findings. Do not edit workflows or other artifacts. Do not
commit, push, change GitHub metadata, or run the expensive scaffold fleet.
