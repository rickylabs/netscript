# Worklog: docs/internal-overhaul

| Field | Value |
|-------|-------|
| Run ID | `docs-internal-overhaul--contributor` |
| Branch | `docs/internal-overhaul` (off `release/jsr-readiness`) |
| Status | **plan READY for PLAN-EVAL** (Groups 1+2 merged → IMPL gate satisfied; awaiting OpenHands/minimax-M3 PLAN-EVAL) |

## Progress Log

| Time | Phase | Step | Notes |
|------|-------|------|-------|
| 2026-06-18 | bootstrap | skeleton scaffolded | Draft `plan.md`/`research.md` (consolidate internal docs; document `deno doc`; keep `.claude/skills/` generated). No branch/worktree/generator yet. |
| 2026-06-18 | plan & design | **Design checkpoint — PLAN-EVAL ready** | Plan finalized against `main`@`cc3b8731` post-1+2-merge. Locked: **IO-5** internal docs keep a **functional/role-based** IA (NOT Diátaxis — that is the user site, Group 3); **IO-6** canonical-home rubric (architecture decisions→`docs/architecture/doctrine/`; cross-agent rules→`AGENTS.md`; domain procedure→`.agents/skills/<name>`; Claude startup→`CLAUDE.md`; run/orchestration→`.llm/harness/`). Group-1 deletion coordination RESOLVED: G1 (merged, PR #54) deleted exactly one `.md` (`AGENTS-handoff.md`, relocated into `.agents/skills/openhands-handoff/SKILL.md`) → clean field, no delete-vs-consolidate conflict. `.claude/skills/` stays generated from `.agents/skills/` (`validate-claude-surface.ts` is the gate). Branch `docs/internal-overhaul` rebased onto umbrella `dd712b1e`. Next: PLAN-EVAL (separate OpenHands/minimax-M3 session); no slice before PASS. |

## Gate Results

(none yet — see `plan.md` Validation Plan; key gate = `validate-claude-surface.ts` green)

## Handoff Notes

- Research+Plan can proceed in parallel with Groups 1/2. **IMPL waits for Groups 1+2 merged.**
- Coordinate doc-file ownership with Group 1 (`prod-readiness` deletes dead doc files; this run
  consolidates surviving content).
- `.claude/skills/` regenerated from `.agents/skills/` — never hand-edit. PLAN-EVAL before any slice.
