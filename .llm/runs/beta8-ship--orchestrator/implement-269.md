use harness

# Slice brief — #269 (E10): MemoryPort — vector-recalled distilled agent memory

## SKILL
Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules
- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-269`, branch `feat/269-memory-port`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-269`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-269 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-269 push origin HEAD:refs/heads/feat/269-memory-port`.
- Worklog at `/home/codex/repos/ns-b8-269/.llm/runs/feat-269-memory-port--codex/worklog.md`.

## Task (issue #269 — read it FULLY + RE-BASELINE FIRST)
IMPORTANT re-baseline: `packages/ai/src/ports/memory.ts` ALREADY declares `AgentMemoryPort` with
the optional `recall` seam and RecallQuery/RecallResult types ("implemented by slice E10 — this
slice"). Verify what exists vs the issue; record the delta in the worklog; do NOT redeclare the
port. Ship the E10 implementation:
- `store(memory)` + `recall(query, k)` returning distilled, relevance-ranked entries composed
  over the existing `EmbeddingProviderPort` (cosine ranking).
- A pluggable vector-store seam with an in-memory/injected starter (stores stay app-owned per the
  persistence law — no DB coupling in core).
- Distillation policy stays app-owned (SO-4): the seam accepts distilled entries; no summarizer.
- Loop behavior: `recall` absent → existing `load` fallback preserved (regression-test it).
- Fail-soft contract per the issue's POC note: recall errors must not break the turn.

## Validation (evidence in worklog)
- Scoped check/lint on `packages/ai`; unit tests (ranking, k-bound, empty store, fail-soft,
  fallback regression); `deno doc --lint` clean; publish dry-run green if export map changed.

## Done means
Implementation + tests committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
