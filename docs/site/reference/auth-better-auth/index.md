---
layout: layouts/base.vto
title: "@netscript/auth-better-auth"
---

# `@netscript/auth-better-auth`

Better Auth integration, authenticator, and backend adapter for NetScript auth. This
page is generated from the package's public surface with `deno doc`.

## Factories

| Symbol | Kind | Description |
| --- | --- | --- |
| `createNetscriptBetterAuth` | function | Create a NetScript-oriented Better Auth instance. |
| `createBetterAuthBackend` | function | Create an `AuthBackendPort` adapter backed by Better Auth. |
| `createBetterAuthAuthenticator` | function | Create a Better Auth request authenticator. |

## Options and integration types

| Symbol | Kind | Description |
| --- | --- | --- |
| `NetscriptBetterAuthOptions` | interface | Options for `createNetscriptBetterAuth`. |
| `BetterAuthBackendOptions` | interface | Options for `createBetterAuthBackend`. |
| `BetterAuthAuthenticatorOptions` | interface | Options for `createBetterAuthAuthenticator`. |
| `BetterAuthProviderOptions` | interface | Provider descriptor options for Better Auth. |
| `BetterAuthInstance` | interface | Better Auth instance boundary consumed by this adapter. |
| `BetterAuthSessionPayload` | interface | Better Auth session payload shape. |
| `BetterAuthGetSessionInput` | type alias | Input accepted when looking up a Better Auth session. |
| `BetterAuthSessionLookupResponse` | type alias | Session lookup response returned by the adapter. |
| `BetterAuthPrismaClient` | type alias | Prisma client boundary accepted by the Better Auth integration. |
| `BetterAuthPrismaProvider` | type alias | Prisma provider value accepted by the integration. |

## Re-exported auth contracts

| Symbol | Kind | Description |
| --- | --- | --- |
| `AuthBackendPort` | interface | Backend adapter port implemented by `createBetterAuthBackend`. |
| `AuthenticatorPort` | interface | Authenticator port used by request authentication. |
| `AuthnRequest` | interface | Authentication request shape. |
| `Principal` | interface | Principal payload returned by authenticators. |
| `AuthBackendOperationUnsupportedError` | class | Error for unsupported upstream operations. |
| `InteractiveFlowPort` | interface | Interactive-flow port re-exported from the core auth package. |

Back to the [auth reference hub](/reference/auth/).
