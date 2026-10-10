---
layout: layouts/base.vto
title: Add a service
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/add-a-service/
---

# Add a service

**Goal:** add a new typed oRPC service to an existing NetScript workspace — define
its contract, implement the handlers, serve it with `defineService`, and confirm it
answers on its own port over both its OpenAPI surface and the `/api/rpc/*` RPC endpoint
that typed clients call.

This is a task-oriented recipe. It assumes you already have a NetScript workspace
(created with `netscript init`) and that the `netscript` command is on your path. If
you want the guided, build-up-from-scratch version that explains _why_ each piece
exists — contract to typed client to a Fresh island — follow the
[Build a service tutorial](/tutorials/storefront/02-catalog-service/) instead. For the full generated
API of the service runtime, see the [`@netscript/service` reference](/reference/service/);
for the concept behind contract-first wiring, read
[Contracts, explained](/explanation/contracts/).

A NetScript service is contract-first: a service is the runtime that _implements_ an
`@orpc/contract` definition. You author the contract once (route + zod input/output),
`implement()` it, bind `.handler()`s, then hand the resulting router to
`defineService(...)`. The same contract object is what a typed client imports, so the
service and its callers cannot drift.

{{ comp callout { type: "note", title: "Two ways to construct a service" } }}
Workspace services use <code>defineService(router, options)</code> — one call, an options
object, the right default for the 80% case. NetScript <strong>plugin</strong> API services
(workers, sagas, triggers, auth) instead use the fluent
<code>createService(router, options).withCors().withDatabase(db).withRPC().serve({ port })</code>
builder when they need to layer CORS, OpenAPI, a database client, authn/authz, or custom
context step by step. Both stand up the same Hono + oRPC runtime and advertise the identical
<code>/api/rpc/*</code> endpoint; this recipe uses <code>defineService</code>.
{{ /comp }}

## Before you start

{{ comp.apiTable({
caption: "Prerequisites",
rows: [
{ name: "A NetScript workspace", type: "netscript init", desc: "An existing project on disk. If you do not have one, scaffold it first — see the tutorials. Run commands from the workspace root." },
{ name: "The netscript CLI", type: "on your PATH", desc: "Install globally with: deno install --global --allow-all --name netscript jsr:@netscript/cli" + releaseSpecifier + " — then confirm with netscript --help." },
{ name: "A contracts workspace", type: "contracts/", desc: "The init scaffold ships a shared contracts/ workspace exposed as the @<project>/contracts import alias. New services add their contract here so clients can import it." },
{ name: "A free port", type: "Randomized by default", desc: "Standalone services, plugin APIs, and apps are allocated stable high-range ports (>= 49152) at scaffold time to avoid collision. The exact ports are written to your appsettings.json." }
]
}) }}

This recipe adds a service named `users` on its assigned port, mirroring the example the
scaffold ships, so every path and code shape below matches a real generated workspace.
Substitute your own name and port where you see them.

## Step 1 — Scaffold the service (or add one at init time)

The fastest path is to let the CLI scaffold a service workspace for you. If you are
creating a brand-new project, pass the service flags straight to `netscript init`:

```bash
netscript init my-app --db postgres --service --service-name users --yes
```

`--db postgres` is the recommended default; swap it for `mysql`, `mssql`, or `sqlite` to scaffold a different Prisma-backed engine (`sqlite` is file-backed and runs without an Aspire container).

To add a service to a workspace that already exists, use the `netscript service add`
subcommand with the `--name` and `--port` flags (the `service` group also has `list` and
`generate` subcommands; `service generate` only regenerates Aspire helper files):

```bash
# from the workspace root
netscript service add --name users --with-client
```

`--with-client` also writes `apps/<app>/lib/users.ts`, exporting the service-derived `usersClient`
and `usersQueries` symbols used by page loaders and islands. Either path lays down a
`services/users/` workspace member with this shape:

```text
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

The generated service includes a colocated `*_test.ts` module; `deno task test` runs it without a
running database. See [Service layout](/services-sdk/service-layout/) for exact filenames, the
collapse decision table, and migration from an existing service.

{{ comp callout { type: "tip", title: "Naming and the import alias" } }}
The service name (<code>users</code>) becomes the workspace folder under <code>services/</code> and the
service's reported <code>name</code>. Its contract lives in the shared <code>contracts/</code> workspace and is
imported through the <code>@&lt;project&gt;/contracts</code> alias (for the example project that is
<code>@my-app/contracts</code>) — never via a relative <code>../../contracts</code> path.
{{ /comp }}

## Step 2 — Define the contract

A service implements a contract; define it first. `service add` creates the initial versioned
contract and aggregate. Add each procedure through the CLI so it updates the existing contract
without hand-editing the aggregate:

```bash
netscript contract add-route users findByEmail \
  --method POST \
  --path /users/by-email \
  --input "z.object({ email: z.string().email() })" \
  --output "UsersListItemSchemaV1.optional()"

netscript contract inspect users
netscript contract inspect users --json
```

The command appends an `@orpc/contract` + Zod route to the existing
`contracts/versions/v1/users.contract.ts`; retain its generated schemas, types and procedures.
The module calls `implement()` so each procedure is ready for `.handler()` binding. The equivalent
new procedure declaration is:

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

{{ comp callout { type: "important", title: "Contract is the source of truth" } }}
Each route is <code>oc.route({ method }).input(zod).output(zod)</code>. Calling
<code>implement(UsersContractV1)</code> produces the object whose <code>.handler()</code> the service
binds — and the very same contract is what a typed client imports. Change the schema in one
place and both the service handler and every caller fail to type-check until they agree.
{{ /comp }}

For a breaking schema change, promote the contract instead of editing v1 in place. This creates
the v2 aggregate and updates the root contract exports:

```bash
netscript contract version add users --from v1 --to v2
netscript contract list
```

## Step 3 — Implement the handlers

The generated application module owns the use-cases and repository port. Add operation logic there,
then bind the implemented contract to it in `routers/v1.ts`. The router should only bind procedures
and map transport errors. The memory variant's bindings look like this:

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
returned object, bound through the existing contract's `.handler()`. It also supports existing
services with an exported router object. Replace the stub's throw with a call to an application
use-case. Generation of the use-case alongside its thin binding is tracked in
[#2113](https://github.com/rickylabs/netscript/issues/2113).

## Step 4 — Serve it with `defineService`

`netscript service add` already creates this entry point and registers it in appsettings and the
Deno workspace; `netscript service generate` can regenerate Aspire helpers after later config
edits. The service entry point passes the router to `defineService(...)`. The port reads from
the `PORT` env var with a literal fallback so the same code runs locally and under Aspire.

```ts
// services/users/src/main.ts
import { defineService } from '@netscript/service';
import { createAuthServiceAuthenticator } from '@netscript/plugin-auth-core/authenticator';
import { createScopeAuthorizer } from '@netscript/service/auth';
import { createRouter } from './router.ts';
import { createMemoryUsersRepository } from './adapters/memory-users-repository.ts';

const router = createRouter(createMemoryUsersRepository());

await defineService(router, {
  auth: {
    authn: {
      authenticator: createAuthServiceAuthenticator({ serviceName: 'auth', timeoutMs: 10_000 }),
    },
    authz: {
      authorizer: createScopeAuthorizer({
        rules: [{ match: () => true, requireScopes: ['users:access'] }],
      }),
    },
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

When the auth plugin is installed with `--name auth` and enabled, `netscript service add` generates
these native guards and records the plugin reference for service discovery. The required scope is
`<service>:access`: without a bearer session `/api` returns 401, a valid session without that scope
receives 403, and `/health` remains anonymous. The remote verifier uses the auth service's SDK; the
guarded service holds no auth backend or provider secret. Authenticated app clients attach the
bearer through an SDK contribution.

Renamed auth keys are not supported by `service add`; an inconsistent installed auth manifest
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
guarded policy above. An authored service entrypoint is preserved unless you explicitly overwrite
it.

New services scaffolded by `netscript service add` opt into a 1 MiB `bodyLimit`. Raise
`maxBytes` for a service that accepts larger payloads, such as base64 document uploads. Remove the
line to accept unbounded bodies, which is how services created before this option behave.

Aspire injects `PORT` at runtime, so the entrypoint reads it from the environment; the typed source
of truth is your `netscript.config.ts` `services.<name>.port` field, which the scaffold wires as the
fallback default — set the port there rather than editing this line.

`defineService` stands up the Hono + oRPC runtime, mounting your router under both an
OpenAPI surface (`/api/v1/users/*`) and the RPC surface (`/api/rpc/v1/...`). The default
RPC mount point is `/api/rpc` and the OpenAPI mount point is `/api`; both are overridable
via the builder's `rpcPath` / `apiPath` options if you reach for `createService`.

To reverse this lifecycle, `netscript service remove users` removes the service workspace,
appsettings/workspace registrations, paired contracts, and regenerated helpers. Pass
`--keep-contract` when the API definition must remain published after the runtime is retired.

{{ comp callout { type: "note", title: "Need CORS, a database, or auth? Use createService" } }}
When a service must layer cross-cutting concerns, swap <code>defineService</code> for the fluent
builder. Each step returns the builder, so you compose only what you need before
<code>.serve({ port })</code>:

<pre><code>const app = createService(router, { name: 'users', version: '1.0.0' })
  .withCors()
  .withDatabase(db)
  .withAuthn({ authenticator })
  .withAuthz({ authorizer })
  .withRPC();
await app.serve({ port: 3001 }); // note: your scaffold's port will differ</code></pre>

The authn/authz seam (<code>@netscript/service/auth</code>) is provider-agnostic — static-credential
and trusted-header authenticators plus a scope authorizer ship built in. It is distinct from
the auth <strong>plugin</strong> backends; see <a href="/capabilities/auth/">Authentication</a>.
{{ /comp }}

## Step 5 — Run and verify

Start just this service workspace directly, or let `aspire start` orchestrate it alongside
the rest of your resources:

```bash
# run only the users service
deno task --cwd services/users dev
```

You should see it bind on its assigned port. Confirm the runtime answers — the health route over
HTTP, and the RPC surface that typed clients call:

```bash
# OpenAPI / HTTP surface (replace <port> with your assigned port)
curl http://localhost:<port>/api/v1/users/health

# RPC surface (replace <port> with your assigned port, what the generated typed client uses)
curl -X POST http://localhost:<port>/api/rpc/v1/users/list \
  -H 'content-type: application/json' -d '{"limit":10}'
```

A healthy service returns `{"status":"healthy","service":"users"}` from the health route
and the seeded `items` array from `list`. A typed client imports `UsersContractV1` from
`@my-app/contracts` and calls `.list(...)` with full input/output inference — no codegen,
no drift.

{{ comp callout { type: "warning", title: "Production pitfalls" } }}
<strong>Port collisions.</strong> Every service needs a distinct port. The scaffolder automatically allocates unique, high-range ports (>= 49152) at scaffold time. Read the port from <code>PORT</code> and let Aspire resolve it dynamically in orchestrated runs rather than hard-coding.<br>
<strong>RPC lives under <code>/api/rpc/&#42;</code>.</strong> The typed-client surface is
<code>/api/rpc/&lt;version&gt;/&lt;router&gt;/&lt;procedure&gt;</code>, not a bare <code>/rpc</code>.
The REST/OpenAPI surface is <code>/api/&#42;</code>. Point clients and smoke tests at the right one.<br>
<strong>Contracts before handlers.</strong> Edit the contract first, then the handler — never
the reverse. The contract is the shared truth; a handler that out-runs its contract silently
breaks every client.<br>
<strong>Use the import alias.</strong> Import contracts via <code>@&lt;project&gt;/contracts</code>,
not a relative path, so the service and its clients resolve the identical type.<br>
<strong>No DB yet at this step.</strong> The scaffold handlers return seeded in-memory records.
Wire persistence with the database recipe before you depend on durability.
{{ /comp }}

## See also

{{ comp.featureGrid({ items: [
{ title: "Tutorial: Build a service", body: "The guided, learning-oriented version — contract to typed client to a Fresh island, explained step by step.", href: "/tutorials/storefront/02-catalog-service/", icon: "→" },
{ title: "Service API reference", body: "The full generated surface of defineService and createService — every option, builder method, and return type.", href: "/reference/service/", icon: "◆" },
{ title: "Contracts, explained", body: "How an oRPC contract flows from service to typed client to UI without a codegen step.", href: "/explanation/contracts/", icon: "◎" },
{ title: "Database & migration", body: "Replace the seeded in-memory records with real Prisma-backed persistence — Postgres is the recommended engine, or mysql / mssql / sqlite via --db — init, generate, seed (Aspire up first).", href: "/data-persistence/how-to/database-migration/", icon: "▣" }
] }) }}

Manage the service over its lifetime by editing its contract under `contracts/versions/`
and re-running your workspace gates (`deno task check`). For the concepts behind
contract-first services, read the [contracts explanation](/explanation/contracts/); for
the capability overview, see [Services](/capabilities/services/).
