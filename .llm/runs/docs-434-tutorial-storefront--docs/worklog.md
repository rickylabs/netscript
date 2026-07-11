# Worklog — docs/434-tutorial-storefront (C1: storefront track rewrite)

Issue #434 · epic #401 · branch `docs/434-tutorial-storefront` from `9be23cce`.

## Plan

Rewrite the 6-chapter storefront track (slugs preserved: `01-scaffold` … `06-deploy` + `index`)
on the playground-dogfood premise, rebuilding every claim against the verified live scaffold
surface (Run-2 grounding debt). Anchor chapter `04-checkout-saga` keeps the money-loss narrative.

## Grounding evidence (verified before writing)

Every load-bearing claim was traced to source, `deno doc`, the CLI E2E suite, or a runtime probe:

- **Scaffold generates the CRUD surface.** `packages/cli/src/kernel/assets/service/contract.ts.template`
  + `routers/v1.ts.template` + `router.ts.template` + `main.ts.template`: `netscript init --db --service`
  generates the Prisma-backed contract (`ProductsContractV1` object, `ProductsV1 = implement(...)`)
  and page-based handlers. Old chapter 2 ("write these files by hand", offset pagination,
  `/api/v1/products/list`) was drifted — rewritten as read-the-generated-code + one authored upgrade.
- **REST projection paths.** Probe against `@orpc/openapi@1.14.6` (pinned in `deno.lock`):
  explicit contract paths mount under the `/api` prefix — `/api/products`, `/api/products/{id}`,
  `/api/products/health`; `/api/v1/...` does NOT match. (`/tmp/orpc-path-probe.ts` output:
  `/api/users MATCHED`, `/api/v1/users no`.) RPC prefix `/api/rpc` and OpenAPI prefix `/api` from
  `packages/service/src/builder/service-rpc.ts` (defaults).
- **CRUD list shape.** `packages/contracts/schemas/pagination.ts` + `crud/create-crud-contract.ts`:
  input `{ page, limit, sortBy, sortOrder }`, output `{ data, pagination: { page, limit, total,
  totalPages, hasNext, hasPrev } }`.
- **Malformed create → 400.** Probe: oRPC input validation failure returns
  `{"defined":false,"code":"BAD_REQUEST","status":400,"message":"Input validation failed",...}` —
  not the old claimed 422. `VALIDATION_ERROR` (422) is a handler-thrown typed error
  (`packages/contracts/src/application/contract-primitives.ts`).
- **Typed NOT_FOUND upgrade.** Probe: generated `getById` throws plain `Error` → 500
  `INTERNAL_SERVER_ERROR`; upgraded `errors.NOT_FOUND(...)` → 404
  `{"defined":true,"code":"NOT_FOUND",...}` — chapter 2's authored delta.
- **Prisma model + seed.** `schema.prisma.template` model is `{ id, name, createdAt, updatedAt }`;
  `seed.ts.template` runs `SELECT 1` only (no sample rows) — old "seed some sample products" claim
  removed; rows are created over the API instead.
- **`@database/zod`** maps to `./database/<engine>/schema/.generated/zod/crud.ts`
  (`templates/workspace/deno-json.ts`).
- **init flags** (`init-command.ts`): `--service`, `--service-name`, `--service-port`, `--model-name`,
  `--db` (postgres|mysql|mssql|sqlite|none per `db-engine.ts`), `--no-aspire`, `--editor`, `--dry-run`.
  CLI version `0.0.1-beta.7` (`packages/cli/deno.json`). Command groups per `public-command-tree.ts`.
- **db commands** (`db-group.ts`): init (`--name`, default `init`), generate, migrate (`--name`),
  seed, status, studio, introspect, reset.
- **Contracts workspace imports** (`templates/workspace/contracts/deno-json.ts`):
  `@orpc/contract`, `@orpc/server`, `@netscript/contracts`, `zod` — old chapter 3 imports
  (`../../shared.ts`, `@shared/utils`) do not exist in a scaffolded project; rewritten against
  the real alias set. Public helpers (`positiveInt`, `nonNegativeInt`, `OffsetPaginationInputSchema`)
  verified via `deno doc packages/contracts/mod.ts`.
- **v1 aggregate shape** (`generate-v1-mod.ts` + `v1-aggregate.ts.template`): named imports +
  `export {...}` + `export const v1 = { products: ProductsV1 }` — chapter 3's mod.ts edit matches it.
- **Typed client** compile-probed (`createORPCClient` + `OpenAPILink` + `ContractRouterClient`),
  `deno check` green; `@orpc/client` / `@orpc/openapi-client` are NOT in the scaffold import map —
  chapter adds them with `deno add npm:...`.
