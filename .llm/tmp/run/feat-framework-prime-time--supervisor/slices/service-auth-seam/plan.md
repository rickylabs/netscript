# Plan — service-auth-seam

## Locked scope

Add a first-class **authentication + authorization seam** to `@netscript/service` (ARCHETYPE-4, SCOPE-service overlay), closing blocker gaps `security-auth-no-authn-middleware` and `security-auth-no-authz-rbac`. Deliver:

1. A port contract (`AuthenticatorPort`, `AuthorizerPort`) + principal/result types.
2. Two real, dependency-free default authenticators (static credential, trusted-header).
3. A real default authorizer (scope/role check, deny-by-default).
4. Builder methods `withAuthn(...)` and `withAuthz(...)` that wire the auth stage into the Hono lifecycle after CORS/logger and before RPC/routes.
5. Principal injection into the oRPC context (`ctx.principal`) and a typed `ServiceContext.principal` accessor.
6. `defineService` opt-in pass-through (`auth` option) — off by default, no behavior change for existing callers.
7. Full tests: unit (port adapters), integration (HTTP 401/403/200 through the built app), failure-path (missing/invalid/expired credential, insufficient scope, deny-by-default).

**Out of scope (locked, not deferred):** bundled asymmetric JWT verification (consumer-supplied via the port); OAuth flows; session/cookie stores; multi-tenant policy engines. These are separate future slices and their absence does not leave any advertised-but-inert surface.

## Archetype + overlays

- **ARCHETYPE-4 (Public DSL / Builder)** — primary.
- **SCOPE-service** overlay — adds consumer-compile gate for `plugins/*/services` callers.
- Doctrine refs: `02-public-surface.md`, `05-folder-structure.md`, `06-archetypes.md#archetype-4`, `07-composition-and-extension.md`, `09-anti-patterns-and-fitness-functions.md`.

## Contract-first design

### Step 1 — Types (write before any impl)

New file `packages/service/src/auth/types.ts`:

```ts
/** Identity established for an authenticated request. */
export interface Principal {
  /** Stable subject identifier (user id, service id, api-key id). */
  readonly subject: string;
  /** Granted scopes (oRPC/REST verb permissions). */
  readonly scopes: readonly string[];
  /** Granted roles for RBAC checks. */
  readonly roles: readonly string[];
  /** Auth scheme that established this principal. */
  readonly scheme: 'api-key' | 'bearer' | 'trusted-header' | 'custom';
  /** Opaque verified claims for consumer-specific authz. */
  readonly claims: Readonly<Record<string, unknown>>;
}

/** Result of an authentication attempt. */
export type AuthnResult =
  | { readonly ok: true; readonly principal: Principal }
  | { readonly ok: false; readonly reason: string };

/** Input handed to an authenticator. */
export interface AuthnRequest {
  /** Reads a request header by lowercase name. */
  header(name: string): string | undefined;
  /** Request method. */
  readonly method: string;
  /** Request path. */
  readonly path: string;
}

/** Authentication boundary: turns a request into a Principal or a rejection. */
export interface AuthenticatorPort {
  authenticate(request: AuthnRequest): Promise<AuthnResult> | AuthnResult;
}

/** Authorization decision input. */
export interface AuthzRequest {
  readonly principal: Principal;
  readonly method: string;
  readonly path: string;
}

/** Authorization decision. */
export type AuthzDecision =
  | { readonly allow: true }
  | { readonly allow: false; readonly reason: string };

/** Authorization boundary: decides whether a Principal may proceed. */
export interface AuthorizerPort {
  authorize(request: AuthzRequest): Promise<AuthzDecision> | AuthzDecision;
}
```

Builder option types (in `service-builder.ts` or `src/auth/options.ts`):

```ts
export interface AuthnOptions {
  /** Authenticator implementation. Required. */
  authenticator: AuthenticatorPort;
  /** Path prefixes the auth stage guards (default ['/api']). Health stays public. */
  protect?: readonly string[];
  /** Path prefixes always left public even under a guarded prefix (default ['/health']). */
  allowAnonymous?: readonly string[];
}

export interface AuthzOptions {
  /** Authorizer implementation. Required. */
  authorizer: AuthorizerPort;
  /** Fail-closed when no decision is reachable (default true). */
  denyByDefault?: boolean;
}
```

### Step 2 — Default adapters (real, dependency-free)

`packages/service/src/auth/static-credential-authenticator.ts`:
- `createStaticCredentialAuthenticator({ credentials, scheme })` where `credentials` maps a token → `{ subject, scopes, roles }`.
- Reads `Authorization: Bearer <t>` or `X-API-Key: <t>`. Constant-time compare via `crypto.subtle.digest` over both candidate and stored token (compare digests with a length-independent equality), so timing does not leak token length/prefix.
- Returns `{ ok:false, reason:'missing-credential' | 'invalid-credential' }` on failure.

