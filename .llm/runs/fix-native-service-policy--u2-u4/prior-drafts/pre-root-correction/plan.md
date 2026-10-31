# Plan: native CORS response authority (U2) and exact anonymous requests (U4)

**Status:** PLAN only. Not evaluated. Implementation not authorized. All gates prospective/UNRUN.
Baseline `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d`, `@netscript/service` 0.0.8, Hono 4.13.13,
`@orpc/server` 1.15.5. Evidence: [research.md](research.md); locks: [decisions.md](decisions.md);
hashes: [source-receipt.json](source-receipt.json).

## Next action (after root read + separate-family PLAN-EVAL)

Implement **U2 first** (two product edits + tests), then **U4** (two product edits + two re-exports +
tests), as two separate commits/PRs on this branch, each proven by the package-scoped gates below
before the merge-readiness suite. No release/version/lock change in either leaf.

## Decision summary

| Leaf | Decision | Measured evidence | Footprint |
| --- | --- | --- | --- |
| U2 | Builder-wired oRPC RPC/OpenAPI handlers stop installing oRPC `CORSPlugin` (`RPCHandlerConfig.cors?: boolean`, default `true`; `wireRpc` passes `false`). Hono `withCors()` is the single CORS authority. Standalone handler factories unchanged. | `handlers.ts` always pushes `new CORSPlugin()`; oRPC default reflects **any** origin and emits `ACAO: ""` with no Origin; Hono's `newResponse`/`set res` only re-applies headers Hono itself set, so a hostile/lookalike origin survives on RPC/REST success and `Vary` carries `origin, Origin`. Existing tests cover `/health` only. | 2 source + 1 JSDoc + 2 tests + README + CHANGELOG (+ conditional docs page) = 8 paths |
| U4 | `allowAnonymous` accepts `string | AnonymousRequestMatch` (`{ method, path }`, exact, both path representations, `GET`⇒`HEAD`); legacy strings/default/`[]` unchanged; validated with `TypeError` at guard construction; both stages share the rule. | `normalizeGuard`/`matchesPrefix` are method-independent decoded-prefix checks consulted by **both** stages before the authorizer; `withHealth()` registers only `GET` on 3 exact paths; a raw `route('all','/*')` receives any method under `/health/*`. | 2 source + 2 re-exports + 3 tests + README + CHANGELOG = 9 paths |

## Public API (U2)

```ts
// packages/service/src/primitives/handlers.ts — additive field on the existing exported interface
export interface RPCHandlerConfig {
  // ...existing fields unchanged...
  /**
   * Install oRPC's `CORSPlugin` (reflects any request origin). Defaults to `true`
   * for standalone handlers so `createRPCHandler(router)` keeps its current
   * behavior. The service builder passes `false`: inside `createService()` and
   * `defineService()`, `withCors()` is the only CORS authority for RPC, OpenAPI,
   * raw routes, health and error responses.
   *
   * @example
   * ```ts
   * import { createRPCHandler } from '@netscript/service';
   * declare const router: import('@netscript/service').ServiceRouter;
   * // Standalone handler mounted behind your own CORS layer:
   * const handler = createRPCHandler(router, { serviceName: 'users', cors: false });
   * ```
   */
  readonly cors?: boolean;
}
```

`createRPCPlugins`: `if (config.cors !== false) plugins.push(new CORSPlugin());` — position unchanged
(after tracing/error/logging, before caller `plugins`). `service-rpc.ts wireRpc`:
`const handlerConfig = { serviceName, debug, redactFields, cors: false } as const;` used for both
`createRPCHandler` and `createOpenAPIHandler`. `service-cors.ts` module JSDoc gains: "Inside a
builder service this middleware is the sole CORS authority; builder-wired oRPC handlers install no
`CORSPlugin` (`RPCHandlerConfig.cors: false`)." No other product change.

## Public API (U4)

