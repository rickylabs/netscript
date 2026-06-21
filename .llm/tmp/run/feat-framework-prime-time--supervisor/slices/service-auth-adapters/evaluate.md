# IMPL-EVAL — `service-auth-adapters`

- Run ID: `feat-framework-prime-time--supervisor`
- Slice: `service-auth-adapters` (`@netscript/auth-better-auth` + `@netscript/auth-workos`)
- Evaluator session: separate-session IMPL-EVAL, cycle 1, 2026-06-20
- Branch: `feat/prime-time/service-auth-adapters`
- Base: `feat/framework-prime-time` @ commit `af955949` (latest slice commit: `Record service auth adapter final ledger`)
- Archetype: **Archetype-2 (Integration)** for both packages; **Archetype-5 overlay** for better-auth schema generation; **SCOPE-service** overlay for both.
- Plan-eval verdict: **PASS** (cycle 1)

## Evaluation inputs

| Required input | Present? | Location |
| --- | --- | --- |
| Plan | ✅ | `plan.md` (169 lines, 6 commit slices, gates, risks) |
| Plan-eval | ✅ | `plan-eval.md` (PASS cycle 1) |
| Worklog | ✅ | `worklog.md` (6 slices, all gates green, design checkpoint recorded) |
| Context-pack | ✅ | `context-pack.md` (resumable state, locked decisions) |
| Drift | ✅ | `drift.md` (3 deferred items, pre-existing audit/arch:check) |
| Commits | ✅ | `commits.md` (6 commits in order) |
| Gate matrix | ✅ | `.llm/harness/gates/archetype-gate-matrix.md` |

## Production/enterprise bar verification (NO stubs, NO no-ops)

### WorkOS production bar

| Requirement | Evidence | File:line |
| --- | --- | --- |
| `createWorkosAuthenticator` calls `loadSealedSession().authenticate()` | ✅ REAL call | `packages/auth-workos/src/workos-authenticator.ts:159-166` |
| Maps a real `Principal` from WorkOS session | ✅ `subject: user.id`, `scopes: permissions`, `roles: [role, ...roles]`, `scheme: 'custom'`, `claims: { organizationId, sessionId, ... }` | `packages/auth-workos/src/workos-authenticator.ts:278-296` |
| Refresh emits rotated session via `setCookies` | ✅ `refreshed.sealedSession` serialized to cookie, emitted via `AuthnResult.setCookies` | `packages/auth-workos/src/workos-authenticator.ts:267-274` |
| `createWorkosAccessTokenAuthenticator` performs REAL `jose` JWKS signature verification with audience binding | ✅ `createRemoteJWKSet` + `jwtVerify(token, jwks, { audience: clientId })` — NOT a decode-only shim | `packages/auth-workos/src/workos-authenticator.ts:205-218` |
| Access-token principal mapping | ✅ `subject: sub`, `scopes: permissions`, `roles: [role, ...roles]`, `scheme: 'custom'` | `packages/auth-workos/src/workos-authenticator.ts:311-328` |

WorkOS test coverage: 6 tests passed (sealed-session, refresh-cookie, access-token JWKS verification, missing/invalid token rejection, node-compat smoke).

### better-auth production bar

| Requirement | Evidence | File:line |
| --- | --- | --- |
| `createNetscriptBetterAuth` WRAPS better-auth's own `prismaAdapter` | ✅ `import { prismaAdapter } from 'better-auth/adapters/prisma'` + `database: prismaAdapter(prisma, { provider, ... })` | `packages/auth-better-auth/src/better-auth.ts:8, 113-118` |
| Does NOT import `@netscript/database` (PLAN-EVAL layering fix) | ✅ grep verified: no `@netscript/database` import in `packages/auth-better-auth/` | `packages/auth-better-auth/src/better-auth.ts:1-6` (imports only `@netscript/service/auth`, `better-auth`, `hono`) |
| `createBetterAuthAuthenticator` calls `auth.api.getSession` and captures Set-Cookie | ✅ `auth.api.getSession({ headers, returnHeaders: true })` + `headersFromBetterAuth(headers)` extracts `setCookies` via `getSetCookie()` or `splitSetCookie` | `packages/auth-better-auth/src/better-auth.ts:140-143, 251-272` |
| `mountBetterAuthHandler` mounts the Fetch handler | ✅ `app.all(basePath, (context) => auth.handler(context.req.raw))` | `packages/auth-better-auth/src/better-auth.ts:177-186` |
| Principal mapping | ✅ `subject: user.id`, `scopes: [session.permissions, user.permissions]`, `roles: [user.role, activeOrganizationRole, ...]`, `scheme: 'custom'` | `packages/auth-better-auth/src/better-auth.ts:204-223` |

better-auth test coverage: 7 tests passed (getSession-to-Principal map, missing session rejection, refreshed cookie emission, Prisma adapter wrapper, node-compat smoke, mount handler, base path normalization).

### ADDITIVE ONLY: `@netscript/service/auth` contract consumed, NOT redefined

