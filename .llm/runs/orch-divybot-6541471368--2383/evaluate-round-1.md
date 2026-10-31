# IMPL-EVAL — round 1

Separate read-only Claude Opus 5.5, high effort, stdin closed.

**IMPL-EVAL round 1: one blocker.** The tests and README are sound and the provider proofs are real. The only problem is a locked-plan case that was dropped without a drift note.

**Verified against source and private evidence (no blockers here)**
- **Real storage fault seams:**
  - **KV:** the fault wraps `KvStore.atomic` and fires on the first atomic call after arming, which is the `commitTransition` CAS. The test checks that this one batch carries the exact `state`, `transition` and `applied` key segments (`kv-saga-store.ts` prefixes), so state, history and replay are proven to share a batch.
  - **Redis:** the adapter serialises `atomic` behind WATCH/EXEC, so the README's "same atomic batch" claim is accurate.
  - **Ordinary PostgreSQL:** the fault throws after the real `createMany` marker insert, inside `$transaction` and before the state write.
  - **Command-capable PostgreSQL:** the fault throws after the real `INSERT INTO saga_runtime_command_applied_key` statement. Both are genuine partial writes that the database rolls back.
- **Reopened persistence:**
  - Deno KV closes and reopens the same file.
  - Redis closes and reconnects to the same namespace.
  - PostgreSQL rebuilds the store over the same rows.
  - The engine is recreated each time.
  - The memory backend can't persist, and the test name says so honestly.
- **Outcomes:** the compensated and failed cases both assert final status, version 2, refunded state and `compensationError` (present only for failed).
- **Ambiguous commits:**
  - The after-commit fault fires only once the provider reports success.
  - The digest and version 2 are confirmed before the retry.
  - The retry returns `committed: false`.
  - A second replay leaves the envelope unchanged and history at 2 rows.
  - PostgreSQL row counts end at `[1,0,2,1,1]` with exactly one marker row, the one from the faulted attempt.
- **Before-commit checks:** after the fault, the test confirms the envelope and history equal the originals, no digest exists and correlation is unchanged. The retry then returns `committed: true`.
- **Negative control:**
  - The patch restores the old independent `#appliedKeys.recordApplied` reservation.
  - The fixture shares one `MemorySagaAppliedKeyStore` across engine recreation, so the old path can't pass just because process memory was reset.
  - The KV fault still hits the state-carrying CAS, which settles my plan-round point 1.
  - Private logs show all 6 KV-family and all 4 PostgreSQL before-commit cases red on exactly `committed: false` vs `true`.
- **The cases actually ran (my plan-round point 2):** 13/13 outer results passed with 0 ignored, Redis cases included. The raw PostgreSQL log shows all 8 child cases passing.
- **README:**
  - It limits the guarantee to retrying the same compensation outcome.
  - It states that redelivery does not rebuild cascades and that effects recovery is deferred.
  - It keeps projections out of the guarantee.
  - Its rejection claim matches `requireSagaAtomicStore` running at engine start.
- No production, export, dependency or lock changes. The public run files carry no machine paths, hosts, ports or session ids.

**Blocker**
1. **Chained compensation outcome missing, drift not recorded.** Locked decision 2 requires "a chained compensation outcome". The fixture only ever uses `cascaded: []`, so it only tests terminal `compensated` and `failed`. A chained outcome resolves to the non-terminal `compensating` status (`resolveCompensationStatus`), and on KV that takes the other retention path (no expiry, retention-key delete in the same batch). That path is still untested, and `drift.md` is unchanged. Fix either way:
   - add a `compensating` variant to `assertCompensationRetry`, with `cascaded` holding one `sagaCompensate(...)` and the expected history status `compensating`, run across the KV-family and both PostgreSQL adapters; or
   - record the omission and its rationale in `drift.md` and `evidence.md`.

The full suite result, CI, the coordinator-armed scaffold verdict and the exact pushed-head attestation remain for the final pass. I did not treat the owner-held scaffold gate as blocking this slice.

VERDICT: FAIL_FIX
