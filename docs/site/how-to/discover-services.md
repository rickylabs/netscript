---
layout: layouts/base.vto
title: Discover services
templateEngine: [vento, md]
prev: { label: "How-to guides", href: "/how-to/" }
next: { label: "Expose OpenAPI & Scalar", href: "/how-to/expose-openapi-scalar/" }
---

# Discover services

**Goal:** call another plugin's (or another workspace member's) oRPC service from your
app, end to end — declare the dependency so Aspire injects the callee's URL, then obtain a
fully typed client from `@netscript/sdk` that resolves that URL at request time. No registry,
no hardcoded `localhost:<port>`, no codegen.

{{ comp.badge({ status: "alpha" }) }}

There is **no service-registry API** in NetScript. "Discovery" is two cooperating
mechanics: Aspire injects each referenced service's resolved endpoint as an environment
variable (`services__<name>__http__0`), and the SDK's typed client reads that variable
lazily via `@netscript/sdk/discovery` when it builds the request URL. Declare the reference,
import the contract, construct the client — that is the whole recipe.

{{ comp.diagram({
  src: "/assets/diagrams/sdk-data-flow.svg",
  alt: "The shared contract object feeds the generated typed client; the client resolves the callee's URL from an Aspire-injected services__ env var and issues a cache-first oRPC query that the same contract's service implements.",
  caption: "Discovery flow: shared contract → typed client → URL resolved from the Aspire services__ env var → oRPC call to the service that implements the same contract."
}) }}

## Before you start

{{ comp.apiTable({
  caption: "Prerequisites",
  rows: [
    { name: "A NetScript workspace", type: "netscript init", desc: "An existing project with at least the caller (an app, plugin, or service) and the callee service already present. Run commands from the workspace root." },
    { name: "The callee service", type: "services/<name>/", desc: "A target service that answers on its own port over /api/rpc/* — e.g. the example users service on :3001. See the Add a service recipe to create one." },
    { name: "@netscript/sdk", type: "import alias", desc: "The SDK provides the typed client (createServiceClient / defineServices) and the discovery readers (@netscript/sdk/discovery). It is a workspace dependency of apps and consuming services." },
    { name: "The shared contract", type: "@<project>/contracts", desc: "Both the service and the caller import the SAME oRPC contract object through the project alias, so the client's input/output types are inferred — never duplicated." },
    { name: "Aspire (for resolved URLs)", type: "aspire run", desc: "Aspire injects the services__<name>__http__<index> env vars that discovery reads. Without it you must set those vars yourself (see pitfalls)." }
  ]
}) }}

This recipe assumes the callee is the example `users` service (port `3001`) and the caller
is an app or another service. Substitute your own service name throughout.

## Step 1 — Declare the service reference

The caller declares which services it depends on by name in its resource entry under
`ServiceReferences`. The init scaffold already writes this into the Aspire `appsettings.json`
when you scaffold an app against a service; to add a dependency to an existing resource, add
the callee's name to that resource's `ServiceReferences` array.

```jsonc
// aspire/appsettings.json — the caller (an app here) depends on the users service
{
  "NetScript": {
    "Apps": {
      "web": {
        "Runtime": "deno",
        "Type": "app",
        "Port": 3000,
        "ServiceReferences": ["users"]
      }
    }
  }
}
```

`ServiceReferences` is the live field; the older `DependsOn` array is still accepted as an
alias and merged in. The names you list here must match the service resource keys under
`NetScript.Services`.

{{ comp callout { type: "note", title: "What the reference actually wires" } }}
At generate time the Aspire helper does a two-pass registration: pass 1 creates every
service resource, pass 2 walks each resource's <code>ServiceReferences</code> and, for each
referenced name, calls <code>getEndpoint('http')</code> on the target and injects it into the
caller as <code>services__&lt;name&gt;__http__0</code> via <code>withEnvironment(...)</code>.
That env var is exactly what the SDK's discovery layer reads at request time — so declaring
the reference is what makes <code>getServiceUrl('users')</code> resolve.
{{ /comp }}

