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
| 0A foundation | #575 | `chore/epic-574-wsl-agentic-runtime-foundation` | Archetype 6 + runtime gates | implementation signed off; four owner canaries block merge | none |
| 0B controller | #576 | `refactor/epic-574-agentic-runtime-controller` | Archetype 6 | Plan-Gate PASS; S1 authorized | 0A implementation head |
| 1A providers | #577 | `feat/epic-574-agentic-provider-profiles` | Archetype 2 + 6 | planned | 0B |
| 1B Gemini evidence | #578 | `feat/epic-574-gemini-evidence-lane` | Archetype 2 + 6 | planned | 0B, 1A profile contract |
| 1C fallback | #579 | `feat/epic-574-agentic-route-fallback` | Archetype 3 | planned | 0B, 1A |
| 2A Codex recovery | #580 | `fix/epic-574-codex-remote-recovery` | Archetype 3 + 6 | planned | 0A, 0B, 1C |
| 2B policy migration | #581 | `refactor/epic-574-harness-routing-policy` | SCOPE-docs + Archetype 6 | planned | 0A-2A |
| 3 rollout | #582 | `test/epic-574-agentic-rollout-canaries` | Runtime/release-style canaries | planned | all prior groups |

## Canonical PR Topology

| Layer | PR | Branch | Base | Canonical head | Merge state |
| --- | --- | --- | --- | --- | --- |
| Umbrella | #583 | `rickylabs-epic-574-wsl-agentic-runtime` | `main` | `b58b4c2a` | draft; contains supervisor artifacts only |
| 0A foundation | #584 | `chore/epic-574-wsl-agentic-runtime-foundation` | umbrella branch | `9b75470` | draft; four owner-interactive canaries block merge |
| 0B controller | #585 | `refactor/epic-574-agentic-runtime-controller` | foundation branch | `f1dfdc9` | draft; Plan-Gate passed, implementation active |

Foundation commits belong to #584, not umbrella #583. #585 is a true stacked PR based on #584 so it
inherits the canonical foundation without duplicating PR 0A's diff.

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
