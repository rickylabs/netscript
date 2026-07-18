# Supervisor Identity — beta11-cli--orchestrator / G2 #841

Written at nested-run start per `workflow/lane-policy.md` § Supervisor identity. The Fable 5
orchestrator owns all evaluator and review dispatches; this Codex session owns research, plan, and
implementation only after the group Plan-Gate passes.

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5.6 Sol · high |
| Session | `019f720b-8d75-7443-a1dc-c8a58410ddae` |
| Supervisor | Claude Fable 5 · session `86d308d5-c761-4e5d-a41f-8be959bc46d2` |
| Host | WSL2 Linux / user `codex` |
| Checkout | `/home/codex/repos/netscript-beta10-cli` |
| Worktree | `/home/codex/repos/wt-g2-841` |
| Branch | `feat/desktop-frontend-841-autoupdate` |
| Baseline | `feat/desktop-frontend` @ `ca72db14fbbfd42aa60e37c7aea730ed9a81585c` (2026-07-17) |
| Run ID | `beta11-cli--orchestrator/slices/g2-841-autoupdate` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `complex_implementation` | Codex · OpenAI · GPT-5.6 Sol · high | G2 research, design, and implementation |
| `review_codex_complex` | Claude · Anthropic · Fable 5 · medium | Supervisor-triggered substantive slice review |
| `formal_evaluation` | Claude Code + OpenRouter · `qwen/qwen3.7-max` | Supervisor-triggered PLAN-EVAL / IMPL-EVAL in separate sessions |

Reference `.llm/harness/workflow/lane-policy.md`; no route override is active.

## Hard stop-lines

1. NO merge to `main` for any PR without BOTH CI green AND an opposite-family eval PASS recorded
   on the PR, and merge authorization per the harness flow.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.

