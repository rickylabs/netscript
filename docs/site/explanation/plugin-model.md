---
layout: layouts/base.vto
title: The plugin model
templateEngine: [vento, md]
prev:
  label: Contracts & type flow
  href: /explanation/contracts/
next:
  label: Durable workflows
  href: /explanation/durable-workflows/
---

# The plugin model

This page explains how a NetScript plugin is put together, why the design is split between a
public plugin package and a sibling core package, and how a host runtime turns a plugin's
declared **manifest** into live capability through **contributions** and a generated
**registry**. Read it to understand the model before you change or extend it.

If you only want to *add* a plugin to an existing workspace, follow the task-oriented
[how-to guide](/how-to/add-a-plugin/). For the exact symbols a plugin author calls, use the
[`@netscript/plugin` reference](/reference/plugin/). For the richest worked example of every
idea on this page, read [The auth model](/explanation/auth-model/).

{{ comp callout { type: "note", title: "Three nouns carry the whole model" } }}
A plugin declares a <strong>manifest</strong>; the manifest names a set of
<strong>contributions</strong> against fixed extension axes; a generated
<strong>registry</strong> turns those declarations into static modules the runtime imports.
Hold those three nouns and the rest of this page is detail.
{{ /comp }}

## What a plugin is

A NetScript plugin is a package under `plugins/` that contributes capability to a host
workspace **without the host hard-coding any knowledge of that capability**. The host depends
on a small, finite vocabulary of contribution shapes; the plugin speaks that vocabulary. Adding
a plugin therefore never means editing host code — it means shipping a manifest and
regenerating a registry.

The first-party plugins are:

{{ comp apiTable {
  caption: "First-party plugins and the capability each contributes",
  columns: ["Plugin", "JSR package", "Capability", "Reference"],
  rows: [
    ["workers", "<code>@netscript/plugin-workers</code>", "Background job scheduling and task execution.", "<a href=\"/reference/workers/\">workers →</a>"],
    ["sagas", "<code>@netscript/plugin-sagas</code>", "Durable saga orchestration and workflow APIs.", "<a href=\"/reference/sagas/\">sagas →</a>"],
    ["triggers", "<code>@netscript/plugin-triggers</code>", "Trigger ingress, scheduling, and file watching.", "<a href=\"/reference/triggers/\">triggers →</a>"],
    ["streams", "<code>@netscript/plugin-streams</code>", "Durable change-data stream services.", "<a href=\"/reference/streams/\">streams →</a>"],
    ["auth", "<code>@netscript/plugin-auth</code>", "Authentication service composing one active backend.", "<a href=\"/reference/auth/\">auth →</a>"]
  ]
} /}}

Each is its own publishable unit with its own reference page. Plugins that run as services
expose them on dedicated ports — workers on `:8091`, sagas on `:8092`, triggers on `:8093`,
auth on `:8094`, and streams as an Aspire Deno service on `:4437` — but a host can compose any
combination of them, because they all speak the same contribution vocabulary.

## Plugins versus their core packages

The single most important thing to understand about a NetScript plugin is that it is *two
packages, not one*. Most public plugins have a sibling **core** package:

{{ comp apiTable {
  caption: "Public plugin packages and their sibling core packages",
  columns: ["Public plugin", "Sibling core package", "What lives in core"],
  rows: [
    ["<code>@netscript/plugin-workers</code>", "<code>@netscript/plugin-workers-core</code>", "Job/scheduler runtime, ports, contracts."],
    ["<code>@netscript/plugin-sagas</code>", "<code>@netscript/plugin-sagas-core</code>", "Saga DSL, durable runtime, durability tiers."],
    ["<code>@netscript/plugin-triggers</code>", "<code>@netscript/plugin-triggers-core</code>", "Trigger definition builders, ingress runtime."],
    ["<code>@netscript/plugin-streams</code>", "<code>@netscript/plugin-streams-core</code>", "Durable stream producer runtime."],
    ["<code>@netscript/plugin-auth</code>", "<code>@netscript/plugin-auth-core</code> (+ backends)", "<code>AuthBackendPort</code> seam, domain, contracts."]
  ]
} /}}

The split follows the architecture doctrine's separation of *behavior* from *integration*:

