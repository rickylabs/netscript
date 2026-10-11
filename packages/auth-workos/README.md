# @netscript/auth-workos

[![JSR](https://jsr.io/badges/@netscript/auth-workos)](https://jsr.io/@netscript/auth-workos)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A WorkOS AuthKit backend for NetScript: verifies AuthKit sealed-session cookies and bearer JWTs
and maps them to NetScript principals through the standard auth backend port.**

When WorkOS AuthKit handles your sign-in, the remaining question is what your API does with the
credential on every request. This package answers it twice: `createWorkosAuthenticator` verifies
AuthKit sealed-session cookies (with optional automatic refresh), and
`createWorkosAccessTokenAuthenticator` verifies bearer access tokens against the WorkOS JWKS — both
producing the same NetScript `Principal`, so route handlers authorize identically whether the caller
is a browser session or an API client. `createWorkosBackend` bundles the cookie path into the full
`AuthBackendPort` that NetScript services consume.

## Why teams use it

- **Standard backend port** — `createWorkosBackend(options)` returns a pure `AuthBackendPort` named
  `workos` with a provider registry, request-derived session lookup, backend-owned session-token
  crypto, and principal mapping.
- **Sealed-session authenticator** — `createWorkosAuthenticator(options)` verifies AuthKit
  sealed-session cookies and plugs directly into `@netscript/service` authentication.
- **Bearer JWT authenticator** — `createWorkosAccessTokenAuthenticator(options)` verifies access
  tokens against the WorkOS JWKS, with an optional issuer constraint.
- **Faithful principal mapping** — the WorkOS user id or JWT `sub` becomes `subject`, WorkOS
  permissions become `scopes`, and `organizationId` / `sessionId` surface as claims.
- **Honest capability boundaries** — WorkOS owns session creation, refresh, and revocation, so
  `createSession`, `refreshSession`, and `revokeSession` raise
  `AuthBackendOperationUnsupportedError` rather than fabricating local state.

## Install

```bash
deno add jsr:@netscript/auth-workos@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line.

## Quick example

Prerequisites: a WorkOS account with AuthKit configured, and `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`,
and `WORKOS_COOKIE_PASSWORD` in the environment.

```typescript
import { createService, type ServiceRouter } from '@netscript/service';
import { WorkOS } from '@workos-inc/node';
import { createWorkosBackend } from '@netscript/auth-workos';

// Your oRPC router and a configured WorkOS AuthKit SDK client.
declare const router: ServiceRouter;
const workos = new WorkOS(Deno.env.get('WORKOS_API_KEY')!, {
  clientId: Deno.env.get('WORKOS_CLIENT_ID')!,
});

const service = createService(router, { name: 'private-api' })
  .withAuthn({
    authenticator: createWorkosBackend({
      workos,
      cookiePassword: Deno.env.get('WORKOS_COOKIE_PASSWORD')!,
      refresh: 'always',
      providers: [{ id: 'workos', displayName: 'WorkOS' }],
    }),
  });
```

## Subject-wide logout

The official auth plugin wires a durable WorkOS revocation store and a service-owned background
worker automatically. `signout { everywhere: true }` atomically writes a subject fence and a durable
work item; it never lists or revokes individual WorkOS sessions inside the request.

The worker uses the service's WorkOS API key, processes at most 50 sessions per delivery, and
checkpoints each page. Partial failures retry automatically without an attempt limit, with
exponential backoff capped at 60 seconds. Storage errors are supervised with the same cap and
reported through the service logger and telemetry using identifier-free classifications. Idle
workers back off to one KV read per minute. A process restart resumes pending work; the service's
shutdown hook aborts admission and drains an active delivery on SIGTERM, SIGINT, or manual stop.

If a storage failure follows upstream success, a bounded, durable retention-repair pass
sets expiry before the subject fence clears; it never touches a newer job's tombstones.

Per-session tombstones have no expiry until upstream revocation succeeds. Then they expire after
`maxAccessTokenLifetimeMs + clockSkewMs`, measured from that success, so a long outage cannot shorten
retention. Defaults are one day and one minute. Configure `WORKOS_ACCESS_TOKEN_MAX_LIFETIME_MS` in the
plugin to cover the longest access-token duration in your [WorkOS application settings](https://workos.com/docs/authkit/sessions).
After a subject logout, verified tokens missing expiry or exceeding the configured lifetime fail
closed even after tombstone expiry. `WORKOS_CLOCK_SKEW_MS` controls both retention padding and the upstream session cutoff margin.
Sessions created within that margin are conservatively revoked; sessions beyond it are preserved.
During cleanup, **all** NetScript credentials of that subject are refused, including new sessions;
they become usable automatically when upstream cleanup succeeds. Other subjects stay usable.

Standalone compositions must pass the same `revocations` store to their backend and any bearer or
sealed-session authenticators. Use `createWorkosRevocationStore(hostKv)` with an atomic `KvStore`.
Run `revokeWorkosSubjectPage(store, workos, delivery, signal)` in a background worker against
`store.nextDelivery(now)`, retry failed pages with capped backoff until recovery, and drain it on shutdown.
Without a store, subject-wide revocation remains explicitly unsupported. Never run the page function
inside signout. The official plugin's service worker supplies this lifecycle for deployed auth APIs.

### Migration in 0.0.8

No existing option is removed. Standalone callers that enable subject-wide logout must configure the
durable store and its worker, then share the store with every authenticator; leaving a standalone
bearer authenticator unconfigured would bypass the local fence. The official plugin requires an
atomic host KV store for WorkOS and now reads its configured session-cookie name consistently. Set `NETSCRIPT_AUTH_COOKIE_NAME=wos-session` to retain an existing AuthKit cookie, or configure your
AuthKit issuer to write the plugin default `__Host-ns_session`. The CLI WorkOS preset now sets that
same name explicitly. Configure the maximum token lifetime to match your WorkOS application.
`WorkosRevocationStore` implementations expose `clockSkewMs` and implement `confirmSessionRevoked` for retention after
upstream success; the terminal `fail` operation is removed. Refresh identity changes return
`workos_session_identity_changed`; a concurrent subject fence still returns `workos_subject_revoked`.

## Public surface

| Symbol                                                                    | What it gives you                                    |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `createWorkosBackend`                                                     | The full `AuthBackendPort` for NetScript services    |
| `createWorkosAuthenticator`                                               | Sealed-session cookie verification alone             |
| `createWorkosAccessTokenAuthenticator`                                    | Bearer JWT verification against the WorkOS JWKS      |
| `AuthBackendOperationUnsupportedError`                                    | Raised for flows WorkOS owns (create/refresh/revoke) |
| `WorkosBackendOptions`, `WorkosAuthenticatorOptions`, `WorkosRefreshMode` | Configuration types                                  |

The always-current symbol list is
[`deno doc jsr:@netscript/auth-workos@<version>`](https://jsr.io/@netscript/auth-workos/doc) (pin
`<version>` on the pre-release line, as above).

## Docs

- **Reference — options, authenticators, and exports**:
  [rickylabs.github.io/netscript/reference/auth-workos/](https://rickylabs.github.io/netscript/reference/auth-workos/)
- **Identity & Access — how NetScript authentication fits together**:
  [rickylabs.github.io/netscript/identity-access/](https://rickylabs.github.io/netscript/identity-access/)
- **How-to: add authentication**:
  [rickylabs.github.io/netscript/how-to/add-authentication/](https://rickylabs.github.io/netscript/how-to/add-authentication/)
- **API docs on JSR**:
  [jsr.io/@netscript/auth-workos/doc](https://jsr.io/@netscript/auth-workos/doc)

## Compatibility

Designed for Deno; needs `--allow-net` (WorkOS API and JWKS) and `--allow-env` (credentials). The
package accepts the official `@workos-inc/node` SDK directly through its structural sealed-session
port. Session types accept a user type parameter for SDK-specific fields; omitting it preserves
extra-field access as `unknown` for existing consumers.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