```ts
// packages/service/src/auth/options.ts
/**
 * One anonymous request: an uppercase method and a byte-exact absolute path.
 * Unlike string prefixes, an entry admits nothing else: no descendants, no
 * percent-encoded spelling, no case or slash variants, no query-less twin
 * with a trailing slash. `GET` also admits `HEAD` because Hono serves `HEAD`
 * through the `GET` route with the body stripped; `HEAD` admits only `HEAD`.
 * `OPTIONS` is not accepted: CORS preflight is answered by `withCors()` before
 * authentication, and any other `OPTIONS` request stays guarded.
 *
 * @example
 * ```ts
 * import type { AnonymousRequestMatch } from '@netscript/service/auth';
 * const health: readonly AnonymousRequestMatch[] = [
 *   { method: 'GET', path: '/health' },
 *   { method: 'GET', path: '/health/live' },
 *   { method: 'GET', path: '/health/ready' },
 * ];
 * ```
 */
export interface AnonymousRequestMatch {
  readonly method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
}

/** A legacy path prefix (`string`) or one exact anonymous request. */
export type AnonymousRule = string | AnonymousRequestMatch;

export interface AuthnOptions {
  readonly authenticator: AuthenticatorPort;
  readonly protect?: readonly string[];
  /**
   * Requests that skip authentication and authorization. Strings are path
   * prefixes (existing behavior; `'/health'` also admits `/health/anything` for
   * every method). Object entries are exact method/path requests. Omitted or
   * empty keeps the native `/health` prefix default; a nonempty list replaces
   * it entirely, so an exact-only list must spell every anonymous probe.
   * Invalid object entries throw a `TypeError` when the guard is built, before
   * any request or listener. A matched contract procedure's own access
   * declaration always takes precedence over this list.
   *
   * @example
   * ```ts
   * import { createService } from '@netscript/service';
   * import { createStaticCredentialAuthenticator } from '@netscript/service/auth';
   * declare const authenticator: ReturnType<typeof createStaticCredentialAuthenticator>;
   * const app = createService({}, { name: 'streams' })
   *   .withAuthn({
   *     authenticator,
   *     protect: ['/'],
   *     allowAnonymous: [
   *       { method: 'GET', path: '/health' },
   *       { method: 'GET', path: '/health/live' },
   *       { method: 'GET', path: '/health/ready' },
   *     ],
   *   })
   *   .withHealth()
   *   .route('all', '/*', (c) => c.text('guarded'))
   *   .build();
   * ```
   */
  readonly allowAnonymous?: readonly AnonymousRule[];
}
```

`auth-middleware.ts`: `AuthzMiddlewareOptions.allowAnonymous?: readonly AnonymousRule[]`;
`normalizeGuard` validates object entries and copies arrays; `isGuardedPath(path, guard)` becomes
`isGuardedRequest(c, guard)` evaluating `method`, `rawPathname(c)` and `c.req.path`; both
`requiresAuthentication` and the authz bypass call it. Re-export `AnonymousRequestMatch`,
`AnonymousRule` from `src/auth/mod.ts` and `mod.ts`. Error text:
`[netscript.service.auth] invalid anonymous request: <method> <path>: <reason>`.

## Ordered implementation leaves

### Leaf U2 — native CORS authority (8 paths)

1. `packages/service/src/primitives/handlers.ts` — `cors?: boolean` + conditional push + JSDoc.
2. `packages/service/src/builder/service-rpc.ts` — pass `cors: false` to both handler factories.
3. `packages/service/src/middleware/service-cors.ts` — JSDoc authority statement only.
4. `packages/service/tests/cors-rpc-policy_test.ts` — **new** real-handler conformance matrix.
5. `packages/service/tests/handlers_test.ts` — standalone default keeps `CORSPlugin`; `cors: false`
   omits it; plugin order otherwise identical.
6. `packages/service/README.md` — inside "CORS migration (breaking in 0.0.8)" add one paragraph:
   `withCors()` is the only CORS authority; RPC/OpenAPI projections emit no access-control headers
   without it; standalone `createRPCHandler`/`createOpenAPIHandler` keep oRPC's default unless
   `cors: false`. Keep the heading and the two pinned snippets byte-identical.
7. `packages/service/CHANGELOG.md` — Unreleased: "Fixed: builder-wired RPC and OpenAPI projections no
   longer emit oRPC's reflected default CORS headers; `withCors()` is the single CORS authority for
   every response (success, error, auth, body limit, preflight). Standalone handler factories are
   unchanged; `RPCHandlerConfig.cors: false` opts out." (classification per M-U2-1).
