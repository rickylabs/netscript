# Agent Briefing: <supervisor> / Group <X> — <name>

Paste this when starting a new agent session for a phase group (see `workflow/supervisor.md` § 2).
Fill every `<…>` before sending.

```text
## Context

You are implementing Phase Group <X> (<name>) of the <supervisor> supervisor run.

### Integration branch
- Branch: feat/<supervisor>
- Worktree: <integration worktree path>

### Your group
- Branch: feat/<supervisor>/<group>
- Worktree: <group worktree path>
- Archetype(s): <N - name + overlays>
- Surfaces: <packages/plugins/apps/services>

### Required reading (in order)
1. .llm/tmp/run/<supervisor-run-id>/plan.md
2. .llm/tmp/run/<supervisor-run-id>/phase-registry.md  (§ Group <X> row)
3. <supervisor-specific plan/research/decision files for this group>
4. .agents/skills/netscript-harness/SKILL.md

### Harness mode
Use harness. Read workflow/activation.md + workflow/run-loop.md.
For package/plugin work also load .agents/skills/netscript-doctrine/SKILL.md and
select your archetype from archetypes/README.md; apply scope overlays; read
gates/archetype-gate-matrix.md and debt/arch-debt.md.

Create your run dir at:
  .llm/tmp/run/<supervisor>-<group>--<suffix>/

### What you must produce
- research.md, plan.md, worklog.md (Design checkpoint first), context-pack.md,
  drift.md, commits.md
- Sliced implementation commits per the Design checkpoint
- Gate results recorded in worklog.md
- A clean state ready for a SEPARATE PLAN-EVAL session (before implementation)
  and a SEPARATE IMPL-EVAL session (after implementation)

### Boundaries
- Stay inside your group's surfaces; cross-surface changes are an escalation.
- Append drift.md whenever facts diverge from plan/doctrine.
- Do not merge your own branch — the supervisor merges after IMPL-EVAL PASS.
```