- The **core** package implements the capability itself — the authoring DSL (for example the
  saga and trigger definition builders), the runtime, the ports it depends on, the adapters,
  telemetry helpers, and the versioned contract types. This is where the long-running behavior
  and state live.
- The **plugin** package is a thin integration layer (the doctrine's *Plugin Package*
  archetype). Its `mod.ts` is small. It re-exports the userland surface from its core sibling
  rather than redefining it, and it adds the one thing the core cannot supply on its own: a
  **manifest** that tells a host *what* this plugin contributes and *how* to wire it up.

Because of this split, core packages appear as an **Internals** subsection on each plugin's
reference page rather than as separate top-level entries. Application authors normally reach
core symbols *through* the public plugin, so the public plugin is the surface users consume.

{{ comp callout { type: "tip", title: "One import path, two responsibilities" } }}
The saga DSL is exported from <code>@netscript/plugin-sagas/runtime</code> even though it is
authored in <code>@netscript/plugin-sagas-core</code>. The plugin re-exports the core contract
and runtime, so consumers get one stable import path while the behavior/integration boundary
stays intact in source.
{{ /comp }}

This is also why some plugin surfaces are deliberately thin or even fail loud. The
`@netscript/plugin-streams` manifest helpers `defineStreamProducer`/`defineStreamConsumer`
throw `StreamUnsupportedOperationError` and redirect you to the real producer runtime in
`@netscript/plugin-streams-core` (`createDurableStream`). The *behavior* lives in core; the
*plugin* only carries the manifest. The boundary is a feature, not an oversight — see
[Streaming change data](/capabilities/streams/) for the producer-versus-manifest framing.

## Manifests and contributions

A plugin describes itself with a typed **manifest**, assembled through the `definePlugin()`
builder in [`@netscript/plugin`](/reference/plugin/). The manifest is a *declaration*, not
executable wiring: it names the plugin, its version, and the set of **contributions** the
plugin makes along well-defined **extension axes**.

{{ comp tabbedCode {
  tabs: [
    {
      label: "definePlugin",
      language: "ts",
      code: "import { definePlugin } from \"@netscript/plugin\";\n\n// A manifest is a declaration the host can read at composition time —\n// no behavior runs here, it only names contributions.\nexport const authPlugin = definePlugin(\"@netscript/plugin-auth\", \"0.0.1-alpha.0\")\n  // The builder is the only public surface: name + version, then chained axes.\n  // contributions: services, schemas, stream topics, contract versions…\n  .withType(\"api\")\n  .withTags([\"auth\", \"oauth\", \"oidc\", \"sessions\"])\n  .build();"
    }
  ]
} /}}

Contributions are the vocabulary the host understands. The plugin contract defines a *fixed*
set of contribution shapes — among them service contributions, background-processor
contributions, database-schema contributions, stream-topic contributions, contract-version
contributions, runtime-config-topic contributions, and telemetry contributions. A workers
plugin contributes worker job definitions; a sagas plugin contributes saga definitions; a
streams plugin contributes stream topics and a service; an auth plugin contributes its oRPC
service, a Prisma schema, and stream topics. The host never needs to know the internals of any
plugin — it only needs to understand these contribution shapes.

This is the doctrine's principle of **registration over inheritance** for cross-package
extension: a plugin *registers* named contributions against open extension axes instead of
subclassing host internals. Registration scales because the host can validate a registration at
composition time, log it, and reject conflicts — for example, duplicate plugin names are
rejected with a structured error that references both contributors.

{{ comp callout { type: "note", title: "Contributions are a closed set; plugins are an open set" } }}
The host understands a <strong>fixed</strong> list of contribution shapes, but any number of
plugins may contribute against them. That asymmetry is what lets capabilities compose without
the host growing new code for each plugin.
{{ /comp }}

## Discovery, loading, and registries

NetScript does **not** auto-discover plugins from `node_modules`. Plugins use **file-system
based discovery** under `plugins/`, and the host loader resolves them **explicitly**. Two
properties of the loader matter for understanding the model:

- **Load order is deterministic.** Plugins must not depend on the order in which other plugins
  load; the doctrine forbids order-dependence and asserts against it.
- **Each load contributes named registrations** against one or more extension axes, and
  duplicate names across plugins are rejected.

