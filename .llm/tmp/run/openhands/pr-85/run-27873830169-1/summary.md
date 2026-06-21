# IMPL-EVAL: @netscript/plugin-auth-core (PR #85)

## Summary

Successfully executed all required IMPL-EVAL gates for the auth-core foundation package. All 18 tests pass, type checking is clean, formatting is correct, and JSR publishing works without private-type-ref leaks. The package structure conforms to doctrine: domain imports from service/auth, ports define pure backend contracts, contracts/v1 exposes typed oRPC schemas only (no router), and streams use defineStreamSchema from plugin-streams-core.

## Gate Results

| Gate | Command | Exit Code | Status |
|------|---------|-----------|--------|
| Deno Check (tool) | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-auth-core --ext ts,tsx` | 0 | ✓ PASS |
| Deno Check (task) | `deno task --cwd packages/plugin-auth-core check` | 0 | ✓ PASS |
| Deno Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-auth-core --ext ts,tsx` | 0 | ✓ PASS |
| Deno Fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-auth-core --ext ts,tsx` | 0 | ✓ PASS |
| Deno Test | `deno test --unstable-kv --allow-all packages/plugin-auth-core` | 0 | ✓ PASS (18/18 tests) |
| JSR Publish | `deno publish --dry-run` | 1 → 0* | ✓ PASS (clean types) |

*Exit 1 was due to uncommitted `.llm/tmp/` harness artifacts; `--allow-dirty` confirms JSR readiness with no slow types or private-ref leaks.

## Consumer Import Validation

Created `scratch-consumer.ts` importing all 8 subpath exports from the package's public surface:
- Root (`./mod.ts`)
- Domain (`./domain`)
- Ports (`./ports`)
- Contracts v1 (`./contracts/v1`)
- Streams (`./streams`)
- Config (`./config`)
- Presets (`./presets`)
- Testing (`./testing`)

**Result:** `deno check --unstable-kv scratch-consumer.ts` → exit 0 ✓  
**Cleanup:** Scratch file deleted after validation.

## Boundary & Lock Hygiene

**PR scope:** `git diff --stat origin/feat/prime-time/auth...HEAD`
- ✓ Only `packages/plugin-auth-core/` added (31 new files)
- ✓ Only one modified file: `deno.lock` (added plugin-auth-core workspace entry)
- ✓ No changes to root `deno.json`, `packages/aspire/`, or `scaffold-versions.ts`
- ✓ No CRLF↔LF churn detected

**deno.lock diff:** 7 lines added for plugin-auth-core workspace dependencies:
```
packages/plugin-auth-core: {
  dependencies: [
    "jsr:@std/assert@1",
    "jsr:@zod/zod@4.4.3",
    "npm:@orpc/contract@^1.14.6"
  ]
}
```

## Conformance Review

### ✓ Domain (`src/domain/mod.ts`)
- Imports `AuthenticatorPort`, `AuthnRequest`, `AuthnResult`, `Principal` from `@netscript/service/auth` (issue #77 seam)
- Does NOT redefine these ports; only re-exports them
- Defines `AuthSession`, `AuthUser`, `Account` as normalized domain types
- Exposes `AuthUserSchema`, `AuthSessionSchema`, `AccountSchema` with Zod validation
- Schema constants `AUTH_SESSION_STATES`, `AUTH_ACCOUNT_STATES` are readonly enums

### ✓ Ports (`src/ports/mod.ts`)
- Pure `AuthBackendPort` interface extends `AuthenticatorPort` (line 98)
- Registry type is `Map<string, AuthBackendPort>` (line 142)
- Default selection seam via `resolveBackend()` function (line 150)
- `ResolvedAuthBackendRegistry` type includes `default: AuthBackendPort` and `resolveBackend()` method
- No implementation details; all types and pure contracts

### ✓ Contracts v1 (`src/contracts/v1/`)
- `mod.ts` exports only schemas and types from `auth.contract.ts`
- `auth.contract.ts` defines `authContract` using `oc.errors()` base (line 138)
- No router implementation (no `router()`, no `createRouter()`)
- Schemas wrap Zod validators with `AuthContractSchema<TOutput>` structural interface
- Exported `authContractV1` is a typed oRPC contract definition (lines 280-313)

### ✓ Streams (`src/streams/mod.ts`)
- Imports `defineStreamSchema` from `@netscript/plugin-streams-core` (line 7)
- `authStreamSchema` uses `defineStreamSchema()` with Zod entity schema (lines 117-123)
- `AuthStreamEventSchema` and `AuthStreamSessionSchema` expose auth event/session stream types
- Event types are readonly array constants: `AUTH_STREAM_EVENT_TYPES` (lines 20-26)

## Verdict

**PASS**

All gates pass. The package is JSR-ready, passes strict type checking under `isolatedDeclarations`, and conforms to NetScript package doctrine. The deno.lock workspace entry is the only non-source change and is necessary for workspace resolution.

## Changes Made

- **Executed:** All 6 required gate commands captured verbatim exit codes
- **Validated:** Consumer import surface with scratch file (deleted after)
- **Verified:** PR boundary hygiene (no unauthorized changes)
- **Reviewed:** All 4 module boundaries for doctrine conformance

## Remaining Risks

None identified. The package is ready for review and merge.
