# Research

- Issue #1115 requires a readable live rollout follower, thread-id resolution shared with
  `codex-watch`, per-session state from rollout evidence, worktree/artifact evidence, and docs.
- Tonight's verifier evidence strengthens the state contract: the surface must distinguish
  `working`, `idle`, `dead`, and `refused`; process liveness alone is not authoritative.
- `codex-watch.ts` already contains rollout resolution and bounded-tail logic, but both are private.
- `agentic-lib.ts` already recognizes terminal `task_complete`; `classify-codex-failure.ts` trusts
  only structured `error`/`turn_aborted` records and excludes quoted prompts.
- Current rollouts expose `agent_reasoning`, `agent_message`, function/custom tool calls and outputs,
  `patch_apply_end.changes`, `task_started`, `task_complete`, `turn_context`, and timestamps.
- `codex-status.ts` currently returns only rollout paths plus one failure classification from the
  newest tail. It does not identify or classify each session.
- This is Archetype 6 tooling. No package/plugin doctrine boundary is changed.