- **Plugin installs** (`plugin-install-gates.ts`, default order `worker, saga, trigger, stream`):
  `netscript plugin install <kind> --name <plural> --samples`. Old "saga pulls in streams
  automatically" claim replaced with explicit installs matching the E2E merge gate.
- **Saga authoring**: `defineSaga().durability('t1'|'t2'|'t3').state().correlate().on().compensate().build()`
  via `deno doc` + `packages/plugin-sagas-core/src/builders/define-saga.ts`; handler signature
  `(saga, message, context) => CascadedMessage[]`; `send(target, payload)`; userland files
  `sagas/<id>-saga.ts` + `sagas/<id>.config.ts` (`defineSagaConfig` from
  `@netscript/plugin-sagas-core/config`) per `plugins/sagas/src/adapter/resources/saga/*` (install
  drops `sagas/user-registration-saga.ts`).
- **Worker job**: `defineJobHandler` / `createSuccessResult` / `createFailureResult`
  (`@netscript/plugin-workers-core`), `createSagaPublisher` (`@netscript/plugin-sagas/runtime`) —
  exact pattern of the shipped `create-user-settings` sample
  (`plugins/workers/src/cli/official-sample-configuration.ts`). Jobs dir scan documented in
  `how-to/tune-worker-runtime.md` (default `./workers/jobs`, default-exported modules).
- **Registries**: `netscript generate plugins` = "Generate plugin registries from project source"
  (`generate-plugin-registries-command.ts`).
- **Sagas API**: `GET /sagas`, `GET /instances`, `GET /instances/{sagaName}/{correlationId}`,
  `POST /publish` (`packages/plugin-sagas-core/src/contracts/v1/sagas.contract.ts`) on `:8092`
  under `/api/v1/sagas` (E2E `runtime-gates.ts`).
- **Workers API**: `GET /api/v1/workers/jobs`, `/executions`, `POST /jobs/{id}/trigger` on `:8091`
  (E2E + `how-to/add-opentelemetry.md`).
- **Webhooks**: `defineWebhook(handler, spec)` + `enqueueJob(jobRef, opts)` from
  `@netscript/plugin-triggers-core/builders` (source-verified); userland file `triggers/<name>.ts`
  (`triggerPath()` in `plugins/triggers/src/adapter/resources/input.ts`); starter stub uses an
  inline `satisfies JobDefinition` job ref (old ungrounded `localJob` helper removed); HMAC
  verifier = hex HMAC-SHA256 over raw body, header **`x-hub-signature-256`** (optionally
  `sha256=`-prefixed) — service wiring in `plugins/triggers/services/src/main.ts`; accepted → 202;
  ingress `POST /api/v1/webhooks/:triggerId` (path-resolved); events `GET /api/v1/events` on `:8093`
  (E2E). `defer` action throws unsupported-operation (`trigger-runtime-processor.ts:190`).
- **Ports** (`packages/cli/src/kernel/constants/port-ranges.ts`): SERVICE 3000–3099,
  PLUGIN_API 8091–8099, APP 8000–8099, INFRA_PLUGIN 4400–4499, dashboard 18888, OTLP 4318;
  streams default 4437 (`plugin-streams-core/src/domain/constants.ts`).
- **Capabilities links** retargeted to pillar pages per #433 (services-sdk/services,
  durable-workflows/triggers, web-layer/fresh-ui).

## Residual risks (recorded, not blocking)

- Chapter 4 drives the saga via `POST /api/v1/sagas/publish`; the endpoint + input schema are
  contract-verified, and instance visibility is asserted via the E2E-verified instances list.
  Full happy-path completion (`completed`) requires inventory/shipment jobs the track does not
  author — checkpoints now honestly assert `paid` and `cancelled`, fixing the old chapter's
  unreachable `completed` claim.
