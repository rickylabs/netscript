# Research — service-auth-adapters (better-auth + WorkOS)

Status: authoring (pre-PLAN-EVAL). Depends on `service-auth-seam` (#77) merging first (consumes the
widened `AuthenticatorPort`/`AuthorizerPort` + `AuthnRequest.headers()/cookie()` + `Set-Cookie`
channel).

## Locked decisions (user, 2026-06-20)

- **Separate per-provider packages** — `@netscript/auth-better-auth`, `@netscript/auth-workos`.
- **Archetype 2 — Integration** each (doctrine `06-archetypes.md`: `prisma-adapter-mysql` is the
  precedent; "wrap exactly one external system behind a small port + adapter").
- **Port stays upstream** — both packages CONSUME `AuthenticatorPort`/`AuthorizerPort` from
  `@netscript/service`; they do NOT redefine them (doctrine: no premature re-port; the single
  adapter for one system).
- **Instance injection** — consumer brings the configured `betterAuth()` / WorkOS client; the
  package is a thin mapping/compat layer (`createBetterAuthAuthenticator({ auth })`,
  `createWorkosAuthenticator({ workos })`). Mirrors `createRedisQueue(url)` / Prisma driver adapter.
- **`catalog:` deps** — `better-auth` / `@workos-inc/*` pinned in catalog, declared only in their own
  package, never in core `@netscript/service`.

## Reference system — Convex (user-suggested; PRIMARY comparable)

Convex ships a contract-based auth seam plus first-party provider integrations, and reveals a
**two-tier** model that NetScript should consciously choose between:

1. **Hosted / data-backed integration (deep).**
   - `@convex-dev/better-auth`: better-auth's **storage adapter is backed by Convex's own DB**.
     `createApi` exposes `create / findOne / findMany / updateOne / updateMany / deleteOne /
     deleteMany`. better-auth's tables live inside the backend → unlocks the FULL feature set (orgs,
     admin, API keys, 2FA, sessions) because most better-auth features require a database.
   - `@convex-dev/workos-authkit`: webhook component that **syncs** WorkOS AuthKit user/org events
     into Convex's DB with prebuilt handlers + queries. AuthKit is now Convex's default auth, with
     CLI auto-provisioning.