8. `docs/site/reference/service/index.md` — **conditional** on M-U2-2 (only if the regeneration gate
   reports drift for `RPCHandlerConfig`).

`service-builder-impl.ts`: inspected, **no edit** (ordering already correct). `define-service.ts`,
`create-plugin-service.ts`: no edit.

### Leaf U4 — exact anonymous requests (9 paths)

1. `packages/service/src/auth/options.ts` — `AnonymousRequestMatch`, `AnonymousRule`, widened
   `AuthnOptions.allowAnonymous`, JSDoc.
2. `packages/service/src/auth/auth-middleware.ts` — union on `AuthzMiddlewareOptions`, validation in
   `normalizeGuard`, `isGuardedRequest`, both call sites.
3. `packages/service/src/auth/mod.ts` — re-export the two types.
4. `packages/service/mod.ts` — re-export the two types.
5. `packages/service/tests/auth/middleware_test.ts` — unit matrix (below).
6. `packages/service/tests/auth/builder-auth_test.ts` — builder matrix with counting catch-all.
7. `packages/service/tests/auth/define-service-auth_test.ts` — preset passthrough + pre-listener
   rejection (`port: 0`, assertRejects on invalid entry, no listener opened).
8. `packages/service/README.md` — under "Auth policy migration": "Exact anonymous requests" recipe
   (three health entries, `protect: ['/']`, catch-all raw route) and the compatibility sentence that
   `[]`/omitted keep the `/health` prefix default.
9. `packages/service/CHANGELOG.md` — Unreleased "Added" entry.

`service-builder-impl.ts installAuth`, `service-auth-policy.ts`, contract files, CLI reconciler,
plugin factory: inspected, **no edit**.

## Proving gates (prospective; exact commands; UNRUN here)

Run from the worktree root. Package-scoped first, then root wrappers, then merge-readiness.

```powershell
# 1. Types and surface
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts,tsx
deno task doc:lint                      # new types must be reachable from mod.ts and ./auth
# 2. Owning tests (per leaf, then whole package)
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/service/tests/cors-rpc-policy_test.ts packages/service/tests/handlers_test.ts packages/service/tests/cors-policy_test.ts packages/service/tests/cors-topology_test.ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/service/tests/auth/
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/service/tests/
# 3. Hygiene
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts,tsx
deno task arch:check
deno task quality:scan
deno task publish:dry-run
# 4. Consumers that pass allowAnonymous / rely on CORS at 401 (U4 type widening, U2 header policy)
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin/tests/service/ packages/cli/src/kernel/templates/aspire/helpers/tests/workspace-cors_test.ts
# 5. Merge readiness only (expensive; evaluator/merge pass)
deno task e2e:cli
```

Durable receipts: wrap each gate in `.llm/tools/gates/run-gate.ts` where allowlisted; `rtk proxy`
output is exploratory only.

### U2 conformance matrix (`tests/cors-rpc-policy_test.ts`)

Fixture: `os.router` with `ping` (RPC, `POST /api/rpc/ping`), `status` (`route({ method:'GET', path:'/status' })`
→ `GET /api/status`), `boom` (throws), `cookie` (sets two `Set-Cookie` via `c`-less oRPC headers is
not possible → set cookies in a raw route and in an authenticator `setCookies`), raw
`route('get','/raw', handler)` returning `Response.redirect` (immutable headers) in one case and a
streamed body in another, `withHealth()`, `withAuthn` (static credential), `withBodyLimit({ maxBytes: 64 })`,
`notFound`/`onError` defaults. CORS: `withCors({ origin: [A], credentials: true, allowMethods:
['GET','POST'], allowHeaders: ['Authorization','Content-Type'], exposeHeaders: ['X-Trace'],
maxAge: 600 })`. Origins: `A`, `H` (hostile), `A.attacker.example` (lookalike), `null`, absent.

