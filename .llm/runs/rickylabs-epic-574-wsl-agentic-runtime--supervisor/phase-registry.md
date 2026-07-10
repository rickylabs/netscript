# Phase Group Registry: epic #574

## Run Metadata

| Field | Value |
| ----- | ----- |
| Supervisor run ID | `rickylabs-epic-574-wsl-agentic-runtime--supervisor` |
| Integration branch | `rickylabs-epic-574-wsl-agentic-runtime` |
| Base branch | `main` |

## Group Registry

| Group | Issue | Branch | Archetype / overlay | Status | Depends on |
| ----- | ----- | ------ | ------------------- | ------ | ---------- |
| 0A foundation | #575 | `chore/epic-574-wsl-agentic-runtime-foundation` | Archetype 6 + runtime gates | active | none |
| 0B controller | #576 | `refactor/epic-574-agentic-runtime-controller` | Archetype 6 | planned | 0A |
| 1A providers | #577 | `feat/epic-574-agentic-provider-profiles` | Archetype 2 + 6 | planned | 0B |
| 1B Gemini evidence | #578 | `feat/epic-574-gemini-evidence-lane` | Archetype 2 + 6 | planned | 0B, 1A profile contract |
| 1C fallback | #579 | `feat/epic-574-agentic-route-fallback` | Archetype 3 | planned | 0B, 1A |
| 2A Codex recovery | #580 | `fix/epic-574-codex-remote-recovery` | Archetype 3 + 6 | planned | 0A, 0B, 1C |
| 2B policy migration | #581 | `refactor/epic-574-harness-routing-policy` | SCOPE-docs + Archetype 6 | planned | 0A-2A |
| 3 rollout | #582 | `test/epic-574-agentic-rollout-canaries` | Runtime/release-style canaries | planned | all prior groups |

## Group 0A — foundation

### Pre-conditions

- Supervisor run activated and clean.
- Native WSL worktree created from the integration baseline with no upstream.
- Nested plan receives separate PLAN-EVAL PASS before Codex implementation.

### Surfaces touched

- WSL-local runtime/toolchain and secret-safe state.
- Native WSL worktree convention.
- Idempotent doctor/bootstrap surfaces required by #575.
- Claude/Codex/Gemini mobile and rollback evidence.

### Success criteria

- Every #575 acceptance item has reproducible captured evidence.
- Exactly one managed, mobile-visible Codex thread owns implementation.
- Separate IMPL-EVAL returns PASS.

## Base-Sync Log

| Date | Base sha merged | Result | Notes |
| ---- | --------------- | ------ | ----- |
| 2026-07-10 | `f7898dba` | clean | Supervisor branch created at current `main`. |

