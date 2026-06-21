# Worklog — S1 Auth Contract Seam

## Design

- Public surface: `authContractV1`, `AuthContractV1`, `AuthRouter<TContext>`, named auth DTOs, Zod schemas, config/domain/stream schemas, backend ports, testing fixtures.
- Domain vocabulary: auth signin/callback/signout/session/me DTOs; auth session/user/account domain schemas; auth config and stream definitions.
- Ports: no new runtime ports; package remains an Archetype 1 contract surface.
- Constants: `AUTH_SESSION_STATES`, `AUTH_ACCOUNT_STATES`, `AUTH_STREAM_EVENT_TYPES`, `DEFAULT_AUTH_BACKEND_NAME`.
- Commit slices: S1 replaces erased contract seam and schema shims, adds compile-time regression guards, completes scoped JSR gates.
- Deferred scope: downstream `plugins/auth` handler migration belongs to S2.
- Contributor path: add new v1 auth routes in `src/contracts/v1/auth.contract.ts`, export through `src/contracts/v1/mod.ts` and `src/public/mod.ts`, and extend `auth.contract_test.ts` type guards.

## Implementation

- Replaced the hand-rolled auth contract/procedure/schema shims with `authContractV1` built by `implement(authContractDefinition) as unknown as AuthContractV1`.
- Kept the single allowed type assertion in `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts` only.
- Replaced config/domain/contract/stream schema shims with explicit `z.ZodType` public annotations.
- Collapsed the duplicate stream `AuthSession` schema by aliasing `AuthStreamSessionSchema` to the domain `AuthSessionSchema`.
- Added compile-time regression guards for `$context<TContext>()` route input/context/error typing and stream/domain session schema identity.
- Added standalone subpath re-exports needed for `deno doc --lint` over every package export entrypoint.
- Added `@orpc/server` to `packages/plugin-auth-core/deno.json` because the contract package now owns the centralized `implement()` seam.
- Discarded validation-produced `deno.lock` churn; `deno.lock` is clean by git diff.

## Gate Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Scoped check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-auth-core --ext ts,tsx` exit 0; 17 files, 0 findings |
| Scoped lint | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-auth-core --ext ts,tsx` exit 0; 17 files, 0 findings |
| Scoped fmt | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-auth-core --ext ts,tsx` exit 0; 17 files, 0 findings |
| Package tests | PASS | `deno test --unstable-kv --allow-all packages/plugin-auth-core` exit 0; 19 passed, 0 failed |
| JSR doc lint | PASS | `deno doc --lint` over `mod.ts`, `domain`, `ports`, `contracts/v1`, `streams`, `config`, `presets`, `testing`; all checked |
| JSR dry-run | PASS | `(cd packages/plugin-auth-core && rtk proxy deno publish --dry-run --allow-dirty)` exit 0; no slow-type warnings; clean file list |
| Cast/shim scan | PASS | `rg "\\bas\\b|as unknown as|as any|as never|SchemaLike|AuthDomainSchema|AuthStreamSchema|AuthContractDefinition|AuthContractProcedureLike|StandardSchemaLike|AuthConfigSchemaResult|AuthContractSchema|AuthStreamSchemaResult" packages/plugin-auth-core` finds only `as unknown as AuthContractV1` |
| Lock hygiene | PASS | `git diff --quiet -- deno.lock` exit 0 |

## IMPL-EVAL

Not self-certified. Ready for separate OpenHands IMPL-EVAL.
