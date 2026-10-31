# PLAN-EVAL round 1

I'm read-only and wrote no files, including `plan-eval.md`; the supervisor will need to record this verdict. The plan fails on three blockers.

**What I checked:**
- `research.md` matches current main (abe9d3e). I confirmed its main findings against the code:
  - **Business state is overwritten.** `projectionState` spreads the business state and then writes `status`, the identifiers and `metadata` on top of it (`plugins/sagas/src/runtime/saga-instance-projection.ts`).
  - **KV GET scans every row.** `findSagaInstanceKv` lists all projections, sorts them, then searches.
  - **The two-read path exists.** `KvSagaStore.findByCorrelation` and `load` each do one get, and the `PrismaSagaStore` equivalents each do one `findUnique`.
  - **The Prisma index exists.** `@@index([sagaName, correlationId])` is in `sagas.prisma`.
  - **The status JSON path is preserved.** List filtering reads `$.status` in `buildSagaInstanceWhere`, and the planned nested Prisma shape keeps status there.
- The plan's decisions line up with the owner's requirements: business state preserved and nested, exactly two reads for KV, one indexed `findFirst` for Prisma, no #2382 work, no local scaffold.runtime, and the coordinator owns labels, milestones and merge.

## Blockers

1. **The backend combinations aren't specified, and the service can't do the direct lookup today.** The API service is a separate process from the runner. Right now it only resolves the projection backend, and only gets a Prisma client when the projection is Prisma (`plugins/sagas/services/src/main.ts:54-62`). The runner resolves the store backend with `resolveSagaStoreBackend({ ...input, defaultBackend: 'kv' })` from the processor appsettings (`saga-runner.ts:266`, `backendInput`), and opens KV through `openSagaRuntimeKv()`, which honours `NETSCRIPT_SAGA_KV_PATH`. The projection uses plain `getKv()`. Locked decision 3 ("inject the canonical store … test seam") leaves this open. The plan must lock and test, for each store (kv/prisma) × projection (kv/prisma/none) combination:
   - **Same store backend as the runner.** The service must resolve it with the same resolver, the same `defaultBackend: 'kv'` and the same env/appsettings inputs. Otherwise an unconfigured KV-only deployment throws at startup, or reads the wrong store and returns 404s.
   - **Prisma store with KV projection.** In this case the service must get a Prisma client with only the `PrismaSagaStoreClient` delegates. The current `isSagaServicePrismaClient` check also requires the `sagaInstance`/`sagaExecutionHistory` delegates.
   - **Same KV handle as the runner.** The canonical KV store must be opened through `openSagaRuntimeKv()`, not `getKv()`.
   - **The expected read path for each combination.** Prisma store with KV projection is two `findUnique` reads, not "two KV gets". The plan should also say what GET does when the projection is `none`.
   - **The test for each combination.** The current risk register only counts KV gets.

2. **There is no rule for telling new Prisma rows from legacy ones.** Decision 1 says "legacy rows use an explicit fallback" but never says how a new nested row `{ state, status, metadata, … }` is told apart from a legacy flat row. Business state can legally contain its own `state`, `status` or `metadata` keys, so guessing from the row's shape is ambiguous. This is a persisted format: changing the rule after rows have been written means another migration. The plan must lock an explicit marker (for example a format/version field written by the new projector), and state how `mapPrismaRecordToInstance` uses it for both GET and list.

3. **S1 doesn't name the files it touches.** The plan gate requires each slice to list its files. `worklog.md` says "exact file families … are in plan.md", but `plan.md` only lists topics. S1 needs an explicit file list:
   - `saga-instance-projection.ts`, `v1-helpers.ts`, `v1-handlers.ts`, `v1-types.ts`, `main.ts`, `database-client.ts`
   - any contract file being clarified
   - the tests
   - the docs, at their real paths

   The docs location also needs settling. `drift.md` moves it to `docs/site/durable-workflows/sagas.md` and `docs/site/reference/sagas/index.md`, but the allowed-write scope in `supervisor.md` still only lists `docs/pages/background-processing/**`. The run should record owner or coordinator approval for that scope change, or keep the docs inside the allowed scope.

VERDICT: FAIL_PLAN
