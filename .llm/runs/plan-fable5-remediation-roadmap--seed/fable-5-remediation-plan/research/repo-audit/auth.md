# Repo audit — Identity / Auth

Baseline: `plan/fable5-remediation-roadmap` @ `fac9e339042c` (== `origin/main`, 2026-08-08).
All line numbers are against that tree. Read-only audit.

---

## 0. Verdict on the Wave-6 finding

> "createServiceClient cannot compose the shipped auth plugin; agents used raw fetch or left RPC
> unauthenticated."

**ACCURATE against current main, and stronger than stated.** It is not a "hard to use" problem — it
is an **absent API**. Three independent proofs:

1. **No credential parameter exists anywhere on the SDK client surface.**
   `deno doc --filter CreateServiceClientOptions packages/sdk/src/client/mod.ts` returns exactly
   nine fields: `contract`, `serviceName`, `routerName`, `protocol`, `apiPath`, `apiVersion`,
   `port`, `timeout`, `propagateTraceContext`
   (`packages/sdk/src/ports/service-client.ts:203-222`). There is no `headers`, `credentials`,
   `fetch`, `auth`, `getToken`, or `clientContext`. The per-call escape hatch
   `ServiceClientContext` (`:129-155`) carries only `signal`, `cache`, retry knobs, and
   `traceHeaders` — trace propagation is the *only* header seam that was ever built.
2. **The transport hard-codes its own header set.** `createHttpClientLink`'s `headers()` callback
   returns `{'Content-Type': 'application/json'}` plus optional `traceparent`/`tracestate` and
   nothing else (`packages/sdk/src/client/http-client-link.ts:83-102`). Its `fetch` override
   (`:130-160`) forwards `cache` and `signal` and never sets `credentials`, so the browser default
   (`same-origin`) applies to a **cross-origin** service URL (see §4.2) — cookies are silently
   dropped.
3. **`grep -rn "cookie|credentials" packages/sdk/src` returns zero matches.** The SDK has no
   concept of a credential at any layer — client, query factory, query-client, collections,
   desktop, or discovery.

**In-repo reproduction of "agents used raw fetch":** NetScript's *own first-party CLI*, which
depends on `@netscript/sdk` and can import `authContractV1`, calls the auth service with raw
`fetch` + hand-rolled JSON shape-sniffing instead of a typed client:
`packages/cli/src/public/features/plugins/auth/auth-session-client.ts:7-23` (`this.request(...)`,
`parseSessionProjection` at `:27-37`), against hardcoded URLs
`http://localhost:4437/auth/sessions` (`auth-plugin-command.ts:87`) and
`http://localhost:8094/api/v1/auth` (`:98-100`). It sends **no credential at all**. The first URL is
already known-broken — issue **#1243** (`0.0.6`, `area:auth`): *"auth: session list --stream-url
default pins localhost:4437 which no longer exists post-#1211"*.

**In-repo reproduction of "left RPC unauthenticated":** the scaffolded service template calls
`defineService(router, {name, version, port, db, openapi, debug})` with **no `auth` key**
(`packages/cli/src/kernel/assets/service/main.ts.template:13-23`), and the framework's own test
codifies the consequence: `Deno.test('defineService without auth leaves api routes public')`
asserts `200` on `/api/openapi.json` (`packages/service/tests/auth/define-service-auth_test.ts:11-22`).
Every first-party plugin service is worse — see §3.1.

---

## 1. What exists and works

### 1.1 Server-side guard (`@netscript/service/auth`) — real, correct, and ordered correctly

