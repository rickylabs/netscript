# Decisions: U2 native CORS response authority and U4 exact anonymous requests

Status: **PLAN, revision 5 — applies the six root-locked fixes from independent PLAN-EVAL
`FAIL_PLAN` `234a77914ec162e0a8b31a5bed7eda3a76c009cb9307b65b5d9d8e2bcb666159` (evaluator session
`ses_e8090d570ffeh6MLTyd5d16ZHM`, [plan-eval.md](plan-eval.md)) to U4 (D-U4-6/D-U4-7/M-U4-2); U2
decisions unchanged. Root-policy-addendum still controls. Not a PASS, not evaluated again yet, not
authorized for implementation — a same independent evaluator recheck and root read are required.**
Revisions 1–4 are retained by root separately; this file supersedes them. Each LOCKED
entry cites the fact (research.md, [root-policy-addendum.md](root-policy-addendum.md)) that makes it
safe to lock. All behavior remains source-derived/UNRUN; root's in-process negative is a measured
counterexample, not a security proof.

## U2 — native CORS response authority

### D-U2-1 (LOCKED, revised ×2) `withCors()` restores the **complete native checkpoint** on the **final** response: all six access-control headers (value or absence) plus `Vary` = union(checkpoint, final), `Origin` at most once

- Why revision 1 was incomplete (root counterexample, verified against source this turn): Hono's
  `cors()` writes its decision on the placeholder **before** `next()`; `set res` re-applies only
  those placeholder headers. A downstream response that already carries access-control headers
  (locked `@durable-streams/server@0.3.9/src/server.ts:446-458` and `:1124` emit `ACAO *`,
  allow-methods, allow-headers, expose-headers; `plugins/streams/services/src/proxy-headers.ts`
  forwards them "verbatim") therefore keeps `ACAO *` under a **hostile** origin (nothing to re-apply)
  and keeps upstream allow/expose headers under an **allowed** origin. Root measured exactly this on
  public `createService` at 1582 (receipt sha256 `8079d153…f2f4ad`, rows `/raw`). Disabling oRPC's
  `CORSPlugin` never touches raw routes, so it cannot be the authority.
- Mechanism (single owner `packages/service/src/middleware/service-cors.ts`, function
  `createServiceCorsMiddleware`): wrap Hono's `cors()` instead of returning it.
  1. Call Hono's middleware with a wrapped `next` that first **snapshots the native checkpoint**:
     the value **or absence (`null`)** of **all six** `access-control-*` response headers
     (`allow-origin`, `allow-credentials`, `expose-headers`, `allow-methods`, `allow-headers`,
     `max-age`) exactly as pinned Hono left them on the placeholder before `next()`, plus the
     placeholder's `Vary` tokens; then runs the real `next()`. The checkpoint is Hono's decision —
     ACAO only for an allowed origin, ACAC whenever `credentials` is configured, ACEH whenever
     `exposeHeaders` is configured (both independent of the origin decision), the three preflight
     headers absent.
  2. If Hono returned a `Response` (its `OPTIONS` short-circuit), return it unchanged — the preflight
     is built from the same decision and nothing downstream ran.
  3. Otherwise, on the final `c.res`, **restore each of the six**: set the checkpoint value, or
     **delete** the header where the checkpoint recorded absence. Set `Vary` to the **union** of the
     checkpoint tokens and the final response's tokens (downstream + Hono's post-`next()` `Origin`
     append), deduplicated case-insensitively, first-seen spelling and order, `*` collapsing
     everything, header removed when empty. `Origin` therefore appears at most once; native policy
     appends it only for origin ≠ `'*'`, and no `Origin` is forced for an explicit wildcard — but
     (root normative interpretation) the union **always preserves a supplied downstream `Origin`
     token**, wildcard included; only a fixture that supplies no `Origin` token proves absence.
     Mutate in place through Hono's finalized-safe `c.header()` (which rewraps immutable-header
     responses such as `Response.redirect`/`fetch` results; `value === undefined` deletes) or one
     explicit rewrap; never reassign `c.res` (the setter would re-apply the stale headers).
