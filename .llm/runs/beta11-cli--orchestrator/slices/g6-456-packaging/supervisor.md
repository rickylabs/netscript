# Supervisor Identity — beta11-cli--orchestrator / G6 #456

Written at nested-run start per `workflow/lane-policy.md` § Supervisor identity. The Fable 5
orchestrator owns the group Plan-Gate, every Tier-A slice review, and all evaluator dispatches. This
Codex session owns research, design, and—only after Plan-Gate PASS—the implementation slices.

| Field      | Value                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Model      | Codex · OpenAI · GPT-5.6 Sol · high                                                                                |
| Session    | Current G6 Codex implementation thread (thread id is not surfaced in this turn context)                            |
| Supervisor | Claude Fable 5 · session `86d308d5-c761-4e5d-a41f-8be959bc46d2`                                                    |
| Host       | WSL2 Linux / `YogaBook9i` / user `codex`                                                                           |
| Checkout   | `/home/codex/repos/wt-g6-456`                                                                                      |
| Worktree   | `/home/codex/repos/wt-g6-456`                                                                                      |
| Branch     | `feat/desktop-frontend-456-packaging`                                                                              |
| Baseline   | `feat/desktop-frontend` / `origin/feat/desktop-frontend` @ `e6e1be087722746b83b1835e29f265adc40db991` (2026-07-18) |
| Run ID     | `beta11-cli--orchestrator/slices/g6-456-packaging`                                                                 |

## Routes in force

| Task lane                | Provider / model / effort             | Role in this run                                                |
| ------------------------ | ------------------------------------- | --------------------------------------------------------------- |
| `complex_implementation` | Codex · OpenAI · GPT-5.6 Sol · high   | G6 research, design, and implementation                         |
| `review_codex_complex`   | Claude · Anthropic · Fable 5 · medium | Supervisor-triggered substantive slice review                   |
| `formal_evaluation`      | OpenRouter · `qwen/qwen3.7-max`       | Supervisor-triggered PLAN-EVAL / IMPL-EVAL in separate sessions |

Reference `.llm/harness/workflow/lane-policy.md`; no route override is active.

## Hard stop-lines

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) —
   owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.

No sub-agent brief was issued by G6.
