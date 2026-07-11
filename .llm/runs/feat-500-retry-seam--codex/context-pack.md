# Context Pack

Issue #500 implementation on the pinned beta-8 worktree is complete. The root
and ports entrypoints expose opt-in retry wrappers and `AiRateLimitError`;
unwrapped behavior remains no-retry. All requested package gates pass (95 tests,
scoped check/lint/format, full export-map doc lint, publish dry-run). No PR was
opened. External Tier-A review / IMPL-EVAL remains with the orchestrator.
