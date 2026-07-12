use harness

# Slice brief — #380 (E15): composable system-prompt assembly seam

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-380`, branch `feat/380-prompt-assembly`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-380`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-380 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-380 push origin HEAD:refs/heads/feat/380-prompt-assembly`.
- Worklog at `/home/codex/repos/ns-b8-380/.llm/runs/feat-380-prompt-assembly--codex/worklog.md`.

## Task (issue #380 — read it first; Contract shape + Scope are the contract)

Thin `composeSystemPrompt(sections)` / `PromptAssembler` seam in `@netscript/ai`: named, ordered
sections with stable precedence (skills systemBlock, memory recall, catalog, app instructions,
…). Framework owns ORDERING/COMPOSITION only; section content stays app/slice-owned. The agent
loop (E3) must be able to consume the assembled prompt — wire the seam so a caller can pass the
assembled result where a system prompt is accepted today (no loop redesign).

Design notes: deterministic order (explicit numeric/ordinal precedence + insertion-order
tiebreak); empty sections dropped; separator policy documented; duplicate section names = typed
error or last-wins (pick one, document, test it).

## Validation (evidence in worklog)

- Scoped check/lint on `packages/ai`.
- Unit tests: ordering, precedence override, empty-section drop, duplicate-name policy,
  integration shape with the loop's system-prompt input.
- `deno doc --lint` clean; publish dry-run green if export map changed.

## Done means

Seam + tests committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
