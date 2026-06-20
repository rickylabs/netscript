# Context Pack: service-auth-seam implementation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-prime-time-service-auth-seam--impl` |
| Branch | `feat/prime-time/service-auth-seam` |
| Current phase | `implement` |
| Archetype | `ARCHETYPE-4 - Public DSL / Builder` |
| Scope overlays | `SCOPE-service` |

## Current State

Slice 5 implementation is complete: auth contracts/adapters/middleware exist, builder methods wire auth deterministically during `build()`, protected route/RPC/doc registration is deferred after auth, and oRPC context receives `principal`.

## Completed

- Pre-flight branch and upstream confirmation.
- Approved research, plan, plan metadata, doctrine, archetype, service overlay, gate matrix, and debt registry loaded.
- Implementation run artifacts created.
- Slice 1 auth contracts added and static gates passed.
- Slice 2 authenticators added and targeted tests/static gates passed.
- Slice 3 scope authorizer added and targeted tests/static gates passed.
- Slice 4 authn/authz middleware added and targeted tests/static gates passed.
- Slice 5 builder integration added and targeted integration/static gates passed.

## In Progress

- Slice 5 commit/push/PR comment.

## Next Steps

1. Commit slice 5.
2. Push with explicit refspec and comment on PR #77.
3. Start slice 6 auth exports and package subpath.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Two-port auth seam | `plan-meta.json` | `AuthenticatorPort` and `AuthorizerPort` are the extension boundaries. |
| No bundled JWT dependency | `plan-meta.json` | Consumers implement the port for JWT/OAuth. |
| Deterministic auth ordering | `plan.md` | Auth is installed during build before deferred RPC wiring. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tmp/run/feat-prime-time-service-auth-seam--impl/*` | new | Implementation evidence artifacts. |
| `packages/service/src/auth/types.ts` | new | Principal, authn/authz request/result, and port contracts. |
| `packages/service/src/auth/options.ts` | new | Auth builder option contracts. |
| `packages/service/src/auth/static-credential-authenticator.ts` | new | Static bearer/API-key authenticator with digest equality comparison. |
| `packages/service/src/auth/trusted-header-authenticator.ts` | new | Trusted gateway header authenticator. |
| `packages/service/tests/auth/authenticators_test.ts` | new | Unit and failure-path tests for default authenticators. |
| `packages/service/src/auth/scope-authorizer.ts` | new | Ordered scope/role authorizer. |
| `packages/service/tests/auth/authorizer_test.ts` | new | Unit tests for allow, missing scope/role, deny-by-default, and explicit allow-by-default. |
| `packages/service/src/auth/auth-middleware.ts` | new | Hono authn/authz middleware with structured decisions and safe envelopes. |
| `packages/service/tests/auth/middleware_test.ts` | new | Unit tests for middleware success and failure paths. |
| `packages/service/src/builder/service-builder.ts` | changed | Added `withAuthn` and `withAuthz` builder methods. |
| `packages/service/src/builder/service-builder-impl.ts` | changed | Deferred auth/RPC/route registration and principal context injection. |
| `packages/service/src/types.ts` | changed | Added optional `ServiceContext.principal`. |
| `packages/service/tests/auth/builder-auth_test.ts` | new | Builder integration tests for 401/403/200, health bypass, and oRPC principal context. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Slice 1-5 check/lint/fmt wrappers passed. |
| Fitness | NOT_RUN | Pending export slices. |
| Runtime | PASS | Slice 2-5 targeted auth tests passed. |
| Consumer | NOT_RUN | Pending final gate. |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none introduced.

## Commits

- 6699099: feat(service): auth port and principal types
- 6f81290: feat(service): add default authenticators
- dda6fb6: feat(service): add scope authorizer
- cbfc40f: feat(service): add auth middleware
