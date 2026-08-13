# Research — feat-milestone-cluster-harness--authoring

## Re-baseline

- Carried-in source: the completed 0.0.6 four-orchestrator release run.
- Re-derived against `main` @ `624e1d736` on 2026-08-13.
- Existing profile: `workflow/milestone-run.md` and `agent-milestone-orchestrator` cover one
  milestone orchestrator delegating one supervisor per PR, but not the proven four-topic cluster.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | Step 0 does not close stale/duplicate/superseded inventory or publish a dependency DAG. | `workflow/milestone-run.md` stage A/B |
| 2 | Gate wrappers exist, but durable command receipts are not the universal worker/CI contract. | `.llm/tools/run-deno-*.ts`, CI workflows |
| 3 | Automatic phase eval already has immutable-head claims and model overrides; the profile must compose it, not duplicate dispatch. | `openhands-phase-eval.yml` |
| 4 | 0.0.6 proved exclusive topic ownership, read-only watchers, WIP limits, meaningful canaries, and a singleton release writer. | release run evidence recorded in owner retrospective |
| 5 | Generic supervisor runs mandate stacked integration branches, which conflicts with the proven milestone cluster's direct-to-main leaf PRs. | `workflow/supervisor.md`, `workflow/activation.md` |
| 6 | The IMPL-EVAL status helper removes and re-adds an already-correct status, producing redundant workflow shells. | `.github/scripts/phase-eval-status.mjs` |
| 7 | Ready-transition status failure is currently diagnostic-only, so paid evaluation may run without a lifecycle state that can consume its verdict. | `openhands-phase-eval.yml`, status workflow tests |
| 8 | The PR merge helper's OpenHands acceptance needs an immutable-head, terminal-verdict proof rather than the latest PASS-shaped comment alone. | `.llm/tools/agentic/github/gh-pr.ts` |
| 9 | Milestone cleanup alone can miss urgent or high-leverage work filed outside the board; Step 0 must sweep unmilestoned, Backlog, and later milestones before scope freezes. | owner correction, 2026-08-13 |

## Resolved design question

- A small generic gate-receipt runner owns process timing, exact command, immutable SHA, terminal
  status, log digest, and durable output. Existing scoped Deno wrappers and E2E tools remain the
  commands inside that envelope; their domain reports are referenced rather than duplicated.