| Symbol | Location | Status |
|---|---|---|
| `AuthenticatorPort` / `AuthnRequest` / `AuthnResult` / `Principal` | `packages/service/src/auth/types.ts:88-137` | works |
| `AuthorizerPort` / `AuthzRequest` / `AuthzDecision` | `:140-158` | works |
| `createAuthnMiddleware` / `createAuthzMiddleware` | `packages/service/src/auth/auth-middleware.ts:28-128` | works |
| `createScopeAuthorizer` (ordered rules, fail-closed default) | `packages/service/src/auth/scope-authorizer.ts:40-63` | works |
| `createStaticCredentialAuthenticator` (Bearer) | `packages/service/src/auth/static-credential-authenticator.ts:70` | works |
| `createTrustedHeaderAuthenticator` (gateway pattern) | `packages/service/src/auth/trusted-header-authenticator.ts:32-54` | works, but see §4.4 |
| `.withAuthn()` / `.withAuthz()` builder stages | `packages/service/src/builder/service-builder-impl.ts:244-252` | works |
| `defineService({ auth: { authn, authz } })` | `packages/service/src/presets/define-service.ts:268-273` | works |

Notable *correct* details worth preserving in any remediation:

- **Middleware ordering is safe.** `withRPC()` is a pure config setter (`service-builder-impl.ts:222-241`,
  `if (this.rpcConfigured) return this; this.rpcOptions = options`) and routes are only mounted in
  `installDeferredRoutes()`, which `build()` runs **after** `installAuth()`
  (`:434-460`). So even though `defineService` calls `.withRPC()` at line 229 and `.withAuthn()` at
  line 269, the Hono `app.use('*', authn)` registration precedes the RPC route registration. RPC is
  genuinely guarded when auth is configured.
- **Both surfaces are covered by the default `protect: ['/api']`.** `wireRpc` mounts RPC at
  `/api/rpc/*` and the OpenAPI REST handler at `/api/*`
  (`packages/service/src/builder/service-rpc.ts:53-89`); `DEFAULT_PROTECTED_PREFIXES = ['/api']`,
  `DEFAULT_ANONYMOUS_PREFIXES = ['/health']` (`auth-middleware.ts:20-23`). Prefix matching is
  segment-safe (`matchesPrefix`, `:152-154`).
- **Authz fails closed** by default (`denyByDefault ?? true`, `auth-middleware.ts:78`,
  `scope-authorizer.ts:41`), and a missing principal is a hard 401 (`:85-93`).
- **Refresh-on-read is modelled**: `AuthnResult.setCookies` / `responseHeaders`
  (`types.ts:112-116`) are written back via `applyAuthnResponse` (`auth-middleware.ts:166-177`).
- **Auth decisions are logged with a hashed subject**, never the raw subject
  (`hashSubject`, `auth-middleware.ts:231-237`).
- **Principal reaches oRPC handlers**: `buildRpcContext` sets `ctx.principal` when the middleware
  resolved one (`service-builder-impl.ts:276-279`).

### 1.2 The auth plugin (`plugins/auth` → `@netscript/plugin-auth`) — a working service

- Contract `authContractV1` with 5 routes + mandatory `describe`, all REST-annotated:
  `POST /signin`, `POST /callback`, `POST /signout`, `GET /session`, `GET /me`
  (`packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:432-462`). Contract type is spelled
  explicitly for `--isolatedDeclarations` (`AuthContractDefinitionShape`, `:412-418`) — no `any`,
  no erasure cast; handlers are contract-checked (`plugins/auth/services/src/routers/router-context.ts:12-20`).
- Service mounts via `createPluginService` at `/api/rpc/v1/auth/*` (RPC) and `/api/v1/auth/*`
  (REST), port 8094 (`plugins/auth/services/src/main.ts:70-83`, `plugins/auth/src/constants.ts:13`).
- Three backends behind one port: `kv-oauth` (interactive), `workos`, `better-auth`
  (`plugins/auth/services/src/backend-registry.ts:29`,
  `packages/plugin-auth-core/src/ports/mod.ts:212-240`). `kv-oauth` implements a real PKCE
  OAuth/OIDC flow with state/nonce, txn store, and `__Host-` cookie hygiene
  (`packages/auth-kv-oauth/src/flow.ts:100-240`, `cookies.ts:110-121`).
- WorkOS and better-auth ship real `AuthenticatorPort` implementations usable directly with
  `withAuthn` (`packages/auth-workos/src/workos-authenticator.ts:149,204`,
  `packages/auth-better-auth/src/better-auth.ts:198`). WorkOS normalizes `organizationId` into
  claims (`workos-authenticator.ts:254,287,323`).
