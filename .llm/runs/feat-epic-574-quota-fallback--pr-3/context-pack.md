# Context Pack — persisted quota fallback and restoration (#579)

## Current State

- Branch: `feat/epic-574-quota-fallback`; worktree native ext4 at the requested path.
- HEAD before plan commit: `783e505e`; locked base `c90bc938`; ancestry verified.
- Phase: Plan & Design, awaiting coordinator Plan-Gate. No implementation authored.
- Coordinator: Claude Opus 4.8; Codex thread `019f4d6c-bed7-7d62-a61f-3dccd822fcc2`.

## Locked Scope

Persist a value-free routing state machine for structured quota/limit/outage signals, approved
fallback selection, reset/backoff/minimal canary, and boundary-safe restoration. Preserve desired
route, never mutate defaults/global environment, and block same-family evaluation.

## Key Decisions

- Canonical runtime contracts only; no forks.
- Archetype 6 primary bootstrap plus mandatory Archetype 3 state/runtime gates.
- Structured diagnostics first; exact version-pinned tested text fallback.
- Explicit policy table, including paid-Fable approval guard as data only.
- Machine-local bounded state/history plus concise run transition projection.
- #580-#582 remain blocked/deferred.

## Next Action

Commit/push P0 and post the structured PLAN comment, then stop for the coordinator’s separate
Plan-Gate verdict. Implementation must not begin before recorded PASS.

