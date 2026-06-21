# Plan — service-auth-adapters (`@netscript/auth-better-auth` + `@netscript/auth-workos`)

Status: PLAN authored (supervisor), ready for PLAN-EVAL. Base branch: `feat/framework-prime-time`
(umbrella; contains the merged `service-auth-seam` #77 at `79f5840d`). Slice branch:
`feat/prime-time/service-auth-adapters`. PR → umbrella.

Grounded against the **merged** #77 seam (`packages/service/src/auth/types.ts` @ `79f5840d`), not the
pre-merge assumption. See `research.md` for the locked decisions and external precedents.

## 1. Goal & scope

Ship two standalone provider-integration packages that let a NetScript service authenticate against
real-world identity systems by plugging into the merged `AuthenticatorPort` seam:

- **`@netscript/auth-better-auth`** — request-time verification adapter **and** a NetScript-backed
  storage tier (wraps better-auth's own first-party Prisma adapter over the consumer's
  `@netscript/database` client), unlocking better-auth's database-backed feature set (orgs, admin,
  API keys, 2FA, persistent sessions). Plus a documented helper to mount better-auth's own
  `/api/auth/**` handler on the service Hono app.
- **`@netscript/auth-workos`** — verification-first adapter: validates a WorkOS AuthKit sealed session
  (and/or access-token JWT via JWKS) into a `Principal`. Webhook→DB org/user sync is explicitly
  DEFERRED (documented optional fast-follow), not in this slice's bar.

Both packages **consume** the upstream `AuthenticatorPort`/`AuthorizerPort`/`Principal`/`AuthnRequest`/
`AuthnResult` from `@netscript/service/auth`; neither redefines the ports. Additive only — no change to
`@netscript/service` public surface.

**In scope:** the two packages (real adapters + tests), catalog entries for `better-auth` +
`@workos-inc/node`, better-auth Prisma model generation routed through a `.llm/tools/` script
(Archetype-5 schema-contribution analogue), the `/api/auth/**` mount helper, Deno node-compat fitness
checks for both provider SDKs, docs for both packages.

**Out of scope (record as deferred, not dropped):** WorkOS webhook→DB sync component; any change to the
#77 seam; a CLI scaffold prompt for auth providers (the seam + packages are consumer-wired; a scaffold
option is a possible fast-follow); migrating better-auth tables into an existing app's schema (the slice
ships generation + wiring, the consumer runs migration).

## 2. Archetype & overlays

- **ARCHETYPE-2 (Integration)** for BOTH packages — each wraps exactly one external system behind the
  existing port + adapter. Precedent: `packages/prisma-adapter-mysql/` (standalone Archetype-2 adapter
  package) and `packages/queue` (port + factory + lazy `await import('../adapters/<tech>.adapter.ts')`).
- **ARCHETYPE-5 (plugin/schema-contribution) overlay** for `@netscript/auth-better-auth` ONLY, covering
  the better-auth Prisma model generation + how those tables route through NetScript's Prisma/migration
  flow. (`@netscript/auth-workos` is pure Archetype-2; no schema.)
- **SCOPE-service** overlay — both packages target the `@netscript/service` composition root (`withAuthn`
  injection idiom) and the Hono request pipeline (mount helper, `Set-Cookie` emission).
- No `@netscript/cli` touch this slice (see out-of-scope). Therefore **NOT** an `e2e-cli-gate` slice —
  do not attach that label or run the scaffold runtime smoke; it changes no scaffold output.

## 3. Contract (contract-first — CONSUME the merged seam verbatim)

From `packages/service/src/auth/types.ts` @ `79f5840d` (do not redefine; import):

- `AuthenticatorPort.authenticate(request: AuthnRequest): Promise<AuthnResult> | AuthnResult`.
- `AuthnRequest`: `header(name)`, `headers(): Headers`, `cookie(name)`, `method`, `path` — provider SDKs
  that validate from header/cookie sets use `headers()`/`cookie()`.
- `AuthnResult` success: `{ ok: true, principal, responseHeaders?, setCookies? }`. **`setCookies:
  readonly string[]`** is the refresh-on-read channel (resolves Q4): better-auth refresh-on-read and
  WorkOS session refresh emit rotated `Set-Cookie` values here; `responseHeaders` for any other headers.
  Failure: `{ ok: false, reason }`.
- `Principal`: `subject`, `scopes`, `roles`, `scheme`, `claims`. **Adapters set `scheme: 'custom'`** and
  put provider identity in `claims` (resolves Q3).