`packages/service/src/auth/trusted-header-authenticator.ts`:
- `createTrustedHeaderAuthenticator({ subjectHeader, scopesHeader, rolesHeader, claimsHeader? })` for upstream-verified identity (mesh/ingress). Returns `{ ok:false, reason:'missing-identity-header' }` when the subject header is absent.

`packages/service/src/auth/scope-authorizer.ts`:
- `createScopeAuthorizer({ rules })` where `rules` is an ordered list of `{ match: (req) => boolean, requireScopes?, requireRoles? }`. First matching rule decides; `denyByDefault` governs the no-match case (default deny). Returns structured `{ allow:false, reason }`.

### Step 3 — Middleware wiring

`packages/service/src/auth/auth-middleware.ts`:
- `createAuthnMiddleware(options)` → Hono middleware: skips `allowAnonymous` prefixes and non-guarded paths; for guarded paths runs `authenticator.authenticate`; on `ok:false` returns `c.json({ error:'UNAUTHORIZED', message }, 401)`; on success `c.set('principal', principal)` and `await next()`.
- `createAuthzMiddleware(options)` → runs after authn; reads `c.get('principal')`; if absent and the path is guarded → 401; else `authorizer.authorize`; on deny → `c.json({ error:'FORBIDDEN', message }, 403)`.
- Both emit a span attribute / structured log via existing logger (`createServiceLogger`) — observability of auth decisions (decision, scheme, subject hashed) without leaking the raw credential.

### Step 4 — Builder integration

`service-builder-impl.ts`:
- Add private fields `authnMiddleware`/`authzMiddleware`.
- `withAuthn(options)` and `withAuthz(options)` store middleware (idempotent guard like other `withX`), and register them on `this.app.use(prefix, …)` in the correct order. Order is enforced regardless of call order by registering them in `build()`/`serve()` immediately before RPC/route resolution rather than at call time — OR (locked) register at call time but require auth methods be chained before `withRPC()`; **locked choice: register in a dedicated `installAuth()` step invoked at the top of `build()`** so ordering is deterministic and independent of fluent call order (mirrors how notFound/onError are deferred to `build()`).
- `buildRpcContext` (240-258): after db/traceHeaders, add `const principal = c.get('principal'); if (principal) ctx.principal = principal;`.

`service-builder.ts`: add `withAuthn`/`withAuthz` to the `ServiceBuilder` interface with JSDoc + `@example`.

`types.ts`: add `principal?: Principal` typed accessor concept — expose via a new `ServiceContext.principal` optional getter doc, and re-export `Principal` etc. from `mod.ts`.

`mod.ts`: export `withAuthn`/`withAuthz` are methods (already surfaced via interface); export the **types** (`Principal`, `AuthnResult`, `AuthenticatorPort`, `AuthorizerPort`, `AuthnOptions`, `AuthzOptions`, `AuthzDecision`) and the **factories** (`createStaticCredentialAuthenticator`, `createTrustedHeaderAuthenticator`, `createScopeAuthorizer`). Consider an `@netscript/service/auth` subpath if the top-level export count crosses the ~20 soft cap (doctrine 02 §subpath); **locked: add `./auth` subpath** in `deno.json` exports for the adapters+types, keeping `mod.ts` to the builder manifest. This also satisfies F-18 sub-barrel via `src/auth/mod.ts`.

### Step 5 — Preset opt-in

`define-service.ts`: extend `DefineServiceOptions` with optional `auth?: { authn: AuthnOptions; authz?: AuthzOptions }`. When present, call `.withAuthn(...)` and optionally `.withAuthz(...)`. Default off → no behavior change for existing generated services (consumer-compile safe).

## Commit slices (ordered, each independently gate-able)

1. **`feat(service): auth port + principal types`** — add `src/auth/types.ts` (`Principal`, `AuthnResult`, `AuthnRequest`, `AuthenticatorPort`, `AuthzRequest`, `AuthzDecision`, `AuthorizerPort`) + `src/auth/options.ts` (`AuthnOptions`, `AuthzOptions`). No wiring yet.
   - Files: `packages/service/src/auth/types.ts`, `packages/service/src/auth/options.ts`.
   - Proves: types compile, JSDoc present. Gate: `run-deno-check.ts --root packages/service --ext ts`, `run-deno-lint.ts`, `run-deno-fmt.ts`.
2. **`feat(service): static-credential + trusted-header authenticators`** — real adapters with constant-time compare; unit tests.
   - Files: `src/auth/static-credential-authenticator.ts`, `src/auth/trusted-header-authenticator.ts`, `tests/auth/authenticators_test.ts`.
   - Proves: valid→principal, missing→reason, invalid→reason, timing-safe compare. Gate: targeted `deno test --allow-all packages/service/tests/auth/authenticators_test.ts` + check/lint/fmt.
3. **`feat(service): scope/role authorizer (deny-by-default)`** — ordered-rule authorizer; unit tests for allow, deny-insufficient-scope, deny-by-default no-match.
   - Files: `src/auth/scope-authorizer.ts`, `tests/auth/authorizer_test.ts`.
   - Gate: targeted test + check/lint/fmt.
