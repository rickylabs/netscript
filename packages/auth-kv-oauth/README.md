# @netscript/auth-kv-oauth

`@netscript/auth-kv-oauth` is a pure KV-backed OAuth2/OIDC relying-party backend for the NetScript
auth plugin. It implements `AuthBackendPort` from `@netscript/plugin-auth-core` and exposes plain
OAuth flow functions for a caller-owned HTTP layer.

There is no Hono mount, route handler, CLI, database generator, or project contribution surface in
this package. The unified `/auth/*` HTTP surface belongs to `plugins/auth`.

## Install

```sh
deno add jsr:@netscript/auth-kv-oauth
```

## Quick Start

```ts
import { createKvOAuthBackend, providers } from '@netscript/auth-kv-oauth';

const backend = await createKvOAuthBackend({
  provider: providers.google({
    clientId: Deno.env.get('GOOGLE_CLIENT_ID')!,
    clientSecret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
    redirectUri: 'https://app.example.com/auth/callback',
  }),
});

const result = await backend.authenticate(requestContext);
```

Provide `encryptionKey` through `createKvOAuthStore()` for tests or set
`NETSCRIPT_AUTH_KV_OAUTH_KEY` to a 32-byte base64url secret in production. Missing key material is a
startup error; token plaintext is never stored in KV.

## Public Surface

- `createKvOAuthBackend()` returns the full `AuthBackendPort`: `name`, `providers`, `sessions`,
  `crypto`, `principalMapper`, and `authenticate`.
- `createKvOAuthFlow()` returns plain `signIn`, `handleCallback`, `signOut`, and `getSessionId`
  primitives for the future plugin service to call.
- `createKvOAuthStore()` stores transactions and sessions in `@netscript/kv` `WatchableKv` using
  typed key tuples, transaction TTL, session TTL, and atomic CAS for rotation.
- `createKvOAuthCrypto()` seals token sets with AES-256-GCM and prefixes sealed values with `keyId`.
- `defineOAuthProvider()` is the generic provider builder used by every preset.

## Providers

First-class presets:

```ts
providers.github(options);
providers.google(options);
providers.gitlab(options);
providers.discord(options);
providers.slack(options);
providers.spotify(options);
providers.facebook(options);
providers.twitter(options);
```

Tenant or issuer presets:

```ts
providers.auth0({ domain: 'tenant.us.auth0.com', ...options });
providers.okta({ domain: 'dev-123.okta.com/oauth2/default', ...options });
providers.awsCognito({ region: 'us-east-1', userPoolId: 'us-east-1_abc', ...options });
providers.azureAd({ tenantId: 'common', ...options });
providers.logto({ domain: 'tenant.logto.app/oidc', ...options });
providers.clerk({ domain: 'example.accounts.dev', ...options });
```

Generic-only recipes use `defineOAuthProvider()` directly: Azure ADB2C, Notion, Dropbox, and
Patreon. OIDC providers should prefer `issuer`; explicit endpoints remain available for non-OIDC
providers and endpoint overrides.

## Security Notes

The backend always uses authorization-code flow with PKCE S256. Callback handling validates exact
state through `oauth4webapi`; OIDC providers use nonce and ID token validation through the same
engine. Return URLs are same-origin by default or constrained by `allowedReturnTo`.

Session cookies default to `__Host-ns_session`, `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`.
HTTPS is required outside explicit test/dev configuration. Refresh-on-read rotates server-side
session state through KV CAS, emits `Set-Cookie` values through `AuthnResult.setCookies`, and treats
refresh-token hash mismatches as compromise.

This package is RP-only for v1. It does not validate inbound bearer JWTs as a resource server. PAR,
DPoP, active key rotation, and global logout indexing are deferred extension points.

## Docs

- [`@netscript/plugin-auth-core`](../plugin-auth-core/README.md)
- [`plugins/auth`](../../plugins/auth/README.md)

## Attribution

Provider catalog shape and the required-env pattern are reimplemented from `deno_kv_oauth`.
Copyright 2023-2024 the Deno authors. MIT license.
