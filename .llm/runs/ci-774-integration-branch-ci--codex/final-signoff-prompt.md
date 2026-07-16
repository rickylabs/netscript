use harness

Perform the final tracked-artifact sign-off for completed run
`.llm/runs/ci-774-integration-branch-ci--codex/` after IMPL-EVAL PASS.

## SKILL

- `netscript-harness` — verify final run artifacts, evaluator separation, and close phase.
- `netscript-tools` — inspect raw git scope and preserve lock hygiene.
- `netscript-pr` — confirm the PR remains draft with the requested labels/milestone and closing keyword.
- `rtk` — compress read-heavy git/diff inspection.

Inspect raw status and diff. Confirm workflow files are unchanged from implementation commit
`e5924b48`, `evaluate.md` says PASS from session `319e284e-b456-401d-a75a-c972bd6631e3`, final
worklog/context/body/session record are accurate, no lock/unrelated churn exists, and the PR is not
self-promoted to ready-merge. If true, stage only the expected final run artifacts and
`.llm/2026-07-16-fix-774-integration-branch-ci.md`, commit with exactly
`chore(harness): record the #774 implementation verdict`, and push only with
`git push origin HEAD:refs/heads/ci/774-integration-branch-ci`. Report the hash and remote result.
Do not edit files, change GitHub metadata, merge, or run expensive gates. Stop on any divergence.