For every (path ∈ {RPC success, REST success, raw success, health, 404, 500 via `boom`, 401 missing
credential on `/api/...`, 403 via denying authorizer, 413 via body limit}) × (origin ∈ set) assert
**all** of: `access-control-allow-origin` (= origin only for `A`, else absent — never `""`),
`access-control-allow-credentials` (`'true'` only with `A`), `access-control-expose-headers`
(`X-Trace` only with `A`), `access-control-allow-methods`/`allow-headers`/`max-age` **absent** on
non-preflight responses, `Vary` contains exactly one `Origin` token (case-insensitive) and preserves
a handler-set `Vary: Accept-Encoding`, `content-type` and handler/oRPC headers preserved, both
`Set-Cookie` values present and in order, body bytes identical to the handler's output, status
unchanged. Preflight `OPTIONS` on RPC, REST and raw paths: `204`, empty body, the three preflight
headers (`GET, POST`, `Authorization, Content-Type`, `600`), `Vary: Origin`, authenticator call count
`0`; hostile preflight: no ACAO/ACAC, still `204`. No-Origin: no access-control header at all on any
path. Resolver-once: `origin: (o) => { calls++; return o === A ? o : null }` → `calls === 1` per
RPC/REST request (today: Hono once + oRPC once would not be visible — the oRPC plugin uses its own
default resolver, so this test instead asserts `calls === 1` **and** hostile ⇒ no ACAO). Env snapshot:
set `NETSCRIPT_CORS_ORIGINS=A`, build, change env to `H`, request RPC path with `H` ⇒ no ACAO.
Async credentialed `'*'` resolver ⇒ no ACAO/ACAC on RPC success. Standalone: `createRPCHandler(router)`
`.handle()` with `Origin: H` ⇒ ACAO reflected (unchanged default); `createRPCHandler(router, { cors:
false })` ⇒ no access-control headers.

**Negative controls (expected to FAIL on current HEAD per source derivation; implementation must
confirm red→green):** RPC/REST success with `H` or lookalike ⇒ ACAO absent; no-Origin RPC ⇒ ACAO
absent (today `""`); `Vary` single `Origin` token on RPC success (today duplicated).

### U4 matrix

`tests/auth/middleware_test.ts` (Hono + middlewares, counters on authenticator, authorizer, handlers):

- Validation: each invalid entry (`'get'`, `'OPTIONS'`, `'ALL'`, `'health'`, `'/health/'`, `'//health'`,
  `'/he%61lth'`, `'/health*'`, `'/health?x'`, `'/health#f'`, `'/health/{id}'`, `'/health :x'`,
  `'/health\\x'`, `''`) ⇒ `TypeError` from `createAuthnMiddleware` **and** `createAuthzMiddleware`;
  `'/'` accepted; duplicates accepted.
- Legacy controls unchanged: omitted, `[]`, `['/health']`, `['/health/']` — `/health/anything` with
  `POST` stays anonymous (prefix), authenticator calls `0`.
- Exact list `[{GET,'/health'}]`, `protect: ['/']`, routes `GET /health` + `all /*` counting handler:
  `GET /health` ⇒ 200, catch-all `0`, authenticator `0`; `GET /health?x=1` ⇒ 200;
  `HEAD /health` ⇒ 200 empty body, authenticator `0`; `POST|PUT|PATCH|DELETE /health` ⇒ 401,
  catch-all `0`, authenticator `1` each; `OPTIONS /health` (no CORS) ⇒ 401, catch-all `0`;
  `GET /health/live`, `/health/x`, `/healthz`, `/health/`, `//health`, `/HEALTH`, `/he%61lth`,
  `/health%2Fx`, `/health%2F..%2Fx` ⇒ 401, catch-all `0`, authenticator `1`; `/x/../health` ⇒ 200
  (URL-normalized to the route); `[{HEAD,'/health'}]` ⇒ `GET` 401, `HEAD` 200.
- Mixed list `['/api/docs', {GET,'/health'}]`: `/api/docs/anything` anonymous (prefix), `POST /health` guarded.
- Authz stage: with principal preset, exact `GET /health` ⇒ authorizer `0`; `POST /health` ⇒
  authorizer `1`, deny ⇒ 403; authorizer throw + `denyByDefault` ⇒ 403 `authz.error`; without
  `denyByDefault` current pass-through preserved.
- Precedence: resolver matched `'none'` on `/api/public` ⇒ bypass both (unchanged test extended with
  an exact list present); resolver matched `'required'` for `{GET,'/health'}` ⇒ 401 (declaration wins).
- Authenticator throw on a guarded `POST /health` ⇒ 503 redacted.

