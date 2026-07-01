# Context Pack: auth S2 service handler seam

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-prime-time-auth-s2-service-handler--impl` |
| Branch | `feat/prime-time/auth-s2-service-handler` |
| Phase | `implement` |
| Archetype | `ARCHETYPE-5-plugin` |
| Scope overlay | `SCOPE-service` |

## Current State

Implementation is complete locally and ready for commit/push.

The supervisor overturned the initial FAIL_RESCOPE: sagas is the accepted exemplar. The auth service
now mirrors sagas by binding handlers through `authContractV1.$context<AuthServiceContext>()`,
keeping `authV1: Record<string, unknown>`, and confining the unavoidable `as any` composition cast
to `plugins/auth/services/src/router.ts`.

## Key Changes

- Removed the service-local fake implementer types and double `implement(... as unknown as ...)`
  cast from `plugins/auth/services/src/routers/v1-handlers.ts`.
- Removed the five identical procedure-level `try/catch` wrappers and deleted `throwContractError`.
- Added plugin-consumable `status` and `data` fields to `AuthServiceHandlerError` so the central
  `ErrorHandlingPlugin` preserves `UNAUTHORIZED`, `VALIDATION_ERROR`, and `AUTH_PROVIDER_ERROR`
  envelopes.
- Added central-plugin envelope tests for all five procedures and a compile-time `$context`
  inference assertion.
- Left unrelated pre-existing casts in non-handler service files untouched.

## Gates

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/auth --ext ts,tsx`
  — PASS, 28 files, 0 occurrences.
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/auth --ext ts,tsx`
  — PASS, 28 files, 0 occurrences.
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/auth --ext ts,tsx`
  — PASS, 28 files, 0 findings.
- `deno test --unstable-kv --allow-all plugins/auth/tests/services/auth-service_test.ts plugins/auth/tests/services/auth-v1-context-types_test.ts`
  — PASS, 5 tests.

## Next Step

Commit the slice, append `commits.md`, push with:

```sh
git push origin HEAD:refs/heads/feat/prime-time/auth-s2-service-handler
```

Then stop for supervisor PR handling and IMPL-EVAL.
