---
layout: layouts/base.vto
title: Discover services
description: Declare a service reference and call it through a typed client that resolves its URL from Aspire.
templateEngine: [vento, md]
order: 102
oldUrl: /how-to/discover-services/
---

# Discover services

This recipe calls another workspace member's or plugin's oRPC service from your app. You declare the
dependency so Aspire injects the callee's URL, then build a typed client from `@netscript/sdk` that
resolves that URL at request time. The shared contract supplies the method inputs, outputs, and
declared errors; discovery and transport failures stay non-defined failures.

{{ comp.badge({ status: "alpha" }) }}

NetScript has no service-registry API. Discovery is two mechanisms working together: Aspire injects
each referenced service's resolved endpoint as an environment variable (`services__<name>__http__0`),
and the typed client reads that variable lazily through `@netscript/sdk/discovery` when it builds the
request URL.

{{ comp.diagram({
  src: "/assets/diagrams/sdk-data-flow.svg",
  alt: "The shared contract object feeds the generated typed client; the client resolves the callee's URL from an Aspire-injected services__ env var and issues a cache-first oRPC query that the same contract's service implements.",
  caption: "Discovery flow: shared contract → typed client → URL resolved from the Aspire services__ env var → oRPC call to the service that implements the same contract."
}) }}

## Prerequisites

You need:

- A NetScript workspace containing the caller (an app, plugin, or service) and the callee service.
  Run commands from the workspace root.
- A callee service that answers on its own port over `/api/rpc/*`, such as the example `users`
  service. [Add a service](/services-sdk/how-to/add-a-service/) creates one.
- `@netscript/sdk`, a workspace dependency of apps and consuming services. It provides the typed
  client (`createServiceClient`, `defineServices`) and the discovery readers
  (`@netscript/sdk/discovery`).
- The shared contract, imported through the `@<project>/contracts` alias by both the service and the
  caller, so the client's types are inferred rather than duplicated.
