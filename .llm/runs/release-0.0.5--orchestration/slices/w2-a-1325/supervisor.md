# Supervisor Identity — W2-A #1325

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5.6 Sol · low |
| Session | current Codex implementation-supervisor thread |
| Host | Linux / WSL2 · Europe/Zurich |
| Checkout | `/home/codex/repos/ns005-w2a` |
| Worktree | `/home/codex/repos/ns005-w2a` |
| Branch | `fix/triggers-generated-kv-adapter-bootstrap` |
| Baseline | `origin/main@c383b2e84c254d90bab8c4f9ffcbf43a7beb8652` (2026-08-08) |
| Run ID | `release-0.0.5--orchestration/slices/w2-a-1325` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `light_implementation` | Codex · OpenAI · GPT-5.6 Sol · low | implementation supervisor |
| PLAN-EVAL | Claude · Anthropic · Fable 5 · medium, separate native session | plan evaluator; orchestrator-launched |
| IMPL-EVAL | Claude · Anthropic · Fable 5 · medium, separate native session | formal implementation evaluator; orchestrator-launched |
| `review_codex_light` | Claude · Anthropic · Opus 5 · high | adversarial review pairing |

## Recorded lane/eval overrides

The explicit 2026-08-08 slice brief supersedes the stale preparation values formerly in this file
(old branch/worktree, canary boundary, and Qwen evaluator). This correction is mirrored in
`drift.md`.
