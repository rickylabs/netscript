# Supervisor Identity — beta11-cli--orchestrator / G4 #452

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5.6 Sol · medium |
| Session | implementation thread `019f720b-9692-7bd2-bd66-e43066365b88`; supervising Fable 5 session `86d308d5-c761-4e5d-a41f-8be959bc46d2` |
| Host | `YogaBook9i` · Linux/WSL · `codex` |
| Checkout | `/home/codex/repos/wt-g4-452` |
| Worktree | `/home/codex/repos/wt-g4-452` |
| Branch | `feat/desktop-frontend-452-generator` |
| Baseline | `ca72db14fbbfd42aa60e37c7aea730ed9a81585c` · `origin/feat/desktop-frontend` · 2026-07-17 |
| Run ID | `beta11-cli--orchestrator/slices/g4-452-generator` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | OpenAI · GPT-5.6 Sol · medium | Research, plan, and (only after group Plan-Gate PASS) implementation |
| formal evaluator | Selected and launched by the Fable supervisor per `lane-policy.md` | Separate-session PLAN-EVAL / IMPL-EVAL |
| `review_codex` | Selected and launched by the Fable supervisor per `lane-policy.md` | Opposite-family slice review |

No lane override is in force. This implementation agent does not dispatch evaluators or reviews.

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

