---
layout: layouts/base.vto
title: 'Auth reference'
---

# Auth reference

NetScript auth spans one plugin package, one core contract package and three backend adapters. Pick
the page for the package you import. For capability guidance, start with
[Authentication](/capabilities/auth/); for the service builder behind `auth-api`, see
[`@netscript/service`](/reference/service/).

| Package | Primary factory | Purpose |
| --- | --- | --- |
| [`@netscript/plugin-auth`](/reference/plugin-auth/) | | Auth plugin manifest, contribution metadata, and plugin inspection helper. |
| [`@netscript/plugin-auth-core`](/reference/plugin-auth-core/) | | Auth contracts, backend ports, session schemas, stream schemas, config schemas, and telemetry primitives. Unsupported upstream operations raise its `AuthBackendOperationUnsupportedError`. |
| [`@netscript/auth-kv-oauth`](/reference/auth-kv-oauth/) | `createKvOAuthBackend(options)` | KV-backed OAuth2/OIDC relying-party backend. Uses provider configs created with `defineOAuthProvider(input)` or the exported provider presets. |
| [`@netscript/auth-workos`](/reference/auth-workos/) | `createWorkosBackend(options)` | WorkOS-backed authenticator and backend adapter. Wraps WorkOS session and token verification behind `AuthBackendPort`. |
| [`@netscript/auth-better-auth`](/reference/auth-better-auth/) | `createBetterAuthBackend(options)` | Better Auth integration, authenticator, and backend adapter. Wraps a Better Auth instance behind `AuthBackendPort`. |

The KV OAuth callback's `oauth_cookie_missing` error is documented under
[OAuth callback errors](/reference/auth-kv-oauth/#oauth-callback-errors).