`tests/auth/builder-auth_test.ts` (real `createService`): `withAuthn({ authenticator, protect: ['/'],
allowAnonymous: [three GET entries] }).withAuthz({ authorizer }).withHealth().route('all','/*',counter).withRPC().build()`
— same matrix on `/health`, `/health/live`, `/health/ready` plus `POST /health/ready/x` ⇒ 401 with
catch-all `0`; `GET /` (service info when `withServiceInfo`) ⇒ guarded; RPC `POST /api/rpc/...`
guarded as before; with `withCors({ origin: [A] })` an `OPTIONS /health` preflight ⇒ 204 and
authenticator `0`; invalid entry ⇒ `build()` throws `TypeError` **before** any route is installed
(assert no listener/no handler call). Legacy builder test "health public under guarded api prefix"
kept unchanged.

`tests/auth/define-service-auth_test.ts`: guarded policy with the exact list ⇒ `GET /health` 200 and
`POST /health` 401 on the live `port: 0` listener; invalid entry ⇒ `assertRejects(TypeError)` and no
port opened.

**Negative controls (expected to FAIL on current HEAD):** `POST /health/anything` with the exact-only
list reaching the catch-all (today the prefix admits it); object entry compile error today.

## Risks and mitigations

| Risk | Leaf | Mitigation |
| --- | --- | --- |
| A consumer relied on reflected RPC CORS without `withCors()` | U2 | README/CHANGELOG sentence; `withCors()` is a one-line fix; M-U2-1 decides classification. |
| Preflight to RPC mounts no longer answered without `withCors()` | U2 | Same consequence, same mitigation; documented. |
| Hidden second installer of `CORSPlugin` via `plugins` | U2 | Builder exposes no `plugins`; standalone users keep control; test asserts plugin list. |
| `Vary` assertions brittle to Hono header casing | U2 | Compare token sets case-insensitively. |
| Type widening breaks a consumer narrowing `allowAnonymous` to `string[]` | U4 | Repo grep shows only string-array producers; `readonly (string|…)[]` accepts them. Note in CHANGELOG. |
| Exact list silently drops `/health/live|ready` | U4 | README recipe + M-U4-1; defineService tests cover all three. |
| Encoded probe spellings now 401 instead of anonymous | U4 | Intended (stricter); documented; legacy strings untouched. |
| Validation moves failure to `build()` for standalone middleware users | U4 | Standalone users already construct middleware explicitly; `TypeError` at construction is the existing CORS/raw-route precedent. |
| Docs-site regeneration drift | both | M-U2-2 conditional owner; run docs gate before PR. |

## Rollback

Each leaf is one revertible commit touching only `packages/service` (+ conditional docs page). Revert
restores: oRPC `CORSPlugin` in builder handlers (U2) / string-only `allowAnonymous` (U4). No lock,
version, graph, generated-asset or scaffold change is made, so no publish rollback is needed before
a release cut. Public legacy hosts are not a fallback for anything here.

## Publish and consumer conditions

- No version bump, lock edit or dependency change in either leaf; release owner cuts normally with
  age policy. Both leaves are additive on types (`cors?`, union widening) — JSR fast-check/`doc:lint`
  must pass with the new re-exports.
- Consumer (EIS) adoption waits for: U1 host factories (other lane), U3 per-request headers, E1
  issuer/roles/TTL/reader credential, published fixed family pins, and the S16 synthetic matrix.
  U2/U4 make the native primitives correct; they do not by themselves make any host "safe".
- Independent IMPL-EVAL (different family) and runtime/browser/listener gates remain pending; this
  plan claims no runtime acceptance.

## Plan-gate self-check (generator view, not a verdict)

- Research current (HEAD-bound, hashed) ✔ · Decisions locked with citations ✔ · Open decisions
  swept into MUST RESOLVE/Deferred ✔ · Slices < 30 paths with gates and files ✔ · Risk register ✔ ·
  Gate set from Archetype 4 + SCOPE-service (check/test/lint/fmt/doc:lint/arch/quality/publish
  dry-run/e2e) ✔ · Deferred scope named ✔ · Planned public surface: `RPCHandlerConfig.cors`,
  `AnonymousRequestMatch`, `AnonymousRule`, widened `AuthnOptions.allowAnonymous` — each with JSDoc +
  example above ✔.
