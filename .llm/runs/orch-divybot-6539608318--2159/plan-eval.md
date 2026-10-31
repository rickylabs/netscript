# Independent PLAN-EVAL — round 2

**PASS.** The round-1 amendment closes the blocker. Each of the four required items is now in `plan.md`:

1. **Bridge.** The engine will expose a read-only `usesAtomicReplay` capability. When an atomic store is configured, `publish` and cascaded `send` skip `SagaIdempotencyPort` reservation for every definition. Storeless composition keeps its current behaviour.
2. **Engine.** Injected `appliedKeys` are ignored on both the ordinary path and `commitCompensation` whenever a store is configured. Both replay identities commit inside the store transaction.
3. **Crash proof.** The persisted SIGKILL test runs through the production runner/supervisor composition with the durable bridge and applied-key stores injected. It pauses at `commitTransition`, kills the process, restarts on the same KV, redelivers, and asserts exactly one history row.
4. **Upgrade negative control.** Orphaned legacy bridge and engine markers are seeded in the production keyspace and must not suppress the atomic transition.

The KV and Prisma amendments also hold up:

- **KV.** A nested digest namespace inside the `applied` family keeps `SagaKvRetention` discovery and rules out aliasing with legacy raw-key markers.
- **Prisma.** `createMany({ skipDuplicates: true })` on `SagaRuntimeCommandAppliedKey` produces `ON CONFLICT DO NOTHING`, and a count of 0 means replay. That avoids the P2002 transaction abort and keeps the identity shipped in #1932.

**Conditions for implementation review (not blockers):**

- **Prisma client guard.** `PrismaSagaStoreClient` and `isPrismaSagaStoreClient` must require the applied-key delegate. A client that lacks it must fail at composition time, before any handler runs.
- **Prisma version check.** Ordinary Prisma `expectedVersion: 0` must mean "row absent": use `create` inside the transaction, never the current upsert.
- **Prisma retention.** The README must state that ordinary Prisma applied-key retention is owned by `createPrismaSagaCommandRetention`.
- **KV commit.** The KV CAS must cover the state versionstamp, the correlation key (absent or same instance) and an absent replay marker in one `atomic()` call. Requests that carry commands must be rejected before any write.
- **Capabilities.** The worker-command predicate stays strict. The projection and recording decorators must pass through the delegate's exact capabilities, and the recording store must log an atomic-commit operation.
- **Scope and evidence.** Bridge reservations on `compensate`, `fail` and `schedule` cascades, effect loss after commit, and a stale projection after a crash between commit and projection upsert all stay with the single slice-2 follow-up. Keep the PR Refs-only with no closing keyword. Mark any unavailable Redis or Postgres gate as unproven.

VERDICT: PASS
