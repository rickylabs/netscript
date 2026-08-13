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

## Open questions

- Which existing command-runner primitive can own a single JSON receipt schema without duplicating
  the scoped Deno wrappers or E2E reports?