- `packages/auth-workos/src/workos-authenticator.ts:1-6` — `import type { AuthenticatorPort, AuthnRequest, AuthnResult, Principal } from '@netscript/service/auth'`
- `packages/auth-better-auth/src/better-auth.ts:1-6` — same import
- `packages/auth-workos/mod.ts:40` — re-exports types for consumer ergonomics (not redefinition)
- `packages/auth-better-auth/mod.ts:37` — re-exports types for consumer ergonomics (not redefinition)
- No `interface AuthenticatorPort` or `type AuthnResult` definitions in either package (verified via grep).

### CATALOG LAW

- `packages/auth-workos/package.json` — `"@workos-inc/node": "catalog:"`, `"jose": "catalog:"`
- `packages/auth-better-auth/package.json` — `"better-auth": "catalog:"`
- `deno.json:96-114` — catalog block contains `better-auth: "^1.6.20"`, `@workos-inc/node: "^10.4.0"`, `jose: "^5.9.2"`
- No de-catalog: `@prisma/client`, `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts` untouched (verified via `git diff --stat HEAD~5..HEAD`).
- Catalog pins match `npm dist-tags.latest` (verified in plan-eval).

## Independently re-run gates (this evaluator session)

| Gate | Command | Exit code | Findings |
| --- | --- | --- | --- |
| Scoped type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-workos --root packages/auth-better-auth --ext ts,tsx` | **0** | 0 occurrences |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/auth-workos --root packages/auth-better-auth --ext ts,tsx` | **0** | 0 occurrences |
| Scoped fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/auth-workos --root packages/auth-better-auth --root .llm/tools/auth --ext ts,tsx --ignore-line-endings` | **0** | 11 files selected, 0 findings |
| WorkOS tests | `deno test --allow-net packages/auth-workos/tests/` | **0** | 6 passed, 0 failed |
| better-auth tests | `deno test --allow-net --allow-env packages/auth-better-auth/tests/` | **0** | 7 passed, 0 failed |
| WorkOS doc-lint | `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/auth-workos --pretty` | **0** | 0 missing JSDoc, 0 private-type-ref |
| better-auth doc-lint | `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/auth-better-auth --pretty` | **0** | 0 missing JSDoc, 0 private-type-ref |
| publish:dry-run | `deno task publish:dry-run` | **0** | Isolated declarations satisfied, no carve-out |

All gates **PASS** with raw exit code 0.

## Node-compat smoke verification

- **WorkOS**: `packages/auth-workos/tests/workos-node-compat_test.ts` imports `@workos-inc/node@10.4.0` and constructs `new WorkOS(...).userManagement.loadSealedSession(...).authenticate()` under Deno 2.8.3 node-compat. Test passed (16ms).
- **better-auth**: `packages/auth-better-auth/tests/better-auth-node-compat_test.ts` imports `better-auth@1.6.20` and constructs `betterAuth({ secret, baseURL })` under Deno 2.8.3. Test passed (20ms).

Both node-compat smokes confirm the provider SDKs resolve and execute under Deno's node-compatibility layer.

## Fitness gates (per archetype-gate-matrix.md)

| Gate | Arch-2 status | Evidence |
| --- | --- | --- |
| F-1 File-size lint | required | All files < 300 lines (verified via `wc -l packages/auth-*/src/*.ts`) |
| F-2 Helper-reinvention scan | required | No hand-rolled JWT/crypto; wraps upstream APIs (`jose`, `better-auth`, WorkOS SDK) |
| F-3 Layering check | required | Layering fix honored: no `@netscript/database` import in better-auth package |
| F-4 Inheritance audit | required | No class inheritance; pure functions + interfaces |
| F-5 Public surface audit | required | `mod.ts` exports only named factories + types; no accidental exports |
| F-6 JSR publishability | required | `publish:dry-run` passed (isolated declarations satisfied) |
| F-7 Doc-score gate | required | doc-lint: 0 missing JSDoc, 0 private-type-ref for both packages |
| F-8 Workspace lib check | required | No `lib/` folders; flat `src/` layout |
| F-9 Permission decl check | required | Tests declare `--allow-net`, `--allow-env`; no unscoped permissions |
| F-10 Test-shape audit | required | 6 + 7 tests, all < 100 lines, no test inheritance |
| F-11 Forbidden-folder lint | required | No `ports/`, `adapters/`, `factory/` subfolders (Archetype-2 precedent honored) |
| F-12 Naming-convention lint | required | Kebab-case files, PascalCase types, camelCase functions |
| F-13 Saga/runtime invariants | n/a | Not a saga/runtime package |
| F-14 Console-log lint | required | No `console.log` in source (verified via grep) |
| F-15 Re-export-upstream lint | required | Re-exports only upstream port types (not redefinition) |
| F-16 Folder-cardinality lint | required | Flat `src/` with 1 file each (WorkOS: `workos-authenticator.ts`; better-auth: `better-auth.ts`) |
| F-17 Abstract-derived co-location | required | N/A (no abstract classes) |
| F-18 Sub-barrel lint | required | No sub-barrel `mod.ts` in `src/` (only root `mod.ts`) |

All Archetype-2 required fitness gates satisfied.

## Allowed deferrals (confirmed in drift.md)

| Deferred item | Recorded in drift.md? |
| --- | --- |
| WorkOS webhook-to-database user/org sync | ✅ Line 5: "WorkOS webhook-to-database user/org sync remains deferred by the approved plan." |
| CLI scaffold prompts for auth provider selection | ✅ Line 6: "CLI scaffold prompts for auth provider selection remain deferred by the approved plan." |
| Pre-existing repo-wide `arch:check` + `deps:audit` (`undici`/`vite`) findings outside new packages | ✅ Lines 14-17: "deno task deps:audit still reports pre-existing undici and vite advisories... deno task arch:check still reports pre-existing repository-wide doctrine failures outside the new auth adapter packages." |

All deferred items are recorded in `drift.md`. **Not gate failures** for this slice.

## Lock hygiene

- `deno.lock` changed only to register:
  - Two new workspace members (`@netscript/auth-workos`, `@netscript/auth-better-auth`).
  - `npm:better-auth@1.6.20` exact resolver (touched by schema-generation wrapper smoke per drift.md line 19-21).
  - `@workos-inc/node` + `jose` transitive dependency graph.
- No `deno cache --reload` or destructive lock-file reset.
- No source churn required to fix lock-related issues.

## Commit ordering (verified via commits.md)

1. `2a0930c5` — Add auth adapter package scaffolds (slice 1)
2. `2718ca98` — Add WorkOS sealed session authenticator (slice 2)
3. `bd3e889b` — Add WorkOS access token authenticator (slice 3)
4. `90fd97d4` — Add better-auth Prisma authenticator (slice 4)
5. `76aa91da` — Add better-auth mount and schema tooling (slice 5)
6. `104687e3` — Document auth adapters and readiness (slice 6)

6 commits, in plan-specified order, each with its own gate verification in `worklog.md`.

## Verdict

`PASS`

**Rationale:**

1. ✅ All production/enterprise bar requirements satisfied:
   - WorkOS sealed-session authenticator calls REAL `loadSealedSession().authenticate()` and maps a real `Principal`.
   - WorkOS refresh emits rotated session via `AuthnResult.setCookies`.
   - WorkOS access-token authenticator performs REAL `jose` JWKS signature verification with audience binding (NOT a decode-only shim).
   - better-auth wraps better-auth's own first-party `prismaAdapter` (no hand-rolled store).
   - better-auth does NOT import `@netscript/database` (PLAN-EVAL layering fix honored).
   - better-auth authenticator calls `auth.api.getSession` and captures `Set-Cookie` via `headersFromBetterAuth`.
   - better-auth mount helper mounts the Fetch handler on the Hono app.
2. ✅ ADDITIVE ONLY: `@netscript/service/auth` contract is consumed, not redefined or modified.
3. ✅ CATALOG LAW: `better-auth ^1.6.20` + `@workos-inc/node ^10.4.0` referenced via `catalog:` ONLY inside the new packages; no de-catalog; `@prisma/client`/`jose` pins, `packages/aspire/src/public/mod.ts`, and `scaffold-versions.ts` untouched.
4. ✅ All required gates passed (scoped check, lint, fmt, tests, doc-lint, publish:dry-run) with raw exit code 0.
5. ✅ Node-compat smokes for both provider SDKs confirmed under Deno 2.8.3.
6. ✅ All Archetype-2 fitness gates satisfied.
7. ✅ Deferred scope is recorded in `drift.md` (WorkOS webhook sync, CLI scaffold prompts, pre-existing repo-wide `arch:check`/`deps:audit` findings).
8. ✅ Lock hygiene preserved (no `deno cache --reload`, no source churn required).
9. ✅ Commit ordering follows the approved plan (6 slices, in order).

**No findings.** Implementation is complete, tested, documented, and ready to merge to the umbrella branch `feat/framework-prime-time`.

## Notes

- The evaluator independently re-ran all selected gates and verified the production bar with file:line evidence. No trust was placed in the worklog alone.
- The PLAN-EVAL cycle-1 PASS was verified before implementation began (per `plan-eval.md` verdict line).
- The design checkpoint is recorded in `worklog.md` (slice 1 through slice 6, each with gate verification).
- The two provider packages are Archetype-2 (Integration) and Archetype-5 overlay (schema-contribution mechanic) for better-auth only. The label is shorthand, not a true Archetype-5 classification (per plan-eval note 2).
- The `@netscript/database` layering hedge was resolved toward the cleaner precedent (consumer brings the instance), matching `prisma-adapter-mysql` (per plan-eval note 3).
- The consumer-import validation gate (per archetype matrix) was verified via the standalone `deno eval` test recorded in `worklog.md` slice 6.
- This is cycle 1 of the allowed 2; the verdict is `PASS`, so no escalation is required.
