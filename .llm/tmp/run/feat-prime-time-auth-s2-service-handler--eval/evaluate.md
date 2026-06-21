# IMPL-EVAL Verdict: S2 auth service-handler seam (separate-session evaluator)

**Branch:** `feat/prime-time/auth-s2-service-handler`
**Base:** `feat/prime-time/auth` (auth umbrella)
**Commits:** `e3a43b84..8d61f6be` (3 commits)
**Evaluator:** OpenHands (separate session, read-only verification)

## Verdict

Verdict: PASS

## Evidence Summary

### 1. Seam correctness — PASS

**Auth v1-handlers.ts (line 33):**
```
const router = authContractV1.$context<AuthServiceContext>();
```

**Export map (line 36):**
```
export const authV1: Record<string, unknown> = {
```

**Handler bindings (lines 37-42):** each handler uses `router.X.handler(...)` destructure.

This matches the sagas exemplar at `plugins/sagas/services/src/routers/v1-handlers.ts:26,29`:
```
const router = sagasContractV1.$context<SagaServiceContext>();
export const sagasV1: Record<string, unknown> = {
```

The removed indirection types (`AuthRouteHandler`, `AuthImplementedContract`, `AuthRouteOptions`) no longer exist in `v1-types.ts`. The per-handler `try/catch` + `throwContractError` double-casts are replaced by `errors.X({...})` calls through the oRPC contract-errors context parameter.

### 2. Error routing — PASS

Handler errors flow through the central `ErrorHandlingPlugin` (order 900, `packages/telemetry/src/orpc/error-plugin.ts`). Each handler uses `errors.X({...})` from the destructured handler context instead of throwing `ORPCError` directly. Errors propagate as `AuthServiceHandlerError` with structured `code` + `status` + `data` fields — consumed centrally by the oRPC error plugin's `call` interceptor.

The test "auth handler errors keep observable central oRPC envelopes" (5 sub-assertions covering signin/callback/signout/session/me) confirms the full envelope lifecycle: handler throws → `AuthServiceHandlerError` → `ErrorHandlingPlugin.call()` intercepts → `ORPCError` with correct code/status/data.

### 3. Zero NEW casts — PASS

```
grep -nE '\bas\b' plugins/auth/services/src/routers/{v1-handlers,v1-types,health}.ts
```
**Result:** 0 matches. The generator's commit `8d61f6be` removed the last remaining `resolveBackend() as InteractiveAuthBackend` cast, replacing it with a type annotation.

Sanctioned casts in `router.ts` (top-level router composition, `deno-lint-ignore`d) pre-date this slice and are identical to the sagas pattern in `plugins/sagas/services/src/router.ts:43-47`. These are OUT OF SCOPE per cast policy.

No `@ts-ignore` or `@ts-expect-error` in any changed source files. The single `@ts-expect-error` in the test file `auth-v1-context-types_test.ts:13` is an intentional negative type assertion (proves invalid input field is rejected at compile time).

### 4. Tests are real — PASS

```
deno test --allow-all --unstable-kv plugins/auth/tests/services/
```
**Result:** 6 passed, 0 failed (309ms)

| Test | Coverage |
|------|----------|
| `signin callback session me signout round-trip` | Full auth flow through contract-bound handlers (signin → callback → session → me → signout) |
| `backend selection reads NETSCRIPT_AUTH_BACKEND` | Backend registry error path (unknown backend → `AuthBackendNotFoundError`) |
| `unsupported interactive backend operation` | Error mapping for non-interactive backends (`AuthServiceHandlerError` with correct code) |
| `auth handler errors keep observable central oRPC envelopes` | 5 sub-tests: handler throws → ErrorHandlingPlugin intercepts → ORPCError with structured data |
| `auth v1 handlers infer contract input context and errors` | Compile-time type inference: input fields, context methods, error variants all correctly typed via `$context<T>()` |
| `public contract and service imports resolve` | Import surface stability (no regressions in module exports) |

### 5. Type soundness end-to-end — PASS

```
deno run --allow-read --allow-run --allow-env .llm/tools/run-deno-check.ts --root plugins/auth --ext ts,tsx
```
**Result:** 0 errors.

The `$context<AuthServiceContext>()` binding provides handlers with correctly-typed `input` (from contract input schema), `context` (AuthServiceContext with registry/request), and `errors` (typed error constructors matching `authV1Contract.errors`). The compile-time test `auth-v1-context-types_test.ts` asserts this inference.

### 6. Lock hygiene — PASS

```
git show --stat e3a43b84..8d61f6be
```
**Result:** None of the 3 commits touch `deno.lock`. Changed files are confined to `plugins/auth/services/src/routers/` (3 files) and `plugins/auth/tests/services/` (2 files), plus harness artifacts in `.llm/tmp/run/` (not source).

### 7. Scope confinement — PASS

```
git diff --name-only e3a43b84..8d61f6be | grep -v '^\.llm/tmp/'
```
**Result:**
```
plugins/auth/services/src/routers/v1-handlers.ts
plugins/auth/services/src/routers/v1-types.ts
plugins/auth/services/src/routers/health.ts
plugins/auth/tests/services/auth-service_test.ts
plugins/auth/tests/services/auth-v1-context-types_test.ts
```

All changes confined to `plugins/auth/`. No out-of-scope edits.

### 8. Gate commands — ALL PASS

| Gate | Command | Result |
|------|---------|--------|
| Type check | `run-deno-check.ts --root plugins/auth --ext ts,tsx` | 0 errors |
| Lint | `run-deno-lint.ts --root plugins/auth --ext ts,tsx` | 0 errors |
| Format | `run-deno-fmt.ts --root plugins/auth --ext ts,tsx` | 0 errors |
| Tests | `deno test --allow-all --unstable-kv plugins/auth/tests/services/` | 6/6 pass |

## Sagas Exemplar Comparison

| Pattern | Sagas | Auth S2 | Match |
|---------|-------|---------|-------|
| Contract context binding | `sagasContractV1.$context<SagaServiceContext>()` | `authContractV1.$context<AuthServiceContext>()` | ✅ |
| Handler map typing | `Record<string, unknown>` | `Record<string, unknown>` | ✅ |
| Handler binding | `router.X.handler(...)` | `router.X.handler(...)` | ✅ |
| Error handling | Central `ErrorHandlingPlugin` via `errors.X({...})` | Central `ErrorHandlingPlugin` via `errors.X({...})` | ✅ |
| Cast policy | Zero in handlers, sanctioned in router.ts | Zero in handlers, sanctioned in router.ts | ✅ |
| Top-level router composition | `any` + `deno-lint-ignore` | `any` + `deno-lint-ignore` | ✅ |

## Conclusion

S2 is a conformant sagas-parity rebind. The contract-context seam, central error routing, zero-cast handler policy, and test coverage all match the merged exemplar. No scope creep, no lock churn, no new architectural debt.

Verdict: PASS
