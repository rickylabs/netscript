---
name: netscript-harness
description: >
  Operating model for NetScript harness v2 runs. Use whenever the user says
  "use harness", references a harness run, asks about archetype/profile
  selection, run artifacts, resource aggregation, commit tracking, evaluator
  protocol, rescoping, or where a lesson/doctrine update should live.
---

# NetScript Harness v2 — Orchestration Skill

This skill coordinates harness-mode runs. The authoritative harness docs live
under `.llm/harness/`; this skill tells you what to load and in what order.

## When to Use

- The user says `use harness` or asks for a harnessed run.
- Selecting archetypes, scope overlays, or gate sets.
- Tracking run artifacts, commits, or drift.
- Understanding evaluator protocol (PLAN-EVAL or IMPL-EVAL).
- Deciding where a lesson or doctrine update should live.

## When Not to Use

- For package/plugin architecture decisions — use `netscript-doctrine`.
- For JSR readiness audits — use `jsr-audit`.
- For frontend/framework-specific questions — use `deno-fresh` or the relevant
  domain skill.

## Key Concepts

| Concept | Meaning |
|---------|---------|
| **8-phase model** | Bootstrap → Research → Plan & Design → Plan-Gate → Implement → Gate → Evaluate → Close. |
| **PLAN-EVAL** | First evaluator pass, before implementation. Hard stop. |
| **IMPL-EVAL** | Final evaluator pass, after implementation. |
| **Plan-Gate** | Checklist (`gates/plan-gate.md`) that PLAN-EVAL enforces. |
| **Archetype** | Package/plugin shape profile from `archetypes/ARCHETYPE-*.md`. |
| **Scope overlay** | `SCOPE-frontend.md`, `SCOPE-service.md`, `SCOPE-docs.md`. |
| **Run artifact** | File in `.llm/tmp/run/<run-id>/` that preserves state across sessions. |
| **Debt** | Recorded in `.llm/harness/debt/arch-debt.md`. |

## Workflow

1. Read `workflow/activation.md` and `workflow/run-loop.md`.
2. If resuming, read `.llm/tmp/run/<run-id>/context-pack.md`.
3. Identify the target surface and select archetype + overlays.
4. Read `gates/archetype-gate-matrix.md` and `gates/plan-gate.md`.
5. Scaffold run artifacts from `templates/`.
6. Produce `research.md`, then `plan.md` with locked decisions.
7. Record Design checkpoint in `worklog.md`.
8. **Run PLAN-EVAL (separate session). No implementation before PASS.**
9. Implement one commit slice at a time; append `commits.md` after each.
10. Run gates; record results in `worklog.md`.
11. **Run IMPL-EVAL (separate session).**
12. Close: update `context-pack.md`, `arch-debt.md`, and promote lessons if warranted.

## Common Pitfalls

- **Skipping Plan & Design** — The Plan-Gate is a hard stop. Implementation
  before PLAN-EVAL `PASS` is a process failure.
- **Self-evaluation** — The evaluator must be a separate session. The generator
  does not self-certify.
- **Carried-in plans as ground truth** — Re-baseline against current `main`
  before locking the plan.
- **Monolithic commits** — Commit by slice, not by monolith. Each slice has its
  own gate.

## What NetScript doesn't do yet

> **Status: draft — pending user approval before becoming mandatory.**

- **Automated fitness gate scripts** — Phase A; most gates are manual or
  `PENDING_SCRIPT`. Workaround: manual evidence in `worklog.md`.
- **Parallel group execution** — Supervisor runs launch groups sequentially.
  Workaround: design groups to be independent; merge order matters.
- **Automatic archetype detection** — The agent must select the archetype
  manually. Workaround: use the decision tree in `archetypes/README.md`.
- **Real-time drift monitoring** — Drift is logged manually in `drift.md`.
  Workaround: append after significant steps.

## Reference Files

| File | Load when |
|------|-----------|
| `.llm/harness/workflow/activation.md` | Every harness run |
| `.llm/harness/workflow/run-loop.md` | Every harness run |
| `.llm/harness/workflow/supervisor.md` | Multi-group supervisor runs |
| `.llm/harness/gates/plan-gate.md` | Plan-Gate checklist |
| `.llm/harness/evaluator/plan-protocol.md` | PLAN-EVAL instructions |
| `.llm/harness/evaluator/protocol.md` | IMPL-EVAL instructions |
| `.llm/harness/evaluator/verdict-definitions.md` | Verdict meanings |
| `.llm/harness/gates/archetype-gate-matrix.md` | Gate selection |
| `.llm/harness/archetypes/README.md` | Archetype selection |
| `.llm/harness/templates/` | Run artifact scaffolding |
| `.llm/harness/debt/arch-debt.md` | Debt registry |

## Checklist

- [ ] `workflow/activation.md` and `workflow/run-loop.md` were read.
- [ ] Archetype and overlays are selected and justified.
- [ ] Plan-Gate checklist (`gates/plan-gate.md`) was reviewed.
- [ ] PLAN-EVAL returned `PASS` before any implementation slice.
- [ ] Commits are appended to `commits.md` immediately after creation.
- [ ] IMPL-EVAL is a separate session from the generator.
