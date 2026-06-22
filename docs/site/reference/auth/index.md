---
layout: layouts/base.vto
title: "Auth reference"
---

# Auth reference

NetScript auth is split across one plugin manifest package, one core contract package, and
three backend adapters. This hub is generated from the public surfaces verified with
`deno doc`.

For capability guidance, start with [Authentication](/capabilities/auth/). For the
runtime service builder used by auth-api, see [@netscript/service](/reference/service/).

## Units

| Unit | Package | Purpose |
| --- | --- | --- |
| [plugin-auth](/reference/plugin-auth/) | `@netscript/plugin-auth` | Auth plugin manifest, contribution metadata, and plugin inspection helper. |
| [plugin-auth-core](/reference/plugin-auth-core/) | `@netscript/plugin-auth-core` | Auth contracts, backend ports, session schemas, stream schemas, config schemas, and telemetry primitives. |
| [auth-kv-oauth](/reference/auth-kv-oauth/) | `@netscript/auth-kv-oauth` | KV-backed OAuth2/OIDC relying-party backend and provider presets. |
| [auth-workos](/reference/auth-workos/) | `@netscript/auth-workos` | WorkOS-backed authenticator and backend adapter. |
| [auth-better-auth](/reference/auth-better-auth/) | `@netscript/auth-better-auth` | Better Auth integration, authenticator, and backend adapter. |

## Backend adapter boundary

| Adapter | Primary factory | Notes |
| --- | --- | --- |
| KV OAuth | `createKvOAuthBackend(options)` | Uses provider configs created with `defineOAuthProvider(input)` or the exported provider presets. |
| WorkOS | `createWorkosBackend(options)` | Wraps WorkOS session and token verification behind `AuthBackendPort`. |
| Better Auth | `createBetterAuthBackend(options)` | Wraps a Better Auth instance behind `AuthBackendPort`. |

Unsupported upstream operations are represented by
`AuthBackendOperationUnsupportedError` from `@netscript/plugin-auth-core`.

Back to the [reference overview](/reference/).
