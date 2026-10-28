---
layout: layouts/base.vto
title: Architecture
templateEngine: [vento, md]
prev: { label: "Explanation", href: "/explanation/" }
next: { label: "Contracts & type flow", href: "/explanation/contracts/" }
order: 1
---

# The NetScript architecture

This page gives you the map of a NetScript app: the layers you work with, what runs where, and which
way the dependencies point. NetScript is a set of Deno-native framework packages published on
[JSR](https://jsr.io), composed into a running backend by **first-party plugins** and orchestrated
locally by **Aspire**.

{{ comp.diagram({ src: "/assets/diagrams/architecture-overview.svg", alt: "A NetScript workspace as four stacked layers: typed contracts at the base, packages and plugins composed on top, the host wiring plugins through generated registries, and the runtime executing services and background processors — all orchestrated by Aspire.", caption: "The four layers an app author works with: typed contracts, packages and plugins, the host that assembles them, and the runtime that executes services and background processors." }) }}

This page explains why NetScript is split the way it is. For hands-on work, use the
[tutorials]({{ "tut:index" |> xref }}) and [how-to guides]({{ "howto:index" |> xref }}); the
[glossary](/glossary/) defines each term.

## The published surface

A package's `mod.ts` is the contract the framework makes with you, the caller. It is not an
implementation detail that happens to be exported. The surface you see through `deno doc`, the JSR
doc score, and the type checker is what everything else serves.

Two consequences explain most of the design decisions you will meet:

1. **Types are designed before implementation.** The public types and the README come first; the
   code that satisfies them comes second. If `deno doc <package>` does not read end-to-end as a
   manual, the surface is broken, however well the internals work.
2. **Simple is preferred over easy at every boundary.** Approachability comes from a small,
   predictable surface rather than hidden magic. The common 80% case is one chained call; advanced
   cases sit one method deeper instead of appearing as required configuration on the entry point.

[Contracts &amp; type flow]({{ "explain:contracts" |> xref }}) covers the rationale for this
contract-first stance.

## Four layers, one direction of dependency

Each layer depends only on the layers beneath it, and no layer edits another boundary's code. From
the bottom up:

### Typed contracts

The contract layer holds schemas and types that describe what a service accepts and returns, with
almost no runtime and no dependencies of its own. A contract is a plain object built from
`@orpc/contract` and zod schemas. The service that *implements* it and the client that *calls* it
import the same object, so the two cannot drift. Because contracts depend on nothing, every layer
above can depend on them.

A shape change is therefore a type error at compile time, not a 500 in production. The contract
machinery (`@orpc/contract`, zod, and `implement()`) is the subject of
[Contracts &amp; type flow]({{ "explain:contracts" |> xref }}); the API reference is
[`@netscript/contracts`]({{ "ref:contracts" |> xref }}).

### Packages and plugins

Above the contracts sit two kinds of building block:

- **Platform packages** (the `@netscript/*` kernel) know nothing about any one capability. They are
  the shared substrate: [`config`]({{ "ref:config" |> xref }}),
  [`service`]({{ "ref:service" |> xref }}), [`database`]({{ "ref:database" |> xref }}),
  [`queue`]({{ "ref:queue" |> xref }}), [`kv`]({{ "ref:kv" |> xref }}),
  [`telemetry`]({{ "ref:telemetry" |> xref }}), and the rest. A package wraps one concern behind a
  small surface and never reaches into another package's internals.
- **Plugins** turn that substrate into a *capability*: workers, sagas, triggers, auth, streams. A
  plugin **composes** packages; it does not redefine them. It declares its capability by
  registering named **contributions** (a service, a background processor, a Prisma schema fragment,
  a stream topic) and leaves the wiring to the host.

A plugin depends on packages, packages depend on contracts, and the arrow never reverses. A workers
plugin imports the contract types from its sibling
[`@netscript/plugin-workers-core`]({{ "ref:workers" |> xref }}) package rather than inventing its
own; an auth plugin composes the auth seam rather than embedding a provider. So adding a capability
is a manifest plus a regenerated registry, never a patch to the kernel.
[The plugin system]({{ "explain:plugin-system" |> xref }}) covers the public plugin versus core
package split, manifests, contributions, and the generated registry.

> [!NOTE]
> Framework tooling uses the word *archetype*. It is an internal classification for the
> framework's own quality gates. As an app author you meet it only through the shape of a
> scaffolded plugin, and you never configure it.

### The host

The host assembles plugins into a workspace. When you run the scaffold's generate step, NetScript
reads the plugin list from `netscript.config.ts`, validates each plugin's contributions against
fixed extension axes, and writes **generated registry** files that wire the contributions together.
The host loads those registries at startup.

The host *reads* plugin manifests and *generates* wiring; it never asks you to hand-edit one plugin
to make room for another. Two enabled plugins coexist because the host merged their registrations,
not because either was patched. Enabling a capability is a config line plus a regenerate, and the
generated files are reproducible output you do not author by hand.

### The runtime

A running workspace is several single-purpose processes, each owned by a plugin, each speaking a
contract, and all started together by Aspire. Two kinds of process run here:

- **Services** answer requests. They are [oRPC services]({{ "cap:services" |> xref }}) mounted at
  `/api/rpc/*`, with one raw exception for webhook ingress.
- **Background processors** do work outside the request path: the worker job runtime, the durable
  saga runtime, schedulers, and file watchers. They own state and lifecycle, persist through a
  store, and shut down cleanly through a `{ stop() }` handle.

The topology below is a fully loaded workspace, with every first-party plugin enabled.

```text
                              ┌───────────────────────────────────┐
                              │            Aspire AppHost          │
                              │   dashboard  https://localhost:18888│
                              │  provisions Postgres + Redis (KV)  │
                              └───────────────┬───────────────────┘
                                              │ wires env, ports, resources
            ┌─────────────────────────────────┼─────────────────────────────────┐
            │                                  │                                 │
   ┌────────▼────────┐                ┌────────▼─────────────────────────┐
   │  example service │                │      PLUGIN SERVICES (oRPC)      │
   │   users (service)│                ├──────────────────────────────────┤
   │  /api/rpc/*      │                │  workers (jobs/tasks)            │
   │  oRPC contract   │                │  sagas (durable flows)           │
   └────────┬─────────┘                │  triggers (raw ingress)          │
            │                          │  auth (oRPC /api/rpc)            │
            │ contracts                └────────┬─────────────────────────┘
            │ (@orpc/contract + zod)            │
            │                          ┌────────▼─────────┐
   ┌────────▼──────────────────────────┴──────────────────┴──────────────────────┐
   │                  PACKAGES  (@netscript/* platform substrate)                  │
   │  config · runtime-config · service · contracts · sdk · plugin · database      │
   │  queue · kv · cron · logger · telemetry · aspire                              │
   └────────┬──────────────────────────────────────────────────────────┬──────────┘
            │ produces durable change-data events                       │
   ┌────────▼─────────┐                                      ┌──────────▼─────────┐
   │  streams  (port)  │  durable-stream service             │  Postgres / Redis   │
   │  HTTP / SSE       │  workers · auth · sagas mirror here  │  (relational + KV)  │
   └───────────────────┘                                      └────────────────────┘
```

Read the picture in three bands. **Aspire** sits on top as the local orchestrator:
`cd aspire && aspire start` brings up Postgres and Redis (the default cache backend; `garnet` or
`deno-kv` are selectable via `--cache-backend`) and starts every service *before* any
`netscript db` command runs. Traces, logs, and health land in the dashboard at
`https://localhost:18888`. **Plugin services** sit in the middle, each owning exactly one service;
your scaffolded `users` service sits beside them and uses the same contract machinery. **The
packages** sit underneath as the substrate every plugin composes. See
[Orchestration with Aspire]({{ "explain:aspire" |> xref }}) for the control plane.

{{ comp.apiTable({
  title: "Workspace ports and surfaces",
  columns: ["Surface", "Port", "Protocol", "Owner"],
  rows: [
    ["Aspire dashboard", ":18888", "HTTP (UI)", "Aspire AppHost"],
    ["Example service (users)", "Assigned (>= 49152)", "oRPC over <code>/api/rpc/*</code>", "your service"],
    ["Workers", "Assigned (>= 49152)", "oRPC", "<code>@netscript/plugin-workers</code>"],
    ["Sagas", "Assigned (>= 49152)", "oRPC", "<code>@netscript/plugin-sagas</code>"],
    ["Triggers", "Assigned (>= 49152)", "oRPC (raw webhook ingress)", "<code>@netscript/plugin-triggers</code>"],
    ["Auth", "Assigned (>= 49152)", "oRPC over <code>/api/rpc/v1/auth/*</code>", "<code>@netscript/plugin-auth</code>"],
    ["Streams", "Assigned (>= 57344)", "durable-stream HTTP / SSE", "<code>@netscript/plugin-streams</code>"]
  ]
}) }}

> [!IMPORTANT]
> Triggers serve a typed v1 oRPC contract for trigger and event introspection and management, like
> every other plugin service. Only the webhook *ingress* endpoint
> (`POST /api/v1/webhooks/:triggerId`) stays a raw route, because it verifies an HMAC over the raw
> request bytes from external senders. Service RPC is mounted at `/api/rpc/*`, not `/rpc`.

## The pure-backend seam

One pattern recurs across the framework: the **pure-backend seam**. It keeps a capability open to
several implementations without leaking any of them into the contract. The shape is always the
same:

1. A package defines a **port**: a pure interface, with no IO, that says what the capability must
   do.
2. **Adapter** code implements that port against a concrete technology. Adapters are *pure
   backends*: they depend on the port, never the reverse, and add no public surface beyond the
   factory you call.
3. A **plugin** composes **exactly one** active adapter, selected by configuration, and exposes it
   as a running service.

Auth is the most visible instance. A core seam defines an `AuthBackendPort`; three pure adapters
implement it (the default interactive KV-OAuth backend, plus WorkOS and Better-Auth); and the auth
plugin composes the one backend named by `NETSCRIPT_AUTH_BACKEND`. When a backend cannot honor a
capability, it fails loud with a typed `AuthBackendOperationUnsupportedError` instead of silently
doing nothing. [The auth model]({{ "explain:auth-model" |> xref }}) covers the port, the three
backends, and the per-backend capability matrix; the capability hub is
[Authentication]({{ "cap:auth" |> xref }}).

The same shape appears elsewhere. The [`queue`](/reference/queue/) package defines one port behind
four backends (Deno&nbsp;KV, Redis, RabbitMQ, and PostgreSQL). The
[`database`](/reference/database/) package wraps a relational engine behind a port: Postgres is the
recommended engine, and `mysql`, `mssql`, or `sqlite` are selected with `--db` at scaffold time.
Durable sagas persist through a `kv` or `prisma` store.

Swapping a backend is therefore a configuration change, not a rewrite: the contract is the port,
and adapters are interchangeable behind it.

## Configuration layers

NetScript keeps *authored intent* apart from the *runtime wiring* that makes a workspace run.

| Layer | Where it lives | What it holds |
| --- | --- | --- |
| Project intent | `netscript.config.ts`, authored with [`defineConfig`]({{ "ref:config" |> xref }}) or `defineConfigAsync` | What the project *is*: its name, paths, enabled plugins (`./plugins/workers/mod.ts`, `./plugins/sagas/mod.ts`, and the rest), services, apps, database declarations, saga groups, trigger groups, and runtime-config output paths. |
| Plugin contributions | `@netscript/config/merge` | Partial config fragments that merge *into* the validated project shape. They never replace project identity. |
| Environment wiring | `appsettings.json`, the Aspire AppHost, and [`@netscript/runtime-config`]({{ "ref:runtime-config" |> xref }}) | Operational database and resource details, plus runtime overrides for topics such as jobs, sagas, triggers, features, and tasks. |

At startup, `loadConfig` and `initConfig` resolve the authored form into a validated
`NetScriptConfig`; `getConfig` is the synchronous read path after initialization.

Capability switches live in the wiring layer, not in code: the saga durable store
(`NETSCRIPT_SAGA_STORE=kv|prisma`), the queue provider, and the active auth backend
(`NETSCRIPT_AUTH_BACKEND`). The same split explains a scaffold detail: `databases.config` can be
empty in `netscript.config.ts` while Aspire provisions the chosen engine and `appsettings.json`
describes it. Postgres is the recommended engine; `mysql`, `mssql`, or `sqlite` are selected with
`--db` at scaffold time, and `sqlite` is file-backed, so it has no Aspire container resource. See
[Runtime configuration]({{ "cap:runtime-config" |> xref }}).

## Naming conventions

Entry points use fixed verbs, so the name tells you the behavior:

| Pattern | Behavior |
| --- | --- |
| `defineX(...)` | Returns a frozen *definition* and does no runtime work. |
| `createX(...)` | Constructs a *runtime* object that owns state and IO. |
| `startX(...)` | Constructs *and* starts a runtime, returning a `{ stop() }` handle. |
| `useX(...)` | A hook-style accessor inside a request, render, or handler scope. |
| `withX(...)` | A builder method that returns a new builder and never mutates. |

When a `mod.ts` would re-export more than roughly twenty symbols, the surface splits into
**subpath exports** (for example `@netscript/logger/middleware` and `@netscript/logger/orpc`). That
keeps bundles lean and isolates adapter-specific code from production exports.

## Durable state machines

Background processors that own *durable* flows model them as explicit state machines, not generic
event-handler ladders. [Durable sagas]({{ "cap:durable-sagas" |> xref }}) are the clearest example:
a saga is a set of named phases with explicit correlation, persistence, and compensation, declared
through a builder.

{{ comp.codeBlock({ lang: "ts", code:
"// plugins/sagas/user-registration.saga.ts\nimport { defineSaga } from \"@netscript/plugin-sagas-core\";\n\ntype State = Readonly<{ status: string }>;\n\nconst saga = defineSaga(\"user-registration\")\n  .state<State>({ status: \"started\" })\n  .on(\"UserRegistered\", (s, _message, _context) => {\n    s.state = { status: \"welcoming\" };\n  })\n  .on(\"WelcomeEmailSent\", (s, _message, _context) => {\n    s.state = { status: \"complete\" };\n  })\n  .build();" }) }}

Failure handling is explicit too. Handlers throw rich errors, and a supervisor, not a scatter of
defensive `try/catch` blocks inside the handler, decides whether to restart or escalate and owns the
telemetry for that decision. The durable runtime persists through a selectable `kv` or `prisma`
store. [The durability model]({{ "explain:durability-model" |> xref }}) covers the full flow.

## Built-in observability

Every plugin composes the same packages, so observability is wired once and inherited everywhere.
Aspire starts an OTLP collector, and the worker job path (dispatch, execution, scheduler, and
subprocess continuation) emits **OpenTelemetry spans automatically**. Job traces appear in the
Aspire dashboard without any handler code.

The scaffold `createJobTools(ctx)` surface adds handler events and child spans to that active job
trace. Its `progress` helper emits a `job.progress` event and forwards the same update to the
workers runtime progress channel. [Observability]({{ "explain:observability" |> xref }}) has the
full picture.

## The publish gate

The publish gate is where the architecture is *enforced* rather than described. Tests act as fitness
functions: checks that the architecture still holds. `deno publish --dry-run`, `deno doc`, the
workspace type checks, the semantic tests, and an export and docs audit are required steps; they
are how each boundary rule above survives contact with real code. A surface that fails them is
broken by definition, which is why the published surface can be trusted as the product.

Next: [Contracts &amp; type flow]({{ "explain:contracts" |> xref }}) shows how types flow from a
contract to a client.

{{ comp.nextPrev({ prev: { label: "Explanation", href: "/explanation/" }, next: { label: "Contracts & type flow", href: "/explanation/contracts/" } }) }}
