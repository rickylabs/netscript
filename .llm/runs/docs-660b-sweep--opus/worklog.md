# Worklog — docs-660b how-to + reference + pillar sweep (Opus 4.8)

Issue #660 slice B. Proposals #7, #8, #9, #10, #11, #12, #15 from `.llm/runs/docs-audit-662--sonnet/report.md`.

## Grounding / evidence

- **PORT/config (#7).** `packages/config/src/domain/schemas/service-schema.ts:11` types `port: z.number()`; `netscript-config-schema.ts:142,144` expose `services`/`apps` records. Scaffold entrypoints read `parseInt(Deno.env.get('PORT') || '<port>')` (`packages/cli/src/kernel/assets/embedded.generated.ts`), and the scaffolder writes the same value into config (`adapters/service/scaffolder.ts:115 port: options.servicePort`). Claim verified: Aspire injects PORT at runtime; `services.<name>.port` (apps: `apps.<name>.port`) is the typed source of truth.
- **#11 queue APIs.** `packages/queue/factory/{create-typed-queue,create-queue,create-parallel-queue}.ts`; `QueueProvider` enum `ports/options.ts:14`; `enqueue`/`listen` on `ports/message-queue.ts`. All cited symbols exist.
- **#11 workers executor.** `createDefaultTaskExecutor` + `TaskRuntimeAdapterLike` in `packages/plugin-workers-core/src/executor/` (import path `@netscript/plugin-workers-core/executor`).
- **#12 better-auth route guard.** `createBetterAuthBackend` returns `AuthBackendPort` with `sessions.getSession({ request })` and `principalMapper.mapSessionToPrincipal` (`packages/auth-better-auth/src/better-auth-backend.ts`). `AuthnRequest` exported from `@netscript/service/auth` (`packages/service/src/auth/mod.ts:53`); `AuthSession.state`/`Principal.roles` per auth.md tables.

## Per-page changes

(appended as slices land)

### #7 — PORT / typed-config consistency (8 pages)
One shared sentence at the first `parseInt(Deno.env.get('PORT')...)` occurrence per page:
`how-to/expose-openapi-scalar.md`, `how-to/add-a-service.md`, `tutorials/storefront/02-catalog-service.md`,
`tutorials/live-dashboard/02-contract-to-service.md`, `services-sdk/services.md`, `explanation/contracts.md`,
`how-to/add-opentelemetry.md` — all use `services.<name>.port`; `how-to/customize-fresh-ui.md` uses
`apps.<name>.port` (Fresh app). Commit 1.

### #8 — reference/ai/index.md
Added a block-quote note: AI provider keys have no typed config surface (by design); raw
`Deno.env.get` is the supported path, secrets injected by the runtime env. Commit 2.

### #9 — reference/queue/index.md + reference/kv/index.md
"See it live" link blocks (how-to/queue-kv-cron, how-to/choose-a-queue-provider, data-persistence
concept) before the reference-overview footer. Commit 2.

### #10 — reference/contracts/index.md + reference/sdk/index.md
Contracts lede: contracts obviate manual `req.json()` validation (rejected before handler runs).
SDK lede: `defineServices()` wires clients + query factories + query utils in one call. Commit 2.

### #15 — durable-workflows/streams.md
One sentence reframing "no in-process subscribe()" as an intentional single HTTP/SSE surface shared
by browser and server consumers. Commit 2.

### #11 — three decision how-tos
Runnable end-to-end block (resulting file + full command sequence) per page at deploy-local-aspire
density: `discover-services.md` (declare ref → service generate → aspire start → typed client),
`choose-a-queue-provider.md` (same call site on Deno KV then Redis), `add-a-task-runtime-adapter.md`
(node task file + runner + `deno run` + expected output). Commit 3.

### #12 — identity-access/better-auth-plugins.md
Complete `routes/admin/index.tsx` handler gated on active session + admin role via
`backend.sessions.getSession` / `principalMapper.mapSessionToPrincipal`, fail-closed. Commit 4.

## Validation
- Grep gate (public-docs law) on all 18 touched files: 0 hits.
- `deno task verify` from docs/site: build 512 files; check:links 23456 links across **169 pages**
  all resolve; check:caveats 27 markers across 22 pages all resolve. 169 ≈ expected ~169 — base not stale.

## Commits
1. PORT/typed-config sweep (#7) — 8 pages
2. reference showcase/links + streams (#8 #9 #10 #15) — 6 pages
3. end-to-end how-to blocks (#11) — 3 pages
4. better-auth route guard (#12) — 1 page
