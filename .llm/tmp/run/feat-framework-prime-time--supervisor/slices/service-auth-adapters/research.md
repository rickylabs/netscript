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

## OPEN DESIGN QUESTIONS (resolve in plan → PLAN-EVAL)

1. **better-auth integration tier.** Ship (a) request-time verification adapter only, or (b) ALSO a
   NetScript-backed storage adapter (better-auth on `@netscript/database`/Prisma) for the full
   feature set? Recommendation: **(b)** — it's what "most features" demands; matches Convex.
   Sub-question: does the storage adapter belong in `@netscript/auth-better-auth`, or does it pull in
   a dependency on `@netscript/database` (still fine for an Archetype-2 package)?
2. **WorkOS tier.** Verification-only, or also an optional webhook→DB sync surface? Recommendation:
   **verification-first**, webhook-sync as a documented optional export or a fast-follow.
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

## TODO (formal research phase, before locking plan.md)

- Read `@convex-dev/better-auth` adapter source/docs for the exact storage-adapter contract surface
  better-auth expects (so the NetScript Prisma-backed adapter is faithful).
- Inventory better-auth's feature list and tag each feature: verification-only vs requires-storage.
- Confirm WorkOS Node SDK surface for AuthKit session validation + JWKS access-token verification.
- Confirm catalog entries / versions for `better-auth` and `@workos-inc/node` via
  `.llm/tools/deps/` (`deps:latest`), never `deno outdated --latest`.
