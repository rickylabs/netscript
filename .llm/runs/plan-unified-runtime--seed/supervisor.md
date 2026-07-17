# Supervisor Identity — plan-unified-runtime--seed

Seed run (stage contracts A–I per `.llm/harness/workflow/seed-run.md`) for issue #824 — the
unified-runtime board (Nitro v3 validation + epic decomposition). Supervised as G8 of the
beta-11 wave by the same Tier-A session.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5`) · effort low |
| Session | `86d308d5-c761-4e5d-a41f-8be959bc46d2` (beta-11 orchestrator, Tier-A) |
| Host | WSL2 Linux / user `codex` |
| Checkout | worktree `/home/codex/repos/wt-g8-seed` |
| Branch | `plan/unified-runtime` |
| Baseline | `origin/main` @ 56cf84b5 (2026-07-18, post-#847) |
| Run ID | `plan-unified-runtime--seed` |

## Routes in force

| Task lane | Provider / model / effort | Role |
| --- | --- | --- |
| `planning_decisions` | Claude · Fable 5 · low | Tier-A supervisor (stages A/C/E/H-filing/I) |
| Stage-B corpus | Sol · medium research sub-agents (Tier D via agentic suite) or committed Tier-C workflow | discovery fan-out |
| Stage-D packs | Opus 4.8 · medium sub-agents (`chore_code`/Tier B) | per-topic design packs |
| Stage-F adversarial | model distinct from all authors — Sol · max | unoriented plan review |
| `formal_evaluation` | OpenRouter qwen/qwen3.7-max | stage-G PLAN-EVAL |

## Hard boundaries (seed-run doctrine + kickoff stop-line 5)

- Drafts-only until stage H: ZERO board mutation (issues, epics, milestones, labels) before the
  owner ratifies the decision brief IN-TURN. The run's own draft PR is the only writable GitHub
  surface.
- One-shot filing from a committed manifest after ratification; FILING-LOG.md + supersession map
  (#451/#453/#454/#455 re-homed; #349 close-as-superseded proposal).

## Stop-lines (verbatim from the wave)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
