use harness

# Slice brief — #496: tokenBudgetHistory strategy for @netscript/ai/agent

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-496`, branch `feat/496-token-budget-history`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-496`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-496 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-496 push origin HEAD:refs/heads/feat/496-token-budget-history`.
- Worklog at `/home/codex/repos/ns-b8-496/.llm/runs/feat-496-token-history--codex/worklog.md`.

## Task (issue #496 — read it first; acceptance line is the contract)

Additive `HistoryStrategy`: ship `tokenBudgetHistory({ budget, estimator? })` beside the existing
`slidingWindowHistory` in `packages/ai/src/agent/history.ts` (re-locate against current main).
Default estimator chars/4; estimator pluggable for real tokenizers. Preserves leading system
messages; keeps newest turns within budget. Exported from `@netscript/ai/agent` with JSDoc example.

## Validation (evidence in worklog)

- Scoped check/lint on `packages/ai`.
- Unit tests: budget respected, system messages preserved, newest-turn kept, custom estimator
  honored, zero/tiny budget edge cases.
- `deno doc --lint` clean on the changed surface; publish dry-run green if the export map changed.

## Done means

Strategy + tests committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