- Telemetry/audit redaction and session streams exist
  (`packages/plugin-auth-core/src/telemetry/redaction.ts`, `plugins/auth/streams/server.ts`).
- CLI config surface is real: `netscript plugin auth backend|provider|secret|session`
  (`packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts:31-110`).
- E2E gate proves the service boots and answers
  (`packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts:405-418`).

### 1.3 Docs exist and are unusually honest about limits

`docs/site/identity-access/auth.md` (393 lines), `.../how-to/add-authentication.md` (350),
`docs/site/explanation/auth-model.md` (250), `docs/site/tutorials/workspace/02-auth.md` (269),
`05-route-authz.md` (325). The how-to carries accurate warnings: interactive flow is `kv-oauth`-only
(`add-authentication.md:96-101`), single active backend (`:74-77`), and "**No auth audit/telemetry
surface yet**" (`:325`).

---

## 2. The central gap — there is no client-side identity seam

**Classification: API/type-system seam (p0).**

| Capability | Server side | Client side |
|---|---|---|
| Send `Authorization: Bearer …` | accepted (`static-credential-authenticator.ts:70`) | **absent** |
| Send session cookie | accepted (`AuthnRequest.cookie`, `types.ts:126`) | **absent** (§4.2) |
| Send trusted identity headers | accepted (`trusted-header-authenticator.ts:32`) | **absent** |
| Receive `Set-Cookie` from a call | emitted (`applyAuthnResponse`, `auth-middleware.ts:166`) | not modelled |
| Per-call credential override | n/a | **absent** (`ServiceClientContext:129-155`) |

`defineServices()` — the "one-liner" preset — forwards exactly the same nine fields and therefore
inherits the gap wholesale (`packages/sdk/src/presets/define-services.ts:106-116`). The generated
app template is a bare unauthenticated client
(`packages/cli/src/kernel/assets/app/lib/example-service.ts.template:16-20`).

The **only** credential mechanism anywhere in `@netscript/sdk` is
`getStreamsAuth()` → `{ Authorization: 'Bearer ' + Deno.env.get('STREAMS_SECRET') }`
(`packages/plugin-streams-core/src/application/stream-url-resolver.ts:136-150`, re-exported at
`packages/sdk/src/streams.ts:34`). That is a **process-global shared secret for service-to-service
streams**, not a user identity, and it is not reachable from `createServiceClient`. It is however
proof that a header seam is implementable in this architecture.

**Consequence for docs:** NetScript's own authz tutorial can only demonstrate authenticated calls
with `curl -H 'authorization: Bearer read'`
(`docs/site/tutorials/workspace/05-route-authz.md:248-258`) — there is no typed-client example
because none can be written. `docs/site/reference/sdk/index.md` and `docs/site/services-sdk/sdk.md`
contain **zero** auth/credential/cookie guidance (only `getStreamsAuth` at
`reference/sdk/index.md:197`).

---

## 3. How scaffolded apps fail to protect `/api/rpc/*`

### 3.1 Every first-party plugin service is unauthenticatable by construction
**Classification: API/type-system seam (p0).**

`PluginServiceConfig` has no `auth` field, and `createPluginService` never calls
`withAuthn`/`withAuthz` — the chain is
`cors → logger → openapi → docs → database → use(middleware) → context → withRPC → withHealth →
withServiceInfo` (`packages/plugin/src/service/presentation/create-plugin-service.ts:63-97,132-180`;
the documented order is restated at `plugins/auth/services/src/main.ts:65-69`). Repo-wide,
`withAuthn` appears **only** in `packages/service` and its tests — no plugin calls it.

So `auth`, `workers`, `sagas`, `triggers`, `streams`, and `ai` all expose `/api/rpc/v1/<ns>/*` and
`/api/v1/<ns>/*` with **no possible guard short of forking the service entrypoint**. The auth
service itself is the sharpest case: `POST /api/v1/auth/signout` accepts an arbitrary `sessionId`
in the body from any caller (`plugins/auth/services/src/routers/v1-handlers.ts:187-231`,
contract `SignoutInput.sessionId` at `auth.contract.ts:56-59`) with no authentication and no
ownership check — the CLI exploits exactly this (`auth-session-client.ts:13-23`).

