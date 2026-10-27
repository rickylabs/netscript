# U1 decision map — 8 footprint questions

Scope: additive inert `./service` factories only (12 product paths). Verdicts: **RESOLVED-U1**
(locked here), **SAFE-DEFER** (explicit owner + gate; no U1 API rework), **MUST-RESOLVE** (blocks
the named downstream leaf, not U1). No deferral below forces a U1 public-contract change.

## Q1 — Additive `./service` + legacy semantics; #829 without supervision

**RESOLVED-U1 — accept.** Each plugin gains `./service → ./services/mod.ts` exporting exactly two
named symbols (`WorkersServiceOptions` + `startWorkersService`; `StreamsServiceOptions` +
`startStreamsService`). Both legacy `./services` entries keep exact current semantics: workers
default `createWorkersService(ctx)` + `import.meta.main` CLI bootstrap; streams start-on-import +
public + wildcard CORS. No `import.meta.main` guard is added to streams legacy (would silently break
import consumers). #829 coordination: U1 owns only the additive factories; the 0.0.17
process-manager/supervision chain is explicitly out of scope — no supervisor abstraction, no
shared/global KV close, no generic middleware. #829/#2396 closure requires E1+E2E, never U1-green
alone. Owner: U1 plan (`plan.md` §§3–5). Rationale: additive-only change is the smallest seam that
unblocks reviewed EIS callers without forking private hosts.

## Q2 — Port/env precedence, option identity, pre-I/O validation, lifecycle ownership

**RESOLVED-U1.** (a) Explicit `serve.port` **including 0** wins; otherwise workers uses
`ctx.env.PORT ?? Deno.env.get('PORT')`, streams uses
`Deno.env.get('PORT') ??
Deno.env.get('STREAMS_PORT')`; missing → the exact legacy throw text. No
new hostname env seam — hostname travels only via `serve.hostname`. (b) `serve` is passed to native
`.serve()` **by identity** (read-only; never copied/mutated); `auth`/`authn`/`authz` callables and
worker context values pass through unchanged. (c) `assertServiceAuthPolicy(options?.auth)` is the
first statement of each start call — missing/mixed/blank-reason postures throw `TypeError` before
any env/KV/ storage/port/internal-server work (order oracle: invalid auth + missing PORT ⇒ auth
`TypeError`, not the PORT error). (d) Streams: front `.serve()` failure stops the factory-owned
upstream and rethrows the primary error (cleanup failure never masks it); normal stop is idempotent
and drains native hooks; `STREAMS_DATA_DIR`/`STREAMS_INTERNAL_PORT` stay env-sourced but are read
**inside** `start`, never at import. Workers KV is never closed by the factory (shared ownership).
Owner: U1 plan (`plan.md` §4). Rationale: every clause above is directly observable in current
listener/auth source, so the plan locks behavior, not guesses.

## Q3 — U2 native CORS response authority vs smaller alternative

**SAFE-DEFER to U2 (separate behavior-review leaf).** U1 forwards `CorsOptions` through native
`withCors` unchanged and adds no wildcard default, no credential handling, and no response-rewrite
step — so U2's internal preservation fix cannot change any U1-planned public type. U1's CORS
guarantees are locked now: workers omitted-`cors` keeps native env-snapshot behavior; streams new
factory defaults to the protocol method/header lists with caller values **replacing** (never
unioning) and omitted origin resolving `NETSCRIPT_CORS_ORIGINS`; caller `credentials: true` +
wildcard still fails closed in native assert. Gate: U2 (PLAN-EVAL-gated, full header/Vary/error
matrix) must land before the **E1 browser-reader cutover**, not before U1. Owner: U2 leaf.
Rationale: response-authority is a service-owned behavior fix with its own evidence bar; coupling it
into U1 would widen the 12-owner footprint and the blast radius.

## Q4 — U3 browser reader identity/issuer/scope/transport/renewal

