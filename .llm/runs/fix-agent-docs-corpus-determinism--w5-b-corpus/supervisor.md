# Supervisor Identity — fix-agent-docs-corpus-determinism--w5-b-corpus

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5.6 Sol |
| Session | `/root` primary workspace session |
| Host | Linux · `/home/codex/repos/ns006-w5b` |
| Checkout | `/home/codex/repos/ns006-w5b` |
| Worktree | `/home/codex/repos/ns006-w5b` |
| Branch | `fix/agent-docs-corpus-determinism` |
| Baseline | `9a7cadcaa9066970e931ed6abf1e61b65fcef20e` (`origin/main`, 2026-08-12) |
| Run ID | `fix-agent-docs-corpus-determinism--w5-b-corpus` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | Codex · OpenAI · GPT-5.6 Sol · medium | Implement the focused tooling/test slice requested by the owner. |
| `review_codex` | Claude · Anthropic · Fable 5 · low | Opposite-family supervisor review pairing for the implementation slice. |
| automated cloud evaluator | OpenHands · approved open model | Mandatory IMPL-EVAL triggered once by draft → ready. |

The user explicitly selected the normal Codex medium implementation route and the normal automatic
draft → ready evaluator. No route override is in force.
