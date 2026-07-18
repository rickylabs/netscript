# Drift — beta10-cli--orchestrator (append-only)

- 2026-07-16 · **moderate** · Codex remote degraded at bootstrap: `agentic:runtime doctor` reports
  `codex-app-server` PROBE_FAILED + MOBILE_DISCONNECTED; `repair codex-remote` refuses (active
  sessions/child commands observed → unmanaged state it won't interrupt). Tier-D
  (`launch-codex-slice`) launches blocked until recovered per `codex-wsl-remote` skill or owner
  guidance. Orchestrator continues with p0 #770 verification (non-implementation work) meanwhile.
- 2026-07-16 · **minor** · Kickoff drift: (a) PR #770 closes **#763**, not #769 — the #769 fix
  (agent-init pins, template pins, repo-wide guard) is already merged into the #715 umbrella branch
  `feat/netscript-mcp-skills` (commits f0850532 + 6976a3f6, tip 8d991890, incl. NF1 fix 8b09ebb6).
  (b) "Stand up S1 #725" is stale — S1–S9 are implemented on that branch with IMPL-EVAL cycle-2
  PASS. Task re-scoped to #715 merge-readiness confirmation.
- 2026-07-16 · **minor** · #774 slice: implementation lane self-arranged its full eval chain
  (PLAN-EVAL aa9cc799, slice-review c8f83551, IMPL-EVAL 319e284e — Opus 4.8, properly separated and
  family-correct). Contract says the supervisor chooses when to trigger evaluators; verdicts were
  consistent with the official supervisor-dispatched eval, so accepted as supplementary evidence
  only. Candidate lesson for `.llm/harness/lessons/`: define whether generator-arranged evals are
  ever authorizing.
