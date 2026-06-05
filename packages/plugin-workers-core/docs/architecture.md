# Architecture

`@netscript/plugin-workers-core` is the Tier 1 core package for workers.

## Boundary

The package owns reusable worker definitions, schemas, contracts, and runtime composition contracts.
It does not own the workers service process, CLI verbs, generated registries, or plugin manifest.

## Layers

- `domain/` contains pure definitions, schemas, constants, and result shapes.
- `builders/` contains the typestate definition DSL.
- `ports/` contains consumed runtime contracts.
- `registry/`, `executor/`, `workflow/`, and `shutdown/` contain reusable runtime primitives.
- `runtime/` owns `createWorkersRuntime(options)`.
- `presets/` owns the thin `startWorkers(options)` preset.
- `contracts/` owns versioned API contracts.
- `testing/` owns memory-backed adapters and fixtures.

## Composition

Callers compose a runtime by passing explicit dependencies to `createWorkersRuntime(options)`. The
composition root creates fresh default registries, worker ports, workflow executors, and shutdown
managers per call.

## Dependency Rules

The core package does not import non-core plugin packages. It also does not re-export worker schemas
from `@netscript/config` or telemetry types from `@netscript/telemetry`.

## Extension

Stub-only abstract contracts live under `src/abstracts/` for later Tier 2 implementations. Concrete
method bodies are kept out of those files.
