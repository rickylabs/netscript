---
title: KV Reference
description: Entrypoint reference map for @netscript/kv during alpha.
package: '@netscript/kv'
order: 0
---

# KV Reference

Reference pages are generated from `deno doc` in a later wave. During alpha, use JSR API docs and
the entrypoint map below.

| Entrypoint              | Primary symbols                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `@netscript/kv`         | `getKv`, `getRawKv`, `closeKv`, `DenoKvAdapter`, `MemoryKvAdapter`, `KvStore`, `WatchableKv`. |
| `@netscript/kv/redis`   | `RedisKvAdapter`, `RedisKvOptions`.                                                           |
| `@netscript/kv/kvdex`   | `createNetscriptDb`, `WatchableKvBridge`, Kvdex compatibility types.                          |
| `@netscript/kv/testing` | `createMemoryKvAdapter`, `runKvStoreContract`, `KvStoreContractOptions`.                      |
