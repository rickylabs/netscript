# @netscript/auth-better-auth

[![JSR](https://jsr.io/badges/@netscript/auth-better-auth)](https://jsr.io/@netscript/auth-better-auth)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A better-auth backend adapter for NetScript that implements the auth-core `AuthBackendPort` over a
consumer-owned Prisma client, mapping better-auth sessions to NetScript principals without owning
the database.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/auth-better-auth

# Node.js / Bun
npx jsr add @netscript/auth-better-auth
bunx jsr add @netscript/auth-better-auth
```

### Usage

```typescript
import { createBetterAuthBackend, createNetscriptBetterAuth } from '@netscript/auth-better-auth';

// 1. Build a better-auth instance over your own Prisma client.
const auth = createNetscriptBetterAuth({
  prisma,
  provider: 'postgresql',
  secret: Deno.env.get('BETTER_AUTH_SECRET')!,
  baseURL: Deno.env.get('BETTER_AUTH_URL')!,
});

// 2. Wrap it as an AuthBackendPort that NetScript services consume.
const backend = createBetterAuthBackend({
  auth,
  sessionTokenSecret: Deno.env.get('BETTER_AUTH_SECRET')!,
  providers: [{ id: 'github', displayName: 'GitHub' }],
});

// `backend.authenticate(request)` resolves the better-auth session and
// returns a NetScript principal; provider, session, and crypto ports
// are exposed on the same backend.
```

---

## 📦 Key Capabilities

- **AuthBackendPort adapter**: `createBetterAuthBackend` returns a pure `AuthBackendPort` named
  `better-auth`, exposing provider registry, session lookup, backend-owned session-token crypto, and
  principal mapping.
- **Consumer-owned Prisma**: `createNetscriptBetterAuth` configures better-auth's first-party Prisma
  adapter over a Prisma client you supply, so the package never depends on `@netscript/database`.
- **Principal mapping**: better-auth sessions map to a NetScript `Principal` with `subject`,
  `scopes`, `roles`, and camelCase `organizationId`/`sessionId` claims, forwarding any `Set-Cookie`
  refresh through `AuthnResult.setCookies`.
- **better-auth plugin passthrough**: a typed `plugins` option forwards better-auth server plugins
  (bearer, jwt, organization, and more) while NetScript retains ownership of the database adapter.
- **Explicit capability boundaries**: session creation, refresh, and revocation throw
  `AuthBackendOperationUnsupportedError` rather than fabricating local state, because better-auth
  owns those flows through its request APIs.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/auth-better-auth/](https://rickylabs.github.io/netscript/reference/auth-better-auth/)
- **Identity & Access**:
  [rickylabs.github.io/netscript/identity-access/](https://rickylabs.github.io/netscript/identity-access/)
- **better-auth plugins**:
  [rickylabs.github.io/netscript/identity-access/better-auth-plugins/](https://rickylabs.github.io/netscript/identity-access/better-auth-plugins/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
