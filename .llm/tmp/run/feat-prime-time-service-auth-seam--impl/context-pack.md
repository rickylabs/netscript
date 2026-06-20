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

Slice 1 implementation is complete: auth principal, authn/authz request/result/port contracts, and builder option types exist under `packages/service/src/auth/`.

## Completed

- Pre-flight branch and upstream confirmation.
- Approved research, plan, plan metadata, doctrine, archetype, service overlay, gate matrix, and debt registry loaded.
- Implementation run artifacts created.
- Slice 1 auth contracts added and static gates passed.

## In Progress

- Slice 1 commit/push/PR comment.

## Next Steps

1. Commit slice 1.
2. Push with explicit refspec and comment on PR #77.
3. Start slice 2 default authenticators.

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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Slice 1 check/lint/fmt wrappers passed. |
| Fitness | NOT_RUN | Pending export slices. |
| Runtime | NOT_RUN | Pending auth tests. |
| Consumer | NOT_RUN | Pending final gate. |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none introduced.

## Commits

- 00771b4: feat(service): auth port and principal types
