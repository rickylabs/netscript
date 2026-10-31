# Research: native CORS response authority (U2) and exact anonymous health (U4)

Run `.llm/runs/fix-native-service-policy--u2-u4/`, worktree
`C:/Users/ericc/source/repos/netscript-native-service-policy-008`, branch `fix/native-service-policy`,
HEAD `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d` (= origin/main). Tracked `packages/`, `docs/`,
`deno.json`, `deno.lock` were clean at inspection time. Planning only: no product file, test, config
or lock was edited; nothing was executed except read-only `git`, `sha256sum`, `grep`, `sed` and the
installed NetScript MCP. All behavior statements below are **source-derived and UNRUN**.

File hashes for every load-bearing file are in [source-receipt.json](source-receipt.json).

## 1. Authority consulted

| Source | What it settled |
| --- | --- |
| `AGENTS.md`, `CLAUDE.md`, `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/workflow/{activation,run-loop,lane-policy}.md`, `.llm/harness/gates/{plan-gate,archetype-gate-matrix}.md`, `.llm/harness/evaluator/plan-protocol.md` | Plan-gate checklist, PLAN-EVAL hard stop, generator/evaluator separation, Archetype 4 + `SCOPE-service` gate set. |
| `generate-plan.md`, `worklog.md`, `supervisor.md` (this run) | Scope: exactly two leaves, U1/U3/E1 out, no sentinel prefix, no option bag, candidate footprints are not caps. |
| NetScript MCP `find_guidance` (CORS/withCors/oRPC handlers; allowAnonymous/protect), `get_doc pages/reference/service#pipeline-order`, `#cors-origins`, `#contract-declared-authentication-and-authorization`, `search_docs` (`allowAnonymous prefix`, `CORSPlugin oRPC access-control-allow-origin`) | Documented pipeline order (tracing → CORS → logger → `use()` → authn/authz → body limit → projections/routes), documented CORS policy ("origins outside the allowlist receive no ACAO"), documented `allowAnonymous` semantics ("a custom nonempty list replaces the native default; the assertion does not add `/health`"; "a [raw-route] declaration never makes a path public"). No doc mentions oRPC `CORSPlugin`; docs are navigation, not behavior authority. |
| EIS run `feat-netscript-008-foundation--s00-s01/`: `s16-remediation-proposal-20261027.md`, `s16-remediation-footprint-20261027.md`, `s16-security-decision-20261027.md`, `s16-browser-bootstrap-proposal-20261027.md` §"Separate minimal native health-match leaf" | Symptom statement (six headers / Vary / inner oRPC overwrite), their candidate footprints (U2: 3–4 paths; exact-health: 5 paths), their open questions 3 and 6. `s16-e1-policy-research-20261027.md` is an input boundary and was not re-audited. |
| `packages/service` source and tests listed in §2–§3 | Current behavior (authority for this plan). |
| Hono 4.13.13 (`jsr:@hono/hono@4.13.13`, lock line 464) `src/middleware/cors/index.ts`, `src/context.ts`, `src/compose.ts`, `src/hono-base.ts`, `src/utils/url.ts`; oRPC `npm:@orpc/server@1.15.5` `dist/plugins/index.mjs` lines 119–193 (`CORSPlugin`) | Dispatch, header-merge and plugin-order mechanics. Read from the user Deno cache (see drift.md for the env remap). |

## 2. U2 — current CORS behavior, derived from source

### 2.1 Native pieces

- `packages/service/src/middleware/service-cors.ts` (57 lines): `resolveServiceCorsOptions` snapshots
  `NETSCRIPT_CORS_ORIGINS` once (exact `http(s)` origins; `TypeError` on `*`, `null`, paths, trailing
  `/`, blanks after a comma; blank value ⇒ `[]`), copies arrays; `assertServiceCorsOptions` rejects
  `credentials` + wildcard (literal or array member); `createServiceCorsMiddleware` wraps a function
  `origin` when `credentials` is set so a resolved `'*'` becomes `null`, then delegates to Hono `cors()`.
- `packages/service/src/builder/service-builder-impl.ts` (629 lines): constructor installs tracing
  `use('*')`; `withCors(options)` resolves, pushes onto `corsOptions[]` and **installs the middleware
  immediately** via `this.use(...)`; `build()` asserts every stored CORS option, then installs authn,
  authz, body limit, deferred routes (`/api/openapi.json`, `/api/docs`, `wireRpc`, raw `route()`s),
  `notFound`, `onError`. `withHealth()` registers `GET /health`, `/health/live`, `/health/ready`
  immediately. Repeated `withCors()` calls stack a second middleware (pre-existing; see deferred Q-U2-3).