### Principal mapping (locked)

| Provider | subject | scopes | roles | scheme | claims |
| --- | --- | --- | --- | --- | --- |
| better-auth | `session.user.id` | derived from member/role permissions (org plugin) if present, else `[]` | `[session.user.role]` ∪ org member roles | `'custom'` | `{ organizationId?, sessionId, activeOrganizationId?, ...sessionMetadata }` |
| WorkOS | `auth.user.id` | `auth.permissions ?? []` | `auth.role ? [auth.role] : []` | `'custom'` | `{ organizationId: auth.organizationId, sessionId: auth.sessionId, ...jwtClaims }` |

Claim-key convention follows the shipped seam example (`organizationId`, `sessionId` — camelCase), NOT
the `org_id`/`sid` form in research F2; keep raw provider claims too so consumers can read either.

## 4. Design

### 4.1 `@netscript/auth-workos` (simpler; build first)

- Package dir `packages/auth-workos/`. Deps: `@workos-inc/node` via `catalog:` (`^10.4.0`), `jose` (its
  transitive, used directly only if we add the JWKS access-token path) — prefer the SDK's own session
  API to avoid a direct `jose` dep unless the access-token path needs it.
- `createWorkosAuthenticator({ workos, cookiePassword }): AuthenticatorPort` — consumer brings the
  configured `WorkOS` client + the `cookiePassword` secret (env-sourced). Per request:
  `workos.userManagement.loadSealedSession({ sessionData: req.cookie('wos-session'), cookiePassword })`
  → `.authenticate()`. On `{ authenticated: true }` → map to `Principal`. On refresh
  (`.refresh()` when the SDK signals a rotated session) → emit the new sealed cookie via
  `AuthnResult.setCookies`. On `{ authenticated: false }` → `{ ok: false, reason }`.
- Optional `createWorkosAccessTokenAuthenticator({ clientId, jwksUrl? })` — verifies a bearer JWT via
  JWKS using `jose` (token path). Ship behind a separate factory so the common path stays SDK-only.
- **Deno node-compat fitness (verify item):** `@workos-inc/node@10` declares Node `>=22.11`; smoke that
  `loadSealedSession`/`.authenticate()` run under Deno 2.8 node-compat (its inlined `jose`,
  `iron-webcrypto`, `uint8array-extras` must resolve). Record evidence in `worklog.md`.

### 4.2 `@netscript/auth-better-auth` (verify + storage)

