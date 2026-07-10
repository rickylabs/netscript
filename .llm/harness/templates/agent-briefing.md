# Agent Briefing: <supervisor> / Group <X> — <name>

Paste this when starting a new agent session for a phase group (see `workflow/supervisor.md` § 2).
Fill every `<…>` before sending.

```text
use harness

## SKILL

- netscript-harness — run lifecycle, Plan-Gate, and evaluator separation.
- <relevant-skill> — <why this phase needs it>.

## Context

You are implementing Phase Group <X> (<name>) of the <supervisor> supervisor run.

### Integration branch
- Branch: feat/<supervisor>
- Worktree: <integration worktree path>

### Your group
- Branch: feat/<supervisor>-<group>
- Worktree: <group worktree path>
- Archetype(s): <N - name + overlays>
- Surfaces: <packages/plugins/apps/services>

### Required reading (in order)
1. .llm/runs/<supervisor-run-id>/plan.md
2. .llm/runs/<supervisor-run-id>/phase-registry.md  (§ Group <X> row)
3. <supervisor-specific plan/research/decision files for this group>
4. .agents/skills/netscript-harness/SKILL.md

### Harness mode
Read workflow/activation.md + workflow/run-loop.md.
For package/plugin work also load .agents/skills/netscript-doctrine/SKILL.md and
select your archetype from archetypes/README.md; apply scope overlays; read
gates/archetype-gate-matrix.md and debt/arch-debt.md.

Create your run dir at:
  .llm/runs/<supervisor>-<group>--<suffix>/
Start it with `supervisor.md` (agent identity: model, session, host, worktree,
branch, baseline SHA, lane table) — a run dir without it is not activated. See
`workflow/lane-policy.md` § Supervisor identity.

### What you must produce
- supervisor.md, research.md, plan.md, worklog.md (Design checkpoint first),
  context-pack.md, drift.md (the draft-PR commit list + per-slice PR comments
  are the commit trail — no commits.md)
- If a slice runs a Tier C Workflow, commit its generated `workflow.js` to
  `<run-dir>/workflows/<slice>-workflow.js` BEFORE executing it (see
  `workflow/lane-policy.md` selection rule 2)
- Sliced implementation commits per the Design checkpoint
- Gate results recorded in worklog.md
- A clean state ready for a SEPARATE PLAN-EVAL session (before implementation)
  and a SEPARATE IMPL-EVAL session (after implementation)

### Boundaries
- Stay inside your group's surfaces; cross-surface changes are an escalation.
- Append drift.md whenever facts diverge from plan/doctrine.
- Do not merge your own branch — the supervisor merges after IMPL-EVAL PASS.
```
