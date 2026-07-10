# Context Pack — persisted quota fallback and restoration (#579)

## Current State

- Branch: `feat/epic-574-quota-fallback`; worktree native ext4 at the requested path.
- HEAD before plan commit: `783e505e`; locked base `c90bc938`; ancestry verified.
- Phase: implementation complete; awaiting coordinator Tier-A review. S1-S4 are gated.
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

## S3 Result

- Added `deno task agentic:routing-state [--json]`, a read-only machine-local status surface, and
  human README restart/restoration semantics.
- Removed only the landed #579 deferral tag; #580-#582 regressions remain explicit.
- Focused tests: 13 passed, 0 failed; CLI exit 0; scoped check/lint/fmt zero findings.

## Final Result

- Full agentic/runtime test inventory: 170 passed, 0 failed.
- Scoped runtime check/lint/fmt: exit 0, 42 files, zero findings each.
- All five issue/PR acceptance statements have direct test evidence in `worklog.md`.
- PR remains draft; no merge/readiness/self-certification action is authorized.
- No persistence, execution, global mutation, or paid behavior was introduced.

## S2 Result

- Added pure durable routing transitions with bounded history, reset/backoff, one minimal canary,
  boundary-safe restoration, and machine-local mode-0600 restart round trips.
- New S1-S2 matrix: 10 passed, 0 failed; adjacent controller/checkpoint/deferred matrix: 17 passed,
  0 failed.
- Scoped check/lint/fmt: exit 0, zero findings.

## Next Action

Coordinator performs substantive Tier-A review, records any requested corrections, and owns all
sign-off/merge actions.
