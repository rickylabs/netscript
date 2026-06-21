# Worklog: auth S2 service handler seam

## Design

### Public Surface

- `plugins/auth/services/src/routers/v1.ts` re-exports `authV1`, `signin`, `callback`, `signout`,
  `session`, `me`, and the auth handler context types.
- `plugins/auth/services/src/router.ts` exposes the top-level service router consumed by
  `services/src/main.ts`.

### Domain Vocabulary

- `AuthServiceContext`: per-request auth service context with the resolved backend registry and
  optional request data.
- `AuthServiceHandlerError`: typed domain error normalized by the central oRPC error plugin.
- `authContractV1.$context<AuthServiceContext>()`: S1 seam used for typed handler binding.

### Ports

- `ResolvedAuthBackendRegistry` from `@netscript/plugin-auth-core/ports`.
- `InteractiveAuthBackend` service-local extension of the backend port for interactive flow
  operations.

### Constants

- No new constants planned for this slice.

### Commit Slices

1. Bind S1 typed auth contract wrapper in `v1-handlers.ts`; delete fake implementer and handler
   try/catch mapping; prove with targeted `deno check`.
2. Mirror sagas by keeping the handler map typed as `Record<string, unknown>` and preserving the
   documented top-level router composition `any`; prove with targeted `deno check`.
3. Add per-procedure central error-envelope tests and compile-time handler inference assertion; prove
   with targeted tests.
4. Run service-scoped check/lint/fmt, touched service tests, and record lock hygiene.

### Deferred Scope

- No contract-package changes were in scope for S2.
- `@netscript/cli` and scaffold runtime E2E are out of scope.

### Contributor Path

Future handler work should start in `plugins/auth/services/src/routers/v1-handlers.ts`, bind through
the contract package's typed `$context` wrapper, and rely on central oRPC error handling rather than
procedure-local error conversion.

## Evidence

| Step | Command | Result | Notes |
| --- | --- | --- | --- |
| Skill activation | Read required `netscript-harness`, `netscript-doctrine`, `netscript-deno-toolchain`, `jsr-audit`, `netscript-tools`, `netscript-pr`, `codex-wsl-remote`, `rtk` skill files | PASS | Also read harness activation/run-loop, Archetype-5, service overlay, gate matrix, plan gate, and doctrine files 01, 02, 05, 06, 07, 08, 09, 10. |
| Branch sequencing | `rtk git log --oneline --decorate -20` | PASS | Branch `feat/prime-time/auth-s2-service-handler` is at umbrella tip `e3a43b84`, with AS6 and S1/S3/S4/S5 merges visible in ancestry. |
| S1 seam inspection | `deno doc --filter AuthContractV1 packages/plugin-auth-core/src/contracts/v1/mod.ts`; `deno doc --filter AuthRouter ...`; `deno doc --filter authContractV1 ...` | PARTIAL | S1 exports `authContractV1: AuthContractV1` and `$context`/`AuthRouter` symbols. |
| Scratch type check | temporary `authContractV1.$context<AuthServiceContext>()` check | PASS | Generic constraint accepts `AuthServiceContext`. Scratch file was removed. |
| Supervisor correction | Read `plugins/sagas/services/src/routers/v1-handlers.ts`, `plugins/sagas/services/src/router.ts`, and saga contract wrapper | PASS | Sagas parity is the accepted target: `Record<string, unknown>` handler map and casts confined to top-level router composition. |
| Implementation | Bound auth handlers through `authContractV1.$context<AuthServiceContext>()`, deleted fake implementer/double cast, removed five handler-level oRPC error wrappers, enriched `AuthServiceHandlerError` status/data, and added tests. | PASS | Touched handler surface has no local casts; top-level router composition cast remains in `services/src/router.ts` per exemplar. |
| Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/auth --ext ts,tsx` | PASS | 28 files selected, 0 occurrences. |
| Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/auth --ext ts,tsx` | PASS | 28 files selected, 0 occurrences. |
| Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/auth --ext ts,tsx` | PASS | 28 files selected, 0 findings. |
| Touched service tests | `deno test --unstable-kv --allow-all plugins/auth/tests/services/auth-service_test.ts plugins/auth/tests/services/auth-v1-context-types_test.ts` | PASS | 5 tests passed. |

## Error-Code-Set Decision

The central `ErrorHandlingPlugin` preserves `code`, `status`, and `data` from rich errors.
`AuthServiceHandlerError` now carries those fields directly:

- `UNAUTHORIZED` -> 401, `{ reason }`
- `VALIDATION_ERROR` -> 422, `{ formErrors, fieldErrors }`
- `AUTH_PROVIDER_ERROR` -> 502, `{ providerId, reason }`

The touched service tests assert all five auth procedure error paths retain the same observable
central oRPC envelopes after deleting `throwContractError`.

## Current Status

Implementation gates are green. Pending commit, explicit-refspec push, and supervisor IMPL-EVAL.