### 3.2 The scaffolded user service ships unguarded
**Classification: scaffold/generation failure (p0).**

`packages/cli/src/kernel/assets/service/main.ts.template:13-23` — no `auth` option, no commented
stub, no TODO. No scaffold asset under `packages/cli/src/kernel/assets/` mentions auth: there is no
`routes/signin.tsx`, no `_middleware.ts`, no session helper, no protected-route example.

### 3.3 `plugin add auth` emits a types-only barrel
**Classification: scaffold/generation failure (p0).**

The single user-facing artifact of installing auth is `auth/mod.ts`, which re-exports 3 schemas and
6 types from `@netscript/plugin-auth-core/contracts/v1` and nothing else
(`plugins/auth/src/adapter/resources/barrel/barrel.stub.ts:29-41`; emitted by
`barrel.ts:65-77`; the only starter resource, `plugins/auth/src/adapter/plugin.ts:11-13`). Its own
docstring concedes the design: *"the single thing a user owns and extends is this barrel"*
(`barrel.stub.ts:16-18`). No client, no route, no guard, no middleware, no session hook.

### 3.4 CORS is `origin: '*'` by default
**Classification: runtime correctness.**

`withCors(options ?? { origin: '*' })` (`service-builder-impl.ts:96`); `createPluginService` calls
`withCors(config.cors)` with `config.cors` undefined unless a plugin passes it
(`create-plugin-service.ts:139-141`), and the auth service passes none
(`plugins/auth/services/src/main.ts:70-83`). `Access-Control-Allow-Origin: *` is spec-incompatible
with `credentials: 'include'`, so browser cookie auth is blocked **even if** the SDK gained a
credentials option. Any fix must move CORS to an explicit allowlist.

---

## 4. Runtime correctness defects in the shipped flow

### 4.1 The oRPC signin/callback flow structurally cannot set a session cookie
**Classification: runtime correctness (p0) + API seam.**

`kv-oauth.signIn()` returns a 302 whose `Set-Cookie` carries the **OAuth transaction id**
(`packages/auth-kv-oauth/src/flow.ts:143` → `redirect(url, buildCookieHeader(txn.id, …))`,
`redirect` at `:345-351`). `handleCallback()` returns a 302 whose `Set-Cookie` carries the
**session id** (`:220-224`).

The auth handlers throw both away. `signin` keeps only the redirect target via
`responseLocation(response)` = `response.headers.get('location')`
(`plugins/auth/services/src/routers/v1-handlers.ts:99-107`; helper at `v1-helpers.ts:82-84`).
`callback` likewise returns `{completed, sessionId, redirectTo, subject}` and discards
`result.response` headers (`v1-handlers.ts:161-168`).

Two failures follow:
- The transaction cookie is never delivered to the browser, so the provider redirect returns without
  it and `handleCallback` throws `oauth_cookie_missing` unless a `txn` query param is supplied
  (`flow.ts:155-159`) — and the callback handler only forwards `providerId`/`code`/`state`
  (`v1-handlers.ts:156-159`), never `txn`.
- The session cookie is never delivered, so `GET /session` and `GET /me` — which read the cookie via
  `toAuthnRequest` (`v1-helpers.ts:64-79`) — cannot see it on a subsequent browser request.

Root cause at the contract layer: none of the five routes declares `outputStructure: 'detailed'`
(`auth.contract.ts:437-461`), so no oRPC procedure in this contract can emit response headers at
all. The docs assert the opposite — *"`POST /api/v1/auth/signout` … clear the session cookie"* and
*"After completing the browser sign-in, the session cookie is set"*
(`docs/site/identity-access/how-to/add-authentication.md:277,290-296`). **Doc claim unverified by
code; code says it cannot happen through this surface.**

