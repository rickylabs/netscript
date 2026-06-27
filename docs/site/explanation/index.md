---
layout: layouts/base.vto
title: Explanation
templateEngine: [vento, md]
prev: null
next:
  label: The NetScript architecture
  href: /explanation/architecture/
---

Explanation pages are the **why** lane. They build the mental model: how NetScript
is put together, why each boundary is shaped the way it is, and which trade-offs
that shape buys you. Read them when you want to understand the framework, not when
you are hunting for a specific command.

NetScript is a **Deno-native, contracts-first backend framework**. Its design is
governed by one thesis — *the published surface is the product* — and everything in
this zone is a consequence of that single idea: types before implementation, a small
predictable surface at every boundary, and durable behavior modeled as explicit state
machines rather than scattered event handlers.

{{ comp callout { type: "tip", title: "How this zone fits the others" } }}
These pages are <strong>understanding-oriented</strong>. For a guided first path use the <a href="/tutorials/">tutorials</a>; to get a concrete job done use the <a href="/how-to/">how-to guides</a>; to look up the exact symbols, ports, and signatures of any package use the generated <a href="/reference/">reference</a>; and for a one-screen tour of each subsystem use the <a href="/capabilities/">capabilities</a> hubs.
{{ /comp }}

## The concept map

Seven topics, ordered from the broadest framing down to the individual subsystems.
The first two explain the framework as a whole; the next two cover the durable
runtime model; the last three explain the cross-cutting concerns every plugin
shares — the local orchestrator, the telemetry it emits, and the pure-backend
authentication seam.

{{ comp.featureGrid({ items: [
  { title: "The NetScript architecture", icon: "🏛️", href: "/explanation/architecture/", body: "The published-surface thesis, the contracts-first workflow, the six package archetypes, and the publish gate that enforces all of it." },
  { title: "Contracts first", icon: "📜", href: "/explanation/contracts/", body: "How an oRPC contract flows from defineContract through implement() and a typed handler into a fully typed client, query layer, and island." },
  { title: "The plugin system", icon: "🧩", href: "/explanation/plugin-system/", body: "How a plugin relates to its core package, what it contributes through its manifest, and how the host discovers it through generated registries." },
  { title: "Durability model", icon: "🔁", href: "/explanation/durability-model/", body: "Sagas as explicit state machines: correlation, the kv or prisma durable store, and compensation modeled as message-handler effects." },
  { title: "Observability", icon: "📡", href: "/explanation/observability/", body: "Where OpenTelemetry traces are real and automatic, where the scaffold handler helpers are still no-op stubs, and how Aspire collects it all." },
  { title: "The Aspire orchestrator", icon: "🛰️", href: "/explanation/aspire/", body: "The generated TypeScript AppHost, the resource graph (the Postgres container by default — or mysql / mssql via --db; sqlite is file-backed with no container — plus Redis and every *-api service), and the dashboard on :18888." },
  { title: "The pure-backend auth model", icon: "🔐", href: "/explanation/auth-model/", body: "Core defines the AuthBackendPort; backends are pure adapters; the plugin composes exactly one active backend. Why only kv-oauth is interactive." }
] }) }}

## A suggested reading order

These pages stand alone, but they compound. If you are new to the design, read them
top to bottom: the architecture page sets the vocabulary the rest assume, and the
auth model is easiest to grasp once you already understand plugins and ports.

{{ comp.learningPath({ steps: [
  { label: "Architecture", href: "/explanation/architecture/" },
  { label: "Contracts", href: "/explanation/contracts/" },
  { label: "Plugin system", href: "/explanation/plugin-system/" },
  { label: "Durability model", href: "/explanation/durability-model/" },
  { label: "Observability", href: "/explanation/observability/" },
  { label: "Aspire", href: "/explanation/aspire/" },
  { label: "Auth model", href: "/explanation/auth-model/" }
] }) }}

## Themes that recur across every page

A handful of ideas surface again and again. Recognizing them early makes the rest of
this zone read as one coherent argument rather than seven separate articles.

- **Contracts before implementation.** Every subsystem starts from a schema and type
  contract — an oRPC contract for a service, a `defineSaga` definition for a workflow,
  an `AuthBackendPort` for an auth adapter — and the implementation is written to
  satisfy it. The [architecture](/explanation/architecture/) and
  [contracts](/explanation/contracts/) pages establish this; everything else applies it.
- **Ports own the seam; adapters stay swappable.** A package owns the *port* and wires
  one default adapter through a `createX()` factory, while technology-specific adapters
  and in-memory testing helpers live behind their own subpaths. The
  [auth model](/explanation/auth-model/) is the sharpest example — `AuthBackendPort`
  is defined once in core and satisfied by three independent backends.
- **Durable state is explicit.** Long-running behavior is a named state machine with a
  persistence backend, not an implicit ladder of callbacks. See
  [durable workflows](/explanation/durability-model/) for sagas (`kv` or `prisma`
  store) and the [auth model](/explanation/auth-model/) for durable `auth.*` events.
- **Plugins extend without redefining.** First-party plugins under `plugins/*` re-export
  their core package's contract and contribute service entrypoints, runtime declarations,
  and schema fragments — covered in the [plugin model](/explanation/plugin-system/).
- **Alpha reality stated plainly.** Where the scaffold ships a stub — the worker handler
  trace helpers, the streams *manifest* helpers, the absent auth audit surface — these
  pages say so plainly. The [observability](/explanation/observability/) page draws the
  exact line between real automatic traces and the no-op handler stubs.

{{ comp callout { type: "note", title: "Where to verify a claim" } }}
Every command, port, and import specifier in this zone is grounded in the generated <a href="/reference/">reference</a> (one page per published package). When an explanation page names a symbol, follow its link to <code>reference/&lt;unit&gt;/</code> for the exact signature — the reference is the single source of truth, and these pages never duplicate it.
{{ /comp }}

## Where to go next

- Start with [The NetScript architecture](/explanation/architecture/) for the
  framework-wide model and vocabulary.
- Jump straight to [The pure-backend auth model](/explanation/auth-model/) if you are
  evaluating NetScript's authentication seam.
- Cross over to the [capabilities](/capabilities/) hubs for a per-subsystem tour with
  headline APIs, or to the [reference](/reference/) for exact symbols.
