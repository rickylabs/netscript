---
title: KV Architecture
description: A2 integration architecture for @netscript/kv adapters and testing contracts.
package: '@netscript/kv'
order: 1
---

# KV Architecture

Archetype: 2

`@netscript/kv` implements Archetype 2 (Integration): it owns a small key-value contract and ships
named adapters for Deno KV, Redis, Kvdex integration, and memory-backed tests.

## Layer Diagram

```text
mod.ts / subpaths
  |
  +-- application/     shared lifecycle, provider detection, key policies
  +-- types/           KvStore, WatchableKv, keys, entries, watch events
  +-- adapters/        DenoKvAdapter, RedisKvAdapter, WatchableKvBridge, MemoryKvAdapter
  +-- src/testing/     public contract tests and in-memory fixtures
```

## Public Surface Map

| Entrypoint              | Exposes                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `@netscript/kv`         | Shared lifecycle helpers, common types, Deno KV and memory adapters. |
| `@netscript/kv/redis`   | Redis adapter and self-registration for Redis provider discovery.    |
| `@netscript/kv/kvdex`   | Kvdex bridge factory and Deno KV compatibility types.                |
| `@netscript/kv/testing` | In-memory adapter factory and reusable KV contract tests.            |

## Axioms In Play

- A1: public types are explicit through `types/` and root re-exports.
- A7: the Deno KV adapter wraps `Deno.Kv` directly instead of hiding it behind generic helpers.
- A8: folder names now describe roles: `application`, `adapters`, `types`, and `testing`.
- A10: shared defaults are wired in `application/shared.ts`, not through a container.

## Anti-Patterns Avoided

- AP-11: the package does not open Redis at module load time; Redis registration is explicit through
  the `./redis` subpath.
- AP-16: the old generic `core/` role is now `application/`.
- AP-17: adapter-facing contracts are named as public types, not a generic `interfaces/` folder.
- AP-22: no private `adapters/mod.ts` sub-barrel is kept after bridge consolidation.

## Migration Note

The previous root `ARCHITECTURE.md` content has been folded into this page. Code examples now point
at the current role folders and the `./testing` contract subpath.
