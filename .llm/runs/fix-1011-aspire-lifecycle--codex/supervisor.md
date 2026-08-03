# Supervisor Identity — fix-1011-aspire-lifecycle--codex

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex / GPT-5 family (runtime-provided primary session) |
| Session | `/root` API session; no durable thread URL exposed |
| Host | Linux / WSL, shared NetScript development host |
| Checkout | `/home/codex/repos/ns004-aspire` |
| Worktree | `/home/codex/repos/ns004-aspire` |
| Branch | `fix/1011-aspire-lifecycle` |
| Baseline | `origin/main` @ `ab0fa13fe5c92129761ebe4dc0246b979733ecaf` (2026-08-03) |
| Run ID | `fix-1011-aspire-lifecycle--codex` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` | Runtime-provided Codex primary session | Supervisor, research, plan, slice sign-off, GitHub lifecycle |
| `complex_implementation` | Runtime-provided Codex primary session / high | Two coupled CLI/Aspire runtime slices |
| `formal_evaluation` | Claude Code + OpenRouter / bound Qwen open-model preset | Separate PLAN-EVAL and IMPL-EVAL sessions |
| `review_codex_complex` | Claude / Fable 5 / medium | Opposite-family substantive slice review |

## Recorded lane/eval overrides

- The user started this Codex session as the harness supervisor, so the runtime-provided primary
  session occupies `planning_decisions` instead of launching a second Fable orchestrator. Formal
  evaluator separation and opposite-family slice review remain unchanged. Mirrored in `drift.md`.

