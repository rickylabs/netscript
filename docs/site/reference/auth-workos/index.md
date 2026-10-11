---
layout: layouts/base.vto
title: "@netscript/auth-workos"
---

# `@netscript/auth-workos`

WorkOS-backed authenticator and backend adapter for NetScript auth. This page is written against
the package's public surface reported by `deno doc`.

## Exports

| Export | Path |
| --- | --- |
| `@netscript/auth-workos` | `./mod.ts` |

## Factories

| Symbol | Kind | Description |
| --- | --- | --- |
| `createWorkosBackend` | function | Create an `AuthBackendPort` adapter backed by WorkOS. |
| `createWorkosAuthenticator` | function | Create a WorkOS session authenticator. |
| `createWorkosAccessTokenAuthenticator` | function | Create a WorkOS access-token authenticator. |

| `createWorkosRevocationStore` | function | Create a durable subject fence and outbox on host KV. |
| `revokeWorkosSubjectPage` | function | Process one bounded upstream revocation page in a worker. |

## Options and result types

| Symbol | Kind | Description |
| --- | --- | --- |
| `WorkosBackendOptions` | interface | Options for `createWorkosBackend`. |
| `WorkosAuthenticatorOptions` | interface | Options for `createWorkosAuthenticator`. |
| `WorkosAccessTokenAuthenticatorOptions` | interface | Options for `createWorkosAccessTokenAuthenticator`. |
| `WorkosProviderOptions` | interface | Provider descriptor options for WorkOS. |
| `WorkosCookieOptions` | interface | WorkOS cookie configuration. |
| `WorkosCookieSession` | interface | Cookie-backed WorkOS session payload. |
| `WorkosSessionClient` | interface | WorkOS session client boundary. |
| `WorkosSessionAuthenticationResult` | type alias | Authentication result returned by WorkOS session authentication. |
| `WorkosSessionRefreshResult` | type alias | Session refresh result. |

| `WorkosRevocationStore` | interface | Durable fence and revocation delivery port. |
| `WorkosRevocationJob` | interface | Subject cutoff and paginated work item. |
| `WorkosRevocationDelivery` | interface | Work item and optimistic storage version. |
| `WorkosRevocationClient` | interface | Official SDK list/revoke boundary used by workers. |

## Subject-wide revocation

The official auth plugin composes the KV fence and its background worker. Signout does one atomic
fence/outbox commit, without WorkOS enumeration. Each worker delivery processes one page of at most
50 sessions. It uses the service's API identity, persists session tombstones before upstream
revocation, and checkpoints progress. Delivery is at least once: partial failures replay safely.
Eight failed attempts move the job into durable failure evidence; the subject stays fenced. Restart
resumes pending pages without requiring an app or browser session to remain open.

Standalone applications compose `createWorkosRevocationStore(hostKv)` on an atomic
`@netscript/kv` store and pass it as `revocations` to `createWorkosBackend`,
`createWorkosAuthenticator`, and `createWorkosAccessTokenAuthenticator`. Their worker consumes
`nextDelivery(now)` and calls `revokeWorkosSubjectPage(store, workos, delivery, signal)` outside
requests. Share one durable store across all instances and authentication paths. Missing token
issuance or session claims fail closed after a subject fence exists. Configurations without a store
continue to report subject-wide revocation as unsupported.

The fence refuses all credentials of the subject while upstream cleanup is pending or failed,
including new logins. After successful cleanup, sessions created after the cutoff can authenticate;
tombstones keep old sessions refused even if their access token was refreshed. Other subjects are
unaffected. Operators inspect `auth-workos/revocation/failed` in host KV and can resubmit cleanup
through `backend.sessions.revokeSubjectSessions({ subject })` from a trusted service identity.

The new optional store and clock settings require no source migration for existing standalone
callers. The official plugin now requires an atomic host KV for WorkOS and respects the configured
session-cookie name. Consumers enabling global logout must add a background worker and wire the
shared store into every authenticator.

## Re-exported auth contracts

| Symbol | Kind | Description |
| --- | --- | --- |
| `AuthBackendPort` | interface | Backend adapter port implemented by `createWorkosBackend`. |
| `AuthenticatorPort` | interface | Authenticator port used by request authentication. |
| `AuthnRequest` | interface | Authentication request shape. |
| `Principal` | interface | Principal payload returned by authenticators. |
| `AuthBackendOperationUnsupportedError` | class | Error for unsupported upstream operations. |
| `InteractiveFlowPort` | interface | Interactive-flow port re-exported from the core auth package. |

Back to the [auth reference hub](/reference/auth/).
