# Drift Log: fix #782 — Preact Windows dedupe

Drift is append-only.

## 2026-07-16 — Supervisor-owned evaluator and attachment state

- **What:** The implementation session was directly supplied by the owner and must not dispatch
  PLAN-EVAL or IMPL-EVAL. The current Codex thread id is available, while the agentic runtime reports
  zero daemon-managed sessions.
- **Source:** Owner constraint; `CODEX_THREAD_ID`; `deno task agentic:runtime status`.
- **Expected:** Default Tier-D harness launches normally record a daemon-managed remote-control
  attachment and perform evaluator handoffs through the supervisor workflow.
- **Actual:** Thread `019f6ca5-1cd3-78f0-bee0-f682e74c49a1` is active in the owner-provided worktree,
  but no daemon attachment is observable and both evaluator passes are explicitly supervisor-owned.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; runtime status `sessions: 0`.
