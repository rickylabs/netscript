# Supervisor Identity — feat-agentic-deepclaude-remote-control--hybrid-control-plane

| Field | Value |
| --- | --- |
| Model | Codex GPT-5.6 Sol |
| Session | Codex thread `019fd09d-1b68-79b0-a7c8-960a67b5b8de` |
| Host | WSL Linux · `codex` |
| Checkout | `/home/codex/repos/ns-005` |
| Worktree | `/home/codex/repos/ns-agentic-deepclaude` |
| Branch | `feat/agentic-deepclaude-remote-control` |
| Baseline | `229de5e237133c1dc8d063500cb9fc2be32620cd` · `orchestrator/0.0.5` · 2026-08-05 |
| Run ID | `feat-agentic-deepclaude-remote-control--hybrid-control-plane` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| planning_decisions | Codex · OpenAI · GPT-5.6 Sol | Supervisor and plan generator |
| formal_evaluation | OpenCode · OpenRouter · Qwen 3.7 Max · high | Separate PLAN-EVAL and IMPL-EVAL sessions |
| adversarial review | OpenCode · OpenRouter · Grok 4.5 · high | Reference-claim and security review |

## Recorded lane/eval overrides

- Owner previously required OpenCode for evaluations and excluded OpenHands because this local
  Remote Control/toolchain behavior cannot be reproduced by cloud agents. Formal evaluation stays
  open-model-only and session-separated.