Between *declaring* a plugin and letting the *runtime* use it sits a generated **registry**.
Rather than scanning the file system at runtime, NetScript emits static registry modules — one
TypeScript module per contribution axis — that the runtime imports directly. The plugin package
exposes the emitter and port types behind this on its [reference page](/reference/plugin/), and
each plugin loads its definitions from the generated static registry module.

{{ comp card { title: "The lifecycle in four steps", icon: "🔌" } }}
<strong>1. Author</strong> capability in a <code>-core</code> package (DSL, runtime, ports).
<strong>2. Declare</strong> a manifest in the plugin package via <code>definePlugin()</code>.
<strong>3. Generate</strong> the static registry so the runtime can see the new contributions.
<strong>4. Compose</strong> — the host loads registrations deterministically and rejects
duplicate names.
{{ /comp }}

Regenerating the registry is what makes a freshly added plugin visible to the runtime; the
practical command sequence (`netscript plugin add …` then the registry generation step) is
covered in the [add-a-plugin how-to](/how-to/add-a-plugin/).

## Auth: the model at its richest

The **auth** plugin is the clearest single exemplar of every idea on this page, because it
stretches the core/plugin split across *five* units instead of two:

- `@netscript/plugin-auth-core` defines the **port** — `AuthBackendPort` — and nothing
  provider-specific. It is the seam.
- Three pure **backend adapters** implement that port for different identity providers:
  `@netscript/auth-kv-oauth` (the only interactive backend — full OAuth/OIDC redirect flow),
  `@netscript/auth-workos`, and `@netscript/auth-better-auth` (both non-interactive).
- `@netscript/plugin-auth` is the **composing plugin**: it carries the manifest, runs the
  `auth-api` oRPC service on `:8094`, and selects exactly **one** active backend via
  `NETSCRIPT_AUTH_BACKEND` (default `kv-oauth`).

That is the whole model written large: behavior lives in core and adapters, the plugin only
composes and declares, and the host sees one service contribution regardless of which backend
is active. Where a backend cannot satisfy a capability — for instance, asking a non-interactive
backend to run an interactive sign-in — the seam fails loud with a typed
`AuthBackendOperationUnsupportedError` rather than silently misbehaving. Read
[The auth model](/explanation/auth-model/) for the full port-and-adapter walkthrough.

{{ comp callout { type: "warning", title: "Auth packages are alpha" } }}
The auth units are published at <code>0.0.1-alpha.0</code>. Scaffold-pinned
<code>jsr:…@^1.0.0</code> specifiers are <strong>forward-looking</strong> and not installable
today. There is also no auth telemetry or audit surface yet — do not assume one exists.
{{ /comp }}

## Why the model looks like this

The shape exists to keep three concerns from leaking into each other:

1. **Capability authors** work in a core package and think only about behavior, ports, and
   contracts — never about how a host discovers them.
2. **Plugin packages** stay small: they translate a capability into a manifest of
   contributions, which is the only thing a host has to understand.
3. **Hosts** depend on a stable, finite set of contribution shapes and a deterministic loader,
   so adding a plugin never requires editing host code — it requires a manifest and a
   regenerated registry.

The result is that capabilities compose. A host can add workers, sagas, triggers, streams, and
auth in any combination, and each plugin contributes its services, background processors,
schemas, and topics through the same contribution vocabulary.

## Where to go next

{{ comp learningPath {
  title: "Continue with the plugin model",
  steps: [
    { label: "Add a first-party plugin", href: "/how-to/add-a-plugin/", description: "The task-oriented recipe: scaffold, register, regenerate, verify." },
    { label: "The auth model", href: "/explanation/auth-model/", description: "The five-unit core/adapter/plugin split — the model at its richest." },
    { label: "Plugin authoring contract", href: "/reference/plugin/", description: "definePlugin(), contribution shapes, and the registry emitter." },
    { label: "Durable workflows", href: "/explanation/durable-workflows/", description: "How saga and worker plugins keep long-running state durable." }
  ]
} /}}

Each plugin's surface is documented on its own reference page:
[workers](/reference/workers/), [sagas](/reference/sagas/),
[triggers](/reference/triggers/), [streams](/reference/streams/), and
[auth](/reference/auth/). For the wider architecture, browse the other
[explanation](/explanation/) pages.
