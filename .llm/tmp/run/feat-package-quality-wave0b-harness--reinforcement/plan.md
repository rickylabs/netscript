# Plan: Wave 0b·A — Plan-Gate reinforcement

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave0b-harness--reinforcement` |
| Branch | `feat/package-quality-wave0b-harness` |
| Phase | `plan` |
| Target | harness v2 docs/infra |
| Archetype | N/A (docs/infra) |
| Scope overlays | `SCOPE-docs.md` |

## Current Doctrine Verdict

N/A — no package/plugin source touched.

## Goal

Harden the harness so Wave 0's Plan & Design skip cannot recur. Introduce a
Plan-Gate (PLAN-EVAL) as a hard stop before implementation, split the run loop
into an 8-phase model, and update all cross-references.

## Scope

- Rewrite `workflow/run-loop.md` to 8-phase model.
- Add `gates/plan-gate.md`.
- Add `evaluator/plan-protocol.md` + edit `verdict-definitions.md`.
- Add `templates/plan-eval.md` + `templates/research.md`.
- Edit `workflow/activation.md` + `workflow/supervisor.md`.
- Edit `.agents/skills/netscript-harness/SKILL.md` + `evaluator/protocol.md`.
- Add lesson `lessons/plan-gate-design-as-gate.md`.
- Update `README.md` / `DOCTRINE-REF.md` indices.

## Non-Scope

- No package/plugin source changes.
- No version bumps, publish, JSR, OIDC.
- Group B (`.agents/docs` + skills) — waits for Group A merge.

## Hidden Scope

- Cross-reference integrity across all harness files.
- Template consistency (every new artifact has a template).
- `deno fmt` on all changed markdown.

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | Two-gate / dual-evaluator model | Cheap fix (plan) before expensive fix (code). |
| D2 | Group A merges first; Group B dogfoods Plan-Gate | Chicken-and-egg: Group A creates the gate, Group B is first real user. |
| D3 | `jsr-audit` shifts left to Plan-Gate | Surface risks named before slicing. |
| D4 | "What NetScript doesn't do yet" mandatory after user approval | Prevents confabulation; content must be approved. |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| D4 content drafting | safe to defer | Lands in Group B; flagged for sign-off. |
| `evaluate.md` template update | must resolve now | Add Plan-Gate process-verification row. |
| `worklog.md` template update | must resolve now | Update phase reference to 8-phase model. |

## Risk Register

| Risk | Mitigation |
|------|------------|
| Cross-reference drift | Manual link-integrity table in worklog.md; verify every path resolves. |
| Template/artifact mismatch | Update all templates and SKILL table together in one slice. |
| Supervisor.md merge protocol conflict | Add Plan-Gate check to pre-merge verification only; no merge logic changes. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
|-------|------|------------------|-----------------|
| 1 | Cross-reference integrity | `grep` every path referenced in new docs against tree | All resolve |
| 2 | Self-consistency | Table comparing activation.md, SKILL, supervisor.md, run-loop.md | 8 phases, 2 evaluators, new artifacts agree |
| 3 | Format | `deno fmt` on changed markdown | Clean |
| 4 | jsr-audit | N/A with reason recorded | N/A |

## Dependencies

- None external.
- Internal: Wave 0 foundation already merged into `feat/package-quality`.
