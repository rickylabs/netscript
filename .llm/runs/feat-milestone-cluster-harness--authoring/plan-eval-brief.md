# Read-only PLAN-EVAL brief

You are the independent PLAN-EVAL for NetScript PR #1636. This is a read-only evaluation. Do not
edit files, GitHub state, branches, labels, or sessions.

Read fully:

- `.llm/runs/feat-milestone-cluster-harness--authoring/research.md`
- `.llm/runs/feat-milestone-cluster-harness--authoring/plan.md`
- `.llm/runs/feat-milestone-cluster-harness--authoring/worklog.md`
- `.llm/harness/workflow/milestone-run.md`
- `.llm/harness/workflow/run-loop.md`
- `.llm/harness/workflow/lane-policy.md`
- `.agents/skills/agent-milestone-orchestrator/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.github/workflows/openhands-phase-eval.yml`
- `.github/workflows/openhands-agent.yml`
- `.github/scripts/phase-eval-status.mjs`

Evaluate whether the plan is implementation-ready, simple, deterministic, and sufficient for:

1. Step 0 intake across unmilestoned, Backlog, later milestones, and the target milestone; only
   critical blockers and evidence-backed, release-coherent high-value features may be pulled in.
2. Complete cleanup/disposition, owner ratification, dependency/RFC DAG, four exclusive topic
   orchestrators, direct-main leaf PRs, read-only watchers, bounded WIP, one expensive gate, one
   release captain, meaningful canary checkpoints, and stable artifact-E2E completion.
3. One generic receipt envelope around existing repo-native check/lint/fmt/test/E2E tools; durable
   atomic JSON in CI and at-most-once lifecycle memory for workers, without overstating crash-safe
   exactly-once execution.
4. Closing false-green wrapper behavior before receipts become authoritative.
5. Exact-once evaluator lifecycle: idempotent status transitions, fail-closed status entry, live
   phase/head revalidation before spend, terminal IMPL verdict bound to current head, existing
   atomic claims/model overrides retained, and clearer Action names.
6. A bounded file/test scope that does not overbuild a distributed lock service or duplicate
   existing E2E reports.

Return one verdict: `PASS_PLAN` or `FAIL_PLAN`. Then list blocking findings first, followed by
non-blocking refinements. Every finding must cite exact repository files and a concrete missing or
excess contract. Do not repeat the plan as praise.
