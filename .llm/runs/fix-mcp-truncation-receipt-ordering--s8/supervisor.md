# Supervisor Identity — fix-mcp-truncation-receipt-ordering--s8

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5 |
| Session | Codex root session (this worktree) |
| Host | Linux native ext4 workspace |
| Checkout | `/home/codex/repos/ns005-receipts` |
| Worktree | `/home/codex/repos/ns005-receipts` |
| Branch | `fix/mcp-truncation-receipt-ordering` |
| Baseline | `fb75cf6fc5ad02130ada0ac42e6f44035ac03a9b` (`origin/main`, 2026-08-03) |
| Run ID | `fix-mcp-truncation-receipt-ordering--s8` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` | Codex root-session fallback already selected by host | Supervisor, research, plan, implementation sign-off |
| `normal_implementation` | Codex · OpenAI · Sol-class implementation route | Two focused source/test slices |
| `review_codex` | Claude · Anthropic · Fable-class review route | Ordinary opposite-family slice review |
| `formal_evaluation` | Claude Code · OpenRouter · `qwen/qwen3.7-max` · high | Separate PLAN-EVAL and IMPL-EVAL sessions |

## Recorded lane/eval overrides

The active Codex host is the supervisor/generator session rather than the canonical Claude
orchestrator. This is the owner-provided implementation-supervisor context; formal evaluation
remains on the canonical open-model route and ordinary source review remains opposite-family.

The slice-1 `review_codex` primary could not start because the installed Claude CLI rejected the
configured Fable model id. The policy-declared Claude-family `token_limit_fallback` route (Opus,
same low effort) is used for ordinary review; formal evaluation is unchanged.
