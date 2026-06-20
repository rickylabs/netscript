# Generator brief — sagas-prisma-store (Track-3, Prisma durable SagaStorePort parity)

**Launch state: HELD until the blocker batch (#76, #77) finishes merging into the umbrella.**
Then create a fresh WSL Codex worktree + daemon-attached thread and launch with this brief.

## Activation

`use harness`. This is a harnessed implementation slice. You are the GENERATOR (WSL Codex), not the
evaluator. Production/enterprise bar: no stubs, no no-ops; real persistence, error-handling,
idempotency parity, observability, graceful teardown; full tests; all selected gates green.

Read first, in order:
1. `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine`.
2. The committed slice artifacts on the umbrella branch:
   - `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/sagas-prisma-store/research.md`
   - `…/slices/sagas-prisma-store/plan.md`  ← the authoritative design (§4.1–§4.5, 6 commit slices)
   - `…/slices/sagas-prisma-store/plan-meta.json` (locked decisions)
   - `…/slices/sagas-prisma-store/plan-eval.md` (PLAN-EVAL PASS verdict + the 3 notes below)
3. Ground truth: `KvSagaStore` (`plugins/sagas/src/runtime/kv-saga-store.ts`), `MemorySagaStore`,
   `createDurableSagaRuntime`, the `SagaStorePort` contract (#74), `@netscript/database`
   `ctx.db.getClient()`.

## Archetype / scope / gates

ARCHETYPE-2 (Integration) + ARCHETYPE-5 (Plugin) + SCOPE-service + `@netscript/cli` touch. Select the
gate set accordingly. Because this changes scaffold output, the PR **MUST carry the `e2e-cli-gate`
label** and the merge-readiness E2E smoke applies:
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` (evaluator/merge pass — do not run
every loop). Name **F-13 (Saga/runtime invariants)** explicitly in the ARCHETYPE-5 gate set.

## Scope (from the ratified plan — do not widen)

- Add `PrismaSagaStore implements SagaStorePort` (`plugins/sagas/src/runtime/prisma-saga-store.ts`),
  consumer-brings-the-instance (`new PrismaSagaStore({ prisma })` from `ctx.db.getClient()`); store does
  NOT own the connection lifecycle.
- Dedicated durable Prisma models (`saga_runtime_state` / `saga_runtime_transition` /
  `saga_runtime_correlation`) in `plugins/sagas/database/sagas.prisma` — SEPARATE from the existing
  read-model/projection tables (port keys on `instanceId`; projection PK is `[sagaName,id]`).
- Optimistic-write parity: `$transaction` + `updateMany where {instanceId, version: expectedVersion}`;
  `count===0 && rowExists` → `SagasError.validationFailed("Saga store version mismatch for <instanceId>.")`.
- Backward-compatible seam refactor of `createDurableSagaRuntime` adding `backend?: 'kv'|'prisma'`,
  `prisma?: PrismaClient`, `dispose()`; `kv` optional (only set for KV backend); zero-arg call keeps the
  KV default so existing internal callers do not break.
- Explicit backend selection: env `NETSCRIPT_SAGA_STORE=kv|prisma`, appsettings `sagas.store.backend`,
  and a minimal additive `@netscript/cli` scaffold option. The scaffold + multi-backend helper REQUIRE an
  explicit choice and error on unresolved.
- Docs reconciliation: Postgres is again a first-class DURABLE saga backend (not only a projection).

**Deferred (record in drift, do NOT implement):** Prisma `SagaIdempotencyPort` (KV stays the idempotency
backend); migrating existing projection tables; any change to `@netscript/plugin-sagas-core` public surface.

## PLAN-EVAL non-blocking notes to fold in during slicing

1. Error-string trailing period parity: `Saga store version mismatch for ${id}.` — the trailing period
   is present in BOTH `KvSagaStore:185` and `MemorySagaStore:48`; match it byte-for-byte.
2. `docs/architecture/.../extension-axes.md:15` reconciliation: `PostgresSagaStore (planned)` →
   `PrismaSagaStore` (the actual name shipped here).
3. Name F-13 (Saga/runtime invariants) explicitly in the ARCHETYPE-5 gate set / worklog.

## Mechanics

- Branch `feat/prime-time/sagas-prisma-store` off the LATEST umbrella tip (re-base if the umbrella moved).
- Catalog law: `@prisma/client` is already cataloged (`deno.json:106`) — use `catalog:`; never
  de-catalog; JSR deps inline `jsr:`. Do NOT touch version pins, `packages/aspire/src/public/mod.ts`,
  or `scaffold-versions.ts`.
- Commit by slice (6 slices in the plan); push each with EXPLICIT refspec
  `git push origin HEAD:refs/heads/feat/prime-time/sagas-prisma-store --force-with-lease`
  (repo `push.default` mis-targets otherwise). Append `commits.md`, write `worklog.md`/`drift.md`/
  `context-pack.md`. Do NOT modify `deno.lock` unless legitimately required.
- When done, signal READY; supervisor dispatches IMPL-EVAL (OpenHands qwen3.7-max) as a separate session.
