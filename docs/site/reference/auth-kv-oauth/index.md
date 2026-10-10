---
layout: layouts/base.vto
title: '@netscript/auth-kv-oauth'
---

# `@netscript/auth-kv-oauth`

KV-backed OAuth2/OIDC relying-party backend for NetScript auth. This page is written against the
package's public surface reported by `deno doc`.

## Backend and flow factories

| Symbol                    | Kind     | Description                                                                                                                                                    |
| ------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createKvOAuthBackend`    | function | Create a KV-backed OAuth backend.                                                                                                                              |
| `createKvOAuthFlow`       | function | Create the OAuth sign-in and callback flow.                                                                                                                    |
| `createKvOAuthStore`      | function | Create the KV-backed OAuth store.                                                                                                                              |
| `createKvOAuthCrypto`     | function | Create crypto helpers for OAuth state and token storage.                                                                                                       |
| `presetProviderKind`      | function | Read the shipped preset protocol kind (`oauth` or `oidc`); custom ids return undefined. OAuth presets use explicit endpoints without issuer discovery.         |
| `defineOAuthProvider`     | function | Normalize generic OAuth provider input into an `OAuthProviderConfig`.                                                                                          |
| `defaultPrincipal`        | function | Default principal mapping; custom `normalizePrincipal` mappers compose on it.                                                                                  |
| `resolvePrincipalSubject` | function | Resolve the stable subject from the provider's `subject` source (ID token or userinfo).                                                                        |
| `presetSubjectSource`     | function | Return the subject source a shipped preset uses, by preset provider id.                                                                                        |
| `providers`               | constant | Provider preset collection including GitHub, Google, GitLab, Discord, Slack, Spotify, Facebook, Twitter, Auth0, Okta, AWS Cognito, Azure AD, Logto, and Clerk. |

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

## Sub-path exports

| Export                               | Path                 | Purpose                                                                            |
| ------------------------------------ | -------------------- | ---------------------------------------------------------------------------------- |
| `@netscript/auth-kv-oauth`           | `./mod.ts`           | Root KV OAuth backend surface.                                                     |
| `@netscript/auth-kv-oauth/providers` | `./src/providers.ts` | Provider presets and the defineOAuthProvider helper.                               |
| `@netscript/auth-kv-oauth/store`     | `./src/store.ts`     | KV OAuth store implementation.                                                     |
| `@netscript/auth-kv-oauth/crypto`    | `./src/crypto.ts`    | KV OAuth crypto helpers.                                                           |
| `@netscript/auth-kv-oauth/cookies`   | `./src/cookies.ts`   | Cookie parsing and header helpers.                                                 |
| `@netscript/auth-kv-oauth/flow`      | `./src/flow.ts`      | OAuth sign-in and callback flow.                                                   |
| `@netscript/auth-kv-oauth/backend`   | `./src/backend.ts`   | Backend adapter factory.                                                           |
| `@netscript/auth-kv-oauth/errors`    | `./src/errors.ts`    | KV OAuth error class and codes, including `subject_missing` and `userinfo_failed`. |
| `@netscript/auth-kv-oauth/subject`   | `./src/subject.ts`   | Stable principal-subject resolution.                                               |

Back to the [auth reference hub](/reference/auth/).

## HTTPS and trusted proxies

The flow and cookie helpers share `deriveHttps`. Request-backed flows recognize direct HTTPS
without proxy configuration. Session refresh receives a URL-less `AuthnRequest`, so direct-TLS
hosts must set `cookie.secure: true` (plugin: `NETSCRIPT_AUTH_COOKIE_SECURE=true`).
Forwarded protocol headers are ignored by default. Behind a TLS-terminating proxy, set top-level
`trustProxyHeaders: true` on `createKvOAuthBackend` or `createKvOAuthFlow`; the same option reaches
sign-in, callback, sign-out cookies, and refreshed session cookies. Enable it only when the proxy
replaces client-supplied protocol headers and direct access to the service is blocked.

`X-Forwarded-Proto` takes precedence over `Forwarded`; the first value/hop is used. Quoted
`Forwarded: proto="https"` is supported. Hop/CIDR verification is deferred to
[#2191](https://github.com/rickylabs/netscript/issues/2191).

- `allowInsecureHttpRequests` permits inbound plain HTTP for development; it defaults to false.
- `cookie.allowInsecureDev` separately permits the development cookie gate. Both are needed for a
  plain HTTP development flow using the default `__Host-` cookie; production requires HTTPS.
- `allowInsecureRequests` only relaxes outbound OAuth discovery/token transport. It defaults to
  false and is unnecessary for proxied TLS. It does not disable certificate validation.
- Standalone cookie helpers accept `trustProxyHeaders` in `KvOAuthCookieOptions`.
  `deriveHttps(request, undefined, true)` explicitly trusts protocol headers. Its existing boolean
  override remains available. Backend/flow top-level `trustProxyHeaders` overrides the cookie
  option when supplied; otherwise `cookie.trustProxyHeaders` applies to both gates.
- `AuthnRequest` carries no URL. For refresh cookies, supply trusted proxy headers with explicit
  trust, or set `cookie.secure: true` when the host guarantees HTTPS.

**Migration:** previously cookie helpers trusted protocol headers unconditionally and
`allowInsecureRequests` also opened the inbound flow gate. Existing proxied deployments must opt
into `trustProxyHeaders`; development HTTP callers must explicitly set `allowInsecureHttpRequests`
and `cookie.allowInsecureDev`. The flow now throws `flow_https_required`, while the cookie gate
throws `cookie_https_required`. These replace the public `https_required` code: callers matching
that code must handle the two new codes. Invalid cookie settings retain `configuration_error`.
See the [0.0.8 canary migration notes](https://github.com/rickylabs/netscript/blob/main/packages/auth-kv-oauth/CHANGELOG.md).
