# Research — feat-package-quality-wave0b-harness--reinforcement

## Re-baseline

- Carried-in source: Wave 0 prompt spec (handover) + current `.llm/harness/*`
- Re-derived against `main` @ 0e9fde203d407771a102301adfac53357ce4796a
- What changed vs the carried-in version:
  - `run-loop.md` still has 5 phases (Bootstrap, Execute, Gate, Evaluate, Close);
    the handover specifies 8 phases with Plan-Gate and dual evaluator passes.
  - No `gates/plan-gate.md` exists yet.
  - No `evaluator/plan-protocol.md` exists yet.
  - No `templates/plan-eval.md` or `templates/research.md` exist yet.
  - `evaluator/verdict-definitions.md` lacks `FAIL_PLAN`.
  - `workflow/activation.md` artifacts list is missing `research.md` and
    `plan-eval.md`.
  - `workflow/supervisor.md` does not mention the Plan-Gate.
  - `README.md` and `DOCTRINE-REF.md` enumerate 5 phases, not 8.
  - `.agents/skills/netscript-harness/SKILL.md` lists one evaluator pass, not two.
  - `lessons/` has no `plan-gate-design-as-gate.md`.

## Findings

| # | Finding | How to verify |
|---|---------|---------------|
| 1 | `run-loop.md` is 5-phase, needs 8-phase rewrite | `cat .llm/harness/workflow/run-loop.md` |
| 2 | `verdict-definitions.md` has no `FAIL_PLAN` | `cat .llm/harness/evaluator/verdict-definitions.md` |
| 3 | `evaluator/protocol.md` does not distinguish IMPL-EVAL from PLAN-EVAL | `cat .llm/harness/evaluator/protocol.md` |
| 4 | `activation.md` mandatory artifacts omit `research.md` and `plan-eval.md` | `cat .llm/harness/workflow/activation.md` |
| 5 | `supervisor.md` group launch does not mention Plan-Gate hard stop | `cat .llm/harness/workflow/supervisor.md` |
| 6 | `README.md` and `DOCTRINE-REF.md` list 5 phases | `cat .llm/harness/README.md` |
| 7 | `netscript-harness` SKILL lists one evaluator pass | `cat .agents/skills/netscript-harness/SKILL.md` |
| 8 | No `plan-eval.md` template exists | `ls .llm/harness/templates/` |
| 9 | No `research.md` template exists | `ls .llm/harness/templates/` |
| 10 | No `plan-gate.md` gate definition exists | `ls .llm/harness/gates/` |
| 11 | No `plan-protocol.md` evaluator protocol exists | `ls .llm/harness/evaluator/` |
| 12 | No lesson file for "Design as gate" exists | `ls .llm/harness/lessons/` |

## jsr-audit surface scan (package/plugin waves)

- N/A for Wave 0b — this wave is harness + docs/infra only. No package/plugin
  source is touched. The `jsr-audit` skill is not exercised here; it will be
  applied as a Plan-Gate checklist item in package/plugin waves per decision D3.

## Open questions

- Should the `evaluate.md` template be updated to include a "Plan-Gate passed"
  process-verification row? (Decision: yes, add it as part of A6.)
- Should `templates/worklog.md` be updated to reference the 8-phase model?
  (Decision: yes, update the Design section reference from § 2a to § 3b.)
