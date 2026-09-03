# Context pack — Slice A client selector

- Objective: behavior-preserving extraction of #1664's selector for #1354 Slice A.
- Baseline/base branch: `a30405df1`, `feat/app-service-client-wiring`.
- Product ceiling: four locked files.
- Current phase: implementation gates complete; awaiting separate-session IMPL-EVAL.
- PLAN-EVAL: N/A per owner; IMPL-EVAL remains mandatory in a separate session.
- Known drift: direct-child count will be 12 on this branch, not the later combined 14-child WARN.
- Evidence: focused 19/19; full CLI 1663/1663; structured check/lint/fmt green; architecture,
  quality, and docs gates exit 0; `deno.lock` unchanged.
