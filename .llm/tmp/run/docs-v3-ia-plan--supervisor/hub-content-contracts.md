# Capability-Hub Content Contracts (complex hubs)

Closes Codex panel **major #6** ("the capability hub template is too shallow for the APIs the plan promises").
The uniform §2 triplet template (`doc-architecture-v3.md`) is the floor; the 8 hubs below carry a **content
contract** the build run must satisfy before the hub is accepted. Each names: concepts, the exact APIs/option
tables, the runnable example(s), the diagram(s) (xref to `ground/leakage-diagram-barraising.md` Section B), the
how-tos, and the generated reference links. APIs are sourced from `surface-inventory.md` +
`ground/playground-showcase-map.md` (verified on `origin/main`).

> Authoring rule: every API named below must be confirmed via `deno doc <unit>` at author time; an option
> table must enumerate the **actual** option keys, not a representative subset.
>
> **Structure rule (binds `doc-architecture-v3.md` §8 Type-H + the competitor teardown):** every hub follows
> the locked Type-H section order. In particular: (1) the hub **opens with its architecture/schema diagram** —
> for the stateful engines (sagas, background-jobs, triggers, database) this is the **ERD / state-machine** of
> the engine's persisted model, drawn from the live Prisma schema (Medusa "module starts with its schema");
> (2) the **primary interface(s)** are shown as a **types-first** `comp.apiTable` (fields/required/defaults)
> **before** the runnable example (TanStack signature-first); (3) every code block carries a **file-path
> first-line comment** and highlights added lines (§8.1); (4) the hub ends with a **"Production notes"**
> callout of deploy/footgun caveats (Laravel per-feature gotchas) before the Reference links.

---

## 1. `capabilities/fresh-framework` ★NEW (heaviest — `@netscript/fresh`, 80 builder imports in showcase)
- **Concepts:** the `definePage` layer-builder model; layers = independently loaded/cached slots; the
  **layer + partial + island triad** (server layer ↔ `definePartial` route ↔ hydrated island sharing one query
  key); cache-first → partial-fallback → SWR background reload; route contracts; forms server/client/hybrid.
- **API / option tables (required):**
  - `definePage().withRoute().withPolicy().withTelemetry().withLayer(name, Comp, opts).withForm().withResource().withLayout(slots).withMeta().build()` — option table for `withLayer` opts (`loader, partial, partialName, fallback, layerDeps, staleTime, staleReloadMode`) and `withForm` opts (`schema, initial, onIntent, mutate, redirectTo`).
  - `withPolicy` enum values (e.g. `'balanced'`) — **document the full enum** (panel finding: undocumented).
  - `defineRouteContract({ searchSchema })`, `paginationSearchSchema`, `enumPathParamSchema`, `InferRouteContractSearch`.
  - `definePartial({ name, loader, component })`; `DeferPage`/`Deferred`/`DeferComponent`.
  - hooks: `useResource/useSearch/useRoute/useSlots`.
- **Runnable example:** the orders list page (`definePage` with a `list` layer + cache-first loader) + its partial.
- **Diagrams:** Section B #2 (request lifecycle), the page-layer rendering model (showcase §5.3).
- **How-tos:** `forms-three-ways`, `tanstack-query`. **Tutorial:** Track D 02–05.
- **Reference:** `ref:fresh/{server,builders,route,defer,form,error,query,interactive,streams,vite}`.

## 2. `capabilities/sdk` ★NEW (`@netscript/sdk`)
- **Concepts:** contract → typed client → KV cache-first query factory → `clientKey()` vs `key()` →
  `getCachedEntry` SWR → TanStack bridge; Aspire service discovery.
- **API tables:** `createServiceClient<Contract>({ contract, serviceName, routerName? })`;
  `createQueryFactories({...})` → per-procedure `.queryOptions()/.mutationOptions()/.clientKey()/.key()/.getCachedEntry()`;
  `createNetScriptQueryClient()`, `bridgeInvalidation(resource, action)`, `toClientKeyPrefix()`;
  `cacheQuery.setCachedData(key, item, ttl)`; `getServiceUrl(name, protocol)` discovery + `VITE_`-mirror; `safe()`.
- **Runnable example:** `lib/api-clients.ts`-style client+factory setup for one service.
- **Diagrams:** Section B hero (contract-to-UI lifecycle, showcase §5.1); service-discovery topology (§5.5).
- **How-tos:** `discover-services`. **Tutorial:** Track D 03/05.
- **Reference:** `ref:sdk/{client,query,query-client,cache,collections,discovery,streams,telemetry,ports}`.

## 3. `capabilities/background-jobs` (enrich — `@netscript/plugin-workers-core` + `plugin-workers`)
- **Concepts:** jobs vs tasks; `WORKER_RUNTIMES = in-process | web-worker | subprocess` thread isolation as a
  **user-tunable**; job lifecycle + result types; graceful shutdown drain.
- **API tables:** `defineJobHandler` (payload Zod, `createSuccessResult/createFailureResult`); worker runtime
  mode config (option table per mode); `shutdown` hooks; `enqueueJob(localJob(...), { payload })`.