`toRequest` *does* forward inbound headers into the backend Request
(`v1-helpers.ts:52-59`), so the *inbound* half works — the defect is strictly the response half.

### 4.2 Cross-origin discovery defeats cookie auth
**Classification: runtime correctness.**

`getServiceUrl` resolves the browser URL from Aspire-injected `import.meta.env`
(`packages/sdk/src/discovery/service-url.ts:97-128`), i.e. the browser calls
`http://localhost:8094` directly while the Fresh app runs on its own port. The session cookie is
`__Host-` prefixed by default (`packages/auth-kv-oauth/src/backend.ts:125`,
`flow.ts:102`), which is **origin-locked with `Path=/` and `Secure`**
(`packages/auth-kv-oauth/src/cookies.ts:110-121`). Even with `credentials: 'include'` added, a
`__Host-` cookie set on `:8094` is never sent to `:8000` and vice versa. There is no
same-origin proxy, no BFF route, and no gateway in the scaffold. **Any remediation must pick a
topology (BFF/proxy vs bearer-token) before adding an SDK option.**

### 4.3 `principal` is untyped for handlers
**Classification: API/type-system seam.**

`ContextFactory = (context: Context) => Record<string, unknown>`
(`packages/service/src/types.ts:270-272`), and `buildRpcContext` merges `ctx.principal` into that
untyped bag (`service-builder-impl.ts:276-279`). `grep -rn principal packages/plugin/src` →
**zero matches**: `@netscript/plugin` has no notion of a principal, so plugin handlers cannot type
one. A handler that wants `context.principal` must hand-declare an optional field and trust it —
exactly the `any`-adjacent pattern the Wave-7 rules call a review blocker.

### 4.4 The trusted-header seam is one-sided
`createTrustedHeaderAuthenticator` reads `x-authenticated-user` / `-scopes` / `-roles` / claims JSON
(`trusted-header-authenticator.ts:20-54`). Nothing in the repo *emits* those headers: no gateway,
no scaffold middleware, and no SDK option (§2). The receiver exists; the sender does not.

### 4.5 No remote session-verifying authenticator
Repo-wide, the only `AuthenticatorPort` implementations are `static-credential`, `trusted-header`,
`kv-oauth`, `workos`, `better-auth`. There is **no** "verify this request by calling `auth-api`"
authenticator. To guard a user service with the auth plugin's sessions today you must instantiate a
backend in-process — meaning every service needs the same KV/DB handles and provider secrets. That
is the missing piece that would make `withAuthn` composable with the shipped plugin.

---

## 5. Procedure-level policy metadata — absent

**Classification: API/type-system seam (p1).**

Authorization is **path-prefix only**: `AuthzRequest = { principal, method, path }`
(`types.ts:140-147`); rules match on `request.path.startsWith(...)`
(`scope-authorizer.ts:22-29`). Because `RPCLink` appends the procedure path segment-wise, a rule
*can* in principle match `/api/rpc/v1/auth/signout`, but that string is derived, not declared.

`grep -rn '\.meta(' packages plugins` finds **no oRPC `.meta()` usage at all** — every hit is Zod
schema metadata in `packages/aspire/config.ts`. There is no `requireScopes` / `public` / `policy`
annotation on any contract procedure, so:
- policy lives in a second place that can drift from the contract;
- OpenAPI emits no `security` metadata (already noted for the MCP work at
  `.llm/runs/plan-openapi-mcp-plugin--seed/design/canonical/01-tool-surface.md:135-137`);
- generated SDK/MCP/agent surfaces cannot tell a protected procedure from a public one.

---

## 6. Tenancy seams (#884 / #885 context)

**Classification: product-expectation partly outside current scope, but the domain model blocks it.**

Board state (`gh issue list --label epic:enterprise-auth`, all open): epic **#871** (Backlog),
**#872** (0.0.8), **#873/#874** (0.0.10), **#875-#877/#880/#878** (0.0.11), **#879** (0.0.13),
**#881-#886** (0.0.12), **#887** (Backlog). #884 = organization-aware identity + authorization
policy contracts; #885 = auth conformance/mocking/scaffold test kit. Adjacent: **#942** (0.0.11,
auth v1 frontend: account + session widget + signin starter), **#945** (0.0.13, auth-org backend
capability), **#1243** (0.0.6, broken CLI default URL).

