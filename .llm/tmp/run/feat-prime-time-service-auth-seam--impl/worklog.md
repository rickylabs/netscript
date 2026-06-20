# Worklog: service-auth-seam implementation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-prime-time-service-auth-seam--impl` |
| Branch | `feat/prime-time/service-auth-seam` |
| Archetype | `ARCHETYPE-4 - Public DSL / Builder` |
| Scope overlays | `SCOPE-service` |

## Design

### Public Surface

- `createService(...).withAuthn(options).withAuthz(options)` — opt-in fluent auth stages for service builders.
- `defineService(router, { auth })` — preset pass-through for generated service entrypoints, off by default.
- `@netscript/service/auth` — auth types, ports, and default factory exports.
- `ServiceContext.principal` and oRPC `context.principal` — typed identity carrier for authenticated requests.

### Domain Vocabulary

- `Principal` — stable authenticated identity with subject, scopes, roles, scheme, and verified claims.
- `AuthnRequest` / `AuthnResult` — request view and discriminated authentication result.
- `AuthzRequest` / `AuthzDecision` — authorization input and discriminated decision.
- `AuthnOptions` / `AuthzOptions` — builder middleware configuration.
- `StaticCredential`, `TrustedHeaderAuthenticatorOptions`, `ScopeAuthorizationRule` — default adapter configuration.

### Ports

- `AuthenticatorPort` — consumer-supplied or default adapter boundary that converts a request into a principal or rejection.
- `AuthorizerPort` — policy boundary that decides whether a principal may proceed.

### Constants

- `DEFAULT_PROTECTED_PREFIXES` — `['/api']`.
- `DEFAULT_ANONYMOUS_PREFIXES` — `['/health']`.
- `AUTHN_FAILURE_CODES` — `missing-credential`, `invalid-credential`, `missing-identity-header`.
- `AUTH_RESPONSE_CODES` — `UNAUTHORIZED`, `FORBIDDEN`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Auth port + principal types | check/lint/fmt wrappers | `packages/service/src/auth/types.ts`, `packages/service/src/auth/options.ts` |
| 2 | Static credential + trusted-header authenticators | targeted auth tests + static wrappers | `packages/service/src/auth/static-credential-authenticator.ts`, `packages/service/src/auth/trusted-header-authenticator.ts`, `packages/service/tests/auth/authenticators_test.ts` |
| 3 | Scope/role authorizer | targeted auth tests + static wrappers | `packages/service/src/auth/scope-authorizer.ts`, `packages/service/tests/auth/authorizer_test.ts` |
| 4 | Authn/authz Hono middleware | targeted auth tests + static wrappers | `packages/service/src/auth/auth-middleware.ts`, `packages/service/tests/auth/middleware_test.ts` |
| 5 | Builder methods + principal context | integration tests + static wrappers | `packages/service/src/builder/service-builder.ts`, `packages/service/src/builder/service-builder-impl.ts`, `packages/service/src/types.ts`, `packages/service/tests/auth/builder-auth_test.ts` |
| 6 | Auth subpath exports | publish dry-run + doc check + static wrappers | `packages/service/mod.ts`, `packages/service/src/auth/mod.ts`, `packages/service/deno.json` |
| 7 | defineService auth opt-in + README/examples | full service tests + publish dry-run + consumer checks | `packages/service/src/presets/define-service.ts`, `packages/service/README.md`, `packages/service/tests/_fixtures/readme-examples_test.ts` |

### Deferred Scope

- Bundled asymmetric JWT/OAuth verification — consumer-owned via `AuthenticatorPort`; no new third-party dependency in this slice.
- Session/cookie stores and multi-tenant policy engines — separate future slices.
- Scaffold template auth examples — out of scope because generated services remain opt-in unchanged.

### Contributor Path

To add an auth mechanism, implement `AuthenticatorPort` in one focused file under `src/auth/`, cover it in `tests/auth/`, export it from `src/auth/mod.ts` only when it is part of the public `./auth` contract, then use `withAuthn()` or `defineService({ auth })` in consumers.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-06-20 | bootstrap | pre-flight | Loaded implement brief, plan, plan-meta, doctrine, archetype, scope overlay, gate matrix, and debt registry. |
| 2026-06-20 | 1 | implementation | Added `Principal`, authn/authz result/request/port contracts, and builder option types. |
| 2026-06-20 | 1 | gates | Check/lint/fmt wrappers passed. Initial check invocation with explicit `--unstable-kv` failed because the wrapper passes it by default; reran supported form successfully. |
| 2026-06-20 | 2 | implementation | Added static credential and trusted-header authenticators plus focused unit tests. |
| 2026-06-20 | 2 | gates | Targeted authenticator tests and check/lint/fmt wrappers passed. Formatter adjusted one owned auth file before final fmt pass. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Use dependency-free auth defaults | Avoid JWT dependency and upstream type leakage while closing inert auth surface. | `plan-meta.json` locked decisions |
| Defer auth/RPC installation until `build()` | Existing `withRPC()` registered immediately; deferring RPC is needed to preserve deterministic auth-before-RPC ordering independent of chain order. | `plan.md` Step 4 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None | N/A | N/A |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts --unstable-kv` | NOT_RUN | Pending implementation slices. |
| lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts` | NOT_RUN | Pending implementation slices. |
| fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts` | NOT_RUN | Pending implementation slices. |
| slice 1 check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` | PASS | Exit 0; wrapper ran `deno check --quiet --unstable-kv <files>`; 19 files, 0 diagnostics. |
| slice 1 lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts` | PASS | Exit 0; 19 files, 0 findings. |
| slice 1 fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts` | PASS | Exit 0; 19 files, 0 findings. |
| slice 2 test | `rtk proxy deno test --allow-all packages/service/tests/auth/authenticators_test.ts` | PASS | Exit 0; 8 passed, 0 failed. |
| slice 2 check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` | PASS | Exit 0; 22 files, 0 diagnostics. |
| slice 2 lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts` | PASS | Exit 0; 22 files, 0 findings. |
| slice 2 fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts` | PASS | Exit 0 after formatting owned auth files; 22 files, 0 findings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-5/F-6/F-7/F-15 | NOT_RUN | Pending export slices. | Planned for slices 6-7. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| auth behavior | NOT_RUN | Pending targeted tests. | Planned for slices 2-7. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| plugins service consumers | NOT_RUN | Pending final gate. | Planned for slice 7. |

## Handoff Notes

- Inspect `packages/service/src/auth/` first, then builder wiring in `service-builder-impl.ts`.
