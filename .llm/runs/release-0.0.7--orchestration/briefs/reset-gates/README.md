# Native reset-gate dispatch

This directory is the coordinator-owned source of truth for the six formal gates parked until
Saturday 2026-08-15 00:00 Europe/Zurich. `dispatch.json` fixes the order, exact remote source heads,
worktrees, routes, and output artifacts.

Rules:

- Do not launch any entry before `launchAfter`.
- The Codex milestone coordinator remains the only active coordinator before the reset.
- Dispatch exactly one evaluator at a time and reconcile its result before starting the next.
- Use the exact per-entry native Claude Sonnet 5 route in `dispatch.json`: low effort for bounded
  mechanical review and medium for substantive review. This is the owner's reset override.
- Do not launch Fable mechanically. Fable is available only after a recorded Sonnet capability
  failure proves the same evidence contract cannot be met efficiently and the coordinator amends
  the entry. OpenRouter, DeepSeek, Minimax, AGY, and silent substitutions remain unauthorized.
- Start `/remote-control` in every native evaluator session and record its session, bridge, PID, and
  cwd in the verdict artifact so the owner can see the lane.
- Resolve the PR and remote branch independently. A mismatch with `sourceHead` is a hard refusal,
  not permission to evaluate a nearby commit.
- Evaluators write verdict evidence only. They do not implement, merge, publish, change labels,
  update central state, or take an expensive-gate lease.
- The coordinator verifies the verdict commit, updates the leaf head/phase, renders status, and
  validates cluster state before any next transition.

The order deliberately clears the harness-tooling IMPL-EVAL first, then the second ready-to-merge
fix, before opening four plan-gated implementation queues. All six leaves are Wave 0 and the central
dependency DAG contains no edge between them. Broad source/CI/hold reconciliation is shared in the
coordinator record, but harness law still requires one fresh evaluator session per formal gate.