- Sibling docs (how-to/add-a-service, explanation/contracts, cli-reference) still carry the
  `/api/v1/<service>/*` path shape the probe disproved; out of C1 scope (storefront track only),
  flagged here for the accuracy umbrella (#232).

## Ground-truth reconciliation (resumed session — re-verified against source, not just worklog)

Before rewriting I re-derived the load-bearing facts directly from templates/source (predecessor
worklog was directionally right; a few specifics were sharpened):

- **REST projection prefix is `/api`, no `/v1`.** `packages/service/src/builder/service-rpc.ts:41-42`
  → `rpcPath ?? '/api/rpc'`, `apiPath ?? '/api'`. Contract path `/products` ⇒ `/api/products`. The
  `/v1` in `v1.products.*` is the RPC namespace, not the URL. Fixed every `/api/v1/products/*` curl.
- **CRUD list is PAGE-based.** `packages/contracts/schemas/pagination.ts` `PaginationInputSchema` =
  `{ page(1..), limit(1-100), sortBy?, sortOrder }`; `createPaginatedOutput` = `{ data, pagination:{
  page, limit, total, totalPages, hasNext, hasPrev } }`. The old offset handler was drift.
- **Scaffold GENERATES the contract + handlers.** `packages/cli/.../assets/service/{contract,
  routers/v1,routers/health,router,main}.ts.template`: object `ProductsContractV1`, implemented
  `ProductsV1`, page-based handlers, `getById` throws plain `Error` (→500). So ch2 was reframed from
  "author these files" to "read the generated CRUD surface + one authored upgrade" (typed `NOT_FOUND`
  → 404). Aggregate `v1/mod.ts` (generate-v1-mod.ts) imports `XxxContractV1`+`XxxV1`, exports the
  object, and `v1.<svc>` uses the **implemented** one — ch3 mod.ts + `CartContractV1`/`CartV1` naming
  now match this.
- **Malformed create ⇒ 400 BAD_REQUEST** (oRPC automatic input-validation), distinct from the
  handler-thrown `VALIDATION_ERROR` (422, `contract-primitives.ts:27-31`). Prisma `Product` has only
  `name` settable, so the example now omits `name` (`-d '{}'`).
- **seed.ts runs `SELECT 1` only** — no sample rows; ch2 now creates the first product over the API.
- **Contracts import aliases** = `@orpc/contract`, `@orpc/server`, `@netscript/contracts`, `zod`
  (`templates/workspace/contracts/deno-json.ts`). `../../shared.ts` / `@shared/utils` do NOT exist;
  `IdQuerySchema` is ABSENT (inlined `z.object({ id: positiveInt(...) })`); `positiveInt`,
  `nonNegativeInt`, `OffsetPaginationQuerySchema`, `paginationLimit`, `paginationOffset` are public.
- **Sagas**: publish input `{ type, payload?, correlationId? }` (`sagas.contract.ts:329-331`); paths
  `/api/v1/sagas/{sagas,instances,publish}`. Ch4 verify now DRIVES the saga via `POST .../publish`
  (OrderCreated+PaymentCompleted ⇒ `paid`; PaymentFailed ⇒ `cancelled`) — replacing the unreachable
  `completed` claim (inventory/shipment jobs are unauthored). `defineSaga` chain + `send` export
  confirmed.
- **Plugins install explicitly** (no auto-pull): checkout needs `workers`+`sagas`+`streams`; ch4 now
  installs all three; ch6 plugin-list expects all four.
- **Triggers**: `defineWebhook`/`enqueueJob` from `.../builders`; header `x-hub-signature-256`;
  accepted `202`; ingress `POST /api/v1/webhooks/:triggerId`; events `GET /api/v1/events` :8093;
  `WebhookVerifierKind='hmac-sha256'|'memory'`. Real userland webhook uses an inline
  `satisfies JobDefinition` ref (NO `entrypoint`, NO `localJob` helper) — ch5 rewritten to match, and
  now authors a real `process-shipping-update` job so the execution checkpoint is observable.
- **Capability links retargeted** to pillar pages (#433): fresh-ui→`/web-layer/fresh-ui/`,
  services→`/services-sdk/services/`, triggers→`/durable-workflows/triggers/`.

## Per-page changes

- `01-scaffold.md`: fresh-ui link → pillar page. (Scaffold flow was already accurate.)
- `02-catalog-service.md`: full reframe — read generated contract/handlers, page-based list,
  `/api/products` paths, 400-on-missing-`name`, empty-seed honesty, authored NOT_FOUND upgrade.
- `03-cart-contracts.md`: real `@netscript/contracts` imports, inlined id input, `CartContractV1`/
  `CartV1` convention, real `v1/mod.ts` aggregate, `/api` client URL + `deno add`.
- `04-checkout-saga.md`: explicit workers/sagas/streams install; verify drives via `/publish`
  asserting reachable `paid`/`cancelled`.
- `05-shipping-webhook.md`: dropped `localJob`, inline `satisfies JobDefinition`, authored the job,
  `x-hub-signature-256`/202, triggers pillar links.
- `06-deploy.md`: `/api/products/*`; plugin-list expects workers/sagas/streams/triggers.

## Evidence

- `deno task verify` (docs/site, resumed session) — **GREEN**:
  - build: `🍾 Site built into _site` — 500 files in 7.41s.
  - `check:links`: `23016 internal links across 162 pages — all resolve`.
  - `check:caveats`: `27 caveat markers across 22 pages — all references resolve`.
- Lock hygiene: `git diff --name-only -- deno.lock` = 0 (reset at session start; never touched).
- Scope: only `docs/site/tutorials/storefront/0{1..6}-*.md` modified (+ this worklog); index.md left
  as-is (already on-premise and accurate).
