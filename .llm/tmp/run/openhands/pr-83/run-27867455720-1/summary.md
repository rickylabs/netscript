# IMPL-EVAL Summary — service-auth-adapters

## Summary

Independent IMPL-EVAL completed for the `service-auth-adapters` prime-time slice (`@netscript/auth-better-auth` + `@netscript/auth-workos`) on PR #83 branch `feat/prime-time/service-auth-adapters`.

**Verdict: `PASS`**

All production/enterprise bar requirements verified with file:line evidence. All required gates passed (exit code 0). No stubs, no no-ops, no contract redefinition, no catalog violations.

## Changes Evaluated

### New packages
- `packages/auth-workos` — WorkOS AuthKit authenticators (sealed-session + JWKS access-token)
- `packages/auth-better-auth` — better-auth integration (Prisma adapter wrapper + authenticator + mount helper)
- `.llm/tools/auth/gen-better-auth-prisma.ts` — Schema generation wrapper for better-auth Prisma models

### Key implementation details
- **WorkOS sealed-session**: `createWorkosAuthenticator` calls `loadSealedSession().authenticate()` (line 159-166), maps WorkOS session to `Principal`, refresh emits rotated session via `AuthnResult.setCookies` (line 267-274)
- **WorkOS access-token**: `createWorkosAccessTokenAuthenticator` uses REAL `jose` JWKS signature verification with `createRemoteJWKSet` + `jwtVerify(token, jwks, { audience: clientId })` (line 205-218) — NOT a decode-only shim
- **better-auth Prisma wrapper**: `createNetscriptBetterAuth` wraps better-auth's own first-party `prismaAdapter` from `better-auth/adapters/prisma` (line 113-118)
- **better-auth authenticator**: `createBetterAuthAuthenticator` calls `auth.api.getSession({ headers, returnHeaders: true })` and captures `Set-Cookie` via `headersFromBetterAuth` (line 140-272)
- **better-auth mount**: `mountBetterAuthHandler` mounts the Fetch handler on Hono app (line 177-186)
- **PLAN-EVAL layering fix honored**: `@netscript/auth-better-auth` does NOT import `@netscript/database` (consumer brings Prisma client instance at boundary)

### Additive-only contract consumption
- Both packages CONSUME `AuthenticatorPort`/`AuthnRequest`/`AuthnResult`/`Principal` from `@netscript/service/auth` (not redefined)
- Type re-exports in `mod.ts` are for consumer ergonomics (not redefinition)

### Catalog law compliance
- `packages/auth-workos/package.json` — `"@workos-inc/node": "catalog:"`, `"jose": "catalog:"`
- `packages/auth-better-auth/package.json` — `"better-auth": "catalog:"`
- Workspace root `deno.json:96-114` — catalog block contains `better-auth: "^1.6.20"`, `@workos-inc/node: "^10.4.0"`, `jose: "^5.9.2"`
- No de-catalog; `@prisma/client`/`jose` pins, `packages/aspire/src/public/mod.ts`, and `scaffold-versions.ts` untouched

## Validation (independently re-run gates)

| Gate | Command | Exit code | Result |
|------|---------|-----------|--------|
| Scoped type-check | `run-deno-check.ts --root packages/auth-workos --root packages/auth-better-auth --ext ts,tsx` | **0** | 0 occurrences |
| Scoped lint | `run-deno-lint.ts --root packages/auth-workos --root packages/auth-better-auth --ext ts,tsx` | **0** | 0 occurrences |
| Scoped fmt | `run-deno-fmt.ts --root packages/auth-workos --root packages/auth-better-auth --root .llm/tools/auth --ext ts,tsx --ignore-line-endings` | **0** | 11 files, 0 findings |
| WorkOS tests | `deno test --allow-net packages/auth-workos/tests/` | **0** | 6 passed, 0 failed |
| better-auth tests | `deno test --allow-net --allow-env packages/auth-better-auth/tests/` | **0** | 7 passed, 0 failed |
| WorkOS doc-lint | `run-deno-doc-lint.ts --root packages/auth-workos --pretty` | **0** | 0 missing JSDoc, 0 private-type-ref |
| better-auth doc-lint | `run-deno-doc-lint.ts --root packages/auth-better-auth --pretty` | **0** | 0 missing JSDoc, 0 private-type-ref |
| publish:dry-run | `deno task publish:dry-run` | **0** | Isolated declarations satisfied, no carve-out |

**All gates passed with raw exit code 0.**

### Node-compat smoke verification
- **WorkOS**: `workos-node-compat_test.ts` imports `@workos-inc/node@10.4.0` and constructs `new WorkOS(...).userManagement.loadSealedSession(...).authenticate()` under Deno 2.8.3 node-compat → PASSED (16ms)
- **better-auth**: `better-auth-node-compat_test.ts` imports `better-auth@1.6.20` and constructs `betterAuth({ secret, baseURL })` under Deno 2.8.3 → PASSED (20ms)

Both provider SDKs resolve and execute under Deno's node-compatibility layer.

## Remaining Risks

### Recorded deferrals (documented in drift.md, not gate failures)
1. **WorkOS webhook-to-database sync**: User/org sync from WorkOS webhooks to database remains deferred (documented optional fast-follow per plan §1 out-of-scope)
2. **CLI scaffold prompts**: Auth provider selection prompts for CLI scaffold remain deferred (not in slice scope)
3. **Pre-existing repo-wide findings**: `deno task arch:check` + `deps:audit` still report pre-existing `undici`/`vite` advisories and repository-wide doctrine failures outside the new auth adapter packages (per drift.md lines 14-17)

### Operational considerations
- Consumer owns running `better-auth` Prisma migration (plan §1 out-of-scope + locked decision 9). Slice ships generation + wiring; migration step is NOT a runtime dep
- Services must configure NetScript auth exemption/`allowAnonymous` policy for `/api/auth/**` when using `mountBetterAuthHandler` (per worklog slice 5)
- Catalog pins `better-auth ^1.6.20` + `@workos-inc/node ^10.4.0` match `npm dist-tags.latest` as of evaluation (verified in plan-eval)

## Next Steps

Branch `feat/prime-time/service-auth-adapters` is ready to merge to umbrella branch `feat/framework-prime-time`. All six implementation slices are complete, tested, documented, and gate-verified. The umbrella PR #83 can proceed with this slice plus the already-merged `service-auth-seam` (#77).

---

**Evaluator session**: Separate-session IMPL-EVAL, cycle 1, 2026-06-20  
**Evaluation artifacts**: `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-adapters/evaluate.md`  
**Raw gate logs**: `/tmp/eval-{check,lint,fmt}.{log,txt}` (local to evaluator session)
