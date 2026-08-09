# Supervisor Identity — W3-B2 #1375

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5.6 Sol · medium |
| Session | Current W3-B2 implementation-supervisor session; platform thread identifier is not exposed in this checkout |
| Host | Linux / WSL workspace |
| Checkout | `/home/codex/repos/ns005-w3b2` |
| Worktree | `/home/codex/repos/ns005-w3b2` |
| Branch | `fix/agent-mcp-docs-root` |
| Baseline | `origin/main@aa8e151e65939ecd789c82e45b22b6338a8d8ce8` (2026-08-09) |
| Run ID | `release-0.0.5--orchestration/slices/w3-b2-1375` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | Codex · OpenAI · GPT-5.6 Sol · medium | Research, plan, and implementation supervisor |
| PLAN-EVAL | Claude · Anthropic · Fable 5 · medium, fresh native session | Mandatory pre-implementation evaluator; orchestrator-launched |
| IMPL-EVAL | Claude · Anthropic · Fable 5 · medium, fresh native session | Mandatory post-gate evaluator; orchestrator-launched |

## Recorded lane/eval overrides

None. The owner-supplied identities are the active routing contract. This session does not launch
either evaluator and does not self-certify.
