# Supervisor Identity — beta11-cli--orchestrator/slices/g10-802-help

| Field | Value |
| --- | --- |
| Model | Codex · GPT-5.6 Sol · low |
| Session | G10 implementation session, supervised by `86d308d5-c761-4e5d-a41f-8be959bc46d2` |
| Host | Linux / WSL worktree |
| Checkout | `/home/codex/repos/wt-g10-802` |
| Worktree | `/home/codex/repos/wt-g10-802` |
| Branch | `fix/802-plugin-cli-help` |
| Baseline | `56cf84b57a64cea3e09b2ea1468c83a387bc5038` (`origin/main`, 2026-07-18) |
| Run ID | `beta11-cli--orchestrator/slices/g10-802-help` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` | Claude · Anthropic · Fable 5 · low | Supervisor, Plan-Gate, slice review, merge-readiness |
| `light_implementation` | Codex · OpenAI · GPT-5.6 Sol · low | Research, mini-plan, implementation, focused gates |
| `review_codex_light` | Opposite-family route selected by supervisor | Required review; implementation agent does not dispatch |

## Stop-lines

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.

