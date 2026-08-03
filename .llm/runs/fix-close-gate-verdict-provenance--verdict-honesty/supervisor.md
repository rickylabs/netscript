# Supervisor Identity — fix-close-gate-verdict-provenance--verdict-honesty

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex GPT-5 (API session; exact runtime model id not exposed) |
| Session | `/root` primary agent session, 2026-08-03 |
| Host | Linux / `/home/codex` |
| Checkout | `/home/codex/repos/ns005-closegate` |
| Worktree | `/home/codex/repos/ns005-closegate` |
| Branch | `fix/close-gate-verdict-provenance` |
| Baseline | `fb75cf6fc5ad02130ada0ac42e6f44035ac03a9b` from `origin/main`, 2026-08-03 |
| Run ID | `fix-close-gate-verdict-provenance--verdict-honesty` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` | Owner-directed Codex supervisor session | Research, plan, orchestration, and Tier-A sign-off |
| `formal_evaluation` | Claude Code + OpenRouter / `qwen/qwen3.7-max` / high | Separate PLAN-EVAL and IMPL-EVAL sessions |
| `normal_implementation` | Codex / OpenAI / GPT-5.6 Sol / medium | Implementation after PLAN-EVAL PASS |
| `review_codex` | Claude / Anthropic / Fable 5 / low | Opposite-family substantive slice review |

## Recorded lane/eval overrides

- The user explicitly assigned this Codex session as implementation supervisor. This replaces the
  default Fable supervisor route but does not alter generator/evaluator separation.
- `deno task agentic:runtime status --worktree /home/codex/repos/ns005-closegate` reported
  `MISSING_IDENTITY` at bootstrap. Implementation launch remains blocked pending a healthy routed
  session; the formal evaluator will first be attempted through the canonical local Qwen route.