2. **Request-time verification (thin).** Validate a session/token per request → identity. (This is
   what the #77 seam already provides via `AuthenticatorPort`.)

### Implication for NetScript scope

"Integrate well with **most** better-auth features" almost certainly needs **tier 1** for
better-auth, not just tier 2 — because orgs/admin/api-keys/2FA need a persistent store. NetScript has
the substrate for this: `@netscript/database` + Prisma + the plugin **database schema-contribution**
mechanism (Archetype 5). A NetScript-backed better-auth **storage adapter** (better-auth tables on
the consumer's Prisma/Postgres) is the analogue of Convex's component.

WorkOS is identity-provider-side, so tier 2 (verify AuthKit session + access-token/JWKS) covers most
needs; an optional webhook→DB sync (tier 1) is a value-add, not a prerequisite for the core feature
set.

## DESIGN DECISIONS (user, 2026-06-20)

1. **better-auth integration tier — RESOLVED: (b) Verify + Prisma storage adapter.**
   `@netscript/auth-better-auth` ships BOTH the request-time verification adapter AND a
   NetScript-backed **storage adapter** (better-auth tables on the consumer's
   `@netscript/database`/Prisma/Postgres), unlocking the full feature set (orgs, admin, API keys,
   2FA). The package may depend on `@netscript/database` — acceptable for an Archetype-2 package.
   Study `@convex-dev/better-auth`'s `createApi` (`create/findOne/findMany/updateOne/updateMany/
   deleteOne/deleteMany`) for the exact storage-adapter contract better-auth expects.
2. **WorkOS tier — RESOLVED: verification-first.** `@netscript/auth-workos` ships AuthKit session +
   access-token/JWKS verification → `Principal` (org+role). Webhook→DB user/org sync (Convex-style)
   is DEFERRED to a documented optional export or a fast-follow slice — NOT in this slice's bar.

## REMAINING DESIGN QUESTIONS (resolve in plan → PLAN-EVAL)

3. **`Principal` mapping fidelity.** Map better-auth session/user/org/role/permissions and WorkOS
   organization/role → `Principal` (`subject`, `scopes`, `roles`, `claims`). Confirm the widened
   `Principal.claims` carries org/tenant id (it does, per #77 steer).
4. **Session refresh.** better-auth refresh-on-read → emit `Set-Cookie` via the #77 response channel.
   Confirm the adapter has access to write response headers through the seam.
5. **Mounting better-auth's own handler.** better-auth is also a request handler (`/api/auth/**`).
   Document/ship a helper to mount it on the `@netscript/service` Hono app + `allowAnonymous` exempt.

## Framework precedents (internal)

- `packages/queue/factory/create-queue.ts` — port + `createQueue()` factory + lazy
  `await import('../adapters/<tech>.adapter.ts')`; provider deps pinned, adapters as subpath exports.
- `packages/prisma-adapter-mysql/` — standalone Archetype-2 adapter package (the per-provider-package
  precedent we are following).
- Plugin **database schema-contribution** (Archetype 5) — plain `*.prisma` files referenced from
  `database/`; relevant if better-auth tables are contributed via Prisma.

## Sources

- Better Auth × Convex integration: https://better-auth.com/docs/integrations/convex
- WorkOS AuthKit Convex component: https://www.convex.dev/components/workos-authkit
- get-convex/workos-authkit: https://github.com/get-convex/workos-authkit
- Convex auth/authkit docs: https://docs.convex.dev/auth/authkit/
- WorkOS blog (Convex AuthKit): https://workos.com/blog/convex-authkit

## RESOLVED FINDINGS — formal research (2026-06-20)

### F1. better-auth storage tier = WRAP better-auth's own Prisma adapter (key simplification)

better-auth **already ships a first-party Prisma adapter** (`prismaAdapter` from
`better-auth/adapters/prisma`, passed as `betterAuth({ database: prismaAdapter(prisma, { provider })
})`). So the NetScript storage tier is NOT a hand-rolled Convex-`createApi`-style CRUD adapter — it is
a thin wrapper that constructs `prismaAdapter` over the consumer's `@netscript/database` Prisma client
(Operating Rule 3: wrap, don't reinvent). The Convex `createApi` study was the right diligence but the
faithful NetScript path is better-auth's native Prisma adapter, not a bespoke store.

- Version: `better-auth@1.6.20`; bundled `@better-auth/prisma-adapter@1.6.20`.
- Prisma peer: `@prisma/client ^5 || ^6 || ^7` (optional) → **compatible with the cataloged Prisma
  7.8.0** ✓. No version conflict.
- Schema: better-auth **generates** Prisma models via its CLI (`@better-auth/cli generate`); it does
  NOT auto-migrate. So this slice must ship/generate the better-auth Prisma models and route them
  through NetScript's Prisma/migration flow (Archetype-5 schema-contribution analogue). Generation is
  a build/tooling step, not a runtime dependency.
- Feature inventory (verify-vs-storage): verification-only needs no tables; **orgs, admin, API keys,
  2FA, persistent sessions all require the better-auth tables** → confirms the locked
  "verify + Prisma storage" tier is the right call for "most better-auth features."

### F2. WorkOS verification surface (confirmed)

- Version: `@workos-inc/node@10.4.0` (deps inlined: `jose@6.2.3`, `iron-webcrypto`,
  `uint8array-extras`; declares Node `>=22.11` — **Deno node-compat fitness is a plan verify item**).
- Session verify: `workos.userManagement.loadSealedSession({ sessionData, cookiePassword })` →
  `.authenticate()` returns `{ authenticated, sessionId, organizationId, role, permissions, user }`.
  `cookiePassword` is required (consumer-provided secret/env).
- Access-token path: token is a JWT, verifiable via JWKS `…/sso/jwks/<clientId>` using `jose`.
- **Principal mapping (resolves Q3):** `subject = user.id`, `roles = [role]`,
  `scopes = permissions`, `claims = { org_id: organizationId, sid: sessionId, ...token claims }`.
  Widened `Principal.claims` carries the tenant/org id (from #77 steer) ✓.

### F3. Catalog additions (versions to pin)

- `better-auth`: `^1.6.20`
- `@workos-inc/node`: `^10.4.0`
- Declared ONLY in their own packages' import maps via `catalog:`; never in core `@netscript/service`.
- `@better-auth/cli` (schema gen) is a dev/tooling concern — invoke via a `.llm/tools/` script, do not
  add a runtime catalog entry unless the generator needs it pinned.
- **Authority caveat:** these were read from the npm registry `latest` tag during research. Per repo
  rule, confirm via `deno task deps:latest` AFTER the catalog entries exist (deps:latest reads the
  catalog) — do NOT trust `deno outdated --latest`.

### Remaining for plan.md (post-#77-merge)

- Q4 session refresh: confirm the adapter writes `Set-Cookie` through the #77 response channel
  (better-auth refresh-on-read; WorkOS session refresh). Surface exists per the #77 widening; wire it.
- Q5 mounting better-auth's own `/api/auth/**` handler on the `@netscript/service` Hono app with an
  `allowAnonymous` exemption — ship a documented helper.
- Deno node-compat smoke for `@workos-inc/node@10` (Node>=22.11 declared) and `better-auth@1.6` under
  the repo's Deno 2.8 toolchain.