- Aspire, which injects the `services__<name>__http__<index>` variables that discovery reads.
  Without it you set those variables yourself (see [Manual / non-Aspire resolution](#manual-non-aspire-resolution)).

This recipe uses the example `users` service as the callee and an app or another service as the
caller. Substitute your own service name.

## 1. Declare the service reference

The caller lists the services it depends on, by name, in the `ServiceReferences` array of its
resource entry. The init scaffold writes this into the Aspire `appsettings.json` when you scaffold an
app against a service. To add a dependency to an existing resource, add the callee's name to that
array.

```jsonc
// aspire/appsettings.json — the caller (an app here) depends on the users service
{
  "NetScript": {
    "Apps": {
      "web": {
        "Runtime": "deno",
        "Type": "app",
        "Port": 3000, // Note: Port values will differ based on the ports allocated at scaffold time.
        "ServiceReferences": ["users"]
      }
    }
  }
}
```

The names you list must match the service resource keys under `NetScript.Services`.

{{ comp callout { type: "note", title: "What the reference actually wires" } }}
At generate time the Aspire helper registers resources in two passes. Pass 1 creates every service
resource. Pass 2 walks each resource's <code>ServiceReferences</code>, calls
<code>getEndpoint('http')</code> on each referenced target, and injects it into the caller as
<code>services__&lt;name&gt;__http__0</code> through <code>withEnvironment(...)</code>. The SDK's
discovery layer reads that variable at request time, which is why the reference makes
<code>getServiceUrl('users')</code> resolve.
{{ /comp }}

## 2. Regenerate the Aspire helpers

The `register-services` helper that performs this wiring is generated from `appsettings.json`. After
editing `ServiceReferences`, regenerate it:

```bash
# from the workspace root — regenerates the Aspire helper files only
netscript service generate
```

`service generate` only rewrites the Aspire helper files, not your service code. The next
`aspire start` injects `services__users__http__0` into the caller's environment.

## 3. Construct the typed client

In the caller, import the same contract object the service implements and pass it to
`createServiceClient`. The `serviceName` is the discovery key and must match the name you referenced
in step 1. The client is typed from the contract; there is no generated client file. When its routes
are composed from `baseContract`, every method also carries the six standard declared errors through
the returned promise.

```ts
// web/src/clients/users.ts — a typed client for the discovered users service
import { createServiceClient } from '@netscript/sdk/client';
import { UsersContractV1 } from '@my-app/contracts';

// serviceName is the discovery key — it resolves services__users__http__0 at call time.
export const usersClient = createServiceClient({
  contract: UsersContractV1,
  serviceName: 'users',
});

// Input, output, and declared errors are inferred; a renamed field is a compile error.
const { items } = await usersClient.list({ limit: 20 });
```

The internal HTTP link resolves the URL lazily on the first call, so you can construct the client at
import time (even in a browser bundle) without touching Deno APIs. By default it targets
`<resolved-url>/api/rpc/v1/<service>` over HTTP.
[Constructing the client & factory](/services-sdk/sdk/#constructing-the-client-factory) lists every
option and its default.

## 4. Call it and handle typed errors

The client methods mirror the contract's procedure tree. Wrap a call in `safe()`, test `isSuccess`
first, then test `isDefined` on the failure. Throw or surface a plain error, transport failure, or
other non-defined value from that second branch so it never falls through to the success path.

```ts
// web/src/routes/users.ts — typed call with safe-style error handling
import { safe } from '@netscript/sdk/client';
import { usersClient } from '../clients/users.ts';

type UsersErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';

export async function listUsers() {
  const result = await safe(usersClient.list({ limit: 20 }));
  if (result.isSuccess) return result.data.items;
  if (!result.isDefined) throw result.error;

  const code: UsersErrorCode = result.error.code;
  if (result.error.code === 'NOT_FOUND') {
    // The code selects NOT_FOUND's schema-derived data shape.
    console.error(result.error.data.resourceType, result.error.data.resourceId);
  }
  throw new Error(`users.list failed: ${code}`, { cause: result.error });
}
```

On the defined branch, `error.code` selects the schema for `error.data`.
[Safe error narrowing](/services-sdk/sdk/#safe-error-narrowing) covers the six `baseContract`
codes and `isDefinedError()`.

## Many services at once with `defineServices`

When the caller talks to several services, `defineServices` builds the clients, cache-aware query
factories and TanStack Query utils from one map. The map key is the discovery key unless you override
`serviceName`.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Direct — createServiceClient",
    lang: "ts",
    code: "// web/src/clients/users.ts — one service, direct calls only\nimport { createServiceClient } from '@netscript/sdk/client';\nimport { UsersContractV1 } from '@my-app/contracts';\n\nexport const usersClient = createServiceClient({\n  contract: UsersContractV1,\n  serviceName: 'users',\n});\n\nconst page = await usersClient.list({ limit: 20 });\nvoid page;"
  },
  {
    label: "Many — defineServices",
    lang: "ts",
    code: "// web/src/sdk.ts — clients + query factories + query utils for several services\nimport { defineServices } from '@netscript/sdk';\nimport { OrdersContractV1, UsersContractV1 } from '@my-app/contracts';\n\nexport const sdk = defineServices({\n  // map key is the discovery key (services__users__http__0, services__orders__http__0)\n  users: { contract: UsersContractV1 },\n  orders: { contract: OrdersContractV1, options: { staleTime: 60_000 } },\n});\n\nconst people = await sdk.clients.users.list({ limit: 20 });\nconst orderPage = await sdk.queries.orders.list({ limit: 20, offset: 0 });\nvoid people;\nvoid orderPage;"
  }
] }) }}

`defineServices` returns `{ clients, queries, queryUtils }`. Each entry's `serviceName` defaults to
the map key, so `users` resolves `services__users__http__0`. Override it only when the registered
service name differs from your map key.

## Manual / non-Aspire resolution

Use the discovery readers directly when you are not running under Aspire, for a smoke test, a
one-off script, or a custom transport. `getServiceUrl(name)` throws an error naming the missing
variable, `isServiceAvailable(name)` is the non-throwing probe, and `getAllServices()` lists every
`services__*` name in the environment.

```ts
// scripts/check-users.ts — resolve a discovered URL by hand
import { getAllServices, getServiceUrl, isServiceAvailable } from '@netscript/sdk/discovery';

if (isServiceAvailable('users')) {
  const baseUrl = getServiceUrl('users', 'http'); // reads services__users__http__0
  console.log('users at', baseUrl, '| all:', getAllServices());
}
```

The server-side lookup key is `services__<name>__http__<index>`. The browser path checks the
`VITE_`-prefixed forms first, which Aspire injects for Vite apps. To point a client at a fixed URL
without an orchestrator, set the variable yourself:

```bash
# point the users client at a locally-running service, no Aspire
services__users__http__0=http://localhost:<users-port> deno task --cwd web dev
```

### A runtime with neither Vite nor Deno

