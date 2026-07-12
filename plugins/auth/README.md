# @netscript/plugin-auth

[![JSR](https://jsr.io/badges/@netscript/plugin-auth)](https://jsr.io/@netscript/plugin-auth)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The deployable auth plugin for NetScript. It binds the host plugin system to a unified auth API
service, single-active-backend selection, the auth database schema, and durable session-stream
projections through a single declarative manifest.**

---

## 🚀 Quick Start

### Add it to a NetScript app

From the root of a generated NetScript project:

```bash
netscript plugin install auth
```

`plugin install` resolves `@netscript/plugin-auth` from JSR and runs the plugin's own scaffolder — the
plugin owns its setup, so the CLI ships no embedded templates. The scaffolder wires the auth API
service, the auth database schema, session streams, and Aspire resources into your workspace, then
pins the matching `@netscript/*` versions.

> **Provisioning:** auth requires both Postgres (for the auth schema) and Deno KV (for sessions).
> `plugin install` records these requirements from the manifest so `netscript db` and Aspire
> orchestration provision them for you.

### Use it as a library

To consume the plugin programmatically (custom hosts, tests, tooling):

```bash
# Deno
deno add jsr:@netscript/plugin-auth

# Node.js / Bun
npx jsr add @netscript/plugin-auth
bunx jsr add @netscript/plugin-auth
```

```typescript
import { inspectPlugin } from '@netscript/plugin';
import { authPlugin } from '@netscript/plugin-auth';

// Register the auth plugin manifest with a NetScript app, then verify
// the contribution groups it brings before the app boots its services.
const inspection = inspectPlugin(authPlugin);

if (inspection.details.contributionGroups === 0) {
  throw new Error('auth service contribution is required');
}

console.log(
  inspection.target,
  inspection.details.version,
  inspection.details.contributionGroups,
);
```

---

## 📦 Key Capabilities

- **Unified auth service**: contributes the `auth-api` oRPC service (default port `8094`) exposing
  `signin`, `callback`, `signout`, `session`, and `me` procedures over a versioned v1 contract.
- **Single-active backend**: selects one backend per app via `NETSCRIPT_AUTH_BACKEND` across
  `kv-oauth` (interactive OAuth/OIDC), `workos`, and `better-auth`. Operations a backend does not
  support return typed auth-provider errors, so capability differences surface explicitly at the API
  boundary.
- **Schema contribution**: ships the auth-owned Prisma schema so generated workspaces provision auth
  tables alongside the rest of the database.
- **Durable session streams**: the browser-safe `./streams` subpath builds a `StreamDB` for the
  `authSession` entity projection, with server-side emit helpers on `./streams/server`.
- **Scaffold-native**: registers as an official `auth` plugin through `scaffold.plugin.json`, wiring
  database and KV requirements into the NetScript CLI and Aspire orchestration.

The domain schemas, `AuthBackendPort` seam, oRPC v1 contract, and Zod config live in
`@netscript/plugin-auth-core`; this package binds them to the host.

---

## 🧩 Install manifest

The plugin root ships `scaffold.plugin.json` — the declarative contract `plugin install` reads to
install the plugin. It is editor-validated through a bundled JSON Schema (`$schema`), so the
manifest gives you IntelliSense and validation in any schema-aware editor.

```jsonc
{
  "$schema": "...", // @netscript/plugin scaffold.plugin.schema.json
  "name": "@netscript/plugin-auth",
  "provider": { "kind": "auth", "category": "plugin" },
  "capabilities": {
    "hasDatabaseMigrations": true,
    "hasRoutes": true,
    "hasBackgroundWorkers": false
  },
  "scaffolder": { "export": "./scaffold" }
}
```

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

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
