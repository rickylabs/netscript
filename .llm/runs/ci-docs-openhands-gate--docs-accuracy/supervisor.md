# Supervisor Identity — ci-docs-openhands-gate--docs-accuracy

| Field | Value |
| --- | --- |
| Model | Codex GPT-5 implementation session |
| Session | Current `/root` Codex session |
| Host | Linux / `/home/codex` |
| Checkout | `/home/codex/repos/b10-docsgate` |
| Worktree | `/home/codex/repos/b10-docsgate` |
| Branch | `ci/docs-openhands-gate` |
| Baseline | `63b8bae45309e4b16067c1ee6258d6834a123d61` (`origin/main`, 2026-07-17) |
| Run ID | `ci-docs-openhands-gate--docs-accuracy` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `light_implementation` | Codex / OpenAI / GPT-5.6 Sol / low | Implement the focused workflow/docs/taxonomy slice. |
| `review_codex_light` | Claude / Anthropic / Opus 4.8 / high | Separate-session slice review. |
| `formal_evaluation` | Claude Code / OpenRouter / Qwen 3.7 Max / bound preset | Separate local PLAN-EVAL and IMPL-EVAL. |

The Minimax M3 route added by this slice is a future automated cloud docs-accuracy gate, not the
formal evaluator for this local harness run. No OpenHands evaluation is dispatched by this run.
