---
layout: layouts/base.vto
title: '@netscript/auth-workos'
---

# `@netscript/auth-workos`

WorkOS-backed authenticator and backend adapter for NetScript auth. This page is written against
the package's public surface reported by `deno doc`.

## Exports

| Export                   | Path       |
| ------------------------ | ---------- |
| `@netscript/auth-workos` | `./mod.ts` |

## Factories

| Symbol                                 | Kind     | Description                                               |
| -------------------------------------- | -------- | --------------------------------------------------------- |
| `createWorkosBackend`                  | function | Create an `AuthBackendPort` adapter backed by WorkOS.     |
| `createWorkosAuthenticator`            | function | Create a WorkOS session authenticator.                    |
| `createWorkosAccessTokenAuthenticator` | function | Create a WorkOS access-token authenticator.               |
| `createWorkosRevocationStore`          | function | Create a durable subject fence and outbox on host KV.     |
| `revokeWorkosSubjectPage`              | function | Process one bounded upstream revocation page in a worker. |

## Options and result types

| Symbol                                  | Kind       | Description                                                      |
| --------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `WorkosBackendOptions`                  | interface  | Options for `createWorkosBackend`.                               |
| `WorkosAuthenticatorOptions`            | interface  | Options for `createWorkosAuthenticator`.                         |
| `WorkosAccessTokenAuthenticatorOptions` | interface  | Options for `createWorkosAccessTokenAuthenticator`.              |
| `WorkosProviderOptions`                 | interface  | Provider descriptor options for WorkOS.                          |
| `WorkosCookieOptions`                   | interface  | WorkOS cookie configuration.                                     |
| `WorkosCookieSession`                   | interface  | Cookie-backed WorkOS session payload.                            |
| `WorkosSessionClient`                   | interface  | WorkOS session client boundary.                                  |
| `WorkosSessionAuthenticationResult`     | type alias | Authentication result returned by WorkOS session authentication. |
| `WorkosSessionRefreshResult`            | type alias | Session refresh result.                                          |
| `WorkosRevocationRetention`             | interface  | Maximum token lifetime, clock-skew margin, and local clock.      |
| `WorkosRevocationStore`                 | interface  | Durable fence and revocation delivery port.                      |
| `WorkosRevocationJob`                   | interface  | Subject cutoff and paginated work item.                          |
| `WorkosRevocationDelivery`              | interface  | Work item and optimistic storage version.                        |
| `WorkosRevocationClient`                | interface  | Official SDK list/revoke boundary used by workers.               |

## Subject-wide revocation

The official auth plugin composes the KV fence and its background worker. Signout does one atomic
fence/outbox commit without WorkOS enumeration. Each delivery processes at most 50 sessions using
the service's API identity. It persists session tombstones before upstream revocation and checkpoints
progress. Failed pages retry indefinitely with exponential backoff capped at 60 seconds. Storage
failures are supervised and reported through the service logger and telemetry without raw errors
or credentials. Idle replicas back off to one KV read per minute. The shutdown hook aborts admission
and drains an active delivery on SIGTERM, SIGINT, and manual stop; restart resumes pending pages.

Standalone applications compose `createWorkosRevocationStore(kv, retention)` over an atomic host
`@netscript/kv` store and share it with `createWorkosBackend`, `createWorkosAuthenticator`, and any
`createWorkosAccessTokenAuthenticator`. Run `revokeWorkosSubjectPage(store, workos, delivery, signal)`
in a service-owned worker, reading `store.nextDelivery(now)` and checkpointing retries. Without a
store, subject-wide revocation remains explicitly unsupported.

The fence refuses every credential of the subject while upstream cleanup is pending. After cleanup,
the cutoff and session tombstones still refuse old or refreshed credentials; other subjects remain
usable. Failed cleanup recovers automatically when the provider or storage becomes available.

If a storage failure follows upstream success, a bounded, durable retention-repair pass
sets expiry before the subject fence clears; it never touches a newer job's tombstones.

Tombstones expire only after upstream revocation succeeds, plus the longest configured access-token
lifetime and clock-skew padding. `WorkosRevocationRetention.maxAccessTokenLifetimeMs` defaults to
one day, and `clockSkewMs` to one minute. In the plugin, set `WORKOS_ACCESS_TOKEN_MAX_LIFETIME_MS` to
cover the longest access-token duration in your [WorkOS application settings](https://workos.com/docs/authkit/sessions).
After a subject logout, tokens missing expiry or exceeding the configured lifetime fail closed even
after tombstone expiry. Set `WORKOS_CLOCK_SKEW_MS` for the allowed provider/local difference; the upstream cutoff includes
that same margin, conservatively ending sessions within it while preserving later sessions.

### Migration in 0.0.8

The plugin requires atomic host KV for WorkOS. It reads `NETSCRIPT_AUTH_COOKIE_NAME`, defaulting to
`__Host-ns_session`. The CLI WorkOS preset explicitly sets `wos-session` to match AuthKit's SDK
default. Configure your AuthKit issuer
with the same name, or set `NETSCRIPT_AUTH_COOKIE_NAME=wos-session` for an existing cookie.
Standalone callers must share the store across all authenticators and run the cleanup worker.
Custom stores expose `clockSkewMs` and implement `confirmSessionRevoked` after upstream success; terminal `fail` is removed.
Refresh identity changes use `workos_session_identity_changed`, distinct from concurrent logout.

## Re-exported auth contracts

| Symbol                                 | Kind      | Description                                                   |
| -------------------------------------- | --------- | ------------------------------------------------------------- |
| `AuthBackendPort`                      | interface | Backend adapter port implemented by `createWorkosBackend`.    |
| `AuthenticatorPort`                    | interface | Authenticator port used by request authentication.            |
| `AuthnRequest`                         | interface | Authentication request shape.                                 |
| `Principal`                            | interface | Principal payload returned by authenticators.                 |
| `AuthBackendOperationUnsupportedError` | class     | Error for unsupported upstream operations.                    |
| `InteractiveFlowPort`                  | interface | Interactive-flow port re-exported from the core auth package. |

Back to the [auth reference hub](/reference/auth/).
