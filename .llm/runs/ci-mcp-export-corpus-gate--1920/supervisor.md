# Supervisor Identity — ci-mcp-export-corpus-gate--1920

| Field | Value |
| --- | --- |
| Model | OpenAI GPT-5.6 Sol (Codex) |
| Session | `01a06201-a4a9-70d0-809d-f15fa5e88c1e` |
| Host | Linux · `/home/agent` |
| Checkout | `/home/agent/projects/netscript/worktrees/007-leaf-1920` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1920` |
| Branch | `ci/mcp-export-corpus-gate` |
| Baseline | `ec848e6b0334ec8fcd2bc66ba009305d35367b01` (`origin/main`, 2026-09-02) |
| Run ID | `ci-mcp-export-corpus-gate--1920` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | OpenAI · GPT-5.6 Sol · medium | Leaf implementation, deterministic corpus regeneration, CI wiring, validation, and draft-PR handoff |
| `formal_impl_evaluation` | Native opposite-family evaluator per lane policy | Pending after implementation; owned by `topic-internals-0.0.7` |

## Recorded lane/eval overrides

- `PLAN-EVAL: N/A`: #1920 is a mechanical two-file implementation with a fully specified command,
  receipt path, trigger contract, validation plan, and explicit stop condition.
- The implementation author will not self-certify, merge, mark ready, or close #1920. The topic
  supervisor retains slice review and IMPL-EVAL.
