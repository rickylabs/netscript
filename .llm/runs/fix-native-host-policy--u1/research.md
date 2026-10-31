# U1 research — current-source re-baseline (planning only)

Run: `.llm/runs/fix-native-host-policy--u1/`. Baseline `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d`,
branch `fix/native-host-policy`, worktree
`C:/Users/ericc/source/repos/netscript-native-host-policy-008`. Generator (observed): session
`ses_e817b95e9ffe8KjbVBmpy4yDxZ`, provider `openrouter`, model `meta/muse-spark-1.3`, stored variant
`max` (variant label only — not reasoning-effort attestation). No implementation, runtime import,
test execution, or evaluator verdict in this turn.

## 1. Carried a833 vs current 1582

The carried S16 proposal/footprint were written against upstream `a833dfa8`. The coordinator's
scoped diff (recorded in `worklog.md`) found current `1582e1c9` adds only CLI chrome and harness
records — no changes in the workers/streams/service security owners. The 22-file hash map
(`source-map-22.json`) confirms: **all 22 entries `matchesCarriedSource: true`** at 1582.

Independent spot-check (this session, current source): `plugins/workers/services/src/main.ts` read
in full (111 lines) — matches the carried excerpt exactly: default `createWorkersService(ctx)`,
`ctx.env.PORT ?? Deno.env.get('PORT')` with legacy throw text, `createWorkersServiceRuntime`,
`registerPluginJobs`, `registerGeneratedJobDefinitions`, public posture with the `#1383` reason,
`name: 'workers'`, `openApi`, `context: () => ({ workers: runtime })`, `.serve()`, `queueMicrotask`
mutation-hook block, `import.meta.main` bootstrap via `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE`,
and the `RunningService`/`RunningServiceAddress`/ `ServiceApp`/`ServiceEnvironment` type re-exports.
Both plugin `deno.json` files also verified on disk (`./services` export, `check` task targets,
`services/**/*.ts` publish glob, no dependency gap for the planned surface).

## 2. 22-source verification (role in U1)

| #  | Path                                                                  | U1 role                                                                  | Hash (prefix) | Match             |
| -- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------- | ----------------- |
| 1  | `AGENTS.md`                                                           | Operating rules                                                          | `e1c1cffa`    | yes               |
| 2  | `plugins/workers/deno.json`                                           | Owner: add `./service` export + check targets                            | `58af1ddc`    | yes               |
| 3  | `plugins/workers/services/src/main.ts`                                | Owner: legacy adapter (default/CLI preserved)                            | `bcca447d`    | yes (+spot-check) |
| 4  | `plugins/workers/services/src/service-runtime.ts`                     | Consumed unchanged (`createWorkersServiceRuntime`)                       | `e1200546`    | yes               |
| 5  | `plugins/workers/streams/factory.ts`                                  | U3 seam: `baseUrl`-only, `getStreamsAuth()` env                          | `c80961ba`    | yes               |
| 6  | `plugins/workers/streams/mod.ts`                                      | U3 browser-safe barrel (not a U1 owner)                                  | `2692919e`    | yes               |
| 7  | `plugins/streams/deno.json`                                           | Owner: add `./service` export + check targets                            | `647bdf32`    | yes               |
| 8  | `plugins/streams/services/src/main.ts`                                | Owner: legacy start-on-import adapter                                    | `4e7b9fc4`    | yes               |
| 9  | `packages/plugin/src/service/presentation/create-plugin-service.ts`   | Native composition chain (auth-first assert)                             | `508ba9a9`    | yes               |
| 10 | `packages/service/deno.json`                                          | Native export map (`.`, `./auth`, …)                                     | `0790c233`    | yes               |
| 11 | `packages/service/src/auth/mod.ts`                                    | Native auth surface incl. `ServiceAuthPolicy`, `assertServiceAuthPolicy` | `e003b776`    | yes               |
| 12 | `packages/service/src/auth/options.ts`                                | `ServiceAuthPolicy` union definition                                     | `67b2894a`    | yes               |
| 13 | `packages/service/src/auth/service-auth-policy.ts`                    | Assert semantics (TypeError, pre-I/O)                                    | `ac2b72d5`    | yes               |
| 14 | `packages/service/src/auth/auth-middleware.ts`                        | 401/403/503 shapes, prefix matching                                      | `00f33679`    | yes               |
| 15 | `…/internal-credential/internal-credential-authenticator.ts`          | Native internal-credential semantics (E1 context)                        | `dde49e3a`    | yes               |
| 16 | `…/auth/contract/contract-raw-routes.ts`                              | Contract raw-route resolver (Q6 context)                                 | `86cb1294`    | yes               |
| 17 | `packages/service/src/types.ts`                                       | `ServeOptions`, `CorsOptions`, `RunningService`                          | `0921e0d2`    | yes               |
| 18 | `packages/service/src/middleware/service-cors.ts`                     | Env snapshot, wildcard+credentials rejection                             | `a34a7f63`    | yes               |
| 19 | `packages/service/src/primitives/handlers.ts`                         | Handler primitives (context)                                             | `20189016`    | yes               |
| 20 | `packages/service/src/builder/service-builder-impl.ts`                | Builder impl (context)                                                   | `c8116199`    | yes               |
| 21 | `packages/service/src/builder/service-listener.ts`                    | Port/hostname/TLS/signal/stop ownership                                  | `76da3884`    | yes               |
| 22 | `packages/plugin-streams-core/src/application/stream-url-resolver.ts` | Stream URL rules (context)                                               | `953f1be6`    | yes               |

