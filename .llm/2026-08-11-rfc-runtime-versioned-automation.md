# 2026-08-11 — runtime-versioned automation RFC orchestrator run

Fable 5 medium supervisor run (owner override). Deliverables: the RFC
(`rfcs/0000-runtime-versioned-automation.md`), legacy + current evidence reports with behavioral
probes, 1444-impact memo (PR #1444), draft PR #1446. Two Codex Sol research slices (one thread,
resumed) + a Sol·xhigh evaluator thread in a dedicated worktree. PLAN-EVAL: 2× FAIL_PLAN →
per-protocol owner escalation with all findings fixed and verified. Lessons: (1) run-codex-slice
forwards ONLY --launch-arg values; (2) one Codex sender per worktree — evaluator needs its own
worktree; (3) NEVER patch by remembered strings after deno fmt — verify every replacement (drift
D-7).
