# @netscript/plugin-auth-core

`@netscript/plugin-auth-core` is the contract package for NetScript auth plugins. It publishes the
domain types, backend adapter port, oRPC v1 contract schemas, durable stream schema, config schema,
provider preset surface, and small contract-level testing fixtures used by the auth plugin program.

This package is intentionally behavior-light. It does not mount HTTP handlers, create routers, open
databases, run CLIs, or implement provider SDKs. Adapter packages implement the ports exported here
and later plugin slices bind those adapters into services.

## Install

```sh
deno add jsr:@netscript/plugin-auth-core
```

## Exports

| Export                                     | Purpose                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `@netscript/plugin-auth-core`              | Curated root surface for common domain, config, and preset contracts.               |
| `@netscript/plugin-auth-core/domain`       | `AuthSession`, `Account`, `AuthUser`, state types, and the service auth seam types. |
| `@netscript/plugin-auth-core/ports`        | `AuthBackendPort` and the backend selection registry seam.                          |
| `@netscript/plugin-auth-core/contracts/v1` | oRPC `auth.contract` v1 schemas and contract definition.                            |
| `@netscript/plugin-auth-core/streams`      | Durable stream schema for auth session projections and event payloads.              |
| `@netscript/plugin-auth-core/config`       | Zod-backed auth plugin config schemas.                                              |
| `@netscript/plugin-auth-core/presets`      | Provider and backend preset definition and registry types.                          |
| `@netscript/plugin-auth-core/testing`      | Contract-level fixtures and builders for tests.                                     |

## Quick Start

```ts
import { AuthConfigSchema, createAuthPresetRegistry } from '@netscript/plugin-auth-core';
import { createAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';
import type { AuthBackendPort } from '@netscript/plugin-auth-core/ports';

declare const backend: AuthBackendPort;

const config = AuthConfigSchema.parse({
  backend: 'kv-oauth',
  session: { cookieName: 'ns_session' },
});

const presets = createAuthPresetRegistry([]);
const backends = createAuthBackendRegistry(new Map([[config.backend, backend]]), config.backend);

console.log(config.backend, presets.size, backends.defaultName);
```

## Required Permissions

None. This package contains contracts, schemas, and pure testing fixtures only.

## Docs

- [`@netscript/service`](../service/README.md) for the `Principal`, `AuthnRequest`, `AuthnResult`, and
  `AuthenticatorPort` seam consumed by service hosts.
- [`@netscript/plugin-streams-core`](../plugin-streams-core/README.md) for the durable stream schema primitive used by the auth stream
  projection schema.

## License

MIT
