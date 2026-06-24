# @netscript/plugin-auth

[![JSR](https://jsr.io/badges/@netscript/plugin-auth)](https://jsr.io/@netscript/plugin-auth)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The official auth plugin for NetScript: it contributes a unified auth API service,
single-active-backend selection, the auth Prisma schema, and durable session-stream projections to a
generated app.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin-auth

# Node.js / Bun
npx jsr add @netscript/plugin-auth
bunx jsr add @netscript/plugin-auth
```

### Usage

```typescript
import { authPlugin, inspectAuth } from '@netscript/plugin-auth';

// Register the auth plugin manifest with a NetScript app, then verify
// the contribution axes it brings before the app boots its services.
const inspection = inspectAuth(authPlugin);

if (!inspection.axes.includes('services')) {
  throw new Error('auth service contribution is required');
}

console.log(inspection.name, inspection.version, inspection.axes);
```

---

## 📦 Key Capabilities

- **Unified auth service**: contributes the `auth-api` oRPC service (default port `8094`) exposing
  `signin`, `callback`, `signout`, `session`, and `me` procedures over a versioned v1 contract.
- **Single-active backend**: selects one backend per app via `NETSCRIPT_AUTH_BACKEND` across
  `kv-oauth` (interactive OAuth/OIDC), `workos`, and `better-auth`; unsupported operations return
  typed auth-provider errors instead of faking parity.
- **Schema contribution**: ships the auth-owned Prisma schema so generated workspaces provision auth
  tables alongside the rest of the database.
- **Durable session streams**: the browser-safe `./streams` subpath builds a `StreamDB` for the
  `authSession` entity projection, with server-side emit helpers on `./streams/server`.
- **Scaffold-native**: registers as an official `auth` plugin through `scaffold.plugin.json`, wiring
  database and KV requirements into the NetScript CLI and Aspire orchestration.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/plugin-auth/](https://rickylabs.github.io/netscript/reference/plugin-auth/)
- **Identity & Access**:
  [rickylabs.github.io/netscript/identity-access/](https://rickylabs.github.io/netscript/identity-access/)
- **How-to — Add authentication**:
  [rickylabs.github.io/netscript/how-to/add-authentication/](https://rickylabs.github.io/netscript/how-to/add-authentication/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
