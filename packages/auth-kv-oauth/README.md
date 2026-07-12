# @netscript/auth-kv-oauth

[![JSR](https://jsr.io/badges/@netscript/auth-kv-oauth)](https://jsr.io/@netscript/auth-kv-oauth)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A KV-backed OAuth2/OIDC relying-party backend for NetScript auth, with PKCE, encrypted token sets,
and presets for fourteen identity providers.**

It implements the `AuthBackendPort` contract from `@netscript/plugin-auth-core` over
`@netscript/kv` session storage.

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/auth-kv-oauth

# Node.js / Bun
npx jsr add @netscript/auth-kv-oauth
bunx jsr add @netscript/auth-kv-oauth
```

### Usage

```typescript
import { createKvOAuthBackend, getRequiredEnv, providers } from '@netscript/auth-kv-oauth';

const backend = await createKvOAuthBackend({
  provider: providers.google({
    clientId: getRequiredEnv('GOOGLE_CLIENT_ID'),
    clientSecret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    redirectUri: 'https://app.example.com/auth/callback',
  }),
});

// `backend` satisfies AuthBackendPort: request authentication plus
// signIn / handleCallback / signOut redirect primitives for a host HTTP layer.
const result = await backend.authenticate(request);
```

---

## 📦 Key Capabilities

- **AuthBackendPort backend**: `createKvOAuthBackend()` returns the full backend port — `name`,
  `providers`, `sessions`, `crypto`, `principalMapper`, and `authenticate` — plus the interactive
  `signIn`, `handleCallback`, `signOut`, and `getSessionId` flow primitives.
- **Provider presets**: the `providers` collection ships first-class presets for GitHub, Google,
  GitLab, Discord, Slack, Spotify, Facebook, Twitter, Auth0, Okta, AWS Cognito, Azure AD, Logto, and
  Clerk; `defineOAuthProvider()` builds any generic OAuth or OIDC provider.
- **KV-backed sessions**: `createKvOAuthStore()` persists transactions and sessions in
  `@netscript/kv` `WatchableKv` using typed key tuples, TTLs, and atomic CAS for refresh-on-read
  rotation.
- **Encrypted token storage**: `createKvOAuthCrypto()` seals token sets with AES-256-GCM and
  prefixes sealed values with a key id; token plaintext is never written to KV.
- **PKCE and OIDC by default**: every flow uses authorization-code with PKCE S256 and exact state
  validation through `@panva/oauth4webapi`; OIDC providers add nonce and ID token validation.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/auth-kv-oauth/](https://rickylabs.github.io/netscript/reference/auth-kv-oauth/)
- **Identity & Access**:
  [rickylabs.github.io/netscript/identity-access/](https://rickylabs.github.io/netscript/identity-access/)
- **Add authentication**:
  [rickylabs.github.io/netscript/how-to/add-authentication/](https://rickylabs.github.io/netscript/how-to/add-authentication/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