Current-state facts #884 must overcome:

- `AuthSession` has **no** organization/tenant field — `{id, userId, accountId?, providerId?, state,
  subject, scopes, roles, claims, issuedAt, expiresAt, refreshedAt?, revokedAt?, traceparent?,
  tracestate?}` (`packages/plugin-auth-core/src/domain/mod.ts:108-124`). Tenancy can only ride in
  the untyped `claims: Record<string, unknown>` bag.
- `Principal` likewise: `{subject, scopes, roles, scheme, claims}`
  (`packages/service/src/auth/types.ts:88-105`). Its doc comment explicitly delegates org/tenant to
  `claims` (`:97-103`) — i.e. tenancy is *documented as untyped by design*.
- `auth.prisma` has four models — `AuthUser`, `AuthSession`, `AuthAccount`, `AuthVerification`
  (`plugins/auth/database/auth.prisma:2,17,33,55`) — **no organization/membership model**.
- WorkOS already produces `organizationId` (`packages/auth-workos/src/workos-authenticator.ts:254,
  287,323`) but it is flattened into `claims` and lost to the type system at the port boundary.
- Multi-backend routing is *structurally* present but *unreachable*: the registry is a
  `Map<string, AuthBackendPort>` with `resolveBackend(name?)`
  (`packages/plugin-auth-core/src/ports/mod.ts:321-353`), yet every handler calls
  `context.registry.resolveBackend()` with **no argument**
  (`v1-handlers.ts:83,134,187,238` and `me`), no contract input carries a backend/tenant selector
  (`auth.contract.ts:437-461`), and the factory is explicitly *"single-active"*
  (`plugins/auth/services/src/backend-registry.ts:96-97`). That is the #874 gap in one line.

For **#885**: today the only auth conformance is `packages/service/tests/auth/*` (which asserts
401/403/200 on `/api/openapi.json` only — **not** on `/api/rpc/*`) and per-backend unit tests. The
scaffold E2E's sole auth behaviour gate is an **unauthenticated** `GET /api/v1/auth/session`
expecting success (`runtime-gates.ts:414-418`). There is no gate anywhere proving an authenticated
end-to-end call, and none proving an unauthenticated call is *rejected*.

---

## 7. Docs / discovery failures

1. **Dangling architecture-debt ids.** Published docs cite `arch-debt:seamless-auth-roadmap` and
   `arch-debt:auth-single-active-backend-boundary`
   (`docs/site/identity-access/how-to/add-authentication.md:76,100`), but neither id exists anywhere
   under `docs/architecture/` — that tree contains only `DOCS-STRUCTURE.md`,
   `PUBLIC-SURFACE-PATTERNS.md`, `STANDARDS.md`, `zod-dependency-boundary.md`, and
   `doctrine/01-11 + ref-migration-map.md`. The caveats are unresolvable pointers.
2. **Cookie claims contradicted by code** — see §4.1 (`add-authentication.md:277,290-296`).
3. **Zero SDK auth guidance.** `docs/site/reference/sdk/index.md` and `services-sdk/sdk.md` never
   mention attaching a credential; the authz tutorial can only show `curl`
   (`05-route-authz.md:248-258`). An agent reading the docs end-to-end finds no path from
   "auth plugin installed" to "my typed client call is authenticated" — which is precisely the
   behaviour Wave-6 observed.
4. **Naming inconsistency in discovery keys.** The plugin exports
   `AUTH_API_SERVICE_NAME = 'auth-api'` (`plugins/auth/src/constants.ts:10`) while the CLI registry
   strips the `-api` suffix (`packages/cli/src/kernel/adapters/config/plugin-registry.ts:81`) and
   the E2E addresses the resource as `'auth'` (`runtime-gates.ts:407,412,417`) but workers as
   `'workers-api'` (`:295,300`). *Unverified at runtime* — flagging as an open question, since
   `createServiceClient({serviceName: AUTH_API_SERVICE_NAME})` resolves
   `services__auth-api__http__0` (`packages/sdk/src/discovery/service-url.ts:107-119`) and would
   throw if Aspire registered `auth`.

