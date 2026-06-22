# Thesis and Axioms

The doctrine is governed by one thesis and fourteen axioms. The remaining doctrine pages translate
these into operating rules for each architectural concern. Every axiom is sourced in the phase-0
research quote armory (`phase-0-research/09-quote-armory.md`).

## Thesis

NetScript publishes Deno-native, JSR-distributed framework packages. The published surface _is_ the
product. Therefore each `mod.ts` is an enterprise contract; each base class is a stub-only
blueprint; each derived class is a thin dispatcher to constructor-injected modules; each helper is
justified or deleted; each folder names a single concern; and each axiom below survives as a check
we run.

We borrow from Java, .NET, Rust, Go, Erlang, and Clojure when their solutions match a real problem
we already have. We translate, we do not imitate. We reject ceremony. We embrace Deno and JSR as the
target.

## Axioms

### A1. Public types are designed first

The shape that callers see precedes the implementation. A `mod.ts` and a README come before classes.
Pike: _data dominates_. Brooks: _show me your tables_.

### A2. Simple is preferred over easy at every published boundary

Easy is at hand; simple is one concern. Approachability for the new caller is achieved by a small,
predictable surface, not by hidden magic. Hickey's distinction is the rule. (See
[`02-public-surface.md`](./02-public-surface.md).)

### A3. The 80% case is one chained call; advanced cases unfold one method deeper

Vue's progressive doctrine. Stroustrup's "make simple things simple." Configuration ceremony does
not creep into the simple path to enable the advanced path. (See
[`02-public-surface.md`](./02-public-surface.md),
[`07-composition-and-extension.md`](./07-composition-and-extension.md).)

### A4. Base classes are contracts; concrete classes delegate

A base class declares a stub-only lifecycle. Concrete classes are thin dispatchers that forward to
constructor-injected modules. No shared state in the base. No utility inheritance. Cross-package
implementation inheritance is forbidden. (See
[`03-base-and-derived-classes.md`](./03-base-and-derived-classes.md).)

### A5. Composition over inheritance — by default and at every level

Bloch Item 18. We use a forwarding-class shape: hold the would-be parent as a field, expose narrow
methods, replace the held instance to change behavior. (See
[`03-base-and-derived-classes.md`](./03-base-and-derived-classes.md).)

### A6. Helpers must be justified

A helper exists only if it does one of: (a) introduces a real test seam, (b) encodes a
NetScript-specific policy, (c) hides a stable non-trivial computation. Renaming a Web Platform or
`@std/*` primitive is not a justification. (See
[`04-modules-and-helpers.md`](./04-modules-and-helpers.md).)

### A7. Web Platform and `@std/*` first

`fetch`, `URL`, `Headers`, `ReadableStream`, `AbortSignal`, `structuredClone`, `crypto.subtle`,
`Temporal/Date`, `Intl.*`, and the entire `@std/*` set are the baseline. The question "what does the
platform already give me?" is mandatory before any helper is written. (See
[`04-modules-and-helpers.md`](./04-modules-and-helpers.md); phase-0 research
`phase-0-research/08-deno-and-jsr-as-target.md`.)

### A8. One concern per folder; one reason per file

Folders name domain concerns. Files have one obvious reason to exist. Tests live next to their
subject (or under `tests/` for cross-cutting suites). Files do not exceed two screenfuls without a
refactor review. (See [`05-folder-structure.md`](./05-folder-structure.md),
[`09-anti-patterns-and-fitness-functions.md`](./09-anti-patterns-and-fitness-functions.md).)

### A9. One structure does not fit every package

Six archetypes cover the published surface today: small contract, integration, runtime/behavior,
public DSL/builder, plugin, and CLI/tooling. Each archetype has its own minimum viable shape. A tiny
package stays tiny; a runtime package layers. (See [`06-archetypes.md`](./06-archetypes.md).)

### A10. Composition root over container; constructor injection is the default

A `createX()` factory wires the package. A typed container is allowed only when many modules
contribute providers, runtime composition is ordered, or services are optional. Decorator-driven DI
is not used. (See [`07-composition-and-extension.md`](./07-composition-and-extension.md); phase-0
research `phase-0-research/05-dotnet-as-source.md`.)

### A11. Extension axes are named before they are abstracted

If we cannot name what varies — engine, transport, store, target, runtime — there is no abstraction
yet. Premature `BaseRunner` is the smell. (See
[`07-composition-and-extension.md`](./07-composition-and-extension.md).)

### A12. Durable workflows are state machines

Sagas, triggers, and other durable flows are modeled as state machines with named phases, explicit
correlation, persistence, time, and compensation. Generic event handler ladders are the smell. (See
[`08-runtime-state-failure.md`](./08-runtime-state-failure.md).)

### A13. Crash boundaries are explicit

Handlers throw rich errors. Supervisors decide restart vs. escalation. Telemetry is owned by the
supervisor. Defensive `try/catch` clutter inside handlers is a smell. (See
[`08-runtime-state-failure.md`](./08-runtime-state-failure.md).)

### A14. Tests are fitness functions; the publish gate is the doctrine gate

`deno publish --dry-run`, `deno doc`, `deno task check:*`, semantic tests, and an export/docs audit
are not optional. They are how the doctrine survives. (See
[`09-anti-patterns-and-fitness-functions.md`](./09-anti-patterns-and-fitness-functions.md).)

## How to read the rest

Every following file restates one or two axioms in operating terms, gives concrete rules, applies
the rules to a real package in this repo, and closes with a checklist. The final file —
[`10-codebase-verdict-and-handoff.md`](./10-codebase-verdict-and-handoff.md) — walks the current
`packages/` and `plugins/` and labels each one.

## What is not in the doctrine

- A single fluent-builder shape replicated across every package. Some packages should not have
  builders at all.
- A mandatory DI container. We escalate to one only on demand.
- A single state-machine DSL imposed on everything. Sagas are the state-machine archetype; triggers
  are not.
- A single test framework. Tests are the architecture; the framework is whatever Deno's test runner
  and `@std/testing` already give us.
- Aspirational architecture for code that has not yet been written. The doctrine binds what we
  publish today and what we are about to publish next.
