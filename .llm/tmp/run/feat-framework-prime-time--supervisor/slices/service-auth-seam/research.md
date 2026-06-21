# Research — service-auth-seam

## Slice identity

- **Slice id:** `service-auth-seam`
- **Title:** Authentication + authorization (authn middleware + authz/RBAC) seam on `@netscript/service`
- **Severity:** blocker · **Wave:** A · **dependsOn:** none
- **Unit:** `packages/service` (single package; no plugin or service-entrypoint change required to close the gap)
- **Archetype:** ARCHETYPE-4 (Public DSL / Builder). Overlay: SCOPE-service.

## Baseline confirmation

Worktree `C:\Dev\repos\netscript-framework\.claude\worktrees\fw-prime-time` is on branch `main` at `cc3b8731` (post S2/S3/S5/OTel landings). Every cited file:line below was re-opened on this checkout and the line numbers are current — they did **not** shift. No gap in this slice is already resolved on main; both gaps stand.

## Gap 1 — `security-auth-no-authn-middleware` (blocker, inert-surface) — CONFIRMED

There is **no authentication primitive anywhere in `@netscript/service`**. Verified on current main:

- `packages/service/mod.ts:66-127` — the public surface exports only health primitives, openapi primitives, RPC/error/notFound handlers, the `types.ts` structural types, `createService`/`ServiceBuilder`/`ServiceConfig`, the re-exported `LoggerMiddlewareOptions`, and `defineService`/`DefineServiceOptions`. **No auth / bearer / jwt / apikey / session export.**
- `packages/service/src/builder/service-builder.ts:59-122` — `ServiceBuilder<TRouter>` interface declares `withCors`, `withLogger`, `withDatabase`, `withHealthCheck`, `withReadinessCheck`, `withOpenAPI`, `withDocs`, `withRPC`, `withContext`, `onStartup`, `withHealth`, `use`, `route`, `withServiceInfo`, `build`, `serve`. **No `withAuthn`/`withAuthz`/`requireAuth`.**
- `packages/service/src/builder/service-builder-impl.ts:73-76` — `withCors(options)` does `this.app.use('*', cors(...))`; it is the only security-adjacent middleware. The builder installs no auth middleware anywhere.
- `packages/service/src/presets/define-service.ts:116-142` — `defineService` wires `.withCors().withLogger().withOpenAPI().withDocs().withRPC().withServiceInfo()` + optional DB + `.withHealth().serve()`. **No authentication seam.**
- Package-wide, the only `auth`/`bearer`/`jwt`/`apikey` matches in `packages/service/src` are the DB `authHint` diagnostic strings in `src/diagnostics/database-connectivity.ts`; `withAuth*` matches elsewhere in the repo are the unrelated `withAuthor` plugin-metadata method.

**Root cause:** the builder lifecycle (`service-builder-impl.ts`) wires Hono middleware in a fixed order (cors → logger → custom `use()` → rpc → routes → health), but there is no middleware stage that establishes a request principal, and no public method to register one. Trace headers and `db` are the only things injected into the oRPC context (`buildRpcContext`, see Gap 2).

## Gap 2 — `security-auth-no-authz-rbac` (blocker, inert-surface) — CONFIRMED

There is **no authorization / RBAC / scope-enforcement layer**. Verified on current main:

- `packages/service/src/builder/service-builder.ts:59-122` — no `authorize`/`withScopes`/`requireRole` method.
- `packages/service/src/types.ts:88-107` — `ServiceContext` exposes `req`, the response helpers (`json`/`html`/`body`/`newResponse`), and `get(key)` only. **No `principal`/`subject`/`claims`/`roles`.**
- `packages/service/src/builder/service-builder-impl.ts:240-258` — `buildRpcContext(c, traceContext)` returns `this.contextFactory(c)` then conditionally sets `ctx.db` and `ctx.traceHeaders`. **No auth principal is injected into the oRPC context**, so router handlers cannot read who is calling. The context object is `Record<string, unknown>`, so it is structurally open for an added `principal` key.
- `packages/service/src/presets/define-service.ts:112-143` — Layer-3 preset wires no authn/authz.
- `packages/telemetry/src/orpc/error-plugin.ts:164-176` — the only `UNAUTHORIZED`/`FORBIDDEN` occurrences are entries in the default error **classifier** (client-error code list), not an enforcement control. Confirmed: this plugin classifies errors for logging severity; it does not gate requests.

**Root cause:** authorization needs (a) a principal on the request context and (b) a policy check stage before the protected handler runs. Neither exists. The oRPC context is the natural carrier for the principal (it already carries `db`/`traceHeaders`), and Hono middleware is the natural enforcement stage.

## Existing wiring this slice must integrate with

- **Middleware ordering** (`service-builder-impl.ts`): `withCors` (73) → `withLogger` (89) → `withRPC` calls `wireRpc` (212-234) → `use` (342) → `route` (354) → `build()` adds notFound/onError (386-390) → `serve()` runs startup hooks then `startServiceListener` (397-407). Auth middleware must run **after** CORS (so preflight `OPTIONS` is answered) and logging, and **before** the oRPC handlers and user routes, so unauthenticated/unauthorized requests are rejected before reaching the router.
- **Context injection seam** (`buildRpcContext`, 240-258): the single place where per-request values reach oRPC handlers. The resolved principal must be attached here (e.g. `ctx.principal`) so contract handlers and authz checks share one source of truth. Hono's `c.set('principal', …)` / `c.get('principal')` is the carrier between the authn middleware and `buildRpcContext`.
- **oRPC error surface** (`packages/service/src/primitives/handlers.ts`): handlers already attach `ErrorHandlingPlugin`/`TracingPlugin`/`LoggingPlugin`/`CORSPlugin`. The known client codes `UNAUTHORIZED` (401) and `FORBIDDEN` (403) are already classified by `@netscript/telemetry`'s `error-plugin.ts:164-176`, so emitting those codes/statuses from the auth stage produces correct telemetry classification for free.
- **`ServiceContext.get(key)`** (`types.ts:106`) is the existing structural accessor for request-scoped state set via Hono `c.set`. A typed `principal` accessor should be added rather than forcing callers through stringly-typed `get('principal')`.

