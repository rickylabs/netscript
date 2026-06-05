---
title: Runtime Config Architecture
description: Archetype, layering, and boundaries for @netscript/runtime-config.
package: '@netscript/runtime-config'
order: 1
---

# Architecture

`@netscript/runtime-config` is an Archetype 1 Small Contract package.

It publishes types, loader functions, a watcher, and structured diagnostics. It does not own
scheduling, persistence, logging, or service lifecycle.

## Layers

```text
mod.ts
  |
  +-- src/domain/types.ts
  |
  +-- src/application/loader.ts
  |     |
  |     +-- src/domain/types.ts
  |
  +-- src/application/watcher.ts
  |     |
  |     +-- src/application/loader.ts
  |     +-- src/domain/types.ts
  |
  +-- src/diagnostics/summary.ts
        |
        +-- src/application/loader.ts
        +-- src/domain/types.ts
```

## Boundary

The package reads from the runtime directory and returns plain data. Callers decide how to apply
overrides, emit logs, expose metrics, or stop processes.

## Axioms

- Public types first: every runtime topic has a named interface.
- Simple over easy: the root surface is a short manifest.
- One concern per folder: domain, application, and diagnostics are separate.
- Helpers must be justified: there is no generic helpers folder.
