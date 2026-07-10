# Context Pack: PR 0B desired-state agentic runtime controller

## Current State

Issue #576 is bootstrapped on native WSL branch `refactor/epic-574-agentic-runtime-controller` at
foundation baseline `9b75470`. The early draft PR, worker attachment, detailed research, and locked
plan are next.

## Next Steps

1. Commit and explicitly push the bootstrap.
2. Open the early draft PR against `chore/epic-574-wsl-agentic-runtime-foundation`.
3. Launch exactly one daemon-attached WSL Codex worker and record its thread identity.
4. Complete research, Design, plan-gate waiver record, then implementation slices.

## Boundaries

- #576 owns the typed desired-state controller and compatibility adapters.
- #577-#582 retain provider profiles, Gemini evidence, fallback policy, durable Codex recovery,
  harness route migration, and rollout canaries.
