# Worklog

## Design

- Model IDs remain centralized in `config/models.ts`.
- Provider presets own transport capability facts.
- Canonical routing owns phase and complexity selection.
- The dispatch tool and GitHub workflow both enforce the same finite open-evaluator set.

## Gates

- Focused agentic tests: PASS (65 tests).
- Dry-run dispatch contracts: PASS for MiniMax M3, DeepSeek V4 Flash 0731, and Qwen 3.8 Max.
- Bounded live OpenHands smoke: PASS — DeepSeek V4 Flash 0731, Actions run `31574668989`, exact
  branch SHA `eb16a6b68`, tool-backed checkout inspection, `OPENHANDS_VERDICT: PASS`.
- The first `ready_for_review` CI event (`31575007718`) materialized only skipped jobs; per the
  milestone did-not-run rule this is unproven, not green. This evidence commit intentionally emits a
  non-draft `synchronize` event so the required classifiers and gates execute.
