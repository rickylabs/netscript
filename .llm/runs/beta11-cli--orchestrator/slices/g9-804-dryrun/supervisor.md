# Supervisor

- Run: `beta11-cli--orchestrator` / `g9-804-dryrun`
- Supervisor: Fable 5 orchestrator, session `86d308d5-c761-4e5d-a41f-8be959bc46d2`
- Implementation lane: G9, Codex GPT-5.6 Sol low (`light_implementation`)
- Worktree: `/home/codex/repos/wt-g9-804`
- Branch: `fix/804-dry-run-writes`
- Baseline: `origin/main`
- Evaluator/review: supervisor-owned; this lane does not dispatch or self-certify.

## Stop-lines

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.
