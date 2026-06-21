---
layout: layouts/base.vto
title: Architecture
templateEngine: [vento, md]
prev:
  label: Explanation
  href: /explanation/
next:
  label: Contracts & type flow
  href: /explanation/contracts/
---

{{ comp.breadcrumb() }}

# The NetScript architecture

NetScript is a set of Deno-native framework packages published on
[JSR](https://jsr.io), composed into a running backend by **first-party
plugins** and orchestrated locally by **Aspire**. This page gives you the
architectural model: how the packages are shaped, how the plugins plug into a
kernel, why the boundaries matter, and what the rules are trying to protect.

Use it for orientation, not step-by-step work. Package names link to the
generated [reference](/reference/) when you need exact symbols; the
[tutorials](/tutorials/) and [how-to guides](/how-to/) are the practical paths,
and the [glossary](/glossary/) defines every term of art used below.

{{ comp callout { type: "info", title: "How to read this page" } }}
This is a <strong>mental-model</strong> page. It explains <em>why</em> NetScript
is split the way it is. If you want exact exports, jump to the
<a href="/reference/">reference</a>; if you want to ship something, start with a
<a href="/tutorials/">tutorial</a>.
{{ /comp }}

## The thesis: the published surface is the product

NetScript treats publishing as the whole point. A package's `mod.ts` is not an
implementation detail that happens to be exported — it is the contract the
framework makes with the outside world. The shape a caller sees through
`deno doc`, the JSR doc score, and the type checker is the surface that
everything else serves.

Two consequences explain most of the design decisions you will encounter:

1. **Types are designed before implementation.** The public types and the README
   come first; the classes that satisfy them come second. If
   `deno doc <package>` does not read end-to-end as a manual, the surface is
   considered broken regardless of how the internals work.
2. **Simple is preferred over easy at every boundary.** Approachability comes
   from a small, predictable surface rather than from hidden magic. The common
   80% case is one chained call; advanced cases unfold one method deeper rather
   than appearing as required configuration on the entry point.

The framework borrows from Java, .NET, Rust, Go, Erlang, and Clojure only where
the idea fits a problem NetScript actually has, then translates it into Deno and
JSR instead of copying the source ecosystem wholesale. The deeper rationale for
this contract-first stance is the subject of [Contracts &
type flow](/explanation/contracts/).

## The topology at a glance

A NetScript workspace is not one process. It is a small constellation of
single-purpose services, each owned by a plugin and each speaking a contract,
brought up together by Aspire. The diagram below is the canonical shape of a
fully-loaded workspace — workers, sagas, triggers, auth, and streams all
enabled.

```text
                              ┌───────────────────────────────────┐
                              │            Aspire AppHost          │
                              │   dashboard  http://localhost:18888│
                              │  provisions Postgres + Garnet (KV) │
                              └───────────────┬───────────────────┘
                                              │ wires env, ports, resources
            ┌─────────────────────────────────┼─────────────────────────────────┐
            │                                  │                                 │
   ┌────────▼────────┐                ┌────────▼────────┐               ┌────────▼────────┐
   │  example service │                │   PLUGIN SERVICES (oRPC / Hono) │              │
   │   users :3001    │                ├─────────────────────────────────┤              │
   │  /api/rpc/*      │                │  workers  :8091   (jobs/tasks)   │              │
   │  oRPC contract   │                │  sagas    :8092   (durable flows)│              │
   └────────┬─────────┘                │  triggers :8093   (raw Hono in)  │              │
            │                          │  auth     :8094   (oRPC /api/rpc)│              │
            │ contracts                └────────┬────────────────────────┘              │
            │ (@orpc/contract + zod)            │                                        │
            │                          ┌────────▼─────────┐                              │
   ┌────────▼──────────────────────────┴──────────────────┴──────────────────────────────┐
   │                            KERNEL  (@netscript/* platform packages)                   │
   │  config · runtime-config · service · contracts · sdk · plugin · database · queue · kv │
   │  cron · logger · telemetry · aspire                                                    │
   └────────┬──────────────────────────────────────────────────────────────────┬─────────┘
            │ produces durable change-data events                               │
   ┌────────▼─────────┐                                              ┌──────────▼─────────┐
   │  streams  :4437   │  durable-stream service (Aspire Deno svc)   │  Postgres / Garnet  │
   │  HTTP / SSE       │  workers · auth · sagas mirror state here   │  (relational + KV)  │
   └───────────────────┘                                              └────────────────────┘
```

Read the picture in three bands:

- **Aspire** sits on top. It is the local orchestrator: `cd aspire && aspire run`
  brings up Postgres and Garnet and starts every service _before_ any
  `netscript db` command runs. The dashboard at `http://localhost:18888` is where
  traces, logs, and resource health land. See [Aspire as the local
  control plane](/explanation/aspire/).
- **Plugin services** sit in the middle. Each first-party plugin owns exactly one
  service on a fixed port — workers on **:8091**, sagas on **:8092**, triggers on
  **:8093**, auth on **:8094**, and the streams durable-stream service on
  **:4437**. Your own services (the scaffolded `users` example service on
  **:3001**) sit alongside them, speaking the same contract machinery.
- **The kernel** sits underneath. The platform packages — config, service,
  database, queue, kv, telemetry, and the rest — are the shared substrate every
  plugin composes against. No plugin redefines them; each one _wires_ them.

{{ comp apiTable {
  title: "Workspace ports and surfaces",
  columns: ["Surface", "Port", "Protocol", "Owner"],
  rows: [
    ["Aspire dashboard", ":18888", "HTTP (UI)", "Aspire AppHost"],
    ["Example service (users)", ":3001", "oRPC over <code>/api/rpc/*</code>", "your service"],
    ["Workers", ":8091", "oRPC", "<code>@netscript/plugin-workers</code>"],
    ["Sagas", ":8092", "oRPC", "<code>@netscript/plugin-sagas</code>"],
    ["Triggers", ":8093", "raw Hono routes", "<code>@netscript/plugin-triggers</code>"],
    ["Auth", ":8094", "oRPC over <code>/api/rpc/v1/auth/*</code>", "<code>@netscript/plugin-auth</code>"],
    ["Streams", ":4437", "durable-stream HTTP / SSE", "<code>@netscript/plugin-streams-core</code>"]
  ]
} /}}

A subtlety worth fixing in your head early: **triggers expose raw Hono routes,
not oRPC**, because trigger ingress is webhook-shaped rather than
contract-shaped. Every other plugin service is an oRPC service, and service RPC
is mounted at `/api/rpc/*` (not `/rpc`). Those two facts trip people up more than
any other detail on this page.

## Kernel and plugins: composition, not a monolith

The kernel/plugin split is the spine of the framework. The kernel is a set of
platform packages that know nothing about any specific capability; plugins are
the units that turn that substrate into workers, sagas, triggers, auth, and
streams.

A plugin never edits the host. It _registers_ named **contributions** against
fixed **extension axes** — a service, a background processor, a Prisma schema
fragment, a stream topic, a contract version, runtime-config topics — and the
host validates and wires those registrations at composition time. Adding a plugin
is therefore a manifest plus a regenerated registry, never a patch to kernel
code. The full mechanics — public plugin versus sibling core package, manifests,
contributions, and the generated registry — are the subject of [The plugin
model](/explanation/plugin-model/).

The first-party plugins, each its own publishable unit with its own reference
page:

{{ comp apiTable {
  title: "First-party plugins",
  columns: ["Plugin", "JSR package", "Service port", "Capability"],
  rows: [
    ["workers", "<a href='/reference/workers/'><code>@netscript/plugin-workers</code></a>", ":8091", "Background job scheduling and polyglot task execution."],
    ["sagas", "<a href='/reference/sagas/'><code>@netscript/plugin-sagas</code></a>", ":8092", "Durable saga orchestration and workflow APIs."],
    ["triggers", "<a href='/reference/triggers/'><code>@netscript/plugin-triggers</code></a>", ":8093", "Trigger ingress (raw Hono), scheduling, and file watching."],
    ["auth", "<a href='/reference/auth/'><code>@netscript/plugin-auth</code></a>", ":8094", "Authentication: one active backend behind a pure-backend port."],
    ["streams", "<a href='/reference/streams/'><code>@netscript/plugin-streams</code></a>", ":4437", "Durable change-data stream services (producer runtime in core)."]
  ]
} /}}

Auth is a **first-class plugin in the topology**, exactly like workers and sagas:
it is added through the same scaffold `plugin add` flow, owns one service
(`auth-api`) on its own port, and contributes a Prisma schema and stream topics.
It is not a bolt-on or a middleware afterthought.

## The pure-backend seam: a port with interchangeable adapters

The most important architectural _pattern_ to take away from auth is not specific
to auth at all — it is the **pure-backend seam**, and it is how NetScript keeps a
capability open to multiple implementations without leaking any of them into the
contract.

The shape is always the same:

1. A **core** package defines a **port** — a pure interface, no IO — that says
   what the capability must be able to do.
2. **Adapter** packages implement that port against a concrete technology. They
   are _pure backends_: they depend on the port, never the other way around, and
   they never define new public surface of their own beyond the factory you call.
3. A **plugin** package composes **exactly one** active adapter, selected by
   configuration, and exposes it as a running service.

Auth is the canonical instance. The core seam
[`@netscript/plugin-auth-core`](/reference/auth/) defines `AuthBackendPort`; three
pure adapters implement it —
[`@netscript/auth-kv-oauth`](/reference/auth/) (the only **interactive** backend,
default),
[`@netscript/auth-workos`](/reference/auth/), and
[`@netscript/auth-better-auth`](/reference/auth/); and
[`@netscript/plugin-auth`](/reference/auth/) composes the one backend named by
`NETSCRIPT_AUTH_BACKEND`. Capabilities a given backend cannot honor fail loud
through a typed `AuthBackendOperationUnsupportedError` rather than silently doing
nothing. The full treatment — `InteractiveFlowPort`, the `Principal`/`AuthnResult`
contract from `@netscript/service/auth`, and the per-backend capability matrix —
lives in [The auth model](/explanation/auth-model/).

{{ comp callout { type: "tip", title: "The seam is the design, not the adapter" } }}
You will see the same port-and-adapter shape across the framework: the
<a href="/reference/queue/"><code>queue</code></a> defines one port behind four
backends (Deno&nbsp;KV, Redis, RabbitMQ, and PostgreSQL), the
<a href="/reference/database/"><code>database</code></a> wraps Postgres behind a
port, and durable sagas persist through a <code>kv</code> or <code>prisma</code>
store. Auth simply makes the pattern most visible because it ships three
adapters in the box.
{{ /comp }}

This is why "swap the backend" is a configuration change in NetScript and not a
rewrite: the contract is the port, and adapters are interchangeable behind it.

## Contracts first

"Contract first" is the workflow that follows from the thesis. For any unit of
framework code, the order is: define the schema and type contract, implement
against it, then test the implementation as a fitness function. A package's
`mod.ts` is a _manifest_ of named exports, a _map_ into the package's
documentation, and a _boundary_ where dependencies become public. It is
deliberately not a kitchen sink of internal symbols, a barrel file forwarding
from twenty modules, or a compatibility shim layer.

That is why the reference pages on this site are generated directly from
`deno doc` against each package's declared exports. The docs describe the same
surface the type checker and the JSR audit enforce, leaving one source of truth
instead of prose that slowly drifts from code. The contract machinery itself —
`@orpc/contract`, zod schemas, and `implement()` — is covered in [Contracts &
type flow](/explanation/contracts/).

## Configuration records intent before runtime wiring

NetScript keeps authored intent separate from the concrete runtime wiring that
makes a workspace run. The project-level intent lives in `netscript.config.ts`
and is authored with [`defineConfig`](/reference/config/) or
`defineConfigAsync`. That object says what the project is — its name, paths,
enabled plugins, services, apps, database declarations, saga groups, trigger
groups, deployment settings, and runtime-config output paths. At startup,
`loadConfig` and `initConfig` resolve that authored form into a validated
`NetScriptConfig`; `getConfig` is the synchronous read path after
initialization.

The generated scaffold shows why this distinction matters. `netscript.config.ts`
carries workspace intent such as `paths` and the plugin list
(`./plugins/workers/mod.ts`, `./plugins/sagas/mod.ts`,
`./plugins/triggers/mod.ts`, `./plugins/auth/mod.ts`,
`./plugins/streams/mod.ts`), while the operational database and plugin resource
details are carried by `appsettings.json` and the Aspire AppHost. Plugin packages
can contribute partial config fragments through `@netscript/config/merge`, but
those fragments merge into the already-validated project shape rather than
replacing project identity. Runtime overrides are a third layer exposed by
[`@netscript/runtime-config`](/reference/runtime-config/) for topics such as
jobs, sagas, triggers, features, and tasks.

Think of the model as three layers: `netscript.config.ts` declares project
intent, plugin config contributions extend that intent, and
appsettings/Aspire/runtime-config materialize the environment-specific wiring.
This is also where capability switches live: the saga durable store
(`NETSCRIPT_SAGA_STORE=kv|prisma` or `appsettings`), the queue provider, and the
active auth backend (`NETSCRIPT_AUTH_BACKEND`) are all selected here rather than
in code. This is why database docs call out the current scaffold reality:
`databases.config` can be empty in `netscript.config.ts` while Postgres is still
provisioned by Aspire and described in `appsettings.json`.

Naming is part of the contract. Entry points follow fixed verbs so a caller can
predict behavior from the name alone:

- `defineX(...)` returns a frozen _definition_ and does no runtime work — it is
  the builder verb.
- `createX(...)` constructs a _runtime_ object that owns state and IO.
- `startX(...)` constructs _and_ starts a runtime, returning a small
  `{ stop() }` handle.
- `useX(...)` is a hook-style accessor inside a request, render, or handler
  scope.
- `withX(...)` is a builder method that always returns a new builder and never
  mutates.

When a `mod.ts` would re-export more than roughly twenty symbols, the surface is
split into **subpath exports** (for example `@netscript/logger/middleware` and
`@netscript/logger/orpc`). Subpaths keep bundles lean, isolate adapter-specific
code, and separate testing helpers from production exports.

## Base classes are contracts; concrete classes delegate

Where NetScript uses classes, inheritance is a contract mechanism, not a
code-reuse mechanism. A base class declares a stub-only lifecycle with no shared
state and no utility methods to inherit. Concrete classes are thin dispatchers
that forward to collaborators supplied through their constructor. Cross-package
implementation inheritance is forbidden.

The default everywhere is **composition over inheritance**: hold the would-be
parent as a field, expose narrow methods, and replace the held instance to
change behavior. A package wires its collaborators in a single **composition
root** — a plain `createX()` factory that constructs the default adapters and
injects them. The framework escalates to a typed container only when many
modules contribute providers, composition is ordered, or services are genuinely
optional; decorator-driven dependency injection is not used. Equally,
abstractions are introduced only once the axis of variation can be _named_ —
engine, transport, store, target, runtime. A `BaseRunner` invented before anyone
can say what varies is treated as a smell.

## Helpers, the platform, and folders

NetScript reaches for the platform before writing its own code. The Web Platform
APIs (`fetch`, `URL`, `Headers`, `ReadableStream`, `AbortSignal`,
`structuredClone`, `crypto.subtle`, `Temporal`/`Date`, `Intl.*`), the `Deno.*`
namespace, and the entire `@std/*` library are the baseline. A local helper is
justified only if it introduces a real test seam, encodes a NetScript-specific
policy, or hides a stable non-trivial computation — renaming a platform
primitive is not a justification.

Structure follows the same discipline: one concern per folder, one reason per
file, and tests living next to their subject. The framework's internal layering
runs `domain` → `ports` → `application` → `adapters` → `presentation`, with each
layer allowed to import only the layers above it. The aim is that a reader can
navigate by folder name alone.

## Six archetypes, not one layout

One folder layout does not fit every package, so the doctrine recognizes six
archetypes. Each package picks the _smallest_ archetype that fits; if two seem
to apply, it picks the larger and folds the smaller one in rather than
fragmenting across both.

{{ comp apiTable {
  title: "The six package archetypes",
  columns: ["Archetype", "Purpose", "Examples"],
  rows: [
    ["Small Contract", "Publishes types and small invariants, almost no runtime.", "<a href='/reference/streams/'>streams</a>, <a href='/reference/runtime-config/'>runtime-config</a>, <a href='/reference/config/'>config</a>"],
    ["Integration", "Wraps one external system behind a port with adapters.", "<a href='/reference/database/'>database</a>, <a href='/reference/queue/'>queue</a>, <a href='/reference/kv/'>kv</a>, <a href='/reference/aspire/'>aspire</a>, <a href='/reference/cron/'>cron</a>, <a href='/reference/logger/'>logger</a>, <a href='/reference/telemetry/'>telemetry</a>"],
    ["Runtime / Behavior", "Owns long-running, supervised behavior with state and lifecycle.", "<a href='/reference/workers/'>workers</a>, <a href='/reference/triggers/'>triggers</a>, <a href='/reference/watchers/'>watchers</a>, <a href='/reference/sagas/'>sagas</a>"],
    ["Public DSL / Builder", "Primary product is a fluent builder API.", "<a href='/reference/fresh/'>fresh</a>, <a href='/reference/fresh-ui/'>fresh-ui</a>, <a href='/reference/sdk/'>sdk</a>, <a href='/reference/service/'>service</a>, <a href='/reference/contracts/'>contracts</a>, <a href='/reference/plugin/'>plugin</a>"],
    ["Plugin Package", "A first-party plugin under <code>plugins/*</code>.", "plugins/workers, plugins/sagas, plugins/triggers, plugins/auth"],
    ["CLI / Tooling", "Ships a binary the user runs.", "<a href='/reference/cli/'>cli</a>"]
  ]
} /}}

The archetype is not cosmetic. A Small Contract package has no base classes, no
dependency injection, and no adapters — its value is the clarity of its types.
An Integration package owns the _port_ (not the adapter), wires a default
adapter through a `createX(options)` factory, and exposes technology-specific
adapters and in-memory testing helpers through their own subpaths. A
Runtime/Behavior package adds supervised lifecycle: the runtime class is
constructor-injected with its store, queue, and telemetry; a `defineX()` builder
produces the frozen definition it consumes; long-running tasks return
`{ stop() }` handles and thread `AbortSignal` through every async path. The
pure-backend seam described above is the Integration archetype taken to its
limit — a port with several shipped adapters.

## Durable behavior is modeled as state machines

For the Runtime/Behavior packages that own durable flows, NetScript models them
as explicit state machines rather than generic event-handler ladders.
[`sagas`](/reference/sagas/) is the clearest example: a saga is named phases
with explicit correlation, persistence, time, and compensation, declared through
a builder:

{{ comp tabbedCode {
  tabs: [
    { label: "user-registration.saga.ts", language: "ts", code:
"import { defineSaga } from \"@netscript/sagas\";\n\nconst saga = defineSaga(\"user-registration\")\n  .initially((s) => s.on(\"UserRegistered\").transitionTo(\"welcoming\"))\n  .during(\"welcoming\", (s) => s.on(\"WelcomeEmailSent\").complete())\n  .build();" }
  ]
} /}}

Failure handling is just as explicit. Handlers throw rich errors; a supervisor —
not a scatter of defensive `try/catch` blocks inside the handler — decides
whether to restart or escalate, and owns the telemetry for that decision. Crash
boundaries are a named part of the design, not an afterthought. The durable
runtime persists through a selectable `kv` or `prisma` store; the full flow is
covered in [Durable workflows](/explanation/durable-workflows/).

## Observability is built into the substrate

Because every plugin composes the same kernel, observability is wired once and
inherited everywhere. Aspire runs an OTLP collector, and the worker job path —
dispatch, execution, scheduler, and subprocess continuation — emits **real
OpenTelemetry spans automatically**; job traces show up in the Aspire dashboard
without any handler code. The honest caveat is narrow: the scaffold
`createJobTools(ctx)` helpers exposed to your handler (`trace.addEvent`,
`withChildSpan`, `progress`) are currently no-op stubs — a tracked limitation
with a fix planned — so for custom handler spans you call `@netscript/telemetry`
helpers directly. The full picture is in
[Observability](/explanation/observability/).

## Plugins extend the framework without redefining it

First-party plugins live under `plugins/*` and form their own archetype. A
plugin package re-exports the contract types from its sibling framework package
— a workers plugin uses the types from
[`@netscript/workers`](/reference/workers/), a sagas plugin uses
[`@netscript/sagas`](/reference/sagas/), an auth plugin composes
[`@netscript/plugin-auth-core`](/reference/auth/) — rather than redefining them.
The plugin's `mod.ts` stays small; most of its code lives in service
entrypoints, runtime declarations (jobs, sagas, triggers, streams, auth flows),
and a package-owned `verify-plugin.ts` validation gate. Schema contributions are
plain Prisma files referenced from the plugin, not a private workspace. This
keeps the contract in one place (the framework or core package) and the
plugin-specific wiring in another.

## The publish gate is the doctrine gate

Tests are treated as fitness functions, and the publish gate is where the
architecture is enforced rather than merely described. `deno publish --dry-run`,
`deno doc`, the workspace type checks, the semantic tests, and an export/docs
audit are not optional steps — they are the mechanism by which every axiom above
survives contact with real code. A surface that does not pass them is broken by
definition, which is precisely why the public surface can be trusted as the
product.

{{ comp callout { type: "note", title: "Alpha specifiers" } }}
The auth packages are published at <code>0.0.1-alpha.0</code> today. Scaffold
output pins forward-looking <code>jsr:@netscript/plugin-auth-core@^1.0.0</code>
specifiers, but those are not installable at <code>1.0</code> yet — treat the
auth zone as the framework's newest surface.
{{ /comp }}

## Where to go next

- **The vocabulary:** every term above — saga, trigger, stream, contract,
  contribution, archetype, port, AppHost — is defined in the
  [glossary](/glossary/).
- **The contract machinery:** how types flow from a contract to a client in
  [Contracts & type flow](/explanation/contracts/).
- **The plugin mechanics:** public-versus-core split, manifests, and registries
  in [The plugin model](/explanation/plugin-model/).
- **The auth seam in depth:** the port, the three backends, and the capability
  matrix in [The auth model](/explanation/auth-model/).
- **The local control plane:** how Aspire provisions and orchestrates everything
  in [Aspire](/explanation/aspire/).
- **Exact symbols:** open any package's [reference page](/reference/).
- **Hands-on:** the [tutorials](/tutorials/) and [how-to guides](/how-to/).

---

Back to the [explanation overview](/explanation/).