On-demand reads beyond the 22 (all current source, planning inspection only): `@netscript/plugin`
`deno.json` (`./service`, `./sdk` subpaths), `static-credential-authenticator.ts`,
`auth-middleware.ts` full 302 lines, streams `proxy.ts` / `bounded-file-store.ts` / `durability.ts`
composition signatures, workers `init.ts`, streams `main_test.ts` pattern, streams `README.md` head,
doctrine 02/09/10, archetypes 5/3, SCOPE-service/docs, lane-policy, gate matrices, release gates,
`.agents/rules/public-surface.mdc` + `package-architecture.mdc`.

## 3. Observed native API findings (current source wins)

- **Policy union** (`options.ts:89-113`): `ServiceGuardedAuthPolicy { authn, authz? }` and
  `ServicePublicAuthPolicy { public: true, reason: nonblank }` are mutually exclusive (`never`
  cross-fields).
- **Assert** (`service-auth-policy.ts:29-77`): rejects absent/mixed/blank-reason/malformed-callable
  postures with one redacted `TypeError`; validates `authenticator.authenticate` and
  `authorizer.authorize` are functions. `createPluginService` calls it first (line 156), before any
  builder/KV/listen work — U1 factories must call the **public** assert themselves before their own
  env/KV/storage reads.
- **ServeOptions** (`types.ts:190-218`): `port?` (0 = ephemeral), `hostname?`, `signal?`,
  `drainTimeoutMs?` (default 30s), `handleSignals?` (default true), `tls? { cert, key }`.
- **Listener** (`service-listener.ts:84-201`): `port = options?.port ?? defaultPort` (explicit 0
  wins); `hostname` forwarded unchanged to `Deno.serve` on both branches; TLS = inline `tls` else
  `NETSCRIPT_TLS_CERT_FILE`+`_KEY_FILE` pair else plain; pre-aborted/external-abort signal bridging;
  SIGINT/SIGTERM (POSIX) or SIGINT/SIGBREAK (Windows) unless `handleSignals: false`; `stop()`
  idempotent via coordinator + listener removal. `serve` object is read-only (never mutated).
- **CORS** (`service-cors.ts:8-56`): `origin ?? NETSCRIPT_CORS_ORIGINS` snapshot (exact http(s)
  origins; unset/blank → deny); arrays copied (caller inputs never mutated); `credentials` +
  wildcard rejected at build; function resolvers guarded against credentialed wildcards.
- **Auth middleware** (`auth-middleware.ts`): defaults `protect ['/api']`,
  `allowAnonymous
  ['/health']`; authenticator throw → `503 SERVICE_UNAVAILABLE`; failed auth →
  `401 UNAUTHORIZED` with reason; authz deny/throw → `403 FORBIDDEN` (deny-by-default); prefix match
  is exact-or-`/`- boundary; raw (undecoded) pathname used for policy resolution.
- **Static authenticator**: accepts `Bearer` or `x-api-key`; missing → `missing-credential`,
  mismatch → `invalid-credential` (constant-time). Suitable for U1's 401/valid-principal oracles
  without new test doubles.