4. **`feat(service): authn/authz Hono middleware`** — `src/auth/auth-middleware.ts` producing 401/403 JSON + structured log + principal injection into Hono context; unit tests against a bare Hono app.
   - Files: `src/auth/auth-middleware.ts`, `tests/auth/middleware_test.ts`.
   - Gate: targeted test + check/lint/fmt.
5. **`feat(service): withAuthn/withAuthz builder methods + context principal`** — extend `ServiceBuilder` interface, `service-builder-impl.ts` (`installAuth()` in `build()`, `buildRpcContext` principal injection), `types.ts` `ServiceContext.principal`.
   - Files: `src/builder/service-builder.ts`, `src/builder/service-builder-impl.ts`, `src/types.ts`.
   - Proves: integration — built app returns 401 unauth, 403 unauthorized, 200 authorized, principal reaches oRPC context. Gate: new `tests/auth/builder-auth_test.ts` integration test + check/lint/fmt.
6. **`feat(service): surface exports + ./auth subpath`** — `mod.ts` type/factory exports, `src/auth/mod.ts` barrel, `deno.json` `./auth` export entry.
   - Files: `packages/service/mod.ts`, `src/auth/mod.ts`, `packages/service/deno.json` (exports map only — **no version/pin change**).
   - Gate: `deno publish --dry-run --allow-dirty --allow-slow-types` (F-6), `deno doc` readability (F-5/F-7), check/lint/fmt.
7. **`feat(service): defineService auth opt-in + README/examples`** — `DefineServiceOptions.auth`, preset wiring, README quick-start auth block, JSDoc `@example`s on new exports.
   - Files: `src/presets/define-service.ts`, `packages/service/README.md`, doc examples in `mod.ts`/auth modules.
   - Proves: preset path + README example compile (readme-examples fixture). Gate: `tests/_fixtures/readme-examples_test.ts` updated, full `deno test`, publish dry-run, consumer-compile (SCOPE-service).

## Gates to run

Per ARCHETYPE-4 "Required Gates in Order" + SCOPE-service additions. Use `.llm/tools` wrappers, not raw CLI.

- **Static (every slice):**
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` (the package task uses `deno check --unstable-kv ./mod.ts`; include `--unstable-kv` for workspace check).
  - `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts`
  - `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts`
- **Targeted tests (slices 2-7):** `rtk proxy deno test --allow-all packages/service/tests/auth/` then full `deno test --allow-all packages/service/tests/` at slice 7.
- **F-6 JSR publishability (slice 6-7):** `rtk proxy deno publish --dry-run --allow-dirty --allow-slow-types` from `packages/service` — must be clean (no new slow types beyond the pre-existing allow-slow-types baseline, no portability warnings).
- **F-5/F-7 surface + doc score (slice 6-7):** `deno doc packages/service/mod.ts` reads as a manual; `deno doc packages/service/deno.json --filter` the new symbols to confirm JSDoc/`@example` present.
- **Consumer check (SCOPE-service, slice 7):** typecheck the service consumers that call `createService`/`defineService` — `plugins/workers/services`, `plugins/sagas/services`, `plugins/streams/services` — via `run-deno-check.ts --root plugins/<x>/services --ext ts`; auth is opt-in so they must compile unchanged.
- **e2e:cli — NOT required.** This slice changes no scaffold output, plugin scaffolding, DB wiring, Aspire helpers, or official-plugin copy mode. `defineService.auth` is optional and unset by generated templates. Do not run `e2e:cli`.

## Design

The auth seam is a **two-stage middleware** (authenticate → authorize) inserted deterministically into the existing Hono lifecycle by `installAuth()` at the top of `build()`, after CORS/logger registration and before oRPC/route resolution. Authentication is a **port** (`AuthenticatorPort`) so the framework ships real defaults (static credential, trusted header) while leaving asymmetric-JWT/OAuth to consumer implementations — wrap, don't vendor (F-15). The resolved `Principal` is the single carrier of identity, set on Hono context and forwarded into the oRPC context by `buildRpcContext`, so contract handlers and the authorizer read one source of truth. Authorization is a separate **port** (`AuthorizerPort`) with **deny-by-default** semantics so an enabled-but-unconfigured authz stage fails closed. Error responses reuse the established `{ error, message }` envelope with `UNAUTHORIZED`/`FORBIDDEN` codes that `@netscript/telemetry`'s error classifier already maps to client-error telemetry. Files live in a dedicated `src/auth/` concern folder exported through a `./auth` subpath, satisfying the ARCHETYPE-4 split-by-concern rule and keeping `mod.ts` a manifest.

**Production bar:** real durable behavior is intrinsic (auth is stateless per-request; no in-memory store to make durable). Real error handling = structured 401/403 with reasons, never silent allow. Idempotency: N/A (read-only decisioning, no side effects). Observability: each auth decision emits a structured log + span attribute (scheme, decision, hashed subject) without leaking credentials. Graceful shutdown: unaffected (middleware holds no resources). No stubs/no-ops/TODOs: every advertised method enforces; deny-by-default guarantees no inert "reserved" path.