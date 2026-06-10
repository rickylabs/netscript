# Architecture

`@netscript/plugin-triggers-core` is an A3 Runtime/Behavior package.

It owns reusable trigger behavior rather than plugin packaging.

The package boundary is intentionally below service startup, CLI orchestration, and Aspire
registration.

## Archetype

The governing archetype is **A3 Runtime/Behavior**.

The package owns trigger firing, scheduling, deduplication, retry, DLQ routing, and ingress
composition behavior.

That means quality gates must cover public surface hygiene, runtime invariants, docs, tests, and
publishability.

## Layers

- `domain/` contains finite vocabulary, trigger definitions, trigger events, action results, ids,
  and errors.
- `builders/` contains handler-first authoring functions.
- `ports/` contains consumed runtime contracts.
- `adapters/` contains small reusable adapters that do not start processes.
- `runtime/` contains `createTriggerProcessor()` and `createTriggerIngress()`.
- `telemetry/` contains structural instrumentation contracts.
- `config/` contains trigger-owned config schemas.
- `contracts/` contains versioned API contracts.
- `testing/` contains deterministic adapters and fixtures.

## Dependency Direction

Domain code does not depend on runtime composition.

Builders depend on domain types.

Ports depend on domain types.

Runtime depends on ports and domain types.

Testing adapters implement ports.

Plugin packages depend on core.

Core does not depend on plugin packages.

## Composition

Core runtime objects are created by functions.

The caller supplies collaborators.

The caller supplies event stores.

The caller supplies idempotency stores.

The caller supplies DLQ ports.

The caller supplies scheduler and watcher adapters.

The caller supplies logging and telemetry boundaries.

This keeps runtime behavior deterministic and replaceable.

## Public Surface

The root barrel is curated for common application authoring.

Specialized subpaths expose lower-level contracts.

New public exports must have JSDoc.

New public exports must have an owning subpath.

New public exports must not leak private or upstream implementation types.

## Runtime Invariants

Accepted webhook events are persisted before acknowledgement.

Duplicate events do not dispatch duplicate actions.

Retry exhaustion goes through the DLQ port.

Schedulers do not require core to import a cron package.

Watchers do not require core to import a watcher package.

The processor can be stopped without abandoning in-flight work.

## Non-Goals

Core does not start HTTP servers.

Core does not scan project files.

Core does not register Aspire resources.

Core does not own CLI commands.

Core does not own generated runtime registries.

Core does not own production secrets.
