---
title: Getting Started
description: First run guide for @netscript/kv with memory, Deno KV, and Redis-backed usage.
package: '@netscript/kv'
order: 3
---

# Getting Started

Install the package:

```powershell
deno add jsr:@netscript/kv@^0.0.1-alpha.0
```

## Use the Memory Adapter

```ts
import { MemoryKvAdapter } from 'jsr:@netscript/kv@^0.0.1-alpha.0';

const kv = new MemoryKvAdapter();
await kv.set(['jobs', 'export'], { status: 'queued' });
const job = await kv.get<{ status: string }>(['jobs', 'export']);
await kv.close();
```

## Use the Shared Deno KV Lifecycle

```ts
import { closeKv, getKv } from 'jsr:@netscript/kv@^0.0.1-alpha.0';

const kv = await getKv({ provider: 'deno-kv' });
await kv.set(['jobs', 'import'], { status: 'running' });
await closeKv();
```

Run with `--unstable-kv` when the Deno KV provider is selected.

## Use Redis

```ts
import 'jsr:@netscript/kv@^0.0.1-alpha.0/redis';
import { getKv } from 'jsr:@netscript/kv@^0.0.1-alpha.0';

const kv = await getKv({ provider: 'redis', redisUrl: 'redis://localhost:6379' });
await kv.set(['jobs', 'notify'], { status: 'queued' });
```

Grant network access to the Redis endpoint.
