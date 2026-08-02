# Supervisor Identity — fix-1004-canary-republish--same-semver

| Field | Value |
| --- | --- |
| Model | Codex GPT-5 |
| Session | `/root` workspace session |
| Host | Linux container |
| Checkout | `/home/codex/repos/fix-1004` |
| Worktree | `/home/codex/repos/fix-1004` |
| Branch | `fix/1004-canary-republish` |
| Baseline | `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` (`origin/main`, 2026-08-01) |
| Run ID | `fix-1004-canary-republish--same-semver` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| planning_decisions | Codex GPT-5 (active session) | Supervisor and plan generator |
| normal_implementation | Codex GPT-5 (active session) | Small release-tool implementation |
| formal evaluator | Claude Code + OpenRouter / bound Qwen open-model preset | Separate PLAN-EVAL and IMPL-EVAL sessions |
| review_codex | Claude opposite-family route | Ordinary slice review if available |

