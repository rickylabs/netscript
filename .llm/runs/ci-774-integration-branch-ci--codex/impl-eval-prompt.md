use harness

Perform final IMPL-EVAL only for NetScript run
`.llm/runs/ci-774-integration-branch-ci--codex/` in worktree
`/home/codex/repos/b10-774-ci`, branch `ci/774-integration-branch-ci`, PR #787. This must be a new
session, separate from the Codex generator, PLAN-EVAL session, and A1 slice-review session.

## SKILL

- `netscript-harness` — enforce final evaluator protocol, process verification, and verdict rules.
- `netscript-tools` — independently verify YAML/test evidence, raw git state, and lock hygiene.
- `netscript-pr` — inspect the PR commit/comment trail, closing keyword, labels/milestone, and close-gate state.
- `rtk` — compress read-heavy git/grep inspection without using filtered output as sole gate proof.

## Required protocol

1. Read the named skills completely before task actions.
2. Read `.llm/harness/evaluator/protocol.md`, `verdict-definitions.md`, `workflow/run-loop.md`, and
   the approved run artifacts (`research.md`, `plan.md`, `plan-eval.md`, `worklog.md`,
   `context-pack.md`, `drift.md`, `slice-review.md`).
3. Inspect the full committed diff against `origin/feat/beta10-integration`, commit history, and all
   prompt/brief artifacts. Verify implementation followed the Design checkpoint and PLAN-EVAL
   preceded implementation.
4. Independently rerun the smallest applicable gates: parse workflow YAML/structure without
   retaining lock churn, run the frozen classifier test, audit all PR base filters, and inspect the
   shell/expression logic. `actionlint` is unavailable unless you independently find it installed.
5. Read PR #787 and issue #774 through the GitHub API if needed, resolving the token only through
   `.llm/tools/agentic/lib/agentic-lib.ts`. Verify the live commit/comment trail, labels, milestone,
   closing keyword, required-check ruleset claim, and close-gate state. Do not change settings or
   GitHub metadata.
6. Write only `.llm/runs/ci-774-integration-branch-ci--codex/evaluate.md` using the template. Emit
   exactly one verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.

This is infrastructure-only; package doctrine/JSR gates are N/A. Do not edit workflows or other run
artifacts, fix findings, commit, push, merge, mark ready, or run the expensive scaffold fleet. Do not
modify `deno.lock`; use `--no-lock`/`--frozen` where applicable and stop if any validation dirties it.