- `packages/service/src/builder/service-rpc.ts` (133 lines): `wireRpc` builds
  `createRPCHandler(options?.rpcRouter ?? router, { serviceName, debug, redactFields })` and
  `createOpenAPIHandler(router, same)`; mounts them with `app.use('<rpcPath>/*')`, each alias, each
  deprecated prefix, and `app.use('<apiPath>/*')`; a matched result is returned as
  `c.newResponse(response.body, response)`, unmatched falls through to `next()`.
- `packages/service/src/primitives/handlers.ts` (247 lines): `RPCHandlerConfig { serviceName?,
  plugins?, tracing?, errorHandling?, deduplication?, warnOnlyCodes?, logging?, debug?, redactFields? }`;
  `createRPCPlugins` pushes tracing/error/logging plugins (when `serviceName`), then **always**
  `new CORSPlugin()` (line ≈100), then caller `plugins`. `createRPCHandler` → `new RPCHandler(router,
  { plugins })`; `createOpenAPIHandler` → plugins + `ZodSmartCoercionPlugin`. Only `service-rpc.ts`
  calls these factories inside the repo (repo-wide grep; `packages/telemetry` only cites them in JSDoc).
- `packages/service/src/types.ts:302` `CorsOptions = Parameters<typeof cors>[0]` (Hono's type).
- `packages/service/src/presets/define-service.ts` always calls `.withCors(options.cors)` first;
  `packages/plugin/src/service/presentation/create-plugin-service.ts:164` calls `withCors(config.cors)`
  unless `enableCors === false`.

### 2.2 Hono 4.13.13 mechanics that matter

- `cors()` (middleware): computes `allowOrigin = await findAllowOrigin(origin, c)` **once per
  request**; sets `Access-Control-Allow-Origin` (only when resolved), `Access-Control-Allow-Credentials`
  (when `credentials`), `Access-Control-Expose-Headers` on the **placeholder** `c.res.headers`
  before `next()`. `OPTIONS` short-circuits: `Vary: Origin` when origin ≠ `'*'`, `Access-Control-
  Max-Age`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` (+ `Vary:
  Access-Control-Request-Headers` when reflecting), deletes `Content-Length`/`Content-Type`,
  returns `204` with no body — **before authn/authz/body-limit/routes** (they are installed later).
  After `next()` it appends `Vary: Origin` (when origin ≠ `'*'`) with `c.header(..., {append:true})`.
- `Context#newResponse(body, init)`: copies placeholder headers, then `set()`s every init header
  (overwrite; `set-cookie` appended). `set res(r)`: re-applies placeholder headers over `r` (skips
  `content-type`; if the placeholder had cookies, replaces the response's cookies with them); on an
  immutable-headers `TypeError` it rewraps the response in a mutable one.
- `compose`: each handler is wrapped in try/catch; an error becomes `onError`'s response and
  `context.res = res` is assigned when `finalized === false || isError`, so outer middleware's
  `await next()` resolves normally and CORS post-processing still runs on error responses.
- `#dispatch`: `HEAD` is matched as `GET` (body stripped), `c.req.method` stays `'HEAD'`.
- `getPath` uses `decodeURI`-style decoding: `%61`→`a`, `%2E`→`.`, but reserved `%2F %3F %23` stay
  encoded; strict routing (`/health/` ≠ `/health`). The WHATWG `URL` parser normalizes dot segments
  (including `%2E%2E`) before Hono sees `c.req.url`.

### 2.3 oRPC 1.15.5 `CORSPlugin` (installed unconditionally today)

`order = 9e6`; defaults `origin: (origin) => origin` (reflect **any** origin), `allowMethods:
GET,HEAD,PUT,POST,DELETE,PATCH`, `timingOrigin`, `credentials` unset. Two `rootInterceptors.unshift`:
an outer interceptor that sets `access-control-allow-origin` (reflected or `'*'`), merges
`vary: origin`, `timing-allow-origin`, `access-control-allow-credentials`, `access-control-expose-
headers` on every matched result; an inner `OPTIONS` interceptor answering `204` with max-age /
allow-methods / allow-headers. With **no** `Origin` header the reflect default yields
`access-control-allow-origin: ""` (empty string header).

### 2.4 Resulting defect (derived; UNRUN)

For a builder service with `withCors({ origin: [A] })` and `withRPC()`:

| Request | Hono placeholder | oRPC response headers | Final after `newResponse` + `set res` |
| --- | --- | --- | --- |
| `Origin: A`, RPC/REST success | ACAO=A (+ACAC/ACEH if set) | ACAO=A reflected, `vary: origin` | ACAO=A (Hono re-applies same value); `Vary` becomes `origin, Origin` (duplicate token) |
| `Origin: hostile`, RPC/REST success | none | ACAO=hostile, `vary: origin` | **ACAO=hostile survives** (nothing to re-apply); `Vary` duplicated |
| `Origin: A.attacker.example` (lookalike) | none | ACAO=lookalike | **reflected** |
| no `Origin`, RPC/REST success | none | ACAO=`""` | **empty ACAO header emitted** |
| any origin, 401/403/413/404/500 (`c.json`/`onError`) | per Hono | n/a (oRPC not reached) | Hono policy only — correct today |
| `OPTIONS` preflight | Hono short-circuit 204 | not reached | correct today |
| `OPTIONS` to RPC path **without** `withCors()` | none | oRPC answers 204 with reflect | implicit CORS without any service policy |
| RPC/REST success **without** `withCors()` | none | reflected ACAO | implicit any-origin CORS on projections only; raw/health/errors have none |

Existing tests (`tests/cors-policy_test.ts` 201 lines, `tests/cors-topology_test.ts` 88 lines) assert
CORS only on `/health` (GET/OPTIONS); none exercises `/api/rpc/*` or `/api/*` success. The CLI E2E
browser tests (`packages/cli/e2e/tests/application/gates/scaffold/generated-browser-conformance_test.ts:126-141,174`,
`browser-auth-topology_test.ts:129-132`) assert ACAO on `/api/v1/private/read` **401 responses**
(authn `c.json`, oRPC not reached) and on `/health`; they therefore already encode Hono-only
authority and are **compatible** with removing oRPC CORS from builder-wired handlers. The Aspire
helper test `packages/cli/src/kernel/templates/aspire/helpers/tests/workspace-cors_test.ts:112-136`
targets `/health` preflight only.

Doctrine/README promise ("Origins outside the allowlist receive no `Access-Control-Allow-Origin`
header"; README "CORS migration (breaking in 0.0.8)") is therefore **false today on successful RPC
and OpenAPI responses**. Fixing it is policy conformance, not new policy.

## 3. U4 — current anonymous-path behavior, derived from source

- `packages/service/src/auth/options.ts` (113 lines): `AuthnOptions { authenticator; protect?:
  readonly string[]; allowAnonymous?: readonly string[] }` — JSDoc describes prefixes. `AuthzOptions
  { authorizer; denyByDefault? }`. `ContractAuthorizerRawRoute { path; authentication: 'required';
  authorization? }`. `AuthnOptions`/`AuthzOptions` are re-exported by `src/auth/mod.ts:37-38` and
  root `mod.ts:89-90`.
- `packages/service/src/auth/auth-middleware.ts` (302 lines):
  - `DEFAULT_PROTECTED_PREFIXES = ['/api']`, `DEFAULT_ANONYMOUS_PREFIXES = ['/health']`.
  - `normalizeGuard`: `protect?.length ? protect : defaults`, `allowAnonymous?.length ? allowAnonymous
    : ['/health']` ⇒ `[]` and `undefined` behave identically (default).
  - `matchesPrefix(path, prefix)`: `path === prefix || path.startsWith(prefix + '/')` (or raw prefix
    when it already ends with `/`). Method-independent.
  - `isGuardedPath(path, guard)`: any anonymous prefix match ⇒ **not guarded** (wins over `protect`);
    else any protect prefix match ⇒ guarded. Called with **`c.req.path` (decoded)** in both stages
    (`:52`, `:113`). `rawPathname(c)` (undecoded) is used only for the contract resolver and the
    authorizer's `rawPath`.
  - authn (`:47-90`): matched contract policy decides first (`requiresAuthentication`); `authentication:
    'none'` bypasses, `'required'` guards even inside an anonymous prefix; unmatched ⇒ prefix guard.
    Authenticator throw/reject ⇒ `503 SERVICE_UNAVAILABLE` (redacted); `!ok` ⇒ `401 UNAUTHORIZED`
    with reason; success sets `principal`, applies `responseHeaders`/`setCookies`.
  - authz (`:102-150`): matched public ⇒ `next()`; `!policy?.matched && !isGuardedPath` ⇒ `next()`
    **without calling the authorizer**; missing principal ⇒ `401 missing-principal`; `authorize({
    principal, method, path: c.req.path, rawPath })`; deny ⇒ `403 FORBIDDEN`; throw ⇒ `denyByDefault
    ? 403 'authz.error' : next()` (current fail-closed shape must be preserved).
- Builder forwarding (`service-builder-impl.ts installAuth`): `createAuthnMiddleware({...authnOptions,
  policyResolver})` and `createAuthzMiddleware({...authzOptions, protect: authnOptions?.protect,
  allowAnonymous: authnOptions?.allowAnonymous, policyResolver})` — both stages receive the **same
  list**; no builder change is needed for a widened element type.
- `assertServiceAuthPolicy` (`service-auth-policy.ts`) validates posture/ports only and explicitly
  "does not normalize anonymous-path policy" — it must stay untouched.
- Contract side (`contract/contract-path.ts`, `contract-raw-routes.ts`, `contract-policy.ts`,
  `contract-authorizer.ts`): raw-route declarations are **exact**, validated with
  `NON_EXACT_PATH_SYNTAX = /[*:{}?#]/`, absolute, no duplicates, bound at `build()`; resolver input is
  `{ method, path: rawPathname, routePath: c.req.path }`; deny-side `normalizePath` strips trailing
  slashes (safe only because it widens denial). That vocabulary is the precedent for U4 validation.
- Consumers of `allowAnonymous` (repo grep): `packages/cli/src/kernel/adapters/plugin/browser-auth-
  reconciler.ts:180` (`['/health','/api/openapi.json','/api/docs']` strings), `packages/plugin/tests/
  service/create-plugin-service-auth_test.ts:126`, `packages/sdk/tests/internal-credential-
  contribution_test.ts:147`, `packages/mcp/.../fetch-service-endpoint-probe.ts:12`, service tests
  `service-auth-policy_test.ts`, `route-precedence_test.ts`, `internal-procedures_test.ts`,
  `.llm/tools/docs/guarded-client-docs_test.ts:165`, docs `docs/site/reference/service/index.md:337,367,369,416`,
  `docs/site/services-sdk/services.md`, `packages/plugin/README.md:341`. All pass **string arrays**; a
  widened element union keeps every one of them type- and behavior-identical.

### 3.1 The gap (derived; UNRUN)

With `protect: ['/']`, `allowAnonymous: ['/health']` (or `[]`/omitted), `withHealth()` and a raw
`route('all', '/*', handler)` (a streams-like arbitrary-path host): `POST /health/anything`,
`PUT /health/live/x`, `DELETE /health%2Fx`-style requests match the anonymous **prefix** in both
stages (authenticator and authorizer are never invoked) and dispatch to the catch-all handler because
`withHealth()` only registers `GET` on three exact paths. Only `GET`/`HEAD` on exactly those three
paths reach health handlers. An ordinary authorizer cannot repair this because authz bypasses before
`authorize()`. No exploit is claimed; this is a source-qualified bypass of the intended health
exception.

### 3.2 Dispatch facts that the exact rule must follow

| Request pathname (wire) | `rawPathname(c)` | `c.req.path` (routes) | Note |
| --- | --- | --- | --- |
| `/health` | `/health` | `/health` | canonical |
| `/health?x=1` | `/health` | `/health` | query excluded from both |
| `/he%61lth` | `/he%61lth` | `/health` | routes to `GET /health`; legacy prefix admits it (decoded) |
| `/health%2Flive` | `/health%2Flive` | `/health%2Flive` | `%2F` stays encoded; not the health route |
| `/health/` , `//health`, `/HEALTH` | as sent | as sent | strict routing; distinct from `/health` |
| `/health/../health`, `/x/%2E%2E/health` | `/health` | `/health` | WHATWG URL normalizes before Hono |
| `HEAD /health` | `/health` | `/health` | served by the `GET` handler, body stripped, method stays `HEAD` |
| `OPTIONS /health` with `withCors()` | — | — | answered 204 by CORS **before** authn |
| `OPTIONS /health` without `withCors()` | `/health` | `/health` | reaches authn like any method |

## 4. Gate and surface authority

- Archetype 4 (Public DSL/Builder) + `SCOPE-service` overlay: public option types are the contract;
  every type reachable from an exported symbol must itself be exported (`deno doc --lint`/F-gates);
  immutable configuration snapshots; fail-closed defaults; no new runtime services.
- Package tasks (`packages/service/deno.json`): `check` = `deno check --unstable-kv ./mod.ts
  commands.ts commands-testing.ts commands-relay.ts ./src/auth/internal-credential/mod.ts
  ./src/rate-limit/mod.ts`; `test` = `deno test --allow-all ./tests/`.
- Root wrappers per `AGENTS.md`: `.llm/tools/run-deno-{check,test,lint,fmt}.ts`, `deno task
  arch:check`, `deno task quality:scan`, `deno task doc:lint`, `deno task publish:dry-run`,
  `deno task e2e:cli` (merge-readiness only). All prospective/UNRUN in this slice.
- `tests/cors-topology_test.ts` pins README/CHANGELOG strings (`## CORS migration (breaking in 0.0.8)`,
  `**Breaking (0.0.8):** CORS`) — U2 prose edits must keep them intact.

## 5. Open questions carried into decisions.md

See decisions.md §"MUST RESOLVE" and §"Deferred" — release classification of the U2 behavior
change for builder services that never call `withCors()`, repeated `withCors()` stacking, the
`/health/live` + `/health/ready` ergonomics for exact lists, and docs-site reference regeneration.