## Step 2 — Regenerate the Aspire helpers

The `register-services` helper that performs the two-pass wiring is generated from
`appsettings.json`. After editing `ServiceReferences`, regenerate so the new dependency is
emitted into the AppHost helpers:

```bash
# from the workspace root — regenerates the Aspire helper files only
netscript service generate
```

`service generate` only rewrites the Aspire helper files (it does not touch your service
code). The next `aspire run` will inject the `services__users__http__0` variable into the
caller's environment.

## Step 3 — Construct the typed client

In the caller, import the **same contract object** the service implements and hand it to
`createServiceClient`. The `serviceName` you pass is the discovery key — it must match the
name you referenced in Step 1. The client is fully typed from the contract; there is no
generated client file to import.

```ts
// web/src/clients/users.ts — a typed client for the discovered users service
import { createServiceClient } from '@netscript/sdk/client';
import { UsersContractV1 } from '@my-app/contracts';

// serviceName is the discovery key — it resolves services__users__http__0 at call time.
export const usersClient = createServiceClient({
  contract: UsersContractV1,
  serviceName: 'users',
});

// Fully inferred input/output — a renamed contract field is a compile error here.
const { items } = await usersClient.list({ limit: 20 });
```

The URL is resolved **lazily**, on the first call, by the internal HTTP link — so the client
can be constructed at import time (even in a browser bundle) without touching Deno APIs. By
default it targets `<resolved-url>/api/rpc/v1/<service>` over HTTP.

{{ comp.apiTable({
  caption: "CreateServiceClientOptions (createServiceClient) — confirmed surface",
  rows: [
    { name: "contract", type: "TContract (required)", desc: "The shared oRPC contract object. Drives both client typing and HTTP method inference — import the same object the service implements." },
    { name: "serviceName", type: "string (required)", desc: "The discovery key. Resolved as services__<serviceName>__http__<index> on the server (and the VITE_ form in the browser). Must match the ServiceReferences entry." },
    { name: "routerName", type: "string?", desc: "Overrides the URL path segment for the router; defaults to serviceName. Use when the mounted router path differs from the service name." },
    { name: "protocol", type: "'http' | 'https'?", desc: "Discovery protocol. Defaults to 'http' (resolves the __http__ endpoint)." },
    { name: "apiPath", type: "string?", desc: "Base RPC path the runtime mounts. Defaults to '/api/rpc' — match what the service serves." },
    { name: "apiVersion", type: "string?", desc: "API version segment in the URL. Defaults to 'v1'." },
    { name: "propagateTraceContext", type: "boolean?", desc: "Attach W3C traceparent/tracestate headers automatically from the active trace context. Defaults to true." }
  ]
}) }}

## Step 4 — Call it (and handle typed errors)

The client methods mirror the contract's procedure tree. Wrap calls in the SDK's `safe()`
helper to get a tuple instead of a throw, and narrow defined errors with `isDefinedError`:

```ts
// web/src/routes/users.ts — typed call with safe-style error handling
import { isDefinedError, safe } from '@netscript/sdk/client';
import { usersClient } from '../clients/users.ts';

const [error, result] = await safe(usersClient.list({ limit: 20 }));

if (error && isDefinedError(error)) {
  // error.code and error.data are typed from the contract
  console.error('users.list failed:', error.code, error.data);
} else {
  // result.items is the contract's output type
  return result.items;
}
```

## Many services at once — `defineServices`

When the caller talks to several services, `defineServices` builds the clients (plus
cache-aware query factories and TanStack Query utils) from one map. The map key is the
discovery key unless you override `serviceName`.

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

`defineServices` returns `{ clients, queries, queryUtils }`. The `serviceName` per entry
defaults to the map key, so `users` resolves `services__users__http__0` automatically —
override it only when the registered service name differs from your local map key.

