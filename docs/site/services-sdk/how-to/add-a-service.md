---
layout: layouts/base.vto
title: Add a service
description: Add a typed oRPC service to a workspace, serve it with defineService, and verify its REST and RPC surfaces.
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/add-a-service/
---

# Add a service

This recipe adds a typed oRPC service to an existing NetScript workspace. You define its contract,
implement the handlers, serve it with `defineService`, and confirm it answers on its own port over
both its OpenAPI surface and the `/api/rpc/*` endpoint that typed clients call. For the guided
version that explains why each piece exists, follow the
[Build a service tutorial](/tutorials/storefront/02-catalog-service/). For the runtime API, see the
[`@netscript/service` reference](/reference/service/).

## Before you start

You need:

- A NetScript workspace created with `netscript init`. Run every command from the workspace root.
- The `netscript` command on your path. Install it with
  `deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}`, then
  confirm with `netscript --help`.
- The shared `contracts/` workspace that `init` scaffolds, exposed as the `@<project>/contracts`
  import alias. New services add their contract there so clients can import it.
- A free port. The scaffold allocates stable high-range ports (>= 49152) to standalone services,
  plugin APIs and apps, and writes them to your `appsettings.json`.

This recipe adds a service named `users` on its assigned port, mirroring the example the scaffold
ships, so every path and code shape below matches a generated workspace. Substitute your own name
and port.

## 1. Scaffold the service

Let the CLI scaffold the service workspace. For a new project, pass the service flags to
`netscript init`:

```bash
netscript init my-app --db postgres --service --service-name users --yes
```

`--db postgres` is the recommended default. Use `mysql`, `mssql`, or `sqlite` for a different
Prisma-backed engine; `sqlite` is file-backed and runs without an Aspire container.

In an existing workspace, use `netscript service add` with the `--name` and `--port` flags. The
`service` group also has `list` and `generate`; `service generate` only regenerates Aspire helper
files.

```bash
# from the workspace root
netscript service add --name users --with-client
```

`--with-client` also writes `apps/<app>/lib/users.ts`, which exports the `usersClient` and
`usersQueries` symbols that page loaders and islands use. Either path creates a `services/users/`
workspace member:

```tree
services/users/
├── deno.json              # workspace member; exports ./src/main.ts
└── src/
    ├── main.ts            # compose the adapter and call defineService
    ├── router.ts          # compose use-cases and aggregate version bindings
    ├── application/       # one entity module with use-cases and its repository port
    ├── domain/            # pure policy
    ├── adapters/          # Prisma or instance-owned seeded memory repository
    └── routers/
        ├── v1.ts          # thin contract bindings calling application use-cases
        └── health.ts      # health.check handler
```

The generated service includes a colocated `*_test.ts` module, and `deno task test` runs it without a
database. [Service layout](/services-sdk/service-layout/) lists the exact filenames, when to split
modules, and how to migrate an existing service.

{{ comp callout { type: "tip", title: "Naming and the import alias" } }} The service name
(<code>users</code>) becomes the folder under <code>services/</code> and the service's reported
<code>name</code>. Its contract lives in the shared <code>contracts/</code> workspace. Import it
through the <code>@&lt;project&gt;/contracts</code> alias (<code>@my-app/contracts</code> in the
example), never through a relative <code>../../contracts</code> path. {{ /comp }}

## 2. Define the contract

A service implements a contract, so define the contract first. `service add` creates the initial
versioned contract and aggregate. Add each procedure through the CLI, which updates the existing
contract without hand-editing the aggregate:

```bash
netscript contract add-route users findByEmail \
  --method POST \
  --path /users/by-email \
  --input "z.object({ email: z.string().email() })" \
  --output "UsersListItemSchemaV1.optional()"

netscript contract inspect users
netscript contract inspect users --json
```

The command appends an `@orpc/contract` and Zod route to
`contracts/versions/v1/users.contract.ts`; keep its generated schemas, types and procedures. The
module calls `implement()`, so each procedure is ready for `.handler()` binding. The equivalent
procedure declaration is:

```ts
import { z } from 'zod';
import { oc } from '@orpc/contract';
import { UsersListItemSchemaV1 } from '@my-app/contracts';

export const findByEmail = oc.route({ method: 'POST', path: '/users/by-email' })
  .input(z.object({ email: z.string().email() }))
  .output(UsersListItemSchemaV1.optional());
```

The CLI inserts that procedure into `UsersContractV1`; it does not replace the existing `list`,
`updateStatus` or health procedures. Add the corresponding application use-case and router binding
as described in Step 3.

The CLI maintains this aggregate so callers and the service share one type source:

```ts
// contracts/versions/v1/mod.ts
import { UsersContractV1, UsersV1 } from './users.contract.ts';

export { UsersContractV1, UsersV1 };
export const v1 = { users: UsersV1 };
```

