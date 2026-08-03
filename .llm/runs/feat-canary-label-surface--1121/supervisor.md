# Supervisor Identity — feat-canary-label-surface--1121

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex API root session (system-reported GPT-5; exact volatile model id unavailable) |
| Session | `/root`, 2026-08-03 |
| Host | Linux / native ext4 / `codex` |
| Checkout | `/home/codex/repos/ns004-canary` |
| Worktree | `/home/codex/repos/ns004-canary` |
| Branch | `feat/canary-label-surface` |
| Baseline | `0b05217cc14213221b3263128b3838373b0484e8` from `origin/main`, verified 2026-08-03 |
| Run ID | `feat-canary-label-surface--1121` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| Supervisor entry session | OpenAI / system-provided Codex GPT-5 / system-managed | Research, plan, Tier-A review, sign-off commits, GitHub lifecycle |
| `light_implementation` | OpenAI / canonical Codex Sol route / low | Thin source slices in one daemon-attached thread |
| `review_codex_light` | Anthropic / canonical opposite-family route / high | Ordinary adversarial review before each supervisor sign-off |
| `formal_evaluation` | OpenRouter / bound open-model Qwen evaluator / high | Separate PLAN-EVAL and separate IMPL-EVAL sessions |

Reference `.llm/harness/workflow/lane-policy.md`; this table records only routes used by this run.

## Recorded lane/eval overrides

- The interactive entry surface is the user-opened Codex API session rather than the canonical
  Fable supervisor. The user explicitly invoked Codex for this checkout; implementation, ordinary
  review, and formal evaluation remain on their canonical routes. This is mirrored in `drift.md`.
