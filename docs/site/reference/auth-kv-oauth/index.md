---
layout: layouts/base.vto
title: '@netscript/auth-kv-oauth'
---

# `@netscript/auth-kv-oauth`

KV-backed OAuth2/OIDC relying-party backend for NetScript auth. Use it to sign users in with an
OAuth or OIDC provider, such as GitHub, Google or Okta, and keep sessions in KV.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/auth-kv-oauth` | `./mod.ts` | Root KV OAuth backend surface. |
| `@netscript/auth-kv-oauth/providers` | `./src/providers.ts` | Provider presets and the `defineOAuthProvider` helper. |
| `@netscript/auth-kv-oauth/store` | `./src/store.ts` | KV OAuth store implementation. |
| `@netscript/auth-kv-oauth/crypto` | `./src/crypto.ts` | KV OAuth crypto helpers. |
| `@netscript/auth-kv-oauth/cookies` | `./src/cookies.ts` | [Cookie parsing and header helpers](#cookie-environment-and-discovery-helpers). |
| `@netscript/auth-kv-oauth/flow` | `./src/flow.ts` | OAuth sign-in and callback flow. |
| `@netscript/auth-kv-oauth/backend` | `./src/backend.ts` | Backend adapter factory. |
| `@netscript/auth-kv-oauth/errors` | `./src/errors.ts` | KV OAuth error class and codes, including `subject_missing` and `userinfo_failed`. |
| `@netscript/auth-kv-oauth/subject` | `./src/subject.ts` | Stable principal-subject resolution. |

## Backend and flow factories

| Symbol | Kind | Description |
| --- | --- | --- |
| `createKvOAuthBackend` | function | Create a KV-backed OAuth backend. |
| `createKvOAuthFlow` | function | Create the OAuth sign-in and callback flow. |
| `createKvOAuthStore` | function | Create the KV-backed OAuth store. |
| `createKvOAuthCrypto` | function | Create crypto helpers for OAuth state and token storage. |
| `presetProviderKind` | function | Read the shipped preset protocol kind (`oauth` or `oidc`); custom ids return undefined. OAuth presets use explicit endpoints without issuer discovery. |
| `defineOAuthProvider` | function | Normalize generic OAuth provider input into an `OAuthProviderConfig`. |
| `defaultPrincipal` | function | Default principal mapping; custom `normalizePrincipal` mappers compose on it. |
| `resolvePrincipalSubject` | function | Resolve the stable subject from the provider's `subject` source (ID token or userinfo). |
| `presetSubjectSource` | function | Return the subject source a shipped preset uses, by preset provider id. |
| `providers` | const | Provider preset collection including GitHub, Google, GitLab, Discord, Slack, Spotify, Facebook, Twitter, Auth0, Okta, AWS Cognito, Azure AD, Logto, and Clerk. |

## Cookie, environment, and discovery helpers

| Symbol               | Kind     | Description                                                                  |
| -------------------- | -------- | ---------------------------------------------------------------------------- |
| `buildCookieHeader`  | function | Build a `Set-Cookie` header value.                                           |
| `clearCookieHeader`  | function | Build a cookie-clearing header value.                                        |
| `parseCookieHeader`  | function | Parse an incoming cookie header.                                             |
| `getRequiredEnv`     | function | Read a required environment variable.                                        |
| `deriveHttps`        | function | Shared inbound HTTPS policy; forwarded headers require explicit proxy trust. |
| `hasIssuerDiscovery` | function | Check whether provider config includes issuer discovery.                     |
| `KvOAuthError`       | class    | OAuth backend error class.                                                   |

## Main types

| Symbol                        | Kind       | Description                                                                    |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `KvOAuthBackend`              | interface  | Backend object returned by `createKvOAuthBackend`.                             |
| `KvOAuthFlow`                 | interface  | OAuth flow object returned by `createKvOAuthFlow`.                             |
| `KvOAuthStore`                | interface  | KV store port used by the OAuth backend.                                       |
| `KvOAuthCrypto`               | interface  | Crypto port used by the OAuth backend.                                         |
| `CreateKvOAuthBackendOptions` | type alias | Options for `createKvOAuthBackend`.                                            |
| `CreateKvOAuthFlowOptions`    | type alias | Options for `createKvOAuthFlow`.                                               |
| `OAuthProviderInput`          | type alias | Generic provider input accepted by `defineOAuthProvider`.                      |
| `OAuthProviderConfig`         | type alias | Normalized provider config.                                                    |
| `PresetOAuthProviderOptions`  | type alias | Options accepted by provider presets.                                          |
| `KvOAuthCallbackResult`       | type alias | Callback result returned by the OAuth flow.                                    |
| `KvOAuthTokenSet`             | type alias | Token set stored by the KV OAuth backend.                                      |
| `OAuthSubjectSource`          | type alias | Where the subject comes from: `id_token` claim or namespaced `userinfo` field. |
| `NormalizePrincipalContext`   | type alias | Context passed to `normalizePrincipal`, including the injected `fetch`.        |
| `PrincipalSubjectContext`     | type alias | Input accepted by `resolvePrincipalSubject`.                                   |
| `KvOAuthUserInfoFetch`        | type alias | Fetch replacement used for userinfo requests.                                  |

## HTTPS and trusted proxies

The flow and cookie helpers share `deriveHttps`. Request-backed flows recognize direct HTTPS
without proxy configuration. Session refresh receives a URL-less `AuthnRequest`, so direct-TLS
hosts must set `cookie.secure: true` (plugin: `NETSCRIPT_AUTH_COOKIE_SECURE=true`).

Forwarded protocol headers are ignored by default. Behind a TLS-terminating proxy, set top-level
`trustProxyHeaders: true` on `createKvOAuthBackend` or `createKvOAuthFlow`; the same option reaches
sign-in, callback, sign-out cookies, and refreshed session cookies.

> [!CAUTION]
> Enable `trustProxyHeaders` only when the proxy replaces client-supplied protocol headers and
> direct access to the service is blocked.

`X-Forwarded-Proto` takes precedence over `Forwarded`; the first value/hop is used. Quoted
`Forwarded: proto="https"` is supported. Hops and CIDRs are not verified.

| Option | Effect |
| --- | --- |
| `allowInsecureHttpRequests` | Permits inbound plain HTTP for development. Defaults to `false`. |
| `cookie.allowInsecureDev` | Separately permits the development cookie gate. A plain HTTP development flow using the default `__Host-` cookie needs both options; production requires HTTPS. |
| `allowInsecureRequests` | Relaxes only outbound OAuth discovery/token transport. Defaults to `false`. Unnecessary for proxied TLS; it does not disable certificate validation. |
| `trustProxyHeaders` (in `KvOAuthCookieOptions`) | Lets standalone cookie helpers trust protocol headers. Backend/flow top-level `trustProxyHeaders` overrides it when supplied; otherwise `cookie.trustProxyHeaders` applies to both gates. |

`deriveHttps(request, undefined, true)` explicitly trusts protocol headers; its boolean override
remains available. `AuthnRequest` carries no URL, so for refresh cookies supply trusted proxy
headers with explicit trust, or set `cookie.secure: true` when the host guarantees HTTPS.

> [!IMPORTANT]
> **Changed in 0.0.8**
>
> Cookie helpers no longer trust protocol headers unconditionally, and
> `allowInsecureRequests` no longer opens the inbound flow gate. Proxied deployments must opt into
> `trustProxyHeaders`; development HTTP callers must set `allowInsecureHttpRequests` and
> `cookie.allowInsecureDev`. The flow throws `flow_https_required` and the cookie gate throws
> `cookie_https_required`; these replace the public `https_required` code, so callers matching it
> must handle both. Invalid cookie settings keep `configuration_error`. See the
> [0.0.8 canary migration notes](https://github.com/rickylabs/netscript/blob/main/packages/auth-kv-oauth/CHANGELOG.md).

## OAuth callback errors

When the KV OAuth callback has neither its transaction cookie nor an explicit `txn` input, both
`POST /api/v1/auth/callback` and `POST /api/rpc/v1/auth/callback` return HTTP **502** with error
code **`oauth_cookie_missing`**. REST exposes the code at `code`; RPC wraps the same error in
`json`, exposing it at `json.code`. The message is
`OAuth transaction cookie is missing. Restart sign-in.` No backend cause or transaction details are
exposed.

To recover, restart sign-in and keep its transaction cookie for the callback, or forward the
explicit `txn` supplied by the sign-in redirect.

> [!IMPORTANT]
> **Changed in 0.0.8**
>
> This failure used the generic `AUTH_PROVIDER_ERROR` code. Clients that
> match that code must handle `oauth_cookie_missing` for this case. The HTTP status remains 502;
> other provider failures keep their existing mapping.
