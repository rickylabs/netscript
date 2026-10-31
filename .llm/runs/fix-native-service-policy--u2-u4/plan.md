# Plan: native CORS response authority (U2) and exact anonymous requests (U4)

**Status:** PLAN, revision 5 — responds to independent PLAN-EVAL **FAIL_PLAN**
`234a77914ec162e0a8b31a5bed7eda3a76c009cb9307b65b5d9d8e2bcb666159` (Meta evaluator session
`ses_e8090d570ffeh6MLTyd5d16ZHM`, [plan-eval.md](plan-eval.md)) by applying its six root-locked fixes
to U4 only; U2 unchanged from revision 4. Root-policy-addendum (through its failed-auth-installation
acceptance section) still controls. **Not a PASS; implementation not authorized**; a same independent
evaluator recheck and root read are still required. All gates prospective/UNRUN; root's in-process
diagnostics are measured baselines, not listener/browser/security qualification. Baseline
`1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d`,
`@netscript/service` 0.0.8, Hono 4.13.13, `@orpc/server` 1.15.5. Evidence:
[research.md](research.md); locks: [decisions.md](decisions.md); root dispositions:
[root-policy-addendum.md](root-policy-addendum.md); hashes: [source-receipt.json](source-receipt.json).

## Next action (after root read + separate-family PLAN-EVAL)

Implement **U2** (one source file + one new test + README + CHANGELOG) then **U4** (three source files
incl. the builder health-order owner + two re-exports + three tests + README + CHANGELOG), as two
separate commits/PRs on this branch, each
proven by the package-scoped gates below before the merge-readiness suite. No release/version/lock
change in either leaf. U1/U3/E1/EIS adoption stay deferred.

## Decision summary

| Leaf | Decision | Measured / derived evidence | Footprint |
| --- | --- | --- | --- |
| U2 | `withCors()` becomes the complete response authority: before `next()` it snapshots all six `access-control-*` header values **including absence** exactly as Hono wrote them (origin resolved once) plus the checkpoint `Vary`; after `next()` it restores that six-value checkpoint on the final response (set value / delete absence) and sets `Vary` to the union of checkpoint and final tokens, deduplicated case-insensitively (`*` wins). No new option/type/export; standalone handler factories untouched; no-`withCors()` services unchanged. | **Measured (root, in-process, 1582):** hostile `/raw` keeps upstream `ACAO *` + allow/expose headers; allowed `/raw` keeps upstream allow/expose; `/health` correct. **Source:** Hono `set res` re-applies only placeholder headers; durable-streams server emits `ACAO *` at `:446`/`:1124`; streams proxy forwards CORS headers verbatim; oRPC `CORSPlugin` reflects any origin and emits `ACAO ""` without Origin. | 4 paths (+1 conditional) |
| U4 | `allowAnonymous` accepts `string \| { method, path }`; object = exact method ∧ byte-exact raw and decoded path; `GET` ≠ `HEAD`; legacy strings/default/`[]` unchanged; `TypeError` at guard construction; both stages share the rule. | `normalizeGuard`/`matchesPrefix` are method-blind decoded-prefix checks consulted by **both** stages before the authorizer; `withHealth()` registers only `GET` on 3 exact paths — **eagerly, before `build()` installs authn/authz**, so health `GET`/`HEAD` bypass the auth stage entirely (root-measured at 1582: `200`/authn `0` under reject-all authn with `allowAnonymous: ['/other']`, both CORS modes); a raw `route('all','/*')` receives `POST /health/anything` anonymously. `%2F` stays encoded, so `/health%2Fx` is *not* under the prefix (research §3.1 corrected). Health registration moves into `build()` after authn/authz, before deferred routes (root-authorized owner; `installHealth` iff `healthConfigured && !healthInstalled`, mark after success); `installAuth` prepares both middlewares before any `app.use` and marks after success (root-locked atomicity). | 10 paths + 1 metadata + focused test |

## U2 — public semantics (no API change; documented behavior of `withCors()`)

Under `withCors(options)` every non-preflight response leaving the service carries **exactly the
six values pinned Hono `cors()` wrote at the native checkpoint** (cors/index.ts, before `next()`),
no more and no less — the authority restores them, it does not define a second policy:

- `Access-Control-Allow-Origin`: the origin Hono resolved **once** for this request (exact origin, or
  `*` when configured), else **absent** — never `""`, never a reflected hostile/lookalike/`null`
  origin, never an upstream wildcard.
- `Access-Control-Allow-Credentials: true` whenever `options.credentials` is set — native Hono emits
  it **independently of whether an origin was allowed** (the credentialed-wildcard guard only
  prevents a resolver from yielding `*`); absent otherwise.
