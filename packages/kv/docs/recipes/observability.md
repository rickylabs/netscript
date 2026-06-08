---
title: KV Observability
description: Record structured KV state changes from callers without embedding console output.
package: '@netscript/kv'
order: 3
---

# KV Observability

## Goal

Record key changes in the caller's logger or telemetry layer.

## Steps

```ts
import { MemoryKvAdapter } from 'jsr:@netscript/kv@^0.0.1-alpha.0';

const kv = new MemoryKvAdapter();
const iterator = kv.watchPrefix(['jobs'], { skipInitial: true })[Symbol.asyncIterator]();

await kv.set(['jobs', 'one'], { status: 'queued' });
const event = await iterator.next();
event.value?.type;

await iterator.return?.();
await kv.close();
```

## Pitfalls

Published packages should not call `console.log` from adapter internals. Emit structured events in
the consuming runtime instead.
