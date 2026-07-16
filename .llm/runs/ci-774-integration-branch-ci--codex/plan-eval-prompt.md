use harness

Perform PLAN-EVAL only for NetScript harness run
`.llm/runs/ci-774-integration-branch-ci--codex/` in worktree
`/home/codex/repos/b10-774-ci` on branch `ci/774-integration-branch-ci`.

## SKILL

- `netscript-harness` — enforce the Plan-Gate, artifact order, and separate-session verdict.
- `netscript-tools` — distinguish trustworthy evidence and preserve lock/worktree hygiene.
- `netscript-pr` — verify closing keyword, phase state, and the planned PR evidence shape.
- `rtk` — compress any read-heavy git/grep inspection.

## Required protocol

1. Read the named skills completely before task actions.
2. Read `.llm/harness/evaluator/plan-protocol.md`,
   `.llm/harness/gates/plan-gate.md`, and
   `.llm/harness/evaluator/verdict-definitions.md`.
3. Read the run's `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, and `drift.md`.
4. Spot-check load-bearing findings against `.github/workflows/ci.yml` and
   `.github/workflows/e2e-cli.yml` and the focused git history/status. Do not implement anything.
5. Write only `.llm/runs/ci-774-integration-branch-ci--codex/plan-eval.md`, using the template and
   emitting exactly `PASS` or `FAIL_PLAN`.

This is infrastructure-only: package archetype, doctrine gates, and jsr-audit are N/A with the
reason already recorded. Confirm each commit slice is ordered, under 30, names its proving gate,
and names its files. Run the evaluator's own open-decision sweep. Do not change workflows, other run
artifacts, `deno.lock`, GitHub metadata, or branch settings. Do not commit or push.