## Manual / non-Aspire resolution

The discovery readers are usable on their own when you are not running under Aspire — for a
smoke test, a one-off script, or a custom transport. `getServiceUrl(name)` throws a clear
error naming the missing env var; `isServiceAvailable(name)` is the non-throwing probe;
`getAllServices()` lists every `services__*` name in the environment.

```ts
// scripts/check-users.ts — resolve a discovered URL by hand
import { getAllServices, getServiceUrl, isServiceAvailable } from '@netscript/sdk/discovery';

if (isServiceAvailable('users')) {
  const baseUrl = getServiceUrl('users', 'http'); // reads services__users__http__0
  console.log('users at', baseUrl, '| all:', getAllServices());
}
```

The server-side lookup key is `services__<name>__http__<index>`; the browser path checks the
`VITE_`-prefixed forms first (Aspire injects those for Vite apps). Set the env var yourself
to point a client at a fixed URL with no orchestrator:

```bash
# point the users client at a locally-running service, no Aspire
services__users__http__0=http://localhost:3001 deno task --cwd web dev
```

## Production pitfalls

{{ comp callout { type: "warning", title: "Footguns before you ship" } }}
<ul>
<li><strong>Alpha surface.</strong> <code>@netscript/sdk</code> publishes as
<code>0.0.1-alpha.*</code>; the discovery env-var convention and client option names are
stable in the scaffold but may shift before <code>1.0</code>. Pin the version you build on.</li>
<li><strong>The reference must be declared, then generated.</strong> Adding a
<code>ServiceReferences</code> entry does nothing until you re-run <code>netscript service
generate</code> and restart <code>aspire run</code>. A missing reference means
<code>getServiceUrl</code> throws <em>"Service URL not found … Expected environment variable:
services__&lt;name&gt;__http__0"</em>.</li>
<li><strong>The discovery key must match.</strong> <code>serviceName</code> (and the
<code>defineServices</code> map key) must equal the service's registered name, or discovery
resolves a variable that was never injected.</li>
<li><strong>The served path is <code>/api/rpc/*</code>.</strong> The client defaults to
<code>apiPath: '/api/rpc'</code> and <code>apiVersion: 'v1'</code>; if your service mounts a
different path, set them explicitly or calls 404. It is <em>not</em> a bare <code>/rpc</code>.</li>
<li><strong>Aspire injects the URL; outside Aspire you must.</strong> Without an orchestrator
the <code>services__&lt;name&gt;__http__0</code> variable is unset — provide it yourself (env
var) or the client cannot find the service.</li>
</ul>
{{ /comp }}

## See also

{{ comp.featureGrid({ items: [
  { title: "Do — Add a service", body: "Create the callee first: contract → defineService → an oRPC service answering on its own port.", href: "/how-to/add-a-service/", icon: "◆" },
  { title: "Capability — Services & contracts", body: "Why the shared contract object is the single source of truth, and how a typed client cannot drift from the service.", href: "/capabilities/services/", icon: "▣" },
  { title: "Look up — @netscript/sdk", body: "The full SDK surface: createServiceClient, defineServices, the discovery readers, query factories, and TanStack utils.", href: "/reference/sdk/", icon: "≡" },
  { title: "Understand — Orchestration with Aspire", body: "How Aspire wires resources, resolves endpoints, and injects the services__ env vars discovery reads.", href: "/explanation/aspire/", icon: "◎" }
] }) }}

For the concepts behind the typed-client surface see {{ comp.xref({ key: "cap:sdk" }) }};
the sibling recipe that builds the callee is {{ comp.xref({ key: "howto:add-a-service" }) }};
and the orchestration that injects the URLs is explained in {{ comp.xref({ key: "explain:aspire" }) }}.

{{ comp.nextPrev({ prev: { label: "How-to guides", href: "/how-to/" }, next: { label: "Expose OpenAPI & Scalar", href: "/how-to/expose-openapi-scalar/" } }) }}
