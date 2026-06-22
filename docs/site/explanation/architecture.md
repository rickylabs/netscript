---
layout: layouts/base.vto
title: Architecture
templateEngine: [vento, md]
prev: { label: "Explanation", href: "/explanation/" }
next: { label: "Contracts & type flow", href: "/explanation/contracts/" }
---

# The NetScript architecture

NetScript is a set of Deno-native framework packages, published on
[JSR](https://jsr.io) and composed into a running backend by **first-party
plugins**, orchestrated locally by **Aspire**. This essay answers one question:
when you build an app on NetScript, what are the layers you actually work with,
what runs where, and which way do the dependencies point?

{{ comp.diagram({ src: "/assets/diagrams/architecture-overview.svg", alt: "A NetScript workspace as four stacked layers: typed contracts at the base, packages and plugins composed on top, the host wiring plugins through generated registries, and the runtime executing services and background processors — all orchestrated by Aspire.", caption: "The four layers an app author works with: typed contracts, packages and plugins, the host that assembles them, and the runtime that executes services and background processors." }) }}

Read this for orientation, not step-by-step work. The
[tutorials]({{ comp.xref({ key: "tut:index" }) }}) and
[how-to guides]({{ comp.xref({ key: "howto:index" }) }}) are the practical paths;
the [glossary](/glossary/) defines every term of art; and each layer below routes
you onward to the capability hub or reference unit that elaborates it.

{{ comp callout { type: "note", title: "How to read this page" } }}
This is a <strong>mental-model</strong> page. It explains <em>why</em> NetScript
is split the way it is. If you want exact exports, jump to a
<a href="/reference/">reference unit</a>; if you want to ship something, start
with a <a href="/tutorials/">tutorial</a>.
{{ /comp }}

## The thesis: the published surface is the product

NetScript treats publishing as the whole point. A package's `mod.ts` is not an
implementation detail that happens to be exported — it is the contract the
framework makes with you, the caller. The shape you see through `deno doc`, the
JSR doc score, and the type checker is the surface everything else serves.

Two consequences explain most of the design decisions you will meet:

1. **Types are designed before implementation.** The public types and the README
   come first; the code that satisfies them comes second. If `deno doc <package>`
   does not read end-to-end as a manual, the surface is considered broken,
   regardless of how the internals work.
2. **Simple is preferred over easy at every boundary.** Approachability comes
   from a small, predictable surface rather than hidden magic. The common 80%
   case is one chained call; advanced cases unfold one method deeper rather than
   appearing as required configuration on the entry point.

The deeper rationale for this contract-first stance is the subject of
[Contracts &amp; type flow]({{ comp.xref({ key: "explain:contracts" }) }}).

## Four layers, one direction of dependency

The single most useful thing to hold in your head is the **direction** of the
arrows. Every layer below depends only on the layers beneath it, and **nothing
ever edits another boundary's code**. Build that picture once and the rest of the
framework stops surprising you.

### 1. Typed contracts — the base, with no dependencies

At the bottom sits the contract layer: schemas and types that describe what a
service accepts and returns, with essentially no runtime and no dependencies of
their own. A contract is a plain object built from `@orpc/contract` and zod
schemas; the same object is imported by the service that *implements* it and by
the client that *calls* it, so the two can never drift. Because contracts depend
on nothing, everything above can depend on them freely.

This is why "change the shape" is a type error you see at compile time rather
than a 500 you discover in production. The contract machinery —
`@orpc/contract`, zod, and `implement()` — is the subject of
[Contracts &amp; type flow]({{ comp.xref({ key: "explain:contracts" }) }}); the
generated reference is [`@netscript/contracts`]({{ comp.xref({ key: "ref:contracts" }) }}).

### 2. Packages and plugins — composing the substrate

Above the contracts sit two kinds of building block:

- **Platform packages** (the `@netscript/*` kernel) know nothing about any one
  capability. They are the shared substrate: [`config`]({{ comp.xref({ key: "ref:config" }) }}),
  [`service`]({{ comp.xref({ key: "ref:service" }) }}),
  [`database`]({{ comp.xref({ key: "ref:database" }) }}),
  [`queue`]({{ comp.xref({ key: "ref:queue" }) }}),
  [`kv`]({{ comp.xref({ key: "ref:kv" }) }}),
  [`telemetry`]({{ comp.xref({ key: "ref:telemetry" }) }}), and the rest. A
  package wraps one concern behind a small surface and never reaches across into
  another package's internals.
- **Plugins** turn that substrate into a *capability* — workers, sagas, triggers,
  auth, streams. A plugin **composes** packages; it does not redefine them. It
  declares its capability by registering named **contributions** (a service, a
  background processor, a Prisma schema fragment, a stream topic) and leaves the
  wiring to the host.

The rule that keeps this clean: a plugin depends on packages, packages depend on
contracts, and the arrow never reverses. A workers plugin imports the contract
types from its sibling [`@netscript/plugin-workers-core`]({{ comp.xref({ key: "ref:workers" }) }})
package rather than inventing its own; an auth plugin composes the auth seam
rather than embedding a provider. The mechanics — public plugin versus core
package, manifests, contributions, and the generated registry — live in
[The plugin system]({{ comp.xref({ key: "explain:plugin-system" }) }}).

{{ comp callout { type: "tip", title: "The key insight" } }}
A plugin is just a unit that <strong>composes packages</strong> and
<strong>registers contributions</strong>. It is never a patch to framework code.
Adding a capability is a manifest plus a regenerated registry, not an edit to the
kernel. That single rule is what lets the framework grow without the layers
tangling.
{{ /comp }}

(You may see the word *archetype* in the doctrine and tooling. That is an
internal classification the framework uses for its own quality gates — as an app
author you meet it only indirectly, through the shape of a scaffolded plugin. See
[The plugin system]({{ comp.xref({ key: "explain:plugin-system" }) }}) if you are
curious; it is not something you configure.)

### 3. The host — assembling plugins through generated registries

A workspace is more than a pile of plugins; something has to *assemble* them. That
is the host's job. When you run the scaffold's generate step, NetScript reads the
plugin list from `netscript.config.ts`, validates each plugin's contributions
against fixed extension axes, and writes **generated registry** files that wire
the contributions together. The host then loads those registries at startup.

The discipline here is the same as everywhere else: the host *reads* plugin
manifests and *generates* wiring; it never asks you to hand-edit one plugin to
make room for another. Two enabled plugins coexist because the host merged their
registrations, not because either was patched. This is why enabling a capability
is a config line plus a regenerate, and why the generated files are reproducible
output you do not author by hand.

### 4. The runtime — executing services and background processors

At the top, the host's assembled workspace *runs*. NetScript is not one process:
it is a small constellation of single-purpose services, each owned by a plugin and
each speaking a contract, brought up together by Aspire. Two kinds of thing
execute here:

- **Services** answer requests. Most are
  [oRPC services]({{ comp.xref({ key: "cap:services" }) }}) mounted at
  `/api/rpc/*`; trigger ingress is the exception, exposing raw Hono routes because
  webhooks are webhook-shaped, not contract-shaped.
- **Background processors** do work outside the request path: the worker job
  runtime, the durable saga runtime, schedulers, and file watchers. They own
  state and lifecycle, persist through a store, and shut down cleanly through a
  `{ stop() }` handle.

The topology below is the canonical shape of a fully-loaded workspace, with every
first-party plugin enabled.

```text
                              ┌───────────────────────────────────┐
                              │            Aspire AppHost          │
                              │   dashboard  http://localhost:18888│
                              │  provisions Postgres + Garnet (KV) │
                              └───────────────┬───────────────────┘
                                              │ wires env, ports, resources
            ┌─────────────────────────────────┼─────────────────────────────────┐
            │                                  │                                 │
   ┌────────▼────────┐                ┌────────▼─────────────────────────┐
   │  example service │                │   PLUGIN SERVICES (oRPC / Hono)  │
   │   users :3001    │                ├──────────────────────────────────┤
   │  /api/rpc/*      │                │  workers  :8091   (jobs/tasks)   │
   │  oRPC contract   │                │  sagas    :8092   (durable flows)│
   └────────┬─────────┘                │  triggers :8093   (raw Hono in)  │
            │                          │  auth     :8094   (oRPC /api/rpc)│
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
   │  streams  :4437   │  durable-stream service             │  Postgres / Garnet  │
   │  HTTP / SSE       │  workers · auth · sagas mirror here  │  (relational + KV)  │
   └───────────────────┘                                      └────────────────────┘
```

Read the picture in three bands. **Aspire** sits on top as the local
orchestrator: `cd aspire && aspire run` brings up Postgres and Garnet and starts
every service *before* any `netscript db` command runs, with traces, logs, and
health landing in the dashboard at `http://localhost:18888`. **Plugin services**
sit in the middle, each owning exactly one service on a fixed port; your own
scaffolded `users` service sits alongside them, speaking the same contract
machinery. **The packages** sit underneath as the shared substrate every plugin
composes against. See
[Orchestration with Aspire]({{ comp.xref({ key: "explain:aspire" }) }}) for the
control-plane detail.

{{ comp.apiTable({
  title: "Workspace ports and surfaces",
  columns: ["Surface", "Port", "Protocol", "Owner"],
  rows: [
    ["Aspire dashboard", ":18888", "HTTP (UI)", "Aspire AppHost"],
    ["Example service (users)", ":3001", "oRPC over <code>/api/rpc/*</code>", "your service"],
    ["Workers", ":8091", "oRPC", "<code>@netscript/plugin-workers</code>"],
    ["Sagas", ":8092", "oRPC", "<code>@netscript/plugin-sagas</code>"],
    ["Triggers", ":8093", "raw Hono routes", "<code>@netscript/plugin-triggers</code>"],
    ["Auth", ":8094", "oRPC over <code>/api/rpc/v1/auth/*</code>", "<code>@netscript/plugin-auth</code>"],
    ["Streams", ":4437", "durable-stream HTTP / SSE", "<code>@netscript/plugin-streams</code>"]
  ]
}) }}

A subtlety worth fixing early: **triggers expose raw Hono routes, not oRPC**,
because trigger ingress is webhook-shaped rather than contract-shaped. Every other
plugin service is an oRPC service, and service RPC is mounted at `/api/rpc/*` (not
`/rpc`). Those two facts trip people up more than any other detail here.

## The pure-backend seam: a port with interchangeable adapters

There is one recurring pattern that, once you see it, you will recognize across
the whole framework: the **pure-backend seam**. It is how NetScript keeps a
capability open to several implementations without leaking any of them into the
contract.

The shape is always the same:

1. A package defines a **port** — a pure interface, no IO — that says what the
   capability must be able to do.
2. **Adapter** code implements that port against a concrete technology. Adapters
   are *pure backends*: they depend on the port, never the reverse, and add no
   public surface of their own beyond the factory you call.
3. A **plugin** composes **exactly one** active adapter, selected by
   configuration, and exposes it as a running service.

Auth is the most visible instance: a core seam defines an `AuthBackendPort`, three
pure adapters implement it (a default interactive KV-OAuth backend, plus WorkOS
and Better-Auth), and the auth plugin composes the one backend named by
`NETSCRIPT_AUTH_BACKEND`. A capability a given backend cannot honor fails loud
through a typed `AuthBackendOperationUnsupportedError` rather than silently doing
nothing. The full treatment — the port, the three backends, and the per-backend
capability matrix — lives in
[The auth model]({{ comp.xref({ key: "explain:auth-model" }) }}); the
capability hub is [Authentication]({{ comp.xref({ key: "cap:auth" }) }}).

{{ comp callout { type: "tip", title: "The seam is the design, not the adapter" } }}
You will see the same port-and-adapter shape everywhere: the
<a href="/reference/queue/"><code>queue</code></a> defines one port behind four
backends (Deno&nbsp;KV, Redis, RabbitMQ, and PostgreSQL), the
<a href="/reference/database/"><code>database</code></a> wraps Postgres behind a
port, and durable sagas persist through a <code>kv</code> or <code>prisma</code>
store. Auth simply makes the pattern most visible because it ships three adapters
in the box.
{{ /comp }}

This is why "swap the backend" is a configuration change in NetScript and not a
rewrite: the contract is the port, and adapters are interchangeable behind it.

## Configuration records intent before runtime wiring

NetScript keeps *authored intent* separate from the concrete *runtime wiring* that
makes a workspace run. The project-level intent lives in `netscript.config.ts`,
authored with [`defineConfig`]({{ comp.xref({ key: "ref:config" }) }}) or
`defineConfigAsync`. That object says what the project *is* — its name, paths,
enabled plugins, services, apps, database declarations, saga groups, trigger
groups, and runtime-config output paths. At startup, `loadConfig` and `initConfig`
resolve that authored form into a validated `NetScriptConfig`, and `getConfig` is
the synchronous read path after initialization.

The split matters because the host needs both halves: `netscript.config.ts`
carries workspace intent such as `paths` and the plugin list
(`./plugins/workers/mod.ts`, `./plugins/sagas/mod.ts`, and the rest), while the
operational database and resource details are carried by `appsettings.json` and
the Aspire AppHost. Plugin packages can contribute partial config fragments
through `@netscript/config/merge`, but those fragments merge *into* the
already-validated project shape rather than replacing project identity. Runtime
overrides are a third layer exposed by
[`@netscript/runtime-config`]({{ comp.xref({ key: "ref:runtime-config" }) }}) for
topics such as jobs, sagas, triggers, features, and tasks.

Think of it as three nested layers: `netscript.config.ts` declares project intent,
plugin config contributions extend that intent, and
appsettings/Aspire/runtime-config materialize the environment-specific wiring.
This is also where the capability switches live — the saga durable store
(`NETSCRIPT_SAGA_STORE=kv|prisma`), the queue provider, and the active auth
backend (`NETSCRIPT_AUTH_BACKEND`) are all selected here rather than in code. It
is also why the database docs note a scaffold reality: `databases.config` can be
empty in `netscript.config.ts` while Postgres is still provisioned by Aspire and
described in `appsettings.json`. See
[Runtime configuration]({{ comp.xref({ key: "cap:runtime-config" }) }}).

### Naming is part of the contract

Entry points follow fixed verbs, so you can predict behavior from the name alone:

- `defineX(...)` returns a frozen *definition* and does no runtime work.
- `createX(...)` constructs a *runtime* object that owns state and IO.
- `startX(...)` constructs *and* starts a runtime, returning a `{ stop() }` handle.
- `useX(...)` is a hook-style accessor inside a request, render, or handler scope.
- `withX(...)` is a builder method that returns a new builder and never mutates.

When a `mod.ts` would re-export more than roughly twenty symbols, the surface
splits into **subpath exports** (for example `@netscript/logger/middleware` and
`@netscript/logger/orpc`) to keep bundles lean and isolate adapter-specific code
from production exports.

## Durable behavior is modeled as state machines

For the background processors that own *durable* flows, NetScript models them as
explicit state machines rather than generic event-handler ladders.
[Durable sagas]({{ comp.xref({ key: "cap:durable-sagas" }) }}) are the clearest
example: a saga is named phases with explicit correlation, persistence, and
compensation, declared through a builder.

{{ comp.tabbedCode({
  tabs: [
    { label: "user-registration.saga.ts", lang: "ts", code:
"// plugins/sagas/user-registration.saga.ts\nimport { defineSaga } from \"@netscript/plugin-sagas-core\";\n\ntype State = Readonly<{ status: string }>;\n\nconst saga = defineSaga(\"user-registration\")\n  .state<State>({ status: \"started\" })\n  .on(\"UserRegistered\", (s, _message, _context) => {\n    s.state = { status: \"welcoming\" };\n  })\n  .on(\"WelcomeEmailSent\", (s, _message, _context) => {\n    s.state = { status: \"complete\" };\n  })\n  .build();" }
  ]
}) }}

Failure handling is just as explicit. Handlers throw rich errors; a supervisor —
not a scatter of defensive `try/catch` inside the handler — decides whether to
restart or escalate, and owns the telemetry for that decision. The durable runtime
persists through a selectable `kv` or `prisma` store. The full flow is covered in
[The durability model]({{ comp.xref({ key: "explain:durability-model" }) }}).

## Observability is built into the substrate

Because every plugin composes the same packages, observability is wired once and
inherited everywhere. Aspire runs an OTLP collector, and the worker job path —
dispatch, execution, scheduler, and subprocess continuation — emits **real
OpenTelemetry spans automatically**, so job traces appear in the Aspire dashboard
without any handler code.

{{ comp callout { type: "warning", title: "Limitation" } }}
The scaffold <code>createJobTools(ctx)</code> helpers handed to your job handler
(<code>trace.addEvent</code>, <code>withChildSpan</code>, <code>progress</code>)
are currently no-op stubs — a tracked limitation with a fix planned. For custom
handler spans today, call <code>@netscript/telemetry</code> helpers directly.
<!-- caveat: arch-debt:workers-scaffold-job-tools-noop -->
{{ /comp }}

The full picture is in
[Observability]({{ comp.xref({ key: "explain:observability" }) }}).

## The publish gate is the architecture gate

Tests are treated as fitness functions, and the publish gate is where the
architecture is *enforced* rather than merely described. `deno publish
--dry-run`, `deno doc`, the workspace type checks, the semantic tests, and an
export/docs audit are not optional steps — they are the mechanism by which every
boundary rule above survives contact with real code. A surface that does not pass
them is broken by definition, which is precisely why the published surface can be
trusted as the product.

{{ comp callout { type: "note", title: "Alpha specifiers" } }}
Scaffold output pins forward-looking <code>jsr:@netscript/plugin-auth-core@^1.0.0</code>
specifiers, but those are not installable at <code>1.0</code> yet.
{{ /comp }}

## Where to go next

- **The contract machinery:** how types flow from a contract to a client in
  [Contracts &amp; type flow]({{ comp.xref({ key: "explain:contracts" }) }}).
- **The plugin mechanics:** public-versus-core split, manifests, and registries in
  [The plugin system]({{ comp.xref({ key: "explain:plugin-system" }) }}).
- **The auth seam in depth:** the port, the three backends, and the capability
  matrix in [The auth model]({{ comp.xref({ key: "explain:auth-model" }) }}).
- **Durable behavior:** how sagas and workers persist and recover in
  [The durability model]({{ comp.xref({ key: "explain:durability-model" }) }}).
- **The local control plane:** how Aspire provisions everything in
  [Orchestration with Aspire]({{ comp.xref({ key: "explain:aspire" }) }}).
- **Exact symbols:** open any package's [reference unit](/reference/).
- **Hands-on:** the [tutorials]({{ comp.xref({ key: "tut:index" }) }}) and
  [how-to guides]({{ comp.xref({ key: "howto:index" }) }}).

{{ comp.nextPrev({ prev: { label: "Explanation", href: "/explanation/" }, next: { label: "Contracts & type flow", href: "/explanation/contracts/" } }) }}
