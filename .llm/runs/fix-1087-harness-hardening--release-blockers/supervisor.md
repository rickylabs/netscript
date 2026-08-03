# Supervisor Identity — fix-1087-harness-hardening--release-blockers

| Field | Value |
| --- | --- |
| Model | Codex / GPT-5 |
| Session | root API session (no durable thread id exposed) |
| Host | Linux / WSL / `codex` |
| Checkout | `/home/codex/repos/ns004-harden` |
| Worktree | `/home/codex/repos/ns004-harden` |
| Branch | `fix/1087-harness-hardening` |
| Baseline | `4833a1676f672aa3e4cf970d05afbcf17a57629b` from `origin/main`, 2026-08-03 |
| Run ID | `fix-1087-harness-hardening--release-blockers` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` | Codex / OpenAI / GPT-5 / current session | Owner-addressed supervisor fallback session |
| `light_implementation` | Codex / OpenAI / GPT-5 / current session | Four bounded sequential implementation slices |
| `review_codex_light` | Claude / Anthropic / canonical opposite-family route | Substantive slice review before each sign-off commit |
| `formal_evaluation` | Claude transport / OpenRouter / `qwen/qwen3.7-max` / high | Separate PLAN-EVAL and IMPL-EVAL sessions |

## Recorded lane/eval overrides

- The owner assigned this existing Codex session to supervise and implement the release-blocking
  slice. The canonical Fable orchestrator was not the entry session; opposite-family slice review
  and open-model formal evaluation remain mandatory.
- The four issues stay one normal harness run and one draft PR, as explicitly requested, rather
  than becoming supervisor sub-PR groups. They are sequential commit slices in priority order.
- Until #1087 lands, local formal evaluation must run with the Claude `Agent` tool denied by
  session-scoped configuration. This avoids exercising the known unsafe child surface before its
  repository guard exists; the deviation is mirrored in `drift.md`.