- Properties satisfied: origin is resolved **once** (by Hono; the wrapper reads the result, it never
  re-resolves); no second policy engine; no new public option, type or export
  (`createServiceCorsMiddleware` is internal — repo grep shows only `service-builder-impl.ts` uses
  it); standalone `createRPCHandler`/`createOpenAPIHandler`/`createRPCPlugins` are untouched;
  body, status, statusText, cookies and non-CORS headers (e.g. `Stream-Next-Offset`) pass through.
- Dropped from revision 1: the public `RPCHandlerConfig.cors` knob and the `service-rpc.ts`
  `cors: false` call. Under `withCors()` oRPC's reflected headers are now replaced by step 3, so the
  knob is redundant; oRPC's `OPTIONS` interceptor is never reached because Hono answers preflight
  first. Removing the inner plugin for efficiency is deferred (Q-U2-5).
- Corrected from revision 2 (root's appended checkpoint/Vary correction): the checkpoint covers all
  six values **including absence**, not three; `Vary` is the union with the checkpoint, not a
  final-only dedupe (a downstream overwrite must not erase a checkpoint token); conformance oracles
  are the native Hono values (ACAC/ACEH independent of origin), not a stricter "only for allowed
  origin" rule the authority would otherwise have to invent.

### D-U2-2 (LOCKED) Pipeline order unchanged; no new middleware slot

Tracing → CORS (`withCors`, installed immediately) → logger → `use()` → authn → authz → body limit →
projections/raw routes. Because the enforcement lives inside the CORS middleware's post-`next()`
path, it covers `use()` middleware, authn `401/503`, authz `401/403`, body-limit `413`, `notFound`
`404`, `onError` `500` (compose assigns the error response before CORS resumes), raw routes, health,
RPC and OpenAPI alike. `build()` still asserts stored CORS options before installing auth.

### D-U2-3 (LOCKED, revised) Without `withCors()` nothing changes

A builder service that never calls `withCors()` installs no authority: oRPC projections keep oRPC's
default reflecting headers and raw routes keep upstream headers exactly as today. `defineService`
always installs `withCors()`; `createPluginService` does unless `enableCors === false`. Root's
addendum requires honest classification for this case → M-U2-1 resolved as **Fixed** with a
migration sentence that states both the `withCors()` change and the unchanged no-`withCors()` case.
Suppressing oRPC's default without `withCors()` is a separate policy decision (Q-U2-5).

### D-U2-4 (LOCKED, revised) Proving owner is one new real-service conformance test

`packages/service/tests/cors-response-authority_test.ts` (new; supersedes the candidate name
`cors-rpc-policy_test.ts` because raw/upstream headers are now in scope) drives a real
`createService(...).build()` with RPC, REST-routed and throwing procedures, a raw route returning a
**synthetic upstream-shaped** response carrying all six access-control headers + `vary: origin` +
`Stream-Next-Offset` + two cookies (root's fixture shape), an immutable `Response.redirect`, a
streamed body, `withHealth()`, `withAuthn`, `withBodyLimit`, `notFound`/`onError`. Every case asserts
each of the six headers (value or **absence**), the `Vary` token set, body bytes, status, cookies and
non-CORS headers. Oracles are the **native Hono checkpoint values**: with `credentials: true` and
`exposeHeaders: ['X-Trace']`, ACAC `true` and ACEH `X-Trace` are expected on every response and
preflight regardless of origin, ACAO only for the allowed origin; a second no-credentials fixture
expects ACAC/ACEH absent everywhere (including over an upstream `allow-credentials: true`). Required
`Vary` negative: a pre-`withCors()` middleware appends `Accept-Encoding` (checkpoint token), the
handler **overwrites** `Vary` with `Cookie`, Hono appends `Origin` ⇒ all three survive exactly once;
plus `*` collapse and the oRPC `vary: origin` single-token case. Wildcard fixtures (root override):
the existing `origin: '*'` `/raw` fixture supplying `vary: origin, Accept-Encoding` expects both
tokens preserved once; a separate wildcard fixture supplying no `Origin` token expects `Origin`
absent. `tests/cors-policy_test.ts` and
`tests/cors-topology_test.ts` stay as regression owners (unchanged). `tests/handlers_test.ts` is no
longer touched (no standalone change).

### D-U2-5 (LOCKED) Policy errors stay loud; no suppression of policy failures

No try/catch around resolution or validation; `TypeError` at `withCors()` (env) and `build()`
(credentialed wildcard) are unchanged. The only new header mutation is the deterministic
restore-the-checkpoint (value or deletion) plus `Vary` union in D-U2-1.

## U4 — exact anonymous method/path capability

### D-U4-1 (LOCKED) Shape: additive object entries inside `allowAnonymous`

```ts
export interface AnonymousRequestMatch {
  readonly method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
}
export type AnonymousRule = string | AnonymousRequestMatch;
// AuthnOptions.allowAnonymous?: readonly AnonymousRule[]
```

- Strings keep prefix semantics unchanged; objects are exact. Lists may mix. `undefined` and `[]`
  keep the `/health` default (`normalizeGuard` default branch unchanged).
- Vocabulary: builder `ServiceRouteMethod` in uppercase plus `HEAD`; `OPTIONS` and `all` excluded
  (preflight is `withCors()`'s before authn; any other `OPTIONS` stays guarded).
- Same union on the internal `AuthzMiddlewareOptions.allowAnonymous`; builder forwards one list to
  both stages → no builder edit. Re-export both types from `src/auth/mod.ts` and root `mod.ts`
  (`AuthnOptions` is public in both; `doc:lint` requires reachable types).
- No helper constant, no new option (root, M-U4-1).

### D-U4-2 (LOCKED) Exact = exact method ∧ byte-exact path on **both** representations

Anonymous under an object entry iff `c.req.method === entry.method` and `rawPathname(c) ===
entry.path` and `c.req.path === entry.path`. Query/fragment never participate. Any percent-encoding
(`/he%61lth`, `/health%2Flive`), case, trailing/duplicate slash or descendant is **not** anonymous;
`/x/../health` is (the URL parser normalized it to the `/health` route before Hono). Stricter than
the legacy decoded-prefix rule and deliberately asymmetric to deny-side `normalizePath` (which may
only widen denial).

### D-U4-3 (LOCKED, revised per root) `GET` does **not** admit `HEAD`

Each entry matches exactly one method. A service that wants body-less probes anonymous lists `HEAD`
entries explicitly; the documented recipe for the native health trio is six entries (three `GET`,
three `HEAD`). Hono still serves `HEAD /health` through the `GET` handler once the guard admits it.

### D-U4-4 (LOCKED) Validation at guard construction, `TypeError`, before any request

`normalizeGuard` (shared by both middlewares; executed in `build()` → `installAuth`, or directly by
standalone `createAuthnMiddleware`/`createAuthzMiddleware`) throws
`TypeError('[netscript.service.auth] invalid anonymous request: <method> <path>: <reason>')` when
`method` is outside the vocabulary (including lowercase) or `path` is not absolute, contains `%`,
`*`, `:`, `{`, `}`, `?`, `#`, `\`, whitespace or `//`, or ends with `/` (except exactly `/`).
Duplicates allowed. Strings are not newly validated. `assertServiceAuthPolicy` untouched;
`defineService` therefore rejects at `serve()` → `build()` before any listener.

### D-U4-5 (LOCKED) Precedence and failure shapes unchanged

Matched contract policy decides first in both stages (`'none'` bypasses; `'required'`/raw-route
declarations guard even when an exact entry names the same request). Unmatched requests consult the
guard: any anonymous rule ⇒ not guarded; else `protect`. Authn `503`/`401`, authz `401
missing-principal`/`403`/`denyByDefault` shapes unchanged. Arrays copied at normalization.

### D-U4-6 (LOCKED) Proving owners count dispatch, not statuses

`tests/auth/middleware_test.ts` (baseline 326 physical lines), `tests/auth/builder-auth_test.ts`
(295), `tests/auth/define-service-auth_test.ts` (219), plus the root-preauthorized focused
**`tests/auth/health-auth-order_test.ts`** (new), **selected and locked in revision 5** for the
health-order / absent- and late-`withHealth()` / exactly-once lifecycle / auth-atomicity matrix
(D-U4-7). Every affected test file has a hard cap of **≤480** physical lines; the three existing files
keep their planned rows under that cap and the focused file absorbs the new matrix — no golf, no
skipped controls, no weaker oracles, not new F-10 debt. No test source is created in this PLAN turn.
Every negative asserts catch-all handler invocations `=== 0` and authenticator/authorizer call
counts; every positive asserts the handler ran and the authenticator did not.

### D-U4-7 (LOCKED, revision 5 — coordinator projection of native plan)

Root-authorized faithful projection, not a new architecture decision or a successful native final. The SAME native Fable correction timed out at300s (runtime/exit.json: timedOut=true/code1); the complete native revision5 plan nevertheless contains these already root-locked paragraphs. The following blocks are copied VERBATIM from plan.md SHA256 `516901bb12ef088b7b967d628c9d4c0134dad1096c0eaa97bb2bada5983d5058`: native owner5 health/auth/F1 lines209–237; native compatibility/migration lines262–272; native focused health/atomicity/lifecycle proof matrix lines404–431. Original partial decisions and native raw remain in the ignored coordinator-projection packet. Original FAIL_PLAN is unchanged; SAME independent evaluator recheck/root read remain mandatory.

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

## MUST RESOLVE — resolved by root (addendum, 2026-10-27)

- **M-U2-1 → RESOLVED: Unreleased "Fixed" entry** with an explicit migration sentence. Because the
  final solution preserves no-`withCors()` behavior (D-U2-3), the sentence reads: "Under `withCors()`
  every response — RPC, OpenAPI, raw routes, health, errors — now carries exactly the configured CORS
  decision (all six access-control headers, present or absent, as the service's CORS middleware
  decided them; `Vary` keeps every token already present); access-control headers set by handlers,
  proxied upstreams or oRPC's default plugin are replaced (declare
  `exposeHeaders`/`allowHeaders`/`allowMethods` on `withCors()` instead). Services that never call
  `withCors()` are unchanged." Pinned `**Breaking (0.0.8):** CORS` bullet and README
  `## CORS migration (breaking in 0.0.8)` heading stay byte-identical (`cors-topology_test.ts`).
- **M-U2-2 → DISSOLVED:** no public type changes in U2, so no reference regeneration dependency.
  `docs/site/reference/service/index.md` (#cors-origins) remains a **conditional prose owner** if the
  docs parity gate requires the "all responses, including raw routes and projections" statement.
- **M-U4-1 → RESOLVED:** no exported helper constant; README documents three explicit `GET` entries
  plus three explicit `HEAD` entries for the native health trio.

## Deferred (named, not solved here)

- Q-U2-3 Repeated `withCors()` stacking: pre-existing; D-U2-1's `Vary` union incidentally removes
  the duplicate `Origin` symptom but the second resolver call remains. Later: last-wins or `TypeError`.
- Q-U2-4 U3 per-request headers, E1 issuer/roles/TTL/reader credential, browser bootstrap, EIS
  adoption, process supervision — dependencies only.
- Q-U2-5 Removing oRPC `CORSPlugin` from builder-wired handlers (efficiency; and the only way to
  change the no-`withCors()` reflect) requires a knob or internal factory — separate decision.
- Q-U2-6 Non-CORS browser headers emitted by upstreams (`timing-allow-origin`,
  `cross-origin-resource-policy`, `access-control-allow-private-network`) are outside the six and
  pass through; not in scope.
- Q-U4-2 Route-aware native denial for raw catch-alls (#2364) stays with the contract authorizer.
- Q-U4-3 Whether `createPluginService`/CLI reconciler emit exact entries — CLI/plugin lanes.
- U1's twelve plugin-host paths and public factories: untouched, by order.
