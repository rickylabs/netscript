# Drift — sagas-prisma-store

## 2026-06-20

- **minor / planned deferral:** Prisma `SagaIdempotencyPort` parity remains deferred. This slice adds
  Prisma durable saga state persistence only; KV remains the idempotency and applied-key backend.
  Recorded in `.llm/harness/debt/arch-debt.md`.
- **minor / test harness:** Prisma store unit tests use a structural in-memory Prisma-shaped client
  for deterministic adapter contract coverage. Real database execution is covered by the final
  `scaffold.runtime` smoke, which provisions Postgres for generated projects.
- **minor / worktree hygiene:** pre-existing `.llm/tmp/run/openhands/**/request.md` line-ending-only
  modifications were present before implementation and excluded from all slice commits.