`implement(UsersContractV1)` produces the object whose `.handler()` the service binds, and a typed
client imports the same contract. Change a schema and both the handler and every caller fail to
type-check until they agree.

For a breaking schema change, promote the contract instead of editing v1 in place. This creates the
v2 aggregate and updates the root contract exports:

```bash
netscript contract version add users --from v1 --to v2
netscript contract list
```

## 3. Implement the handlers

The generated application module owns the use-cases and the repository port. Add operation logic
there, then bind the implemented contract to it in `routers/v1.ts`. The router only binds procedures
and maps transport errors. The memory variant's bindings:

```ts
// services/users/src/routers/v1.ts
import { notFound } from '@netscript/contracts';
import { v1 } from '@my-app/contracts';
import type { UsersApplication } from '../application/users.ts';

export function createUsersV1(application: UsersApplication) {
  return {
    list: v1.users.list.handler(({ input }) => application.list(input)),
    updateStatus: v1.users.updateStatus.handler(async ({ input, errors }) => {
      const record = await application.updateStatus(input);
      if (!record) {
        notFound({ errors, resourceId: input.id, message: `users record ${input.id} not found` });
      }
      return record;
    }),
  };
}
```

Aggregate the bindings and compose the application from its repository port:

```ts
// services/users/src/router.ts
import { createUsersV1 } from './routers/v1.ts';
import { health } from './routers/health.ts';
import { createUsersApplication, type UsersRepository } from './application/users.ts';

export function createRouter(repository: UsersRepository) {
  const application = createUsersApplication(repository);
  return { v1: { users: { ...createUsersV1(application), health } } };
}

export type Router = ReturnType<typeof createRouter>;
```

The Prisma variant uses the model's filename, such as `application/user.ts`, and binds the CRUD
procedures instead. Its repository implements the same layering rule. See
[Service layout](/services-sdk/service-layout/) for the full vocabulary and migration steps.

`service add-handler <service> <procedure>` inserts a compiling stub into the generated factory's
returned object, bound through the existing contract's `.handler()`. It also works on existing
services with an exported router object. Replace the stub's throw with a call to an application
use-case.

## 4. Serve it with `defineService`

`netscript service add` already creates the entry point and registers it in appsettings and the Deno
workspace; `netscript service generate` regenerates Aspire helpers after later config edits. The
entry point passes the router to `defineService(...)` and reads the port from `PORT` with a literal
fallback, so the same code runs locally and under Aspire.

With auth installed, the shared verifier lives at the workspace root:

```ts
// auth/service.ts
import { createAuthServiceAuthenticator } from '@netscript/plugin-auth-core/authenticator';

export const browserAuthenticator = createAuthServiceAuthenticator({
  serviceName: 'auth',
  timeoutMs: 10_000,
});
```

The generated entrypoint composes it with the contract authorizer:

```ts
// services/users/src/main.ts
import { defineService } from '@netscript/service';
import { browserAuthenticator } from '../../../auth/service.ts';
import { createContractAuthorizer } from '@netscript/service/auth';
import { createRouter } from './router.ts';
import { createMemoryUsersRepository } from './adapters/memory-users-repository.ts';

const router = createRouter(createMemoryUsersRepository());

await defineService(router, {
  auth: {
    authn: {
      authenticator: browserAuthenticator,
      allowAnonymous: ['/health', '/api/openapi.json', '/api/docs'],
    },
    authz: { authorizer: createContractAuthorizer(router) },
  },
  name: 'users',
  version: '1.0.0',
  port: parseInt(Deno.env.get('PORT') || '3001'), // note: your scaffold's port will differ
  openapi: { title: 'Users API', description: 'users service' },
  debug: true,
  // Reject request bodies over 1 MiB with a typed 413. Raise it for upload-heavy services.
  bodyLimit: { maxBytes: 1024 * 1024 },
});
```

When the auth plugin is installed with `--name auth` and enabled, `netscript service add` uses the
same BFF composition as a service created before auth was installed. Both reconcile the scaffold
policy through the generated `auth/service.ts` browser authenticator and
`createContractAuthorizer(router)`. `generate aspire` only regenerates helpers and leaves authored
source and appsettings unchanged.

`/health`, `/api/openapi.json` and `/api/docs` stay anonymous. Generated demo procedures declare
`access: { authentication: 'none' }` in their contracts, so their REST and RPC calls stay public. A
procedure declaring `authentication: 'required'` returns 401 without a bearer session, 403 when its
contract authorization denies the session, and 200 when authorized. Declare a procedure's
permissions in its contract; there is no service-wide `<service>:access` scope requirement. Authored
policies remain authoritative.