---

## 8. Gap register (classified)

| # | Gap | Class | Sev |
|---|---|---|---|
| G1 | `CreateServiceClientOptions` / `ServiceClientContext` have no credential, header, or fetch seam | API/type-system seam | p0 |
| G2 | `createPluginService` cannot enable `withAuthn`/`withAuthz`; all 6 first-party plugin services are unguardable | API/type-system seam | p0 |
| G3 | Scaffolded service template ships with no `auth` option and no stub | scaffold/generation | p0 |
| G4 | `plugin add auth` emits only a types barrel — no client, route, guard, or session helper | scaffold/generation | p0 |
| G5 | oRPC signin/callback discard backend `Set-Cookie`; contract lacks `outputStructure: 'detailed'` | runtime correctness | p0 |
| G6 | Unauthenticated `POST /api/v1/auth/signout` accepts an arbitrary `sessionId` | runtime correctness | p0 |
| G7 | Cross-origin discovery + `__Host-` cookie + `origin:'*'` CORS makes browser cookie auth impossible | runtime correctness | p1 |
| G8 | No remote session-verifying `AuthenticatorPort` for non-auth services | plugin-composition | p1 |
| G9 | No procedure-level policy metadata (`.meta()` unused); authz is path-prefix only | API/type-system seam | p1 |
| G10 | `principal` is untyped (`Record<string, unknown>`); `@netscript/plugin` has no principal concept | API/type-system seam | p1 |
| G11 | Tenancy/organization absent from `AuthSession`, `Principal`, and `auth.prisma`; multi-backend routing unreachable | API seam (→ #884/#874) | p1 |
| G12 | No E2E/conformance gate proves an authenticated call or a rejected unauthenticated call | test-coverage (→ #885) | p1 |
| G13 | Dangling `arch-debt:` ids; cookie claims contradicted by code; zero SDK auth docs | docs/discovery | p1 |
| G14 | Trusted-header authenticator has no emitter anywhere | plugin-composition | p2 |
| G15 | CLI auth session commands use raw fetch + hardcoded broken URL (#1243) | docs/discovery + correctness | p2 |
| G16 | `auth-api` vs `auth` discovery-name inconsistency — **needs runtime verification** | open question | p2 |

## 9. Smallest coherent remediation shape (for the planner, not a decision)

The ordering is forced by the seams: **G1 is unusable without G7's topology decision, and G2/G8 are
what make the auth plugin composable at all.**

1. Decide the topology (BFF/same-origin proxy vs bearer). Everything else depends on it.
2. `SdkClientContribution`-style seam on `createServiceClient`/`defineServices`: a
   `headers?: () => Headers | Promise<Headers>` (or `clientContext`) plus per-call override on
   `ServiceClientContext`. Auth is the first dogfood; streams' `getStreamsAuth` is the second,
   non-auth proof that the seam is generic.
3. `PluginServiceConfig.auth` → `withAuthn/withAuthz` inside `createPluginService`, plus a remote
   `createAuthServiceAuthenticator()` in `@netscript/plugin-auth` (G2 + G8) so a scaffolded service
   can guard itself without embedding backend secrets.
4. `outputStructure: 'detailed'` on `signin`/`callback`/`signout` so `Set-Cookie` survives (G5),
   and an authenticated `signout` (G6).
5. Procedure `.meta({ scopes })` + an authorizer adapter that reads it (G9), and a typed
   `principal` in the plugin/service context (G10) — this is the prerequisite for #884.
6. Scaffold: auth-aware service template + `plugin add auth` emitting a signin route, a session
   helper, and a guarded-procedure example (G3/G4) — feeds #942.
7. Conformance gates: authenticated call passes, unauthenticated call 401s, on `/api/rpc/*` and
   `/api/v1/*` (G12) — this is #885's floor.
