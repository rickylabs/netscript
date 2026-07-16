# @netscript/plugin-auth-core

[![JSR](https://jsr.io/badges/@netscript/plugin-auth-core)](https://jsr.io/@netscript/plugin-auth-core)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The reusable auth core for NetScript: domain and durable-stream schemas, Zod config, an
`AuthBackendPort` adapter seam, and the oRPC v1 contract.**

This is the contract surface every auth backend implements and every service host wires; the
deployable `@netscript/plugin-auth` plugin binds it to the host.

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin-auth-core

# Node.js / Bun
npx jsr add @netscript/plugin-auth-core
bunx jsr add @netscript/plugin-auth-core
```

### Usage

```typescript
import { AuthConfigSchema, createAuthBackendRegistry } from '@netscript/plugin-auth-core';
import type { AuthBackendPort } from '@netscript/plugin-auth-core';

// A backend adapter (kv-oauth, better-auth, WorkOS, ...) implements AuthBackendPort.
declare const kvOAuthBackend: AuthBackendPort;

// Parse app settings into a normalized, defaulted auth config.
const config = AuthConfigSchema.parse({
  backend: 'kv-oauth',
  session: { cookieName: '__Host-netscript-auth', sameSite: 'lax' },
});

// Register backends and resolve the single active one at the composition root.
const registry = createAuthBackendRegistry(
  new Map([[config.backend, kvOAuthBackend]]),
  config.backend,
);

// Service hosts authenticate requests through the resolved backend port.
const backend = registry.resolveBackend();
const session = await backend.sessions.getSession({ token: 'opaque-session-token' });
```

---

## 📦 Key Capabilities

- **Backend port seam**: `AuthBackendPort` composes provider registry, session store, token crypto,
  and principal-mapping sub-ports so adapters implement one stable contract.
- **Backend registry**: `createAuthBackendRegistry` and `resolveBackend` select a single active
  backend per composition root, with typed `AuthBackendNotFoundError` /
  `AuthBackendOperationUnsupportedError` boundaries.
- **Zod config**: `AuthConfigSchema`, `AuthSessionPolicySchema`, and `AuthProviderConfigSchema`
  normalize app settings into a defaulted `AuthConfig` (secure `__Host-` cookies, TTL, refresh
  window).
- **oRPC v1 contract**: `authContract` / `authContractV1` define the signin, callback, session, me,
  and signout routes that the auth service implements.
- **Durable streams + telemetry**: `authStreamSchema` projects `auth.*` session events, and
  `createAuthTelemetry` plus `redactAuthPrincipal` emit redacted spans for observability.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/plugin-auth-core/](https://rickylabs.github.io/netscript/reference/plugin-auth-core/)
- **Identity & Access pillar**:
  [rickylabs.github.io/netscript/identity-access/](https://rickylabs.github.io/netscript/identity-access/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
