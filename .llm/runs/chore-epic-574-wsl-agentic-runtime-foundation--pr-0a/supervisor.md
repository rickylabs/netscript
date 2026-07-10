# Supervisor Identity — chore-epic-574-wsl-agentic-runtime-foundation--pr-0a

| Field | Value |
| --- | --- |
| Model | GPT-5.6 Sol (`gpt-5.6-sol`) bootstrap coordinator |
| Session | Copilot project session `7b41605a-08a4-4637-9f7a-c6bdc14869ce` |
| Host | Windows_NT coordinator; Ubuntu-24.04 WSL execution user `codex` |
| Checkout | `/home/codex/repos/netscript-547-lffix` |
| Worktree | `/home/codex/repos/netscript-epic-574-pr0a-foundation` |
| Branch | `chore/epic-574-wsl-agentic-runtime-foundation` |
| Baseline | `b58b4c2a` from `rickylabs-epic-574-wsl-agentic-runtime`, 2026-07-10 |
| Run ID | `chore-epic-574-wsl-agentic-runtime-foundation--pr-0a` |

## Lane table in force

| Tier | Binding | Role in this run |
| --- | --- | --- |
| A | GPT-5.6 Sol bootstrap coordinator; Opus 4.8 high after native WSL Claude is established | Plan, GitHub/run artifacts, slice review, and sign-off |
| D | One daemon-attached WSL Codex GPT-5.6 Sol high thread | Foundation implementation after PLAN-EVAL PASS |
| E | OpenHands minimax-M3 / qwen-3.7-max in separate sessions | PLAN-EVAL / IMPL-EVAL |

## Recorded lane/eval overrides

- Owner directive selects GPT-5.6 Sol high for PR 0A instead of the currently documented Tier-D
  GPT-5.5-high binding.
- The first `send-message-v2` turn is an attach-only handshake. It makes no repository or machine
  changes, yields the concrete thread ID, and then idles. Implementation starts only through
  `codex-resume.ts` on that same thread after the pre-slice GitHub comment records the identity.
- Fable 5 is not authorized while it is paid/on-demand.
- Separate PLAN-EVAL was explicitly waived by the owner after personal review on 2026-07-10; this
  authorization is recorded in `plan-eval.md`.
