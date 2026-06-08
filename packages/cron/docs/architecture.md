---
title: Cron Architecture
description: Architecture notes for @netscript/cron.
package: '@netscript/cron'
order: 1
---

# Cron Architecture

This package follows the Archetype 2 integration pattern. The scheduler contract is defined in
`ports/`, concrete runtimes live in `adapters/`, and `testing/` exposes the in-memory adapter for
consumer and port-contract tests.

```
ports       -> scheduler contract and event types
adapters    -> Deno cron and memory implementations
testing     -> reusable in-memory test adapter
mod.ts      -> curated package root and scheduler factory
```

The root module is the composition entrypoint. It exposes `createScheduler`, `getScheduler`, and
`stopScheduler` while keeping adapter-specific details available through explicit subpaths.
