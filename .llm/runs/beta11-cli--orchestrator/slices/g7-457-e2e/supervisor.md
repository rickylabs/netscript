# Supervisor Identity — beta11-cli--orchestrator / G7 #457

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex · GPT-5.6 Sol · medium |
| Session | G7 implementation session in the current Codex thread; supervising Fable 5 session `86d308d5-c761-4e5d-a41f-8be959bc46d2` |
| Host | `YogaBook9i` · native WSL2 Linux · user `codex` |
| Checkout | `/home/codex/repos/wt-g7-457` |
| Worktree | `/home/codex/repos/wt-g7-457` (native ext4, not `/mnt/c`) |
| Branch | `feat/desktop-frontend-457-e2e` |
| Baseline | `origin/feat/desktop-frontend` @ `1709dcbabb689edd8e5c659ca91774600272597c` (2026-07-18) |
| Run ID | `beta11-cli--orchestrator/slices/g7-457-e2e` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` | Claude · Anthropic · Fable 5 · low | Orchestrator and Tier-A supervisor |
| `normal_implementation` | Codex · OpenAI · GPT-5.6 Sol · medium | G7 plan and implementation generator |
| `review_codex` | Claude · Anthropic · Fable 5 · low | Opposite-family Tier-A slice review, dispatched only by the supervisor |
| `formal_evaluation` | Claude Code · OpenRouter · Qwen 3.7 Max (open model) | PLAN-EVAL / IMPL-EVAL, dispatched only by the supervisor |

Reference `.llm/harness/workflow/lane-policy.md`; no route override is authorized.

## Attachment evidence

`deno task agentic:runtime status --worktree /home/codex/repos/wt-g7-457` reported
`MISSING_IDENTITY` and zero managed sessions on 2026-07-18. The worktree/path identity is proven,
but this implementation agent does **not** claim daemon/mobile attachment or invent a Codex thread
UUID. The discrepancy is recorded in `drift.md`; the supervisor-provided Fable session remains the
only concrete session identifier.