- `Access-Control-Expose-Headers`: exactly `options.exposeHeaders` whenever configured, **independent
  of the origin decision** (native); absent otherwise — upstream/handler values are replaced, never
  merged.
- `Access-Control-Allow-Methods`, `-Allow-Headers`, `-Max-Age`: **absent** (Hono writes them only on
  its `OPTIONS` short-circuit, so the non-preflight checkpoint records their absence).
- `Vary`: the **union** of the checkpoint tokens (placeholder `Vary` before `next()`) and the final
  tokens (downstream + Hono's post-`next()` `Origin` append), deduplicated case-insensitively,
  first-seen spelling and order, `*` collapsing everything. `Origin` therefore appears **at most
  once, and only when native policy put it there** (origin ≠ `'*'`); an explicit `'*'` policy gets
  no forced `Origin`. A downstream handler overwriting `Vary` cannot drop a checkpoint token.
- Body bytes, status, statusText, cookies (all `Set-Cookie` values, in order) and every non-CORS
  header (`Stream-Next-Offset`, `content-type`, `etag`, …) unchanged. Immutable-header responses
  (`Response.redirect`, `fetch` results) are handled.

`OPTIONS` requests are answered by Hono before authn (unchanged). Without `withCors()` nothing is
emitted or stripped by the service (unchanged).

```ts
// packages/service/src/middleware/service-cors.ts — shape, not final code
/**
 * Wrap Hono's `cors()` so the service's decision is the only CORS visible on the wire.
 * Hono resolves the origin once and writes its headers on the placeholder; downstream
 * handlers, proxied upstreams and oRPC's default plugin may add their own. The checkpoint
 * taken before `next()` records all six access-control header values, absence included,
 * plus the placeholder `Vary`. After `next()` the final response is restored to that
 * checkpoint (set each value, delete each absence) and `Vary` becomes the union of
 * checkpoint and final tokens. Preflight responses are returned as Hono built them.
 * Services without `withCors()` are untouched.
 */
const ACCESS_CONTROL_RESPONSE_HEADERS = [
  'access-control-allow-origin', 'access-control-allow-credentials', 'access-control-expose-headers',
  'access-control-allow-methods', 'access-control-allow-headers', 'access-control-max-age',
] as const;

export function createServiceCorsMiddleware(options: ResolvedCorsOptions): ServiceMiddleware {
  const upstream = cors(guardCredentialedResolver(options)); // existing wildcard guard
  return async (c, next) => {
    let checkpoint: CorsCheckpoint | undefined; // { headers: Record<name, string | null>; vary: string[] }
    const preflight = await upstream(c, async () => {
      checkpoint = snapshotCheckpoint(c.res.headers); // six values incl. null, + Vary tokens
      await next();
    });
    if (preflight) return preflight;
    restoreCheckpoint(c, checkpoint); // for each of six: set value | delete; Vary = union(checkpoint, final)
  };
}
```

Implementation constraints: never `c.res = …` inside `restoreCheckpoint` (the setter re-applies stale
headers); mutate in place (`c.header(name, undefined)` deletes and rewraps immutable headers; after
the first call the response is mutable, so direct `Headers` ops are fine); at most one structural
rewrap per response; no origin re-resolution; no header value is invented — only checkpoint values
are written.

## U4 — public API

```ts
// packages/service/src/auth/options.ts
/**
 * One anonymous request: an uppercase method and a byte-exact absolute path. Unlike string
 * prefixes an entry admits nothing else: no other method (a `GET` entry does not admit `HEAD`),
 * no descendants, no percent-encoded spelling, no case or slash variants. The path is compared
 * both as sent on the wire and as Hono routes it; query strings never participate. `OPTIONS` is
 * not accepted: CORS preflight is answered by `withCors()` before authentication and any other
 * `OPTIONS` request stays guarded.
 *
 * @example
 * ```ts
 * import type { AnonymousRequestMatch } from '@netscript/service/auth';
 * // Native health trio, body-less probes included: six explicit entries.
 * const health: readonly AnonymousRequestMatch[] = [
 *   { method: 'GET', path: '/health' },
 *   { method: 'GET', path: '/health/live' },
 *   { method: 'GET', path: '/health/ready' },
 *   { method: 'HEAD', path: '/health' },
 *   { method: 'HEAD', path: '/health/live' },
 *   { method: 'HEAD', path: '/health/ready' },
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
   * Requests that skip authentication and authorization. Strings are path prefixes (existing
   * behavior: `'/health'` admits `/health/anything` for every method). Object entries are exact
   * method/path requests. Omitted or empty keeps the native `/health` prefix default; a nonempty
   * list replaces it entirely, so an exact-only list must spell every anonymous probe. Invalid
   * object entries throw a `TypeError` when the guard is built, before any request or listener.
   * A matched contract procedure's own access declaration always takes precedence.
   *
   * @example
   * ```ts
   * import { createService } from '@netscript/service';
   * import type { AuthenticatorPort } from '@netscript/service/auth';
   * declare const authenticator: AuthenticatorPort;
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
`isGuardedRequest(c, guard)` evaluating `c.req.method`, `rawPathname(c)` and `c.req.path`; both
`requiresAuthentication` and the authz bypass call it. Error text:
`[netscript.service.auth] invalid anonymous request: <method> <path>: <reason>`.

## Ordered implementation leaves

### Leaf U2 — native CORS response authority (4 paths + 1 conditional)

1. `packages/service/src/middleware/service-cors.ts` — wrapper + six-value checkpoint + restore +
   Vary union + module/function JSDoc (D-U2-1).
2. `packages/service/tests/cors-response-authority_test.ts` — **new** conformance matrix (below).
3. `packages/service/README.md` — inside `## CORS migration (breaking in 0.0.8)` (heading and the two
   pinned snippets byte-identical) add one paragraph: under `withCors()` the service decision is the
   only CORS on the wire for every response including raw routes, proxied upstreams and RPC/OpenAPI
   projections; declare `exposeHeaders`/`allowHeaders`/`allowMethods` on `withCors()`; services
   without `withCors()` are unchanged.
4. `packages/service/CHANGELOG.md` — Unreleased **Fixed** entry with the M-U2-1 migration sentence.
5. *Conditional* `docs/site/reference/service/index.md` (#cors-origins prose) only if the docs parity
   gate requires the "all responses" statement.

Inspect-only (no edit): `service-builder-impl.ts`, `service-rpc.ts`, `primitives/handlers.ts`,
`define-service.ts`, `create-plugin-service.ts`, `plugins/streams/services/src/{main,proxy,proxy-headers}.ts`,
`tests/handlers_test.ts`, `tests/cors-policy_test.ts`, `tests/cors-topology_test.ts`.

### Leaf U4 — exact anonymous requests (10 paths)

**Root-measured precondition (revision 4):** `withHealth()` registers its three `GET` handlers
**eagerly** (`service-builder-impl.ts:422-431`) while `build()` installs authn/authz later
(`:502-532`). Hono routes `HEAD` to `GET`, so health `GET`/`HEAD` never reach the auth stage: with a
reject-all authenticator, `protect: ['/']`, `allowAnonymous: ['/other']`, both no-CORS and prior-CORS
modes measured `GET|HEAD /health`, `GET /health/live`, `HEAD /health/ready` ⇒ `200`, authn `0`, raw
`0`; `POST /health` ⇒ `401`, authn `1`; `GET|POST /other` ⇒ `200`, raw `1`; `POST /guarded` ⇒ `401`,
authn `1` (receipt sha256 `2e72751b…decdd6d5c3`, `--check --cached-only --frozen`, deny-net/run/write,
no listener/KV/provider; a separate earlier setup failure is not a behavior result). Exact entries
alone cannot therefore guard health; the builder needs a behavioral owner.

1. `packages/service/src/auth/options.ts` — `AnonymousRequestMatch`, `AnonymousRule`, widened
   `AuthnOptions.allowAnonymous`, JSDoc.
2. `packages/service/src/auth/auth-middleware.ts` — union on `AuthzMiddlewareOptions`, validation in
   `normalizeGuard`, `isGuardedRequest`, both call sites.
3. `packages/service/src/auth/mod.ts` — re-export the two types.
4. `packages/service/mod.ts` — re-export the two types.
5. **`packages/service/src/builder/service-builder-impl.ts`** (root-authorized behavioral owner) —
   `withHealth()` keeps its one-time option/check accumulation (`healthConfigured` guard,
   `checks`/`includeDetails` capture) but **stops calling `this.app.get(...)`**. A new private
   `installHealth()` has the locked predicate **iff `healthConfigured && !healthInstalled`**: it
   registers the same three `GET` handlers with the same
   `createHealthHandler({ checks: this.healthChecks, version, includeDetails })`,
   `createLivenessHandler()`, `createReadinessHandler(this.readinessChecks)` arguments, and sets
   `healthInstalled = true` **only after** those registrations succeed (prepare-then-mark — explicitly
   **not** the mark-first shape of today's `installAuth`). A service that never called `withHealth()`
   registers **no** health route (no silent opt-in). `build()` calls it **after** `installAuth()` and
   `installBodyLimit()` and **before** `installDeferredRoutes()`, so in the normal
   configure-before-build order health still precedes OpenAPI/docs/RPC/raw routes. A **late**
   `withHealth()` after an initial `build()` is honored on the **next** `build()` (before the first
   request to that app, within Hono's existing route-mutability constraints); that is a distinct
   proof and makes **no** promise that routes deferred by an earlier `build()` are reordered behind
   health. No public option, no private consumer factory, no all-builder freeze, no other ordering
   change; `withHealthCheck()`/readiness arrays keep late-registration semantics because the handler
   receives the live arrays.
   **Auth atomicity (root-locked acceptance, same owner):** `installAuth()` constructs **both**
   `createAuthnMiddleware(...)` and `createAuthzMiddleware(...)` (where `normalizeGuard` validation
   throws) **before any `app.use`**, then registers them, then sets `authInstalled = true` only after
   success. An invalid exact rule therefore rejects the first `build()`, every repeated `build()` and
   any subsequent `serve()` with the `TypeError` surfaced — zero authenticator/authorizer/health/raw
   handler calls, zero listeners; valid repeated `build()`/`serve()` idempotence is retained. The
   `TypeError` is never swallowed and there is no unguarded fallback.
   **F-1 accounting:** this `installAuth` reorder is absorbed inside the existing root-accepted
   builder debt delta (629 baseline + ≤32 ⇒ ≤661 physical lines, same count convention) as part of
   the same authorized behavioral change, offset by the eager `withHealth()` registration lines it
   removes; no separate growth allowance, no other file growth, no registry edit, no PASS claim.
6. `packages/service/tests/auth/middleware_test.ts` — unit matrix (baseline **326** physical lines;
   hard cap ≤480).
7. `packages/service/tests/auth/builder-auth_test.ts` — real builder with counting catch-all; keeps
   its existing exact-list rows (baseline **295**; ≤480).
8. `packages/service/tests/auth/define-service-auth_test.ts` — preset passthrough + pre-listener
   rejection (baseline **219**; ≤480).
8a. **`packages/service/tests/auth/health-auth-order_test.ts`** (new; root-preauthorized focused
   owner, **selected and locked now** — the condition is resolved before implementation) — the
   health-order / auth-atomicity / lifecycle matrix below (RED baseline → GREEN, absent-`withHealth()`,
   late-`withHealth()`, invalid-rule first/repeated `build()` + `serve()`, valid idempotence),
   hard **≤480** physical lines, no golf, no skipped controls, no weaker oracles, not new F-10 debt.
   Placing the matrix here keeps all four auth test files ≤480 without trimming any existing
   control; no test source is created in this PLAN turn.
9. `packages/service/README.md` — under `## Auth policy migration (breaking in 0.0.8)`: "Exact
   anonymous requests" recipe (six entries, `protect: ['/']`, catch-all raw route), the sentence that
   `[]`/omitted keep the `/health` prefix default, and the compatibility sentence below.
10. `packages/service/CHANGELOG.md` — Unreleased **Added** (exact anonymous entries) **and Changed**
    (health registration order, with the compatibility impact and migration below); pinned
    `**Breaking (0.0.8):**` strings byte-identical.

Footprint note: U4 = these 10 native owners + 1 existing **metadata** owner
(`.llm/harness/debt/arch-debt.md` F-1 subbullet, already appended by root — not edited by this plan)
+ the focused test 8a. Still < 30 paths.

**Compatibility (M-U4-2 — resolved by root, Unreleased Added + Changed):** omitted/`[]`/`['/health']`
lists keep health public (prefix, method-blind) — unchanged on the wire. For a **custom non-empty
legacy list that excludes `/health`**: **BEFORE**, health `GET`/`HEAD` returned `200` by registration
order despite the list; **AFTER**, those requests return `401` under a rejecting authenticator when
excluded — as the documented policy already states ("a custom nonempty list replaces the native
default; the assertion does not add `/health`"). **Migration:** add `'/health'` to retain the legacy
prefix capability, or use the three `GET` plus three explicit `HEAD` exact entries when that is the
intended capability. This is a security-policy fix **with** compatibility impact and must appear in
the release breaking-impact summary; not every builder-visible legacy result is unchanged, and the
CHANGELOG **Changed** entry says so. Pinned 0.0.8 Breaking strings stay byte-for-byte.

Inspect-only: `service-auth-policy.ts`, contract files, CLI reconciler, plugin factory.

## Proving gates (prospective; exact commands; UNRUN here)

```powershell
# 1. Types and surface
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts,tsx
deno task doc:lint                      # U4 types reachable from mod.ts and ./auth
# 2. Owning tests (per leaf, then whole package)
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/service/tests/cors-response-authority_test.ts packages/service/tests/cors-policy_test.ts packages/service/tests/cors-topology_test.ts packages/service/tests/handlers_test.ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/service/tests/auth/   # includes health-auth-order_test.ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/service/tests/
# 3. Hygiene
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts,tsx
deno task arch:check
deno task quality:scan
deno task publish:dry-run
# 4. Consumers (streams proxy under withCors; plugin service auth; aspire helper CORS) — exact existing owners per root addendum
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all plugins/streams/services/src/proxy_test.ts plugins/streams/services/src/main_test.ts plugins/streams/tests/service/proxy-headers_test.ts packages/plugin/tests/service/ packages/cli/src/kernel/templates/aspire/helpers/tests/workspace-cors_test.ts
# 5. Merge readiness only (expensive; evaluator/merge pass)
deno task e2e:cli
```

Durable receipts via `.llm/tools/gates/run-gate.ts` where allowlisted; `rtk proxy` output is
exploratory only.

### U2 conformance matrix (`tests/cors-response-authority_test.ts`)

Fixture: `createService(router, { name: 'cors-authority' })` with `os.router` procedures `ping`
(RPC `POST /api/rpc/ping`), `status` (`route({ method: 'GET', path: '/status' })` → `GET /api/status`),
`boom` (throws → `onError` 500); raw routes: `GET /raw` returning a **synthetic upstream-shaped**
`Response` with `access-control-allow-origin: *`, `access-control-allow-methods: GET, POST`,
`access-control-allow-headers: authorization, content-type`, `access-control-expose-headers:
Stream-Next-Offset`, `access-control-max-age: 600`, `access-control-allow-credentials: true`,
`vary: origin, Accept-Encoding`, `Stream-Next-Offset: 42`, `content-type: text/event-stream`, two
`Set-Cookie` values, streamed body; `GET /redirect` returning `Response.redirect(…, 302)` (immutable
headers); `GET /cookie` via `c.header('Set-Cookie', …)` ×2; `withHealth()`; `withAuthn` (static
credential, `protect: ['/api']`); a denying authorizer path; `withBodyLimit({ maxBytes: 64 })`.
CORS: `withCors({ origin: [A], credentials: true, allowMethods: ['GET','POST'], allowHeaders:
['Authorization','Content-Type'], exposeHeaders: ['X-Trace'], maxAge: 600 })`. Origins: `A`, hostile
`H`, lookalike `A.attacker.example`, literal `null`, absent.

Oracles are **native Hono checkpoint values**, not a separate policy. With the fixture configuration
(`credentials: true`, `exposeHeaders: ['X-Trace']`) pinned Hono writes ACAC and ACEH **whenever
configured, independent of the origin decision**, and ACAO only for an allowed origin.

For every (response ∈ {RPC success, REST success, `/raw`, `/redirect`, `/cookie`, `/health`, 404,
500 via `boom`, 401 missing credential, 403 deny, 413 body limit}) × (origin ∈ {`A`, `H`, lookalike,
`null`, absent}) assert **all six** headers against the checkpoint: `access-control-allow-origin`
= `A` for `A`, **absent** for `H`/lookalike/`null`/absent (never `""`, never `*`);
`access-control-allow-credentials` = `true` for **every** origin case (native: configured
credentials); `access-control-expose-headers` = `X-Trace` for **every** origin case (native:
configured list; never `Stream-Next-Offset`); `-allow-methods`/`-allow-headers`/`-max-age` **absent**
on every non-preflight response (also when the upstream fixture supplied them). A second fixture
without `credentials`/`exposeHeaders` asserts ACAC and ACEH **absent** on every path and origin,
including `/raw` whose upstream fixture carries `access-control-allow-credentials: true`. `Vary`:
exactly one token case-insensitively equal to `origin` on every response (Hono appends it; policy
origin ≠ `'*'`), `Accept-Encoding` kept on `/raw`, no `*` unless the handler sent it;
`content-type`/`Stream-Next-Offset`/`etag` preserved, both cookies present and ordered, body bytes
identical (streamed body read to completion), status/statusText unchanged. `HEAD /raw`: same
headers, empty body. Preflight `OPTIONS` on RPC, REST, `/raw`, `/health`: `204`, empty body,
`GET,POST` / `Authorization,Content-Type` / `600`, ACAC `true`, ACEH `X-Trace`, `Vary: Origin`
(+ `Access-Control-Request-Headers` only when Hono reflected request headers), authenticator calls
`0`; hostile preflight: ACAO **absent**, ACAC/ACEH still present (native), still `204`. No-Origin
request: ACAO absent; ACAC/ACEH per configuration; preflight-only headers absent. Resolver-once:
function origin with a counter ⇒ `calls === 1` per request on RPC, REST and `/raw`. Env snapshot:
`NETSCRIPT_CORS_ORIGINS=A` at build, env changed to `H` afterwards ⇒ `H` gets no ACAO on `/raw` and
RPC. Async credentialed resolver returning `'*'` ⇒ ACAO absent on RPC and `/raw` (ACAC present,
native). `origin: '*'` configuration (streams `main.ts` shape, no credentials): `ACAO *` on every
response, upstream allow/max-age still absent. **Wildcard `Vary` (root normative override):** Hono
adds no `Origin` token for `'*'`, but the union **preserves any supplied token** — the existing
wildcard `/raw` fixture sends `vary: origin, Accept-Encoding`, so its oracle is `Origin` (supplied,
once) + `Accept-Encoding`, nothing forced; a **separate wildcard fixture whose upstream sends no
`Origin` token** proves actual `Origin` absence. "No forced Origin" never means deleting an existing
token.

**Vary union controls:** (a) checkpoint token — a middleware installed before `withCors()` appends
`Vary: Accept-Encoding` to the placeholder; the handler **overwrites** `Vary` with `Cookie` via
`c.header('Vary', 'Cookie')`; Hono appends `Origin` ⇒ final `Vary` contains `Accept-Encoding`,
`Cookie` and `Origin`, each exactly once, nothing else. (b) Same with a handler returning a
`Response` whose `Vary: Cookie` — assert the checkpoint token and `Origin` survive once and document
in the test that Hono's own `set res` (placeholder wins) decides whether the downstream token
survives; the authority must not drop a token that reached the final response. (c) Handler sends
`Vary: *` ⇒ final `Vary: *` only. (d) oRPC success with `vary: origin` ⇒ single `origin`/`Origin`
token. Standalone control: `createRPCHandler(router).handle()` with `Origin: H` still reflects
(unchanged; documents the boundary).

**Negative controls (RED on HEAD):** measured by root — hostile `/raw` ⇒ `ACAO *`, allowed `/raw`
⇒ upstream allow/expose headers present; derived — hostile/lookalike RPC success ⇒ reflected ACAO,
no-Origin RPC ⇒ `ACAO ""`, `Vary: origin, Origin` duplicate, upstream `allow-credentials: true`
surviving under the no-credentials fixture. Implementation must show red→green.

### U4 matrix

`tests/auth/middleware_test.ts` (Hono + middlewares; counters on authenticator, authorizer, handlers):

- Validation: each of `'get'`, `'OPTIONS'`, `'ALL'`, `'health'`, `'/health/'`, `'//health'`,
  `'/he%61lth'`, `'/health*'`, `'/health?x'`, `'/health#f'`, `'/health/{id}'`, `'/health :x'`,
  `'/health\\x'`, `''` ⇒ `TypeError` from `createAuthnMiddleware` **and** `createAuthzMiddleware`;
  `'/'` accepted; duplicates accepted.
- Legacy controls unchanged: omitted, `[]`, `['/health']`, `['/health/']` — `POST /health/anything`
  anonymous (prefix), authenticator `0`; `DELETE /health%2Fx` ⇒ **not** under the prefix (encoded
  slash) ⇒ guarded 401, catch-all `0`.
- Exact list `[{GET,'/health'}]`, `protect: ['/']`, routes `GET /health` + `all /*` counting handler:
  `GET /health` ⇒ 200, catch-all `0`, authenticator `0`; `GET /health?x=1` ⇒ 200;
  **`HEAD /health` ⇒ 401**, authenticator `1`, handler `0`; `POST|PUT|PATCH|DELETE /health` ⇒ 401,
  catch-all `0`, authenticator `1` each; `OPTIONS /health` (no CORS) ⇒ 401, catch-all `0`;
  `GET /health/live`, `/health/x`, `/healthz`, `/health/`, `//health`, `/HEALTH`, `/he%61lth`,
  `/health%2Fx`, `/health%2F..%2Fx` ⇒ 401, catch-all `0`, authenticator `1`; `/x/../health` ⇒ 200.
- `[{HEAD,'/health'}]` ⇒ `HEAD /health` 200 empty body, authenticator `0`; `GET /health` ⇒ 401.
- Six-entry recipe ⇒ `GET`+`HEAD` on all three paths 200/authenticator `0`; every other method 401.
- Mixed `['/api/docs', {GET,'/health'}]`: `/api/docs/anything` anonymous (prefix); `POST /health`
  guarded.
- Authz stage: principal preset, exact `GET /health` ⇒ authorizer `0`; `POST /health` ⇒ authorizer
  `1`, deny ⇒ 403; authorizer throw + `denyByDefault` ⇒ 403 `authz.error`; without `denyByDefault`
  current pass-through preserved.
- Precedence: resolver matched `'none'` on `/api/public` ⇒ bypass both with an exact list present;
  resolver matched `'required'` for `{GET,'/health'}` ⇒ 401 (declaration wins).
- Authenticator throw on guarded `POST /health` ⇒ 503 redacted.

`tests/auth/builder-auth_test.ts` (real `createService`): `withAuthn({ authenticator, protect: ['/'],
allowAnonymous: six entries }).withAuthz({ authorizer }).withHealth().route('all','/*',counter).withRPC().build()`
— `GET`/`HEAD` ×3 ⇒ 200/authenticator `0`; `POST /health/ready/x` ⇒ 401, catch-all `0`; RPC
`POST /api/rpc/...` guarded as before; with `withCors({ origin: [A] })` an `OPTIONS /health`
preflight ⇒ 204 and authenticator `0`; invalid entry ⇒ `build()` throws `TypeError` **before any
handler executes and before any listener** (no authenticator/authorizer/catch-all/health call; the
"before any route is installed" oracle is withdrawn because `withHealth()` registers eagerly today).
Existing "health public under guarded api prefix" test unchanged. The health-order, lifecycle and
atomicity rows live in owner 8a, not here (keeps this file ≤480).

**Health-order / atomicity / lifecycle matrix — `tests/auth/health-auth-order_test.ts` (owner 8a,
real `createService`, ≤480 lines, root-measured baseline):** reject-all authenticator,
`protect: ['/']`, `allowAnonymous: ['/other']`, `.withHealth().route('all','/*',counter)`, with and
without prior `withCors()`. **RED on HEAD (measured):** `GET|HEAD /health`, `GET /health/live`,
`HEAD /health/ready` ⇒ `200`, authn `0`, catch-all `0`. **GREEN (intended):** the same four ⇒ `401`,
authn `1` each, authorizer `0` (authn short-circuits), catch-all `0`, health handler `0`;
`POST /health` ⇒ `401`/authn `1`/catch-all `0`; `GET|POST /other` ⇒ `200`/authn `0`/catch-all `1`;
`POST /guarded` ⇒ `401`/authn `1`/catch-all `0` (unchanged rows). Preservation rows: omitted, `[]`,
`['/health']` ⇒ health `GET`/`HEAD` ×3 `200`/authn `0`; `checks`/`includeDetails`/readiness
semantics identical (same handler factories, same argument arrays); `withHealthCheck()` after
`withHealth()` still reported; configure-before-build health still precedes the deferred catch-all
(`GET /health` with the default list ⇒ health handler `1`, catch-all `0`).
**Absent-`withHealth()` row:** service with `protect: ['/']`, default list, catch-all counter and **no**
`withHealth()` ⇒ `GET /health` reaches **no** health handler (health handler `0`; the request falls
to the catch-all/404 per the fixture and authn per policy) — no silent opt-in.
**Late-`withHealth()` rows:** `build()` → `withHealth()` → `build()` ⇒ health registered exactly once
on the second `build()`, before the first request to that app (`GET /health` ⇒ health handler `1`,
one route match); a further `build()` adds nothing. No assertion is made about routes deferred by the
first `build()` being reordered behind health (distinct proof, no invented precedence).
**Exactly-once lifecycle rows:** `withHealth()` twice ⇒ options accumulated once; `build()` twice and
`serve()` after `build()` ⇒ health registered once (one `GET /health` match, no duplicate-route
behavior), authn installed once, valid repeated `build()`/`serve()` idempotent.
**Auth atomicity rows (root-locked):** an invalid exact rule ⇒ **first `build()` rejects**
(`TypeError`), **repeated `build()` rejects** again (flag never set), **subsequent `serve()`
rejects** — each with authenticator `0`, authorizer `0`, health handler `0`, raw/catch-all `0`,
listeners `0`; `authInstalled` stays false; existing contract-policy/authz behavior for a valid
configuration unchanged.

`tests/auth/define-service-auth_test.ts`: guarded policy with the exact list ⇒ `GET /health` 200,
`HEAD /health` 401 (GET-only list) and `POST /health` 401 on the live `port: 0` listener; invalid
entry ⇒ `assertRejects(TypeError)` with no port opened and no handler executed. (The `HEAD /health`
401 row is reachable only with owner 5 — today eager registration returns 200.)

**Negative controls (RED on HEAD):** `POST /health/anything` with an exact-only list reaching the
catch-all (prefix admits it today); object entry is a compile error today; **health `GET`/`HEAD`
`200`/authn `0` under a custom list excluding `/health`** (root-measured, both CORS modes).

## Risks and mitigations

| Risk | Leaf | Mitigation |
| --- | --- | --- |
| A proxied upstream's `expose-headers` were relied on by browsers and the service never declared them | U2 | Service-owned by design; `plugins/streams/services/src/main.ts:115` already declares the full list. README/CHANGELOG sentence; consumer gate 4. |
| Handler-set access-control headers (e.g. a `use()` middleware adding CORS) are now replaced by the checkpoint, including deletion where Hono wrote nothing | U2 | Intended; documented as `withCors()` being the only authority. |
| Reading `c.res` in the checkpoint creates a placeholder → downstream `Response` is rewrapped | U2 | Hono already rewraps in allowed/`'*'` cases; body stream identity preserved; test asserts bytes, cookies, status. |
| `c.res` reassignment inside enforcement would re-apply stale headers | U2 | Constraint stated; test with upstream `ACAO *` + hostile origin catches it. |
| Downstream `Vary` token lost when a handler **returns** a `Response` (Hono `set res`: placeholder wins) | U2 | Not caused by the authority; the union keeps every token that reaches the final response and never drops the checkpoint's. Documented in the Vary union control (b). |
| `Vary` assertions brittle to casing | U2 | Compare token sets case-insensitively; `*` collapses. |
| Type widening breaks a consumer narrowing `allowAnonymous` to `string[]` | U4 | Repo grep: only string-array producers; `readonly (string \| …)[]` accepts them. CHANGELOG note. |
| Exact list drops `HEAD` probes or `/health/live|ready` silently | U4 | Six-entry recipe in README; define-service test covers GET-only ⇒ HEAD 401 explicitly. |
| Health-order change guards health for existing custom lists that exclude `/health` (orchestrator probes start failing with 401) | U4 | Documented policy already says so; root-resolved M-U4-2: CHANGELOG **Changed** entry with BEFORE 200 → AFTER 401 and the add-`'/health'`/six-entries migration, README sentence, release breaking-impact summary; default/`[]`/`['/health']` unchanged. |
| Moving health registration into `build()` changes handler lookup order, silently opts every service into health, drops late `withHealth()`, or double-registers on repeated `build()`/`serve()` | U4 | Locked predicate `healthConfigured && !healthInstalled`, mark after success; absent-/late-`withHealth()` and exactly-once rows in owner 8a; configure-before-build health still precedes deferred routes. |
| `installAuth` marks installed before validation; invalid rule rejects first `build()` but a later `build()`/`serve()` runs unguarded | U4 | Root-locked atomicity: construct both middlewares before any `app.use`, mark after success; first/repeated `build()` + `serve()` rejection rows with zero calls/listeners in owner 8a. |
| Builder file growth exceeds the accepted F-1 delta | U4 | Hard cap 661 physical lines (629 + ≤32) covers health state + `installHealth` + the `installAuth` reorder, offset by removed eager registration; no separate allowance. |
| Encoded spellings now 401 instead of anonymous | U4 | Intended (stricter); legacy strings untouched. |
| Validation moves failure to `build()`/construction | U4 | Existing `TypeError` precedent (CORS, raw routes). |
| Docs parity drift | both | Conditional docs owner; run docs gate before PR. |

## Rollback

Each leaf is one revertible commit touching only `packages/service` (+ conditional docs page). U2
revert restores Hono-only placeholder behavior (upstream/oRPC headers survive again); U4 revert
restores string-only `allowAnonymous`. No lock, version, graph, generated-asset or scaffold change,
so no publish rollback precedes a release cut. Public legacy hosts are not a fallback.

## Publish and consumer conditions

- No version bump, lock edit or dependency change. U4 is additive on types; `doc:lint`/JSR
  fast-check must pass with the new re-exports. U2 has no type change.
- Consumer adoption waits for U1 host factories (other lane), U3 per-request headers, E1
  issuer/roles/TTL/reader credential, published fixed-family pins and the S16 synthetic matrix.
  U2/U4 make the native primitives correct; they do not by themselves make any host "safe".
- Independent IMPL-EVAL (different family) and runtime/browser/listener gates remain pending; this
  plan claims no runtime acceptance and root's in-process negative is not a security proof.

## Plan-gate self-check (generator view, not a verdict)

Research current, HEAD-bound and hashed ✔ · Root counterexample incorporated and source-verified ✔ ·
Root's complete-checkpoint/Vary correction applied (six values incl. absence, Vary union, native
ACAC/ACEH oracles) ✔ · Root's health-order measurement incorporated: builder owner added (10 paths),
RED baseline/GREEN intent with counts, compatibility stated honestly ✔ · Decisions locked with
citations ✔ · M-U2-1/M-U4-1 resolved per root, M-U2-2 dissolved, **M-U4-2 resolved by root**
(Unreleased Added + Changed, 200→401 impact, migration, breaking-impact summary) ✔ · **FAIL_PLAN
`234a7791…666159` six fixes applied** (installHealth predicate + late/absent rows, atomicity fold-in,
F-1 accounting, test budgets + focused owner locked, stale M-U4-2 markers) — same independent
evaluator recheck and root read still required ✔ · Slices < 30
paths with gates and owners ✔ · Risk register ✔ · Archetype 4 + SCOPE-service gate set ✔ · Deferred
scope named (Q-U2-3..6, Q-U4-2..3, U1/U3/E1) ✔ · Public surface: U2 none; U4 `AnonymousRequestMatch`,
`AnonymousRule`, widened `AuthnOptions.allowAnonymous` with JSDoc + examples ✔.