- **RunningService**: `{ app, addr: { hostname, port, transport }, stop() }`.
- **Plugin chain** (`create-plugin-service.ts:149-230`): cors → logger → openapi → docs → database →
  middleware → context → auth → withRPC (unless `serveRpc: false`) → withHealth → withServiceInfo →
  rawRoutes → onStartup → onShutdown. Caller only calls `.serve()`.

## 4. MCP findings (observed, this session)

- `find_guidance` (high confidence): explicit-service-posture, `@netscript/service` layers, two
  construction APIs, CORS-origins env semantics — consistent with current source.
- `get_doc pages/reference/service#explicit-service-posture` (verbatim): `defineService` asserts
  before builder config/db/listen; guarded installs native stages unchanged, public skips; custom
  `allowAnonymous` **replaces** the native default (no implicit `/health` add); `/api` guarded +
  `/health` anonymous under defaults.
- `find_export ServiceAuthPolicy`: `@netscript/plugin./service`, `@netscript/service.` and `./auth`.
  U1 imports the policy type + assert from `@netscript/service/auth` (the documented auth subpath),
  `CorsOptions`/`RunningService`/`ServeOptions` from `@netscript/service`, `createPluginService`
  from `@netscript/plugin/service`, `PluginServiceContext` from `@netscript/plugin/sdk` — all
  present in current export maps.

## 5. Plugin seam findings

- **Workers composition order** (current `main.ts`): PORT resolve → runtime → `registerPluginJobs` →
  `registerGeneratedJobDefinitions` → `createPluginService(router, { public #1383, …, context })` →
  `.serve()` → `queueMicrotask` mutation hook. `createWorkersServiceRuntime()` is sync (returns
  registries over a lazy `getKv()` promise).
- **Streams composition order** (current `main.ts`): `PORT ?? STREAMS_PORT` → durability probe →
  `getAvailablePort` (honors `STREAMS_INTERNAL_PORT`) →
  `createStreamsServer({ port, host:
  '127.0.0.1', dataDir })` → `server.start()` → health checks →
  `createStreamsProxyHandler({
  internalPort })` →
  `createPluginService({}, { public #1383, serveRpc: false, cors: wildcard +
  protocol headers, healthChecks, rawRoutes [{ all, /* }], onShutdown: [server.stop] })`
  → `.serve()`. All top-level (start-on-import); env seams `STREAMS_DATA_DIR`,
  `STREAMS_INTERNAL_PORT`, `STREAMS_LIVE_CREATE_WAIT_MS`/`_POLL_MS` (proxy bridging, stays inside
  `proxy.ts`).
- **Private modules consumed unchanged**: workers `service-runtime.ts`, `init.ts`,
  `generated-jobs.ts`, `router.ts`, `streams/server.ts`; streams `proxy.ts`, `proxy-headers.ts`,
  `bounded-file-store.ts`, `bounded-segment-log.ts`, `durability.ts`.
- **U3 seam**: `createWorkersStreamDB({ baseUrl? })` hard-codes `getStreamsAuth()` (env; `{}` in
  browser) — cannot carry a new reader principal unchanged. U1 touches neither `factory.ts` nor
  `streams/mod.ts`.
- **Test pattern** (`main_test.ts`): ephemeral ports, tiny local upstream, `Deno.serve` with
  `hostname: '127.0.0.1'` — the shape U1 tests extend with explicit sanitizers and env isolation.

## 6. Completed research vs planned gates

Verified by inspection (above): hash re-baseline, public signatures/import paths, precedence and
ownership semantics, status-code shapes, chain order, private-module inventory, export-map and
publish-glob coverage (`services/**/*.ts` already included; `**/*_test.ts` already excluded).
**Not** verified and owned by implementation gates: runtime inertness under denied capabilities,
pre-I/O rejection order, live 401/503/principal/raw-path behavior, physical listener observation,
upstream cleanup, legacy equivalence, doc-lint/JSR/consumer/publish verdicts. No test was run and no
passing result is claimed here.

## 7. Honest unknowns for the plan to carry

1. Whether committed TLS fixtures already exist for reuse (implementation slice 0 discovers
   read-only; no new fixture files — the plan's TLS oracle does not depend on them).
2. The exact `quality:scan`/`arch:check` treatment of the carried `console.*` lines (plan gates on
   zero _new_ violations vs a pre-change baseline diff).
3. Minimal `PluginServiceContext` construction for the workers legacy-delegation test (slice-owned
   discovery; one bounded `quality-allow` line budgeted if a cast is required).
