# Worklog: Wave 0b·A — Plan-Gate reinforcement

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave0b-harness--reinforcement` |
| Branch | `feat/package-quality-wave0b-harness` |
| Archetype | N/A |
| Scope overlays | docs |

## Design

### Public Surface

- No new code exports. Changes are to harness docs, templates, and skill files.
- New files: `gates/plan-gate.md`, `evaluator/plan-protocol.md`,
  `templates/plan-eval.md`, `templates/research.md`,
  `lessons/plan-gate-design-as-gate.md`.
- Changed files: `workflow/run-loop.md`, `workflow/activation.md`,
  `workflow/supervisor.md`, `evaluator/protocol.md`,
  `evaluator/verdict-definitions.md`, `README.md`, `DOCTRINE-REF.md`,
  `.agents/skills/netscript-harness/SKILL.md`.

### Domain Vocabulary

- **Plan-Gate** — the first evaluator pass, before implementation.
- **PLAN-EVAL** — the separate session that runs the Plan-Gate.
- **IMPL-EVAL** — the final evaluator pass, after implementation.
- **FAIL_PLAN** — verdict emitted only by PLAN-EVAL.
- **8-phase model** — Bootstrap, Research, Plan & Design, Plan-Gate, Implement,
  Gate, Evaluate, Close.

### Ports

- None — no external dependencies.

### Constants

- Verdicts: `PASS`, `FAIL_PLAN`, `FAIL_FIX`, `FAIL_RESCOPE`, `FAIL_DEBT`.
- Phases: Bootstrap, Research, Plan & Design, Plan-Gate, Implement, Gate,
  Evaluate, Close.

### Commit Slices

| # | Slice | Gate | Files |
|---|-------|------|-------|
| A1 | Rewrite run-loop.md to 8-phase model | Link check | `workflow/run-loop.md` |
| A2 | Add plan-gate.md | Link check | `gates/plan-gate.md` |
| A3 | Add plan-protocol.md + edit verdict-definitions.md | Link check | `evaluator/plan-protocol.md`, `evaluator/verdict-definitions.md` |
| A4 | Add plan-eval.md + research.md templates | Link check | `templates/plan-eval.md`, `templates/research.md` |
| A5 | Edit activation.md + supervisor.md | Link check | `workflow/activation.md`, `workflow/supervisor.md` |
| A6 | Edit SKILL.md + evaluator/protocol.md | Link check | `.agents/skills/netscript-harness/SKILL.md`, `evaluator/protocol.md` |
| A7 | Add lesson + update README/DOCTRINE-REF indices | Link check | `lessons/plan-gate-design-as-gate.md`, `README.md`, `DOCTRINE-REF.md` |

### Deferred Scope

- Group B (`.agents/docs` + skills cluster) — waits for Group A merge and user
  approval of D4 content.
- `evaluate.md` and `worklog.md` template updates — included in A6/A7.

### Contributor Path

To extend the harness: add a new gate definition under `gates/`, add its
protocol under `evaluator/` if it needs a separate evaluator pass, add a
template under `templates/`, and update `README.md` + `DOCTRINE-REF.md` indices.

## Progress Log

| Time | Slice | Step | Notes |
|------|-------|------|-------|
| 2026-06-05 | Setup | Branch + run dir created | `feat/package-quality-wave0b-harness` |
| 2026-06-05 | Plan | research.md + plan.md written | Re-baseline complete; divergences recorded |

## Decisions

| Decision | Reason | Source |
|----------|--------|--------|
| 8-phase model | Prevents Plan & Design skip | D1 (locked) |
| jsr-audit N/A here | Wave 0b is docs/infra | D3 (locked) |
| D4 deferred to Group B | Content needs user approval | D4 (locked) |

## Drift

| Drift | Severity | Logged in drift.md |
|-------|----------|--------------------|
| None yet | — | — |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
|------|------------------|--------|-------|
| Cross-reference integrity | Manual path resolution | NOT_RUN | Will run post-implementation |
| Self-consistency | Table comparison | NOT_RUN | Will run post-implementation |
| Format | `deno fmt` | NOT_RUN | Will run post-implementation |

### Fitness Gates

N/A — no package/plugin work.

### Runtime Gates

N/A.

### Consumer Gates

N/A.

## Handoff Notes

- Evaluator should verify every path referenced by new/edited files resolves to
  a real file.
- Verify 8-phase model is consistent across activation.md, run-loop.md,
  supervisor.md, SKILL.md, README.md, DOCTRINE-REF.md.