`getServiceUrl` has two sources, `import.meta.env` and `Deno.env`. A React Native (Metro) runtime
has neither, so the default client cannot find the service. Pass `resolveServiceUrl` instead. It
receives the client's `serviceName` and `protocol` on every call; throw from it to fail the call.
To keep Aspire's key names, compose the pure `resolveServiceUrlFromSources` over an explicit
environment bag. It reads no runtime global and returns `undefined` rather than throwing:

```ts
// mobile/src/clients/users.ts — the origin comes from app config, not the environment
import { createServiceClient } from '@netscript/sdk/client';
import { resolveServiceUrlFromSources } from '@netscript/sdk/discovery';
import { UsersContractV1 } from '@my-app/contracts';

const browserEnv = { VITE_USERS_URL: 'https://api.example.com' };

export const usersClient = createServiceClient({
  contract: UsersContractV1,
  serviceName: 'users',
  resolveServiceUrl: (serviceName, protocol) => {
    const url = resolveServiceUrlFromSources(serviceName, protocol, 0, { browserEnv });
    if (url === undefined) throw new Error(`No URL configured for "${serviceName}"`);
    return url;
  },
});
```

## End to end in one pass

The four steps against the example `users` service, start to finish. Copy the file, then run the
commands from the workspace root:

```ts
// web/src/clients/users.ts — the resulting file (contract in, typed client out)
import { createServiceClient, safe } from '@netscript/sdk/client';
import { UsersContractV1 } from '@my-app/contracts';

// serviceName is the discovery key — resolves services__users__http__0 at call time.
export const usersClient = createServiceClient({
  contract: UsersContractV1,
  serviceName: 'users',
});

type UsersErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';

// A typed call with safe-style error handling — no hardcoded URL anywhere.
export async function firstUsers() {
  const result = await safe(usersClient.list({ limit: 20 }));
  if (result.isSuccess) return result.data.items;
  if (!result.isDefined) throw result.error;

  const code: UsersErrorCode = result.error.code;
  if (result.error.code === 'VALIDATION_ERROR') {
    // VALIDATION_ERROR selects { formErrors, fieldErrors } from its contract schema.
    console.error(result.error.data.formErrors, result.error.data.fieldErrors);
  }
  throw new Error(`users.list failed: ${code}`, { cause: result.error });
}
```

```bash
# From the workspace root, in order:

# 1. Declare the dependency — add "users" to the caller's ServiceReferences
#    array in aspire/appsettings.json (see Step 1 above).

# 2. Regenerate the Aspire helpers so the reference is wired into the AppHost.
netscript service generate

# 3. Bring the graph up — Aspire injects services__users__http__0 into the caller.
cd aspire && aspire start && cd ..

# 4. Run the caller; the typed client resolves the URL lazily on the first call.
deno task --cwd web dev
```

With `aspire start` up, `usersClient.list({ limit: 20 })` resolves `services__users__http__0`,
calls `<resolved-url>/api/rpc/v1/users`, and returns the contract's typed `items` on success. Its
declared error union comes from the same contract; non-defined runtime failures stay separate.

## Production pitfalls

- **Pre-1.0 surface.** NetScript packages share the aligned `{{ releaseVersion }}` version. The
  discovery variable convention and client option names are stable in the scaffold but may change
  before 1.0. Pin the version you build on.
- **Declare, then generate.** A `ServiceReferences` entry does nothing until you re-run
  `netscript service generate` and restart `aspire start`. Without the reference,
  `getServiceUrl` throws `Service URL not found … Expected environment variable:
  services__<name>__http__0`.
- **The discovery key must match.** `serviceName` (and the `defineServices` map key) must equal the
  service's registered name, or discovery reads a variable that was never injected.
- **The served path is `/api/rpc/*`.** The client defaults to `apiPath: '/api/rpc'` and
  `apiVersion: 'v1'`. If your service mounts a different path, set them explicitly or calls return
  404. It is not a bare `/rpc`.
- **Outside Aspire, you supply the URL.** Without an orchestrator, `services__<name>__http__0` is
  unset. Set it yourself, or pass a `resolveServiceUrl` callback on a runtime with no environment.

## Next steps

Serve the OpenAPI document and Scalar UI for your service with
[Expose OpenAPI & Scalar](/services-sdk/how-to/expose-openapi-scalar/). See also
[Typed SDK & client](/services-sdk/sdk/), the [`@netscript/sdk` reference](/reference/sdk/), and
[Orchestration with Aspire](/explanation/aspire/).
