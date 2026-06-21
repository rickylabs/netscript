# IMPL-EVAL: AS2a — auth-workos + auth-better-auth → pure AuthBackendPort backends

## Gate → Exit-Code Table

| # | Gate Command | Exit Code |
|---|---|---|
| 1 | `run-deno-check.ts --root packages/auth-workos --ext ts,tsx` | **0** |
| 2 | `run-deno-check.ts --root packages/auth-better-auth --ext ts,tsx` | **0** |
| 3 | `run-deno-lint.ts --root packages/auth-workos --ext ts,tsx` | **0** |
| 4 | `run-deno-lint.ts --root packages/auth-better-auth --ext ts,tsx` | **0** |
| 5 | `run-deno-fmt.ts --root packages/auth-workos --ext ts,tsx` | **0** |
| 6 | `run-deno-fmt.ts --root packages/auth-better-auth --ext ts,tsx` | **0** |
| 7 | `deno test --unstable-kv --allow-all packages/auth-workos packages/auth-better-auth` | **0** (15 passed, 0 failed) |
| 8 | `deno check --unstable-kv packages/auth-workos/mod.ts` | **0** |
| 9 | `deno check --unstable-kv packages/auth-better-auth/mod.ts` | **0** |
| — | `deno task test` (full repo) | **0** (805 passed, 0 failed, 12 ignored) |

All gates pass with exit code 0.

## Boundary + Lock Hygiene

**Files changed (14 files, +841 / −215):**

```
.llm/tools/auth/gen-better-auth-prisma.ts          |  72 ----  (DELETED)
deno.lock                                           |   1 -
packages/auth-better-auth/README.md                 |  70 ++---
packages/auth-better-auth/deno.json                 |   2 +-
packages/auth-better-auth/mod.ts                    |  26 +-
packages/auth-better-auth/src/better-auth-backend.ts| 270 ++++ (NEW)
packages/auth-better-auth/src/better-auth.ts        |  41 +-
packages/auth-better-auth/tests/better-auth_test.ts |  83 ++-
packages/auth-better-auth/tests/mount_test.ts       |  48 --   (DELETED)
packages/auth-workos/README.md                      |  23 +-
packages/auth-workos/deno.json                      |   1 +
packages/auth-workos/mod.ts                         |  21 +-
packages/auth-workos/src/workos-backend.ts          | 301 ++++ (NEW)
packages/auth-workos/tests/workos-authenticator_test.ts | 97 ++-
```

**Boundary check:**
- Changes are confined to `packages/auth-workos`, `packages/auth-better-auth`, and the deleted `.llm/tools/auth/gen-better-auth-prisma.ts`.
- No changes to `packages/plugin-auth-core`, root `deno.json` / catalog, `packages/aspire`, or `scaffold-versions.ts`.
- `deno.lock` delta is exactly the `hono-removal`: one line removed (`"jsr:@hono/hono@4.12.24"` from `packages/auth-better-auth` dependencies). Clean.
- No CRLF↔LF churn detected (0 CR bytes in diff).
- No junk files introduced.

## Conformance

**Factory pattern:** Both packages export a pure `AuthBackendPort` factory:
- `createWorkosBackend` in `packages/auth-workos/src/workos-backend.ts`
- `createBetterAuthBackend` in `packages/auth-better-auth/src/better-auth-backend.ts`

**AuthBackendPort shape** (both return identical structural interface):
- `name` — `'workos'` / `'better-auth'`
- `providers` — `{ listProviders, getProvider }`
- `sessions` — `{ getSession, createSession, refreshSession, revokeSession }` — last 3 throw typed errors
- `crypto` — `{ sealSessionToken, openSessionToken }` — backend-owned HMAC token signing
- `principalMapper` — `{ mapSessionToPrincipal }` → `{ session, principal }` with enriched claims
- `authenticate` — delegates to existing authenticator (`createWorkosAuthenticator` / `createBetterAuthAuthenticator`)

**Backward compatibility preserved:**
- WorkOS sealed-session + JWKS access-token path intact (existing authenticators re-exported).
- Better-auth `createNetscriptBetterAuth` `prismaAdapter` wrapping intact.

**Dropped symbols confirmed gone:**
- `mountBetterAuthHandler` — no references in codebase.
- `BetterAuthMountOptions` — no references.
- `packages/auth-better-auth/tests/mount_test.ts` — deleted.
- `hono` / `@hono` imports — zero occurrences in both packages.
- `.llm/tools/auth/gen-better-auth-prisma.ts` — deleted (directory gone).
- Removal rationale documented in commit message (`refactor(auth-backends): make WorkOS and Better Auth pure backends`).

**AuthBackendOperationUnsupportedError pattern:**

Both `AuthBackendOperationUnsupportedError` classes are:
- Typed named errors (`name === 'AuthBackendOperationUnsupportedError'`) with `backendName`, `operation`, `reason` fields.
- Thrown (not returning `undefined`, not silent) — verified by inspection of `sessions.createSession`, `sessions.refreshSession`, `sessions.revokeSession` in both backends.
- Asserted by tests:
  - `workos-authenticator_test.ts`: `"createWorkosBackend throws typed errors for unsupported managed-session operations"` — asserts `instanceof AuthBackendOperationUnsupportedError` for all 3 ops with backendName = `'workos'`.
  - `better-auth_test.ts`: `"createBetterAuthBackend throws typed errors for unsupported managed-session operations"` — same assertions with backendName = `'better-auth'`.
- Both backends also assert the provider registry + session-token sealing via named tests (`"createWorkosBackend exposes AuthBackendPort provider and session ports"` / `"createBetterAuthBackend exposes AuthBackendPort provider and session ports"`).

**Note (minor):** Each package defines its own `AuthBackendOperationUnsupportedError` class with identical shape. This is a small duplication — likely intentional given each package is independently publishable. Both are exported. Callers doing `instanceof` checks must match against the per-package class. Not a blocker for AS2a; if upstream `plugin-auth-core` eventually defines a shared class, consolidation can be addressed in AS3.

## Remaining Risks

- Small duplication in the two `AuthBackendOperationUnsupportedError` classes; consider consolidating under `plugin-auth-core` in AS3.
- The `signSessionToken` / `verifySessionToken` helper pair is duplicated across the two backends (`packages/auth-workos/src/workos-backend.ts` and `packages/auth-better-auth/src/better-auth-backend.ts`). Could be lifted to a shared helper in `plugin-auth-core` later.

## Verdict

**PASS**

All 9 gates exit 0. Boundary is clean (no forbidden package changes, no junk files, clean lock delta = hono removal only). Conformance is complete: both backends implement the full `AuthBackendPort` contract including typed unsupported-operation errors asserted by tests. Dropped symbols are fully removed with rationale in the commit message.
