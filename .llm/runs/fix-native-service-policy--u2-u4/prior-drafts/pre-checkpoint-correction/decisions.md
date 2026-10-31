# Decisions: U2 native CORS response authority and U4 exact anonymous requests

Status: **PLAN, revision 2 (root-policy-addendum applied) — not evaluated, not authorized for
implementation.** Revision 1 is retained by root separately; this file supersedes it. Each LOCKED
entry cites the fact (research.md, [root-policy-addendum.md](root-policy-addendum.md)) that makes it
safe to lock. All behavior remains source-derived/UNRUN; root's in-process negative is a measured
counterexample, not a security proof.

## U2 — native CORS response authority

### D-U2-1 (LOCKED, revised) `withCors()` enforces the service decision on the **final** response: all six access-control headers (presence and absence) plus a single `Vary: Origin`

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
  1. Call Hono's middleware with a wrapped `next` that first **snapshots the decision Hono already
     wrote on the placeholder** (`access-control-allow-origin`, `-allow-credentials`,
     `-expose-headers`) and then runs the real `next()`.
  2. If Hono returned a `Response` (its `OPTIONS` short-circuit), return it unchanged — the preflight
     is built from the same decision and nothing downstream ran.
  3. Otherwise, on the final `c.res`: delete all six `access-control-*` response headers
     (`allow-origin`, `allow-credentials`, `expose-headers`, `allow-methods`, `allow-headers`,
     `max-age`); re-set only the snapshotted values; collapse `Vary` to a token set deduplicated
     case-insensitively (`*` wins; `Origin` spelled `Origin`; other tokens and order preserved;
     header removed when empty). Mutate in place through Hono's finalized-safe `c.header()` (which
     rewraps immutable-header responses such as `Response.redirect`/`fetch` results) or one explicit
     rewrap; never reassign `c.res` (the setter would re-apply the stale headers).
- Properties satisfied: origin is resolved **once** (by Hono; the wrapper reads the result, it never
  re-resolves); no second policy engine; no new public option, type or export
  (`createServiceCorsMiddleware` is internal — repo grep shows only `service-builder-impl.ts` uses
  it); standalone `createRPCHandler`/`createOpenAPIHandler`/`createRPCPlugins` are untouched;
  body, status, statusText, cookies and non-CORS headers (e.g. `Stream-Next-Offset`) pass through.
- Dropped from revision 1: the public `RPCHandlerConfig.cors` knob and the `service-rpc.ts`
  `cors: false` call. Under `withCors()` oRPC's reflected headers are now replaced by step 3, so the
  knob is redundant; oRPC's `OPTIONS` interceptor is never reached because Hono answers preflight
  first. Removing the inner plugin for efficiency is deferred (Q-U2-5).

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
non-CORS headers. `tests/cors-policy_test.ts` and `tests/cors-topology_test.ts` stay as regression
owners (unchanged). `tests/handlers_test.ts` is no longer touched (no standalone change).

### D-U2-5 (LOCKED) Policy errors stay loud; no suppression of policy failures

No try/catch around resolution or validation; `TypeError` at `withCors()` (env) and `build()`
(credentialed wildcard) are unchanged. The only new header mutation is the deterministic
replace-with-decision in D-U2-1.

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

`tests/auth/middleware_test.ts`, `tests/auth/builder-auth_test.ts`, `tests/auth/define-service-auth_test.ts`.
Every negative asserts catch-all handler invocations `=== 0` and authenticator/authorizer call
counts; every positive asserts the handler ran and the authenticator did not.

## MUST RESOLVE — resolved by root (addendum, 2026-10-27)

- **M-U2-1 → RESOLVED: Unreleased "Fixed" entry** with an explicit migration sentence. Because the
  final solution preserves no-`withCors()` behavior (D-U2-3), the sentence reads: "Under `withCors()`
  every response — RPC, OpenAPI, raw routes, health, errors — now carries exactly the configured CORS
  decision; access-control headers set by handlers, proxied upstreams or oRPC's default plugin are
  replaced (declare `exposeHeaders`/`allowHeaders`/`allowMethods` on `withCors()` instead). Services
  that never call `withCors()` are unchanged." Pinned `**Breaking (0.0.8):** CORS` bullet and README
  `## CORS migration (breaking in 0.0.8)` heading stay byte-identical (`cors-topology_test.ts`).
- **M-U2-2 → DISSOLVED:** no public type changes in U2, so no reference regeneration dependency.
  `docs/site/reference/service/index.md` (#cors-origins) remains a **conditional prose owner** if the
  docs parity gate requires the "all responses, including raw routes and projections" statement.
- **M-U4-1 → RESOLVED:** no exported helper constant; README documents three explicit `GET` entries
  plus three explicit `HEAD` entries for the native health trio.

## Deferred (named, not solved here)

- Q-U2-3 Repeated `withCors()` stacking: pre-existing; D-U2-1's dedupe incidentally removes the
  duplicate `Vary` symptom but the second resolver call remains. Later: last-wins or `TypeError`.
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
