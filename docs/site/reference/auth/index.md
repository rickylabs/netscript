---
layout: layouts/base.vto
title: 'Auth reference'
---

# Auth reference

NetScript auth is split across one plugin manifest package, one core contract package, and three
backend adapters. This hub is written against the public surfaces reported by `deno doc`.

For capability guidance, start with [Authentication](/capabilities/auth/). For the runtime service
builder used by auth-api, see [@netscript/service](/reference/service/).

## Units

| Unit                                             | Package                       | Purpose                                                                                                   |
| ------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| [plugin-auth](/reference/plugin-auth/)           | `@netscript/plugin-auth`      | Auth plugin manifest, contribution metadata, and plugin inspection helper.                                |
| [plugin-auth-core](/reference/plugin-auth-core/) | `@netscript/plugin-auth-core` | Auth contracts, backend ports, session schemas, stream schemas, config schemas, and telemetry primitives. |
| [auth-kv-oauth](/reference/auth-kv-oauth/)       | `@netscript/auth-kv-oauth`    | KV-backed OAuth2/OIDC relying-party backend and provider presets.                                         |
| [auth-workos](/reference/auth-workos/)           | `@netscript/auth-workos`      | WorkOS-backed authenticator and backend adapter.                                                          |
| [auth-better-auth](/reference/auth-better-auth/) | `@netscript/auth-better-auth` | Better Auth integration, authenticator, and backend adapter.                                              |

## Backend adapter boundary

| Adapter     | Primary factory                    | Notes                                                                                             |
| ----------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| KV OAuth    | `createKvOAuthBackend(options)`    | Uses provider configs created with `defineOAuthProvider(input)` or the exported provider presets. |
| WorkOS      | `createWorkosBackend(options)`     | Wraps WorkOS session and token verification behind `AuthBackendPort`.                             |
| Better Auth | `createBetterAuthBackend(options)` | Wraps a Better Auth instance behind `AuthBackendPort`.                                            |

Unsupported upstream operations are represented by `AuthBackendOperationUnsupportedError` from
`@netscript/plugin-auth-core`.

## OAuth callback errors

When the KV OAuth callback has neither its transaction cookie nor an explicit `txn` input, both
`POST /api/v1/auth/callback` and `POST /api/rpc/v1/auth/callback` return HTTP **502** with error
code **`oauth_cookie_missing`**. REST exposes the code at `code`; RPC wraps the same error in
`json`, exposing it at `json.code`. The message is
`OAuth transaction cookie is missing. Restart sign-in.` No backend cause or transaction details are
exposed. Restart sign-in and retain its transaction cookie for the callback, or forward the explicit
`txn` supplied by the sign-in redirect.

### 0.0.8 error-code migration

The missing-transaction failure previously used the generic `AUTH_PROVIDER_ERROR` code. Update
clients that match that code to handle `oauth_cookie_missing` for this case. The HTTP status remains
502; other provider failures retain their existing mapping.

Back to the [reference overview](/reference/).