**SAFE-DEFER for U1; MUST-RESOLVE before E1 streams-reader adoption.** U1 adds no browser surface
and does not touch `streams/factory.ts` / `streams/mod.ts`. Measured blocker carried forward:
`createWorkersStreamDB` accepts only `{ baseUrl? }` and hard-codes env-based `getStreamsAuth()`
(`{}` in a browser) — header injection, if selected, needs freshness/expiry/disposal design against
the real transport first. No producer/admin secret in JS, no query-string token escape hatch, no
browser executor dispatch — all restated as U3/E1 non-goals. Owner: U3 leaf (+ E1 for adoption).
Rationale: credential architecture cannot be inferred from a bearer; deciding it inside U1 would be
speculation, and U1's factory shape fits any outcome.

## Q5 — Least-authority worker/stream roles, aliases/raw/health exceptions

**SAFE-DEFER for U1; MUST-RESOLVE in E1 policy design before EIS adoption.** U1 forwards
`authn.protect` / `authn.allowAnonymous` / `authz` **by identity** (custom `allowAnonymous` replaces
the native default; the assert adds no `/health`), so any future role table — including
`protect: ['/']` with explicit health exceptions and encoded/lookalike/nested-path negatives — fits
without API rework. The plan records the native-default trap explicitly (defaults guard only `/api`;
a raw `/*` proxy needs deliberate `protect: ['/']`) and forbids anonymous raw-route prefix
exceptions and CORS-as-auth. The frozen role table itself is E1-owned. Owner: E1 (EIS host-policy
composition). Rationale: roles are caller policy, not framework shape; the seam is what U1 owes, and
it is identity-preserving.

## Q6 — Focused public `AuthorizerPort` vs waiting on #2364

**Architecture disposition recorded; SAFE-DEFER for U1.** An ordinary public `AuthorizerPort`
(method/path/principal decisions, default deny) is already sufficient for dynamic stream policy — no
contract-route-resolver duplication in U1, and no wait on #2364's dynamic raw-route resolver (which
stays an optional enhancement). U1 accepts any `AuthorizerPort` via native `authz` unchanged. E1
selects the concrete policy and proves canonical encoded/path-boundary tests. Owner: E1 (policy
choice + proof). Rationale: using the existing public port avoids coupling U1's additive seam to an
unrelated resolver feature.

## Q7 — EIS bearer/principal/grants/HMAC/ledger preservation vs native migration

**SAFE-DEFER for U1; MUST-RESOLVE before E1 cutover.** U1 preserves principal/context/callable
identity end-to-end (no normalization, no credential exchange, no silent migration to native
internal credentials — whose derivation and opaque marking differ from the EIS custom principal).
Default stance carried forward: keep the EIS document/reindex bearer, `isInternalCaller` checks, and
per-operation HMAC/ledger fences with original contribution/header-identity tests; any native
migration is a separately reviewed change. Owner: E1. Rationale: identity preservation is a U1
construction rule; the credential decision is caller-owned and must not be smuggled inside a
framework seam.

## Q8 — Release family/pins/age gates, closure evidence, rollback

**SPLIT.** (a) **RESOLVED-U1**: rollback is a complete source/config/lock transaction over the 12
owned paths (6 modified reverted, 6 new deleted; no lock changes exist to roll back). Restoring
legacy public hosts is explicitly **not** a security-approved shipping fallback. (b) **SAFE-DEFER**:
published release family, exact pins, and minimum-age/exclusion disposition belong to the normal
upstream release process at cut time — no fixed future version is invented here. (c) **SAFE-DEFER**:
S16 closure evidence (runtime/browser/listener/Windows/OTEL, distinct IMPL gates) is owned by E1/E2E
after the credential design; U1-green proves only the host seam. Original public exposure stays
unqualified until those pass. Owners: (a) U1 plan (`plan.md` §11); (b) upstream release cut; (c)
E1/E2E. Rationale: U1 can only promise what it owns — a revertible additive seam with named
downstream gates.