## Reference patterns already in the repo (wrap / mirror, do not reinvent)

- **Port + default-adapter shape:** `packages/plugin-triggers-core/src/ports/trigger-idempotency-port.ts` — a small `interface ...Port { … }` with `Readonly<{…}>` input/result types, plus separate concrete adapters. This is the doctrine-blessed shape to mirror for `AuthenticatorPort` / `AuthorizerPort`.
- **oRPC error codes:** `UNAUTHORIZED`/`FORBIDDEN` are part of the oRPC error vocabulary (also present in the contract definitions under `packages/plugin-*-core/src/contracts/v1/*.contract.ts`). The auth stage should produce HTTP 401/403 JSON consistent with `createErrorHandler`'s `{ error, message }` envelope (`handlers.ts:200-217`).
- **Hono middleware idiom:** `service-builder-impl.ts:73-76,89-92` shows the `this.app.use('*', fn)` idiom; the auth middleware uses the same registration path, scoped to the protected prefix when configured.
- **Builder-concern file split** (ARCHETYPE-4 minimum folder shape, doctrine `06-archetypes.md`): cors/rpc/listener are already split into their own files (`service-rpc.ts`, `service-listener.ts`). Auth must follow the same split — its own `src/auth/` concern folder, not inlined into `service-builder-impl.ts` (AP-1 builder-barrel anti-pattern).

## Doctrine constraints (ARCHETYPE-4 + SCOPE-service)

- **A1 design-types-first** (`02-public-surface.md`): write `AuthnContext`/`Principal`/port types before implementation.
- **A2/A3 80%-in-one-chain:** advanced auth config unfolds via `withAuthn(...)`/`withAuthz(...)`; the entrypoint signature does not grow required args.
- **Naming** (`02-public-surface.md`): builder methods are `withX()` and return a new builder (here the existing builder mutates `this` and returns `this`, matching the package's established pattern — keep consistent with the package, not the doctrine's pure-immutable ideal, since all existing `withX` here mutate-and-return-this; do **not** introduce a divergent immutable pattern in one method). Ports are `interface` (contract implemented by multiple classes). No `I*` prefixes, no upstream re-exports.
- **F-5 public-surface audit / F-6 JSR publishability:** every new export needs JSDoc summary + `@example`; no slow types (the builder generics already publish with `--allow-slow-types` in the package's `publish:dry-run` task, but new types must not worsen this). 
- **F-15 re-export-upstream lint:** must **not** re-export `hono`, `jose`, or any JWT library type from `mod.ts`. If JWT verification is offered, wrap it behind the port; do not vendor a JWT type onto the surface.
- **F-1 file-size, F-11 forbidden-folder, F-16 folder-cardinality, F-18 sub-barrel:** new `src/auth/` folder must follow folder-cardinality/sub-barrel rules (a folder with multiple files gets a local barrel only if exported as a subpath; otherwise import directly).
- **SCOPE-service:** no contract/Aspire/topology change is required — this is a `packages/` public-builder change, so the archetype profile (ARCHETYPE-4) governs; SCOPE-service only adds the consumer-compile check (plugins/*/services that call `createService`/`defineService` must still compile).
- **Forbidden edits:** do not touch `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, or any version pin. `@netscript/cli` publishes last and is not in scope.

## Dependency decision (Option-A catalog law)

The plan deliberately ships **zero new third-party dependencies**. Authentication verification primitives are provided as injectable **ports** (the caller supplies the verifier), plus two first-party, dependency-free default adapters:

1. **Static API-key / bearer-token authenticator** — compares the presented credential against a configured set using `crypto.subtle`-backed constant-time comparison (Web Platform API; already permitted — no new import, no new permission beyond what `Deno.serve` needs).
2. **Header-claims authenticator** (trusted-gateway mode) — reads pre-verified identity headers (e.g. `x-authenticated-user`, `x-authenticated-scopes`) injected by an upstream proxy/mesh; the common Aspire/ingress deployment shape.

Full asymmetric **JWT verification is intentionally NOT bundled** (it would require `jose` via npm catalog and a vendored type on the surface, violating F-15 if leaked). Instead the `AuthenticatorPort` is the extension seam: a consumer that wants JWT brings `jose` in their own service and implements the port. This is locked, not deferred — see plan §Locked decisions. If PLAN-EVAL insists JWT must ship in-package, that is a scoped follow-up slice, not a blocker for closing the inert-surface gap.

## Debt implications

Closing these two blockers removes an **inert-surface** debt (a service framework that advertises production readiness but cannot authenticate or authorize a single request). No new debt is introduced provided the default adapters are real (constant-time compare, real 401/403, real deny-by-default) and not stubs. The `withAuthz` deny-by-default semantics must be explicit so an unconfigured-but-enabled authz stage fails closed, not open.