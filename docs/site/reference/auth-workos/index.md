---
layout: layouts/base.vto
title: "@netscript/auth-workos"
---

# `@netscript/auth-workos`

WorkOS-backed authenticator and backend adapter for NetScript auth. This page is
generated from the package's public surface with `deno doc`.

## Factories

| Symbol | Kind | Description |
| --- | --- | --- |
| `createWorkosBackend` | function | Create an `AuthBackendPort` adapter backed by WorkOS. |
| `createWorkosAuthenticator` | function | Create a WorkOS session authenticator. |
| `createWorkosAccessTokenAuthenticator` | function | Create a WorkOS access-token authenticator. |

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
