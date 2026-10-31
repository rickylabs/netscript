# Decisions: U2 native CORS authority and U4 exact anonymous requests

Status: **PLAN — not evaluated, not authorized for implementation.** Each LOCKED entry cites the
source fact in research.md that makes it safe to lock. MUST RESOLVE entries need root/owner policy;
the plan is complete and reviewable with them open.

## U2 — native CORS response authority

### D-U2-1 (LOCKED) `withCors()` is the only CORS authority inside a builder service; builder-wired oRPC handlers install no `CORSPlugin`

- Mechanism: additive `cors?: boolean` on the already-public `RPCHandlerConfig` (default `true`);
  `createRPCPlugins` skips `new CORSPlugin()` when `cors === false`; `wireRpc` passes `cors: false`
  for both the RPC and the OpenAPI handler (aliases and deprecated prefixes reuse the same handler).
- Why this and not response preservation (EIS approach): preservation keeps two engines running and
  must re-delete/re-merge six headers plus `Vary` on every path (research §2.2 shows the overwrite
  happens inside `newResponse`/`set res`, so a preservation layer would have to run after Hono's own
  re-application). Disabling the inner plugin removes the conflict at its source, touches no origin
  resolution, and leaves `service-cors.ts` semantics byte-identical. Brief preference: "one
  service-owned authority without duplicating origin resolution" — satisfied.
- Why not configure oRPC's plugin from Hono's options: duplicates origin resolution and both
  allowlist/credential rules; rejected by the brief.
- Why not an internal-only knob instead of a public boolean: `wireRpc` reaches the handlers only
  through the exported factories; an internal path would need a second factory or symbol. One
  optional boolean on an existing exported config is the smallest additive change and is not an
  "option bag".
- Standalone `createRPCHandler(router)` / `createOpenAPIHandler(router)` / `createRPCPlugins({})`
  keep today's plugin list (CORS included) — default `true` preserves them exactly.

### D-U2-2 (LOCKED) Pipeline order is unchanged

Tracing → CORS (`withCors`, immediate) → logger → `use()` → authn → authz → body limit → projections
and raw routes (documented order, verified in `service-builder-impl.ts`). No reordering; no new
middleware; `build()` still asserts all stored CORS options before installing auth. `service-cors.ts`
receives JSDoc only (authority statement); no behavioral edit.

### D-U2-3 (LOCKED) Consequence to document: builder services without `withCors()` emit no CORS anywhere

Today such services emit oRPC's reflect-any-origin headers on RPC/OpenAPI success and answer
preflight on those mounts only. After U2 they emit none (raw/health/error paths already had none).
This aligns with the published 0.0.8 policy ("Unset origins deny cross-origin browser access") and
with `createPluginService({ enableCors: false })` meaning what it says. README + CHANGELOG record it.
**Release classification (fix vs. breaking note) is MUST RESOLVE M-U2-1.**

### D-U2-4 (LOCKED) Proving owner is a new real-handler conformance test, plus standalone compatibility in the handler owner

`packages/service/tests/cors-rpc-policy_test.ts` (new) runs a real `os.router` with an RPC procedure,
a REST-routed procedure, a throwing procedure, plus raw `route()`, `withHealth()`, `withAuthn`,
`withBodyLimit`, through `createService(...).build()` and asserts the full header matrix in plan.md
§U2 gates. `packages/service/tests/handlers_test.ts` gains the standalone-default and `cors:false`
assertions. Status-only assertions are insufficient; every case asserts the six access-control
headers (presence **and absence**), `Vary` token set, body identity, cookies and unrelated headers.

### D-U2-5 (LOCKED) Policy errors stay loud

No try/catch, normalization or `Vary` rewriting is added around oRPC responses. Env/option
validation (`TypeError` at `withCors()` for env, at `build()` for wildcard+credentials) is unchanged.

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

- Strings keep prefix semantics; objects are exact. Lists may mix. `undefined` and `[]` keep the
  `/health` default (`normalizeGuard` unchanged). A nonempty list of only objects contains no prefix.
- Method vocabulary mirrors the builder's `ServiceRouteMethod` (`get|post|put|delete|patch`) in
  uppercase plus `HEAD`; `OPTIONS` and `all` are excluded (OPTIONS preflight is owned by `withCors()`
  which runs before authn; a non-preflight OPTIONS stays guarded).
- Both `AuthnOptions.allowAnonymous` and the internal `AuthzMiddlewareOptions.allowAnonymous` use the
  same union; the builder already forwards one list to both stages, so no builder edit.
- `AnonymousRequestMatch` and `AnonymousRule` are re-exported from `src/auth/mod.ts` and root
  `mod.ts` (required: `AuthnOptions` is public in both and `deno doc --lint` demands reachable types).

### D-U4-2 (LOCKED) Exact match = method rule ∧ byte-exact path on **both** path representations

