---
title: Basic KV Usage
description: Store, read, list, and delete records with @netscript/kv.
package: '@netscript/kv'
order: 1
---

# Basic KV Usage

## Goal

Store job state under a stable prefix and list it later.

## Steps

```ts
import { MemoryKvAdapter } from 'jsr:@netscript/kv@^0.0.1-alpha.0';

const kv = new MemoryKvAdapter();
await kv.set(['jobs', 'nightly'], { status: 'queued' });

for await (const entry of kv.list<{ status: string }>({ prefix: ['jobs'] })) {
  entry.value.status;
}

await kv.delete(['jobs', 'nightly']);
await kv.close();
```

## Pitfalls

Use array keys consistently. Mixing string serialization formats makes prefix scans unreliable.