- Package dir `packages/auth-better-auth/`. Deps: `better-auth` via `catalog:` (`^1.6.20`); MAY depend on
  `@netscript/database` (acceptable for Archetype-2 per locked decision). `@prisma/client` stays
  `catalog:` (already at `deno.json:106`, compatible with better-auth's `^5||^6||^7` peer).
- **Storage tier — WRAP, don't reinvent (research F1):** `createNetscriptBetterAuth({ prisma, provider,
  ...betterAuthOptions })` constructs `betterAuth({ database: prismaAdapter(prisma, { provider }),
  ...options })` using better-auth's OWN first-party `prismaAdapter` (`better-auth/adapters/prisma`) over
  the consumer's `@netscript/database` client. NOT a hand-rolled Convex-`createApi` CRUD store.
- **Verification adapter:** `createBetterAuthAuthenticator({ auth }): AuthenticatorPort` where `auth` is
  the `betterAuth(...)` instance. Per request: `auth.api.getSession({ headers: req.headers() })` →
  session/user/org → `Principal`. Refresh-on-read rotated cookies → `AuthnResult.setCookies` (read from
  the better-auth response the SDK produces). Reject → `{ ok: false }`.
- **Mount helper (resolves Q5):** `mountBetterAuthHandler(app, auth, { basePath = '/api/auth' })` —
  mounts better-auth's `auth.handler` (a `(Request) => Response`) on the service Hono app and documents
  the `allowAnonymous`/auth-exempt path so the auth routes themselves are not gated by the authenticator.
- **Schema-contribution (Archetype-5 overlay):** better-auth GENERATES Prisma models via
  `@better-auth/cli generate` (it does not auto-migrate). Ship a `.llm/tools/auth/gen-better-auth-prisma.ts`
  wrapper that runs the generator against a config and writes the models to a documented location the
  consumer references from their `database/` schema. `@better-auth/cli` is dev/tooling — invoked via the
  script, NOT a runtime catalog entry. Generation is a build step, not a runtime dependency.

### 4.3 Catalog & dependency authority

Add to the catalog: `better-auth ^1.6.20`, `@workos-inc/node ^10.4.0` — declared ONLY in their own
packages' import maps via `catalog:`, never in core `@netscript/service`. **After** the entries exist,
confirm "latest" via `deno task deps:latest` (reads the catalog stable channel) — do NOT trust
`deno outdated --latest`. Run `deno task deps:audit` for the two new third-party trees.

## 5. Commit slices (commit-by-slice, gate each)

1. **Catalog + scaffolding** — add catalog entries, create both package dirs with `deno.json`
   (`catalog:` deps, subpath exports), `mod.ts` barrels, README stubs. Gate: check + `deps:latest`
   confirms pins + `deps:audit`.
2. **`@netscript/auth-workos` verification adapter** — `createWorkosAuthenticator` + Principal mapping +
   sealed-session refresh → `setCookies`. Unit tests (mapped principal, reject, refresh-cookie) + Deno
   node-compat smoke. Gate: ARCHETYPE-2 set + tests.
3. **`@netscript/auth-workos` access-token path (optional factory)** — JWKS bearer verification. Tests.
   Gate: ARCHETYPE-2 + tests. (May fold into slice 2 if small.)
4. **`@netscript/auth-better-auth` storage + verification** — `createNetscriptBetterAuth` (wraps
   `prismaAdapter`) + `createBetterAuthAuthenticator` (`getSession` → Principal) + refresh cookies. Unit
   + integration tests (in-memory/SQLite Prisma or mocked session). Gate: ARCHETYPE-2 + tests.
5. **better-auth schema generation + mount helper** — `.llm/tools/auth/gen-better-auth-prisma.ts`,
   generated models routed through the Prisma flow, `mountBetterAuthHandler` + `allowAnonymous` docs.
   Gate: ARCHETYPE-5 overlay (schema-contribution) + F-13-style runtime-wiring check + tests.
6. **Docs + JSR readiness** — per-package README/usage, `deno doc` clean, `publish:dry-run` for both
   packages, JSR doc-lint on the FULL export map of each (not mod.ts alone — see lessons), catalog law
   re-verified. Gate: doc-lint + publish dry-run + arch:check.

## 6. Gates (ARCHETYPE-2 + ARCHETYPE-5 overlay + SCOPE-service)

`deno task check` (with `--unstable-kv` for workspace check), scoped `run-deno-check.ts`/`-lint.ts`/
`-fmt.ts` over `packages/auth-workos` + `packages/auth-better-auth` (`--ext ts,tsx`), per-package
`deno test`, `deno task publish:dry-run`, JSR doc-lint over full export sets, `deno task arch:check`,
`deps:latest`/`deps:audit`. **NO `e2e:cli` smoke** (no scaffold output change). Name the SCOPE-service
wiring invariant and the Archetype-5 schema-contribution gate explicitly in `worklog.md`.

## 7. Debt & risks

- **DEBT (logged):** WorkOS webhook→DB org/user sync deferred to a documented optional fast-follow.
- **DEBT (logged):** no CLI scaffold prompt for auth providers this slice.
- **RISK — Deno node-compat:** `@workos-inc/node@10` (Node>=22.11) and `better-auth@1.6` under Deno 2.8.
  Mitigation: node-compat smoke is a slice-2/slice-4 gate item; if a provider SDK is incompatible, record
  in `drift.md` and rescope to the JWKS-only path for WorkOS / surface the better-auth limitation.
- **RISK — better-auth API drift:** `auth.api.getSession`/`prismaAdapter` import path are pinned to
  `1.6.20`; the plan cites the version so IMPL re-verifies against the installed surface, not docs.
- **RISK — storage migration ownership:** the slice ships generation + wiring; the consumer owns running
  the migration. Document this boundary explicitly so it is not read as auto-migration.

## 8. Resolved design questions (from research)

- **Q3 Principal mapping** — RESOLVED (§3 table; `scheme:'custom'` + `claims`).
- **Q4 session refresh** — RESOLVED: `AuthnResult.setCookies` (+ `responseHeaders`) is the merged
  channel; adapters write rotated cookies there.
- **Q5 mounting better-auth's handler** — RESOLVED: `mountBetterAuthHandler` helper + `allowAnonymous`
  exemption (§4.2, slice 5).