A request is anonymous under an object entry iff `methodMatches(c.req.method, entry.method)` and
`rawPathname(c) === entry.path` and `c.req.path === entry.path`. Query/fragment are never part of
either string. Consequences (research §3.2): any percent-encoding (`/he%61lth`, `/health%2Flive`),
case variants, trailing/duplicate slashes and descendants are **not** anonymous; dot-segment paths
that the URL parser already normalized to `/health` are (they *are* the `/health` route). This is
stricter than the legacy decoded-prefix rule and deliberately differs from deny-side
`normalizePath` (which may only widen denial).

### D-U4-3 (LOCKED) `GET` entries admit `HEAD`; `HEAD` entries admit only `HEAD`

Derived from Hono dispatch: a `HEAD` request is served by the `GET` route with the body stripped and
`c.req.method === 'HEAD'`. An exact `GET` health exception therefore covers the probe pair that the
same handler serves; declaring `HEAD` alone narrows to the body-less form. No other implicit method.

### D-U4-4 (LOCKED) Validation at guard construction, `TypeError`, before any request

`normalizeGuard` (shared by both middlewares, executed inside `build()` → `installAuth`, or at
`createAuthnMiddleware`/`createAuthzMiddleware` for standalone users) throws
`TypeError('[netscript.service.auth] invalid anonymous request: <reason>')` for an object entry whose
`method` is outside the vocabulary or not uppercase, or whose `path` is not absolute, contains `%`,
`*`, `:`, `{`, `}`, `?`, `#`, `\`, whitespace or `//`, or ends with `/` (except exactly `/`).
Duplicates are allowed (idempotent). Strings are not newly validated (legacy). `assertServiceAuthPolicy`
is untouched; `defineService` therefore rejects at `serve()`→`build()` before the listener.

### D-U4-5 (LOCKED) Precedence unchanged

Matched contract policy (`policyResolver`) decides first in both stages: `authentication: 'none'`
bypasses, `'required'` and raw-route declarations guard even when an exact entry lists the same
request. Unmatched requests consult the guard: any anonymous rule (string or object) ⇒ not guarded;
else `protect`. Authn `503`/`401`, authz `401 missing-principal`/`403`/`denyByDefault` fail-closed
shapes are unchanged. Configuration arrays are copied at normalization (immutability preserved).

### D-U4-6 (LOCKED) Proving owners count dispatch, not statuses

`tests/auth/middleware_test.ts` (unit matrix, validation, both stages, call counters),
`tests/auth/builder-auth_test.ts` (real builder: `protect: ['/']`, `withHealth()`, counting
`route('all','/*')` catch-all, legacy controls), `tests/auth/define-service-auth_test.ts` (preset
passthrough + pre-listener rejection). Every negative asserts catch-all invocations `=== 0` and the
authenticator/authorizer call count, not only the status.

## MUST RESOLVE (policy the generator cannot lock)

- **M-U2-1 Release classification.** Removing implicit oRPC CORS from builder-wired projections is
  policy conformance with 0.0.8's documented breaking change, but observable for a builder consumer
  that relied on reflected RPC CORS without `withCors()`. Root/release owner must choose: (a) "Fixed"
  entry in Unreleased with a migration sentence, or (b) a second "Breaking" bullet. The plan writes
  (a) and keeps the pinned `**Breaking (0.0.8):** CORS` bullet intact; flip to (b) on instruction.
- **M-U2-2 Docs-site reference regeneration.** `docs/site/reference/service/index.md:182` documents
  `RPCHandlerConfig` by name only; whether the reference-regeneration gate requires a field-level
  update for `cors` must be checked by running the docs gate at implementation (owner: `docs/site/
  reference/service/index.md`, included in the footprint as conditional).
- **M-U4-1 Exact-list ergonomics for the three native health routes.** A nonempty exact list must
  spell `/health`, `/health/live` and `/health/ready` individually to keep all native probes
  anonymous. The plan documents this and offers no helper constant; root decides whether an exported
  constant (e.g. `NATIVE_HEALTH_ANONYMOUS_REQUESTS`) is wanted — not added here to avoid a new
  public symbol without necessity.

## Deferred (named, not solved here)

- Q-U2-3 Repeated `withCors()` calls stack middleware (duplicate `Vary: Origin` token, double
  resolution). Pre-existing, unrelated to the oRPC overwrite; one test documents single-call behavior
  only. Candidate later fix: last-wins or `TypeError` on a second call (public behavior change).
- Q-U2-4 U3 per-request headers, E1 issuer/roles/TTL/reader credential, browser bootstrap, EIS
  adoption, process supervision: dependencies named in plan.md; not addressed.
- Q-U4-2 Route-aware native denial for raw catch-alls (EIS footprint Q6, issue #2364 dynamic raw
  declarations) remains the contract-authorizer concern; U4 does not duplicate resolvers.
- Q-U4-3 Whether `createPluginService`/CLI reconciler should emit exact entries for generated
  scaffolds — scaffold policy is owned by CLI/plugin lanes; U4 only makes the capability available.
- U1's twelve plugin-host paths and public factories: untouched, by order.
