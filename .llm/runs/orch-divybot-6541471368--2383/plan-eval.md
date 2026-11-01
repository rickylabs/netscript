# PLAN-EVAL — round 1

Separate read-only Anthropic Claude Opus 5.5, high effort, stdin closed, owner route.

No blockers. The plan is sound and the acceptance boxes can be met as scoped.

**Checked against the source at the baseline commit**
- `SagaEngine.commitCompensation` sends compensation through the same `#persistTransition` → `commitTransition` path as inbound handlers, with replay identity `saga-compensation-v1` + saga id + instance id + version. There is no separate reservation step. Keeping production logic unchanged unless a proof fails is the right call.
- **KV (Deno KV and Redis):** `KvSagaStore.commitTransition` puts state, correlation, reverse correlation, history, retention and the replay marker into one atomic call. There is no window between writes. So the plan's choices are correct: fail the atomic call, check what the batch contained, check that nothing changed, and test a lost acknowledgement.
- **Lost acknowledgement retry:** on KV the retry short-circuits on the marker read; on PostgreSQL `createMany` returns a count of 0. Both give `committed: false` even though the expected version is now stale. That matches the plan's "duplicate replay writes nothing" assertion.
- **PostgreSQL:** both stores write the replay marker first in the transaction, then state. "Fail after the marker write, before the state write" is therefore a real partial-write point and a valid rollback proof. Both adapters (ordinary and command-capable) are covered.
- **Coverage:** Deno KV, Redis, ordinary Prisma and command-capable Prisma are all the shipped durable stores. Memory is test-only, and granular custom stores are rejected at registration.
- **Negative control:** the requirement that every provider's assertion goes red against the old reservation-before-save path keeps the proof honest.
- **Owner constraints:** no local scaffold.runtime, a coordinator-armed e2e-cli verdict, a Refs-only PR, and no labels or milestones. All are recorded consistently in the plan, supervisor, drift and context-pack files.

**Points the implementation review will check (not blockers)**
1. **No git history for the negative control.** The clone is shallow (2 commits), so the old reservation path can't be checked out from history. Rebuild it by hand: write the marker in its own step before `commitTransition` without `appliedKeyHash`, and record the exact diff. On KV, the fault must hit the state-carrying atomic call, not the marker reservation. Otherwise the old path fails cleanly and the control can't go red.
2. **Proof that provider tests actually ran.**
   - The Redis tests only run when `NETSCRIPT_TEST_REDIS_URL` is set. CI sets it only for matrix index above 0.
   - The PostgreSQL fixture only runs when `COMMAND_POSTGRES_SOCKET` is set. No CI workflow sets it.
   - Evidence must show those cases running and passing, not skipped. For PostgreSQL that means a local run with real Postgres, captured through `SAGA_POSTGRES_EVIDENCE`. Otherwise the provider's box stays unchecked, as the plan already says.
3. **What "retry" means.** The proof covers retrying the same compensation outcome at the engine/store level. Redelivering an inbound message whose transition already committed returns `alreadyApplied` with no cascades, so compensation does not re-run. The README must not claim automatic recovery through redelivery. It should name that gap as the deferred cascaded/post-commit delivery recovery.
4. **Projection (non-blocking).** In the durable runtime, a projection failure after the main commit, followed by a retry, returns `committed: false` and does not refresh the projection. This is existing read-model behaviour, not replay plus state. Leave it out of the guarantee or describe it accurately.

VERDICT: PASS_PLAN

## Implementation research clarification

The evaluator correctly required real PostgreSQL evidence, which this run supplies. Its statement that no CI workflow sets COMMAND_POSTGRES_SOCKET overlooks the called `.llm/tools/command-postgres-conformance.sh`: that script creates the isolated provider and exports the variable before running the saga provider test. `.github/workflows/command-postgres.yml` invokes it. The local provider proof remains valid and independently recorded.
