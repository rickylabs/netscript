# Context Pack — persisted quota fallback and restoration (#579)

## Current State

- Branch: `feat/epic-574-quota-fallback`; worktree native ext4 at the requested path.
- HEAD before plan commit: `783e505e`; locked base `c90bc938`; ancestry verified.
- Phase: implementation; coordinator Plan-Gate APPROVED. S1 is implemented and gated.
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

## S1 Result

- Added pure routing policy data/guards and structured-first, version-pinned signal classification.
- Focused tests: 7 passed, 0 failed.
- Scoped check/lint/fmt: exit 0, zero findings.
- No persistence, execution, global mutation, or paid behavior was introduced.

## Next Action

Commit/push/comment S1, then implement S2 state transitions and machine-local restart persistence.