- **Runnable example:** `process-payment`-style job handler + enqueue.
- **Diagrams:** Section B #5 (queue→worker→scheduler), #6 (polyglot subprocess + traceparent).
- **How-tos:** `tune-worker-runtime`. **Tutorial:** Track C 02. **Deferred (D):** job-tools `createJobTools`
  no-op → status badge + one caveat (the canonical Observability callout — see WS7).
- **Reference:** `ref:plugin-workers-core/{builders,workflow,executor,runtime,state,registry,presets,shutdown}`.

## 4. `capabilities/polyglot-tasks` ★NEW (`@netscript/plugin-workers-core` task surface)
- **Concepts:** `TASK_TYPES = deno|python|dotnet|cmd|powershell|shell|executable`; per-runtime config
  (venv/requirements, runtimeVersion, loginShell); the **per-task Deno permission model**.
- **API tables:** `TaskPermissionsSchema` (`net/read/write/env/run/ffi/import`) as a full option table; the
  runtime-support matrix (which TASK_TYPE on which OS).
- **Runnable example:** one `shell` + one `python` task with explicit permissions (sourced per
  `tutorial-proof-plans.md` Track C proof gate).
- **Diagrams:** Section B #6.
- **How-tos:** `run-a-polyglot-task`. **Tutorial:** Track C 03 (gated by proof).

## 5. `capabilities/durable-sagas` (enrich — `@netscript/plugin-sagas-core` + `plugin-sagas`)
- **Concepts:** saga state machine; event-driven transitions; compensation-as-effect; checkpoint stores
  (kv/prisma); the **extension points** (presets/middleware/transports/agent/integration) the current page omits.
- **API tables:** `defineSaga` + `send`; `SagaState`; `sagaComplete/sagaFail`; `createSagaPublisher`;
  `createParallelQueue` (panel: referenced but never shown — must be shown); preset/middleware/transport option
  tables; store choice (kv vs prisma) table.
- **Runnable example:** `order-saga.ts` step machine with a compensation branch.
- **Diagrams:** Section B #3 (saga state machine + compensation + checkpoint store).
- **How-tos:** (extending sagas). **Tutorial:** Track A 04.
- **Reference:** `ref:plugin-sagas-core/{builders,runtime,stores,presets,middleware,transports,agent,integration/*}`.

## 6. `capabilities/triggers` (enrich — `@netscript/plugin-triggers-core` + `plugin-triggers` + `watchers`)
- **Concepts:** webhook ingress + HMAC verification; file-watch triggers; scheduled triggers; adapters/runtime.
- **API tables:** `defineWebhook(handler, { id, path, verifier, secretEnv, metadata })`;
  `defineFileWatch(handler, { id, paths, patterns, on, stabilityThreshold })`; trigger adapter/runtime options.
- **Runnable example:** `payment-status-webhook.ts` + `product-import.ts` CSV watch.
- **Diagrams:** (trigger ingress flow). **Tutorial:** Track A 05, Track C 04.
- **Reference:** `ref:plugin-triggers-core/{builders,runtime,adapters,public}`.

## 7. `capabilities/services` (enrich — `@netscript/service` + `@netscript/contracts`)
- **Concepts:** contract-first oRPC services; OpenAPI/Scalar exposure; health/readiness/liveness; graceful
  shutdown; the auth middleware seam.
- **API tables:** `defineService(router, { name, version, port, db, openapi, debug })`;
  `createOpenAPISpec/createScalarDocs/createOpenAPIHandler`; `createReadinessHandler/createLivenessHandler`,
  `healthChecks.database`; `ShutdownHook/Context/Reason/Report`; `.withAuthn()/.withAuthz()`.
- **Runnable example:** `services/orders` `defineService` + router.
- **Diagrams:** Section B #2 (request lifecycle). **How-tos:** `graceful-shutdown`, `expose-openapi-scalar`.
  **Tutorial:** Track A 02.
- **Reference:** `ref:service/.`, `ref:service/auth`, `ref:contracts/{crud,query,transform}`.

## 8. `capabilities/database` (enrich — `@netscript/database` + `prisma-adapter-mysql`)
- **Concepts:** Prisma + adapter model (postgres/mssql/mysql); per-plugin schema aggregation; Prisma OTel tracing.
- **API tables:** adapter selection (`adapters/postgres|mssql|mysql`) option table; `tracing` hook config;
  per-plugin `.prisma` aggregation; `db.getClient()`.
- **Runnable example:** second-database (mssql or mysql) adapter wiring.
- **Diagrams:** Section B #10 (per-plugin schema aggregation / ERD). **How-tos:** `use-a-second-database`.
  **Tutorial:** Track B 03.
- **Reference:** `ref:database/{ports,adapters,adapters/postgres,adapters/mssql,adapters/mysql,extensions,tracing}`.

---

**Acceptance (binds WS1/WS3):** each hub above is accepted only when its content contract is fully present —
every named API has an option table or runnable example, the listed diagram(s) exist, and the how-to/tutorial/
reference links resolve via xref. A hub that restates the gap in prose without the contract content fails review.
