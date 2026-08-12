# Worklog

## Design

- Model IDs remain centralized in `config/models.ts`.
- Provider presets own transport capability facts.
- Canonical routing owns phase and complexity selection.
- The dispatch tool and GitHub workflow both enforce the same finite open-evaluator set.

## Gates

- Focused agentic tests: PASS (65 tests).
- Dry-run dispatch contracts: PASS for MiniMax M3, DeepSeek V4 Flash 0731, and Qwen 3.8 Max.
- Bounded live OpenHands smoke: pending.
