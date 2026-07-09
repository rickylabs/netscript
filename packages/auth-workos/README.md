# @netscript/auth-workos

[![JSR](https://jsr.io/badges/@netscript/auth-workos)](https://jsr.io/@netscript/auth-workos)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A WorkOS AuthKit auth backend for NetScript that maps verified AuthKit sealed sessions and bearer
JWTs into NetScript principals through the `@netscript/plugin-auth-core` port.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/auth-workos

# Node.js / Bun
npx jsr add @netscript/auth-workos
bunx jsr add @netscript/auth-workos
```

### Usage

```typescript
import { WorkOS } from '@workos-inc/node';
import { createService } from '@netscript/service';
import { createWorkosBackend } from '@netscript/auth-workos';

const workos = new WorkOS(Deno.env.get('WORKOS_API_KEY')!, {
  clientId: Deno.env.get('WORKOS_CLIENT_ID')!,
});

const service = createService(router, { name: 'private-api' })
  .withAuthn({
    authenticator: createWorkosBackend({
      workos,
      cookiePassword: Deno.env.get('WORKOS_COOKIE_PASSWORD')!,
      refresh: 'always',
      providers: [{ id: 'workos', displayName: 'WorkOS' }],
    }),
  });
```

---

## 📦 Key Capabilities

- **Backend port**: `createWorkosBackend(options)` returns a pure `AuthBackendPort` named `workos`
  with a provider registry, request-derived session lookup, backend-owned session-token crypto, and
  principal mapping.
- **Sealed-session authenticator**: `createWorkosAuthenticator(options)` verifies WorkOS AuthKit
  sealed-session cookies and is reusable directly through `@netscript/service` auth.
- **Bearer JWT authenticator**: `createWorkosAccessTokenAuthenticator(options)` verifies access
  tokens against a WorkOS JWKS, with an optional issuer constraint.
- **Principal mapping**: maps the WorkOS user id or JWT `sub` to `subject`, WorkOS permissions to
  `scopes`, and surfaces `organizationId` and `sessionId` as claims.
- **Honored boundaries**: WorkOS owns session creation, refresh, and revocation, so `createSession`,
  `refreshSession`, and `revokeSession` raise `AuthBackendOperationUnsupportedError` rather than
  fabricating local state.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/auth-workos/](https://rickylabs.github.io/netscript/reference/auth-workos/)
- **Identity & Access**:
  [rickylabs.github.io/netscript/identity-access/](https://rickylabs.github.io/netscript/identity-access/)
- **Add authentication**:
  [rickylabs.github.io/netscript/how-to/add-authentication/](https://rickylabs.github.io/netscript/how-to/add-authentication/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
