# @netscript/service

[![JSR](https://jsr.io/badges/@netscript/service)](https://jsr.io/@netscript/service)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The service runtime for NetScript: a fluent builder that turns an oRPC router into a Hono service
with health probes, OpenAPI, Scalar docs, and graceful shutdown. `defineService()` wires the full
surface in one call; `createService()` composes it step by step.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/service

# Node.js / Bun
npx jsr add @netscript/service
bunx jsr add @netscript/service
```

### Usage

```typescript
import { defineService } from '@netscript/service';
import { router } from './router.ts';

// One call materializes the Hono + oRPC runtime and starts the listener:
// CORS, request logging, OpenAPI JSON, Scalar docs, RPC, service info, and health.
const service = await defineService(router, {
  name: 'users',
  version: '1.0.0',
  port: 3001,
  openapi: { title: 'Users API', description: 'User management service' },
});

// RunningService handle: addr + idempotent graceful stop() for tests and supervisors.
console.log(`listening on :${service.addr.port}`);
await service.stop();
```

---

## 📦 Key Capabilities

- **Fluent builder**: `createService(router, config)` composes CORS, logging, OpenAPI, Scalar docs,
  RPC, health, custom routes, and auth stages, then `serve()` (start a listener) or `build()`
  (return a mountable `ServiceApp`).
- **One-call preset**: `defineService(router, options)` stands up the full runtime that generated
  NetScript service entrypoints use, with health-aware shutdown when the database client exposes
  `$disconnect()`.
- **Health probes**: `withHealth()` adds `/health`, `/health/live`, and `/health/ready`;
  `healthChecks.database`, `.kv`, `.service`, and `.custom` cover common dependencies.
- **Graceful lifecycle**: `onShutdown()` registers LIFO teardown hooks; `serve()` drains in-flight
  requests through `Deno.serve`'s shutdown, installs `SIGINT`/`SIGTERM` handlers, and accepts an
  external `AbortSignal`.
- **Opt-in auth**: `@netscript/service/auth` ships provider-agnostic authentication and
  authorization ports plus static-credential, trusted-header, and scope-authorizer factories, kept
  off the import graph until a service uses it.

---

## ⚙️ Builder & auth

Reach for `createService()` when a service needs explicit, stage-by-stage composition — and pull in
`@netscript/service/auth` to guard it with authentication and authorization:

```ts
import { createService } from '@netscript/service';
import {
  createScopeAuthorizer,
  createStaticCredentialAuthenticator,
} from '@netscript/service/auth';

const authenticator = createStaticCredentialAuthenticator({
  credentials: {
    'local-token': { subject: 'service:orders', scopes: ['orders:read'], roles: ['service'] },
  },
});

const authorizer = createScopeAuthorizer({
  rules: [{
    match: (request) => request.path.startsWith('/api/orders'),
    requireScopes: ['orders:read'],
  }],
});

const running = await createService(router, { name: 'orders', version: '1.0.0' })
  .withAuthn({ authenticator })
  .withAuthz({ authorizer })
  .withRPC()
  .withHealth()
  .serve({ port: 3001 });

await running.stop();
```

Generated entrypoints stay on the `defineService()` preset and opt in by passing `auth`, so the same
authn/authz ports apply without leaving the one-call surface:

```ts
import { defineService } from '@netscript/service';
import { createScopeAuthorizer, createTrustedHeaderAuthenticator } from '@netscript/service/auth';

const running = await defineService(router, {
  name: 'orders',
  port: 3001,
  auth: {
    authn: {
      authenticator: createTrustedHeaderAuthenticator({
        subjectHeader: 'x-authenticated-user',
        scopesHeader: 'x-authenticated-scopes',
      }),
    },
    authz: {
      authorizer: createScopeAuthorizer({
        rules: [{
          match: (request) => request.path.startsWith('/api/orders'),
          requireScopes: ['orders:read'],
        }],
      }),
    },
  },
});

await running.stop();
```

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/service/](https://rickylabs.github.io/netscript/reference/service/)
- **Services & SDK pillar**:
  [rickylabs.github.io/netscript/services-sdk/](https://rickylabs.github.io/netscript/services-sdk/)
- **How-to: Add a service**:
  [rickylabs.github.io/netscript/how-to/add-a-service/](https://rickylabs.github.io/netscript/how-to/add-a-service/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
