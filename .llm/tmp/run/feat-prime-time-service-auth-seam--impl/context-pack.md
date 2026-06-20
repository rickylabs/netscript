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

Follow-up additive widening is complete: `AuthnRequest` now exposes full headers and cookies, successful auth can emit response headers and Set-Cookie, `Principal.claims` documents tenant/session/provider mapping, and README documents external auth router mounting with `allowAnonymous`. No provider dependency was added.

## Completed

- Pre-flight branch and upstream confirmation.
- Approved research, plan, plan metadata, doctrine, archetype, service overlay, gate matrix, and debt registry loaded.
- Implementation run artifacts created.
- Slice 1 auth contracts added and static gates passed.
- Slice 2 authenticators added and targeted tests/static gates passed.
- Slice 3 scope authorizer added and targeted tests/static gates passed.
- Slice 4 authn/authz middleware added and targeted tests/static gates passed.
- Slice 5 builder integration added and targeted integration/static gates passed.
- Slice 6 `./auth` subpath added and static/publish/doc gates passed.
- Slice 7 `defineService({ auth })`, README examples, and preset integration tests added.
- Final service tests, publish/doc checks, consumer checks, and service-scoped doctrine check passed.
- Follow-up adapter-readiness widening implemented and focused/full service gates passed.

## In Progress

- Follow-up commit/push/PR comment.

## Next Steps

1. Commit follow-up widening.
2. Push with explicit refspec and comment on PR #77.
3. Stop for supervisor IMPL-EVAL with root `arch:check` caveat unchanged.

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
| `packages/service/src/auth/mod.ts` | new | Public auth subpath manifest. |
| `packages/service/deno.json` | changed | Added `./auth` export entry. |
| `packages/service/src/presets/define-service.ts` | changed | Added optional auth pass-through. |
| `packages/service/README.md` | changed | Added auth feature, subpath, builder, and preset examples. |
| `packages/service/tests/_fixtures/readme-examples_test.ts` | changed | Added auth example assertions. |
| `packages/service/tests/auth/define-service-auth_test.ts` | new | Preset auth-off and auth-on integration tests. |
| `packages/service/src/auth/types.ts` | changed | Added full headers, cookie lookup, optional response headers/Set-Cookie, and claims mapping docs. |
| `packages/service/src/auth/auth-middleware.ts` | changed | Applies successful auth response headers and Set-Cookie values. |
| `packages/service/tests/auth/authenticators_test.ts` | changed | Updated request fixture for full headers/cookie access. |
| `packages/service/tests/auth/middleware_test.ts` | changed | Added full-header/cookie and response-write tests. |
| `packages/service/README.md` | changed | Added external auth router mounting pattern and session adapter notes. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Slice 1-7 plus follow-up check/lint/fmt wrappers passed. |
| Fitness | PASS_WITH_CAVEAT | Publish/doc/service doctrine passed; root `deno task arch:check` failed on pre-existing repo-wide findings. |
| Runtime | PASS | Targeted auth tests and full service tests passed after follow-up widening. |
| Consumer | PASS | workers/sagas/streams service checks passed. |

## Open Questions

- None.

## Drift and Debt

- Drift: root `deno task arch:check` fails outside slice; additive adapter-readiness widening recorded; service-scoped doctrine check passes.
- Debt: none introduced.

## Commits

- 6699099: feat(service): auth port and principal types
- 6f81290: feat(service): add default authenticators
- dda6fb6: feat(service): add scope authorizer
- cbfc40f: feat(service): add auth middleware
- a51cb42: feat(service): wire auth into service builder
- dbf8536: feat(service): expose auth subpath
- 5bf5086: feat(service): add defineService auth opt-in
