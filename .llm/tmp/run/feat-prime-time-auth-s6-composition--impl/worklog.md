# S6 Auth Composition Worklog

## Design

Public surface:
- `@netscript/plugin-auth-core/ports` adds `InteractiveFlowPort` and an optional
  `AuthBackendPort.interactive` sub-port.
- `@netscript/plugin-auth` service handlers continue exposing the v1 auth procedures and keep the
  accepted top-level router generic `any` exemplar.

Domain vocabulary:
- `InteractiveFlowPort` is the backend capability for redirect/callback/signout flow operations.
- `AuthServiceInitialContext` carries service-static registry state.
- `AuthServiceContext` is the execution context after the oRPC request middleware adds the request.
- `AuthPluginServiceContext` declares the auth appsettings seam supplied by the host when present.

Ports:
- Consumes `AuthBackendPort.interactive` instead of casting resolved backends to a structural
  backend subtype.
- Consumes the plugin service context through a declared optional `appsettings` property.

Constants:
- Existing backend names and auth stream constants remain unchanged.

Commit slices:
1. Composition seams: add typed interactive capability, appsettings seam, and request middleware;
   prove with auth/core scoped checks and targeted tests.
2. Gate evidence and artifacts: record validation, commit, and push with explicit refspec.

Deferred scope:
- No `@netscript/cli` changes.
- No host SDK redesign beyond a local declared optional auth appsettings seam.
- No full `scaffold.runtime` run.

Contributor path:
- Add future interactive backend support by populating `AuthBackendPort.interactive` at backend
  construction, then call through `backend.interactive` in service handlers.

## Evidence

## Capability-Seam Decision

Chosen shape: additive `AuthBackendPort.interactive?: InteractiveFlowPort`.

Rationale: `resolveBackend()` remains a narrow single-active backend registry operation, while
interactive flow support is a named optional capability on the backend port. Handlers narrow by
checking `backend.interactive`; session-only backends leave it undefined. This matches the
composition-over-cast requirement without redesigning the registry return type.

KV OAuth populates `interactive` from its existing `KvOAuthFlow` instance. WorkOS and better-auth
remain session/authentication backends only.

## Request Context Decision

`createService().withContext()` now supplies static registry context only. A Hono service middleware
captures the current raw request into request-scoped storage, and an oRPC middleware adds
`request` to the handler execution context with `next({ context: { request } })`.

## Gate Evidence

| Gate | Result |
| --- | --- |
| S2/AS6 base check | PASS: `HEAD` is `0b3521d5` S2; parent includes `e3a43b84` AS6. |
| `deno doc @netscript/plugin-auth-core/ports` | PASS: confirmed pre-change `AuthBackendPort` members before editing. |
| Targeted tests | PASS: `deno test --unstable-kv --allow-all packages/plugin-auth-core/src/ports/ports_test.ts plugins/auth/tests/services/auth-service_test.ts` (13 passed). |
| `run-deno-check` plugins/auth | PASS: 29 selected files, 0 findings. |
| `run-deno-check` packages/plugin-auth-core | PASS: 17 selected files, 0 findings. |
| `run-deno-lint` plugins/auth | PASS: 29 selected files, 0 findings. |
| `run-deno-lint` packages/plugin-auth-core | PASS: 17 selected files, 0 findings. |
| `run-deno-fmt` plugins/auth | PASS: 29 selected files, 0 findings. |
| `run-deno-fmt` packages/plugin-auth-core | PASS: 17 selected files, 0 findings. |
| `deno doc --lint` packages/plugin-auth-core full export set | PASS: 8 files checked. |
| `deno doc --lint` plugins/auth full export set | PASS: 7 files checked; upstream `@types/node` resolution warnings emitted, no doc-lint errors. |
| `deno publish --dry-run --allow-dirty` packages/plugin-auth-core | PASS: no slow-type warnings, expected file list. |
| `deno publish --dry-run --allow-dirty` plugins/auth | PASS: no slow-type warnings; existing dynamic bootstrap import warning remains. |
| Lock hygiene | PASS: `git diff -- deno.lock` empty. |

## Cast Scan

`rg` over touched auth service/core port/KV OAuth backend surfaces finds only the accepted
`authV1 as any` router exemplar in `plugins/auth/services/src/router.ts`.
