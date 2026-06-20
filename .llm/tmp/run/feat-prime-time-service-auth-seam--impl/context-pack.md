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

Slice 3 implementation is complete: auth contracts and default authenticators exist, and ordered scope/role authorization is implemented with deny-by-default tests.

## Completed

- Pre-flight branch and upstream confirmation.
- Approved research, plan, plan metadata, doctrine, archetype, service overlay, gate matrix, and debt registry loaded.
- Implementation run artifacts created.
- Slice 1 auth contracts added and static gates passed.
- Slice 2 authenticators added and targeted tests/static gates passed.
- Slice 3 scope authorizer added and targeted tests/static gates passed.

## In Progress

- Slice 3 commit/push/PR comment.

## Next Steps

1. Commit slice 3.
2. Push with explicit refspec and comment on PR #77.
3. Start slice 4 auth middleware.

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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Slice 1-3 check/lint/fmt wrappers passed. |
| Fitness | NOT_RUN | Pending export slices. |
| Runtime | PASS | Slice 2 authenticator and slice 3 authorizer unit tests passed. |
| Consumer | NOT_RUN | Pending final gate. |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none introduced.

## Commits

- 6699099: feat(service): auth port and principal types
- 6f81290: feat(service): add default authenticators