The browser authenticator uses the bearer-only remote verifier through the auth service's SDK, so
the guarded service holds no backend or provider secret. Fresh forwards the session bearer through an
SDK contribution on the server. The [auth model](/explanation/auth-model/#generated-browser-topology)
and the [authentication guide](/identity-access/how-to/add-authentication/) describe the BFF
topology. `service add` does not support renamed auth keys; an inconsistent installed auth manifest
produces a configuration error.

Without an enabled auth plugin, the entrypoint explicitly records its public posture:

```ts
// services/users/src/public-main.ts
import { defineService } from '@netscript/service';
import { createRouter } from './router.ts';
import { createMemoryUsersRepository } from './adapters/memory-users-repository.ts';

const router = createRouter(createMemoryUsersRepository());

await defineService(router, {
  name: 'users',
  auth: {
    public: true,
    reason:
      'Service authentication is not configured. Install or enable the auth plugin to protect this API.',
  },
});
```

After installing auth, add a guarded service or update an existing public entrypoint with the
guarded policy above. The CLI preserves an authored entrypoint unless you explicitly overwrite it.

New services from `netscript service add` set a 1 MiB `bodyLimit`. Raise `maxBytes` for a service
that accepts larger payloads, such as base64 document uploads, or remove the line to accept
unbounded bodies.

Aspire injects `PORT` at runtime. The typed source of truth is the `services.<name>.port` field in
`netscript.config.ts`, which the scaffold wires as the fallback default; set the port there rather
than editing the entrypoint.

`defineService` mounts your router under an OpenAPI surface (`/api/v1/users/*`) and the RPC surface
(`/api/rpc/v1/...`). The default mount points are `/api` for OpenAPI and `/api/rpc` for RPC; with
`createService`, the builder's `apiPath` and `rpcPath` options override them.

To remove the service later, `netscript service remove users` deletes the service workspace, its
appsettings and workspace registrations, the paired contracts, and the regenerated helpers. Pass
`--keep-contract` to keep the API definition published after the runtime is retired.

{{ comp callout { type: "note", title: "Need CORS, a database, or auth? Use createService" } }} To
layer cross-cutting concerns, use the fluent builder instead of <code>defineService</code>. Each step
returns the builder, so you compose only what you need before <code>.serve({ port })</code>:

<pre><code>const app = createService(router, { name: 'users', version: '1.0.0' })
  .withCors()
  .withDatabase(db)
  .withAuthn({ authenticator })
  .withAuthz({ authorizer })
  .withRPC();
await app.serve({ port: 3001 }); // note: your scaffold's port will differ</code></pre>

The authn/authz seam (<code>@netscript/service/auth</code>) is provider-agnostic and ships
static-credential and trusted-header authenticators and a scope authorizer. It is separate from the
auth <strong>plugin</strong> backends; see <a href="/identity-access/auth/">Authentication</a>. {{ /comp }}

## 5. Run and verify

Run the service on its own, or let `aspire start` run it with the rest of your resources:

```bash
# run only the users service
deno task --cwd services/users dev
```

It binds on its assigned port. Check the health route over HTTP and the RPC surface that typed
clients call:

```bash
# OpenAPI / HTTP surface (replace <port> with your assigned port)
curl http://localhost:<port>/api/v1/users/health

# RPC surface (replace <port> with your assigned port, what the generated typed client uses)
curl -X POST http://localhost:<port>/api/rpc/v1/users/list \
  -H 'content-type: application/json' -d '{"limit":10}'
```

A healthy service returns `{"status":"healthy","service":"users"}` from the health route and the
seeded `items` array from `list`. A typed client imports `UsersContractV1` from `@my-app/contracts`
and calls `.list(...)` with full input and output inference, with no code generation.

## Production pitfalls

- **Port collisions.** Every service needs a distinct port. The scaffold allocates unique high-range
  ports (>= 49152). Read the port from `PORT` and let Aspire resolve it in orchestrated runs instead
  of hard-coding it.
- **RPC lives under `/api/rpc/*`.** The typed-client surface is
  `/api/rpc/<version>/<router>/<procedure>`, not a bare `/rpc`. The REST/OpenAPI surface is
  `/api/*`. Point clients and smoke tests at the right one.
- **Contracts before handlers.** Edit the contract first, then the handler. A handler that gets
  ahead of its contract breaks every client.
- **Use the import alias.** Import contracts through `@<project>/contracts`, not a relative path, so
  the service and its clients resolve the same type.
- **No database yet at this step.** The scaffold handlers return seeded in-memory records. Wire
  persistence with the [database recipe](/data-persistence/how-to/database-migration/) before you
  depend on durability.

## Next steps

Call the new service from an app or another service with
[Discover services](/services-sdk/how-to/discover-services/). Change it over time by editing its
contract under `contracts/versions/` and re-running `deno task check`. See also
[Contracts, explained](/explanation/contracts/) and the
[`@netscript/service` reference](/reference/service/).
