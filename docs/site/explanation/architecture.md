---
layout: layouts/base.vto
title: The NetScript architecture
---

# The NetScript architecture

NetScript is a set of Deno-native, [JSR](https://jsr.io)-distributed framework
packages. This page explains *how* the framework is shaped and *why* it is shaped
that way. It is understanding-oriented: read it to build a mental model, not to
follow steps. When you want exact symbols and signatures, every package named here
links to its [reference page](/reference/); when you want to build something, start
with the [tutorials](/tutorials/) or a [how-to guide](/how-to/).

## The thesis: the published surface is the product

NetScript treats publishing as the whole point. A package's `mod.ts` is not an
implementation detail that happens to be exported — it is the contract the framework
makes with the outside world. The shape a caller sees through `deno doc`, the JSR doc
score, and the type checker is the surface that everything else serves.

Two consequences follow from this, and they explain most of the design decisions you
will encounter:

1. **Types are designed before implementation.** The public types and the README come
   first; the classes that satisfy them come second. If `deno doc <package>` does not
   read end-to-end as a manual, the surface is considered broken regardless of how the
   internals work.
2. **Simple is preferred over easy at every boundary.** Approachability comes from a
   small, predictable surface rather than from hidden magic. The common 80% case is one
   chained call; advanced cases unfold one method deeper rather than appearing as
   required configuration on the entry point.

The framework borrows ideas from Java, .NET, Rust, Go, Erlang, and Clojure where those
solutions match a real problem the codebase already has — translated to Deno and JSR
rather than imitated.

## Contracts first

"Contract first" is the workflow that the thesis implies. For any unit of framework
code the order is: define the schema and type contract, then implement against it, then
test the implementation as a fitness function. A package's `mod.ts` is a *manifest* of
named exports, a *map* into the package's documentation, and a *boundary* across which
dependencies become public. It is deliberately not a kitchen sink of internal symbols, a
barrel file forwarding from twenty other modules, or a backwards-compatibility shim
layer.

This is why the reference pages on this site are generated directly from `deno doc`
against each package's declared exports: the documentation describes the same surface the
type checker and the JSR audit enforce, so there is one source of truth rather than prose
that drifts from code.

Naming is part of the contract. Entry points follow fixed verbs so a caller can predict
behavior from the name alone:

- `defineX(...)` returns a frozen *definition* and does no runtime work — it is the
  builder verb.
- `createX(...)` constructs a *runtime* object that owns state and IO.
- `startX(...)` constructs *and* starts a runtime, returning a small `{ stop() }` handle.
- `useX(...)` is a hook-style accessor inside a request, render, or handler scope.
- `withX(...)` is a builder method that always returns a new builder and never mutates.

When a `mod.ts` would re-export more than roughly twenty symbols, the surface is split
into **subpath exports** (for example `@netscript/logger/middleware` and
`@netscript/logger/orpc`). Subpaths keep bundles lean, isolate adapter-specific code, and
separate testing helpers from production exports.

## Base classes are contracts; concrete classes delegate

Where NetScript uses classes, inheritance is a contract mechanism, not a code-reuse
mechanism. A base class declares a stub-only lifecycle with no shared state and no utility
methods to inherit. Concrete classes are thin dispatchers that forward to collaborators
supplied through their constructor. Cross-package implementation inheritance is forbidden.

The default everywhere is **composition over inheritance**: hold the would-be parent as a
field, expose narrow methods, and replace the held instance to change behavior. A package
wires its collaborators in a single **composition root** — a plain `createX()` factory
that constructs the default adapters and injects them. The framework escalates to a typed
container only when many modules contribute providers, composition is ordered, or services
are genuinely optional; decorator-driven dependency injection is not used. Equally,
abstractions are introduced only once the axis of variation can be *named* — engine,
transport, store, target, runtime. A `BaseRunner` invented before anyone can say what
varies is treated as a smell.

## Helpers, the platform, and folders

NetScript reaches for the platform before writing its own code. The Web Platform APIs
(`fetch`, `URL`, `Headers`, `ReadableStream`, `AbortSignal`, `structuredClone`,
`crypto.subtle`, `Temporal`/`Date`, `Intl.*`), the `Deno.*` namespace, and the entire
`@std/*` library are the baseline. A local helper is justified only if it introduces a
real test seam, encodes a NetScript-specific policy, or hides a stable non-trivial
computation — renaming a platform primitive is not a justification.

Structure follows the same discipline: one concern per folder, one reason per file, and
tests living next to their subject. The aim is that a reader can navigate by folder name
alone.

## Six archetypes, not one layout

One folder layout does not fit every package, so the doctrine recognizes six archetypes.
Each package picks the *smallest* archetype that fits; if two seem to apply, it picks the
larger and folds the smaller one in rather than fragmenting across both.

| Archetype | Purpose | Examples |
| --- | --- | --- |
| **Small Contract** | Publishes types and small invariants, almost no runtime. | [`streams`](/reference/streams/), [`runtime-config`](/reference/runtime-config/), [`config`](/reference/config/) |
| **Integration** | Wraps one external system behind a port with adapters. | [`database`](/reference/database/), [`queue`](/reference/queue/), [`kv`](/reference/kv/), [`aspire`](/reference/aspire/), [`cron`](/reference/cron/), [`logger`](/reference/logger/), [`telemetry`](/reference/telemetry/) |
| **Runtime / Behavior** | Owns long-running, supervised behavior with state and lifecycle. | [`workers`](/reference/workers/), [`triggers`](/reference/triggers/), [`watchers`](/reference/watchers/), [`sagas`](/reference/sagas/) |
| **Public DSL / Builder** | Primary product is a fluent builder API. | [`fresh`](/reference/fresh/), [`fresh-ui`](/reference/fresh-ui/), [`sdk`](/reference/sdk/), [`service`](/reference/service/), [`contracts`](/reference/contracts/), [`plugin`](/reference/plugin/) |
| **Plugin Package** | A first-party plugin under `plugins/*`. | `plugins/workers`, `plugins/sagas`, `plugins/triggers` |
| **CLI / Tooling** | Ships a binary the user runs. | [`cli`](/reference/cli/) |

The archetype is not cosmetic. A Small Contract package has no base classes, no
dependency injection, and no adapters — its value is the clarity of its types. An
Integration package owns the *port* (not the adapter), wires a default adapter through a
`createX(options)` factory, and exposes technology-specific adapters and in-memory testing
helpers through their own subpaths. A Runtime/Behavior package adds supervised lifecycle:
the runtime class is constructor-injected with its store, queue, and telemetry; a
`defineX()` builder produces the frozen definition it consumes; long-running tasks return
`{ stop() }` handles and thread `AbortSignal` through every async path.

## Durable behavior is modeled as state machines

For the Runtime/Behavior packages that own durable flows, NetScript models them as
explicit state machines rather than generic event-handler ladders.
[`sagas`](/reference/sagas/) is the clearest example: a saga is named phases with explicit
correlation, persistence, time, and compensation, declared through a builder:

```ts
import { defineSaga } from "@netscript/sagas";

const saga = defineSaga("user-registration")
  .initially((s) => s.on("UserRegistered").transitionTo("welcoming"))
  .during("welcoming", (s) => s.on("WelcomeEmailSent").complete())
  .build();
```

Failure handling is just as explicit. Handlers throw rich errors; a supervisor — not a
scatter of defensive `try/catch` blocks inside the handler — decides whether to restart or
escalate, and owns the telemetry for that decision. Crash boundaries are a named part of
the design, not an afterthought.

## Plugins extend the framework without redefining it

First-party plugins live under `plugins/*` and form their own archetype. A plugin package
re-exports the contract types from its sibling framework package — a workers plugin uses
the types from [`@netscript/workers`](/reference/workers/), a sagas plugin uses
[`@netscript/sagas`](/reference/sagas/) — rather than redefining them. The plugin's
`mod.ts` stays small; most of its code lives in service entrypoints, runtime declarations
(jobs, sagas, triggers, streams), and a package-owned `verify-plugin.ts` validation gate.
Schema contributions are plain Prisma files referenced from the plugin, not a private
workspace. This keeps the contract in one place (the framework package) and the
plugin-specific wiring in another.

## The publish gate is the doctrine gate

Tests are treated as fitness functions, and the publish gate is where the architecture is
enforced rather than merely described. `deno publish --dry-run`, `deno doc`, the workspace
type checks, the semantic tests, and an export/docs audit are not optional steps — they
are the mechanism by which every axiom above survives contact with real code. A surface
that does not pass them is broken by definition, which is precisely why the public surface
can be trusted as the product.

## Where to go next

- To look up the exact exports of any package, open its [reference page](/reference/).
- To learn the framework by doing, start with the [tutorials](/tutorials/).
- To accomplish a specific task, see the [how-to guides](/how-to/).
