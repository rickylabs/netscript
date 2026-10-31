# PLAN-EVAL round 2

Separate Claude Opus 5.5 high session; read-only; verdict transcribed by implementer.

I'm read-only and wrote no files, including `plan-eval.md`. All three round-1 blockers are fixed and nothing else blocks implementation, so the plan passes.

**Round-1 blockers, now fixed:**

1. **Backend combinations are specified, with concrete wiring.** All six store/projection pairs are in the plan's table, each with its expected GET path and list path:
   - `instance-query.ts` uses the runner's resolver with `defaultBackend: 'kv'`.
   - Canonical KV reads open through `openSagaRuntimeKv`.
   - Canonical Prisma reads check only `isPrismaSagaStoreClient`.
   - An optional `sagaStore` in the context serves GET. `useKvProjection` now only picks the list backend.
   - With projection `none`, GET goes to the canonical store and the list stays empty.

   The Prisma-projection GET is one indexed `findFirst` on the existing `@@index([sagaName, correlationId])`. The KV GET is exactly two gets. Both match what the owner required.
2. **New Prisma rows carry an explicit marker.** The new projector writes `projectionVersion: 2`, defined as a shared named constant, and the reader checks it. Legacy rows are returned unchanged and are never guessed from their keys. The full read model keeps `status` at the top level, so the `$.status` path that list filtering uses is unchanged and no #2382 work is needed.
3. **S1 names every file, and the docs path is fixed.** I checked that every file in the inventory exists, apart from the three marked new. `supervisor.md` now allows `docs/site/durable-workflows/sagas.md`, and the owner's authorization for the sagas docs settles that scope.

**Notes for implementation (none of these block):**
- **Read the same settings the runner reads.** The plan says `main.ts` passes "service appsettings, exactly as runner settings". But the runner reads the project's appsettings file and lets `NetScript.BackgroundProcessors.sagas` override it (`saga-runner.ts:226-244`). The service's `serviceAppsettings(ctx)` reads `ctx.appsettings`, `ctx.settings` or `ctx.config` instead. `instance-query.ts` needs to reproduce the runner's override. Otherwise a store backend set only in that processor section would send GET to the wrong store. The six-combination tests won't catch this unless one of them sets the backend only in that section.
- **`drift.md` names a docs file the inventory doesn't.** It still says `docs/site/reference/sagas/index.md` "if needed", but neither the inventory nor `supervisor.md` lists that file. Under the plan's own rule, editing it would need a drift entry first.
- **Old KV rows keep their merged state.** KV projection rows written before this change still have business data mixed with runtime fields until their next transition or until retention removes them. The docs should cover this along with the Prisma migration note.

VERDICT: PASS
