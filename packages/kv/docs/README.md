---
title: NetScript KV
description: Documentation hub for the reactive key-value adapters in @netscript/kv.
package: '@netscript/kv'
order: 0
---

# NetScript KV

`@netscript/kv` provides the shared key-value contract used by NetScript runtimes that need durable
state, prefix scans, and reactive key watching.

## Contents

| Page                                    | Purpose                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------- |
| [Architecture](./architecture.md)       | A2 integration layout, public surface map, and adapter boundaries.        |
| [Concepts](./concepts.md)               | Domain vocabulary for keys, entries, watches, providers, and adapters.    |
| [Getting started](./getting-started.md) | First-run guide using the in-memory adapter and shared lifecycle helpers. |
| [Recipes](./recipes/README.md)          | Task-oriented examples for storage, testing, and observability.           |
| [Reference](./reference/README.md)      | Entry point map for the current alpha surface.                            |

## Required Permissions

The in-memory adapter needs no Deno permissions. Deno KV usage requires `--unstable-kv`. Redis usage
requires network access to the Redis or Garnet endpoint and environment access only when the
application asks the package to discover `REDIS_URL`, `GARNET_URL`, or `KV_REDIS_URL`.
