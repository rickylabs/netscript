# Context pack — release 0.0.8 milestone run (resume here)

1. Read `supervisor.md` (mandate and decisions), then `plan.md` (the locked wave plan, PLAN-EVAL-approved 2026-10-09 19:18Z).
2. **The control plane is `milestone-cluster-state.json`.** `milestone-status.md` is rendered from it; never hand-edit the status. To change state, edit the state and then:
   - `deno task harness:milestone:render -- .llm/runs/release-0.0.8--orchestration`
   - `deno task harness:milestone:validate -- .llm/runs/release-0.0.8--orchestration`
3. **Live truth is GitHub.**
   - Milestone 0.0.8 open issues = the active inventory.
   - Leaf PRs carry `Refs rickylabs/netscript#2103`.
   - "Merged" means PR state, never commit ancestry.
4. **Next actions** live in the state's `reporting.orchestratorMatrix[*].nextAction` and `reporting.canary.criticalPath`.
5. **Merge gate** (coordinator only): CI green on the exact head, a Sol MERGE at the same head, every review thread resolved (GraphQL `isResolved`) plus `check:review-threads`, local gates pasted, and zero unticked boxes on closed issues. Then apply `status:ready-merge`, re-run CI for the close-gate, squash-merge, and append the merge to `cut-trace.md`.
6. **Canaries are owner-only.** At each group boundary, post the first-parent merge list on #2103.
