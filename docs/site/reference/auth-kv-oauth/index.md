---
layout: layouts/base.vto
title: "@netscript/auth-kv-oauth"
---

# `@netscript/auth-kv-oauth`

KV-backed OAuth2/OIDC relying-party backend for NetScript auth. This page is
generated from the package's public surface with `deno doc`.

## Backend and flow factories

| Symbol | Kind | Description |
| --- | --- | --- |
| `createKvOAuthBackend` | function | Create a KV-backed OAuth backend. |
| `createKvOAuthFlow` | function | Create the OAuth sign-in and callback flow. |
| `createKvOAuthStore` | function | Create the KV-backed OAuth store. |
| `createKvOAuthCrypto` | function | Create crypto helpers for OAuth state and token storage. |
| `defineOAuthProvider` | function | Normalize generic OAuth provider input into an `OAuthProviderConfig`. |
| `providers` | constant | Provider preset collection including GitHub, Google, GitLab, Discord, Slack, Spotify, Facebook, Twitter, Auth0, Okta, AWS Cognito, Azure AD, Logto, and Clerk. |

## Cookie, environment, and discovery helpers

| Symbol | Kind | Description |
| --- | --- | --- |
| `buildCookieHeader` | function | Build a `Set-Cookie` header value. |
| `clearCookieHeader` | function | Build a cookie-clearing header value. |
| `parseCookieHeader` | function | Parse an incoming cookie header. |
| `getRequiredEnv` | function | Read a required environment variable. |
| `deriveHttps` | function | Derive HTTPS defaults for provider configuration. |
| `hasIssuerDiscovery` | function | Check whether provider config includes issuer discovery. |
| `KvOAuthError` | class | OAuth backend error class. |

## Main types

| Symbol | Kind | Description |
| --- | --- | --- |
| `KvOAuthBackend` | interface | Backend object returned by `createKvOAuthBackend`. |
| `KvOAuthFlow` | interface | OAuth flow object returned by `createKvOAuthFlow`. |
| `KvOAuthStore` | interface | KV store port used by the OAuth backend. |
| `KvOAuthCrypto` | interface | Crypto port used by the OAuth backend. |
| `CreateKvOAuthBackendOptions` | type alias | Options for `createKvOAuthBackend`. |
| `CreateKvOAuthFlowOptions` | type alias | Options for `createKvOAuthFlow`. |
| `OAuthProviderInput` | type alias | Generic provider input accepted by `defineOAuthProvider`. |
| `OAuthProviderConfig` | type alias | Normalized provider config. |
| `PresetOAuthProviderOptions` | type alias | Options accepted by provider presets. |
| `KvOAuthCallbackResult` | type alias | Callback result returned by the OAuth flow. |
| `KvOAuthTokenSet` | type alias | Token set stored by the KV OAuth backend. |

## Sub-path exports

| Export | Purpose |
| --- | --- |
| `@netscript/auth-kv-oauth` | Root KV OAuth backend surface. |
| `@netscript/auth-kv-oauth/providers` | Provider presets and `defineOAuthProvider`. |
| `@netscript/auth-kv-oauth/store` | KV OAuth store implementation. |
| `@netscript/auth-kv-oauth/crypto` | KV OAuth crypto helpers. |
| `@netscript/auth-kv-oauth/cookies` | Cookie parsing and header helpers. |
| `@netscript/auth-kv-oauth/flow` | OAuth sign-in and callback flow. |
| `@netscript/auth-kv-oauth/backend` | Backend adapter factory. |
| `@netscript/auth-kv-oauth/errors` | KV OAuth error class and codes. |

Back to the [auth reference hub](/reference/auth/).
