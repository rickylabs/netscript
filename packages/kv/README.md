# `@netscript/kv`

[![JSR](https://jsr.io/badges/@netscript/kv)](https://jsr.io/@netscript/kv)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

Reactive key-value storage with a unified API across Deno KV, Redis, and in-memory backends.
Auto-detects the best available provider from Aspire environment variables or falls back to local
Deno KV.

## Features

- **Multi-backend** — Deno KV, Redis/Garnet, and in-memory adapters behind one consistent API
- **Auto-detection** — Discovers the best available backend from environment variables at startup
- **Reactive watches** — Subscribe to individual key changes or entire key prefixes across all
  backends
- **Atomic operations** — Compare-and-swap with versionstamp checks for safe concurrent writes
- **TTL support** — Per-key expiration via `expireIn` (milliseconds) on all adapters
- **Type-safe** — Fully typed keys, values, and events via `WatchableKv` and `KvStore` interfaces
- **Zero-config default** — Falls back to local Deno KV with no external dependencies

## Install

```ts
// deno.json
{
  "imports": {
    "@netscript/kv": "jsr:@netscript/kv@^0.1.0"
  }
}
```

The Redis adapter has an optional peer dependency on `ioredis`. Import `@netscript/kv/redis` only
when you need it — the root entrypoint keeps Redis out of your module graph.

## Quick Start

```ts
import { getKv } from '@netscript/kv';

const kv = await getKv(); // auto-detects backend from environment

await kv.set(['users', 'alice'], { name: 'Alice', role: 'admin' });

const entry = await kv.get<{ name: string; role: string }>(['users', 'alice']);
console.log(entry?.value.name); // "Alice"

// React to changes in real time
for await (const events of kv.watch([['users', 'alice']])) {
  for (const event of events) {
    console.log(event.type, event.key, event.value);
  }
}
```

## Entry Points

| Import                | Purpose                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `@netscript/kv`       | Lifecycle helpers, all public types, Deno KV and in-memory adapters |
| `@netscript/kv/redis` | Redis adapter — import only when using Redis directly               |

## Usage

### Watch a key prefix for real-time updates

Stream every change under a prefix, including newly created keys:

```ts
import { getKv } from '@netscript/kv';

const kv = await getKv();

for await (const event of kv.watchPrefix(['jobs', 'order-processor'])) {
  console.log(`${event.key.join('/')} → ${event.type}`, event.value);
}
```

### Set a value with TTL

```ts
import { getKv } from '@netscript/kv';

const kv = await getKv();

// Expire after 1 hour
await kv.set(['sessions', 'tok_abc'], { userId: 'u1' }, { expireIn: 3_600_000 });
```

### Atomic compare-and-swap

Update a value only if no concurrent write has occurred since it was last read:

```ts
import { getKv } from '@netscript/kv';

const kv = await getKv();

const entry = await kv.get<number>(['counters', 'visits']);
const result = await kv.atomic(
  [{ key: ['counters', 'visits'], versionstamp: entry?.versionstamp ?? null }],
  [{ type: 'set', key: ['counters', 'visits'], value: (entry?.value ?? 0) + 1 }],
);

if (!result.ok) {
  // Concurrent modification detected — retry
}
```

### Redis backend with explicit connection

```ts
import { RedisKvAdapter } from '@netscript/kv/redis';

const kv = new RedisKvAdapter({
  url: 'redis://localhost:6379',
  namespace: 'myapp',
});

await kv.set(['cache', 'featured'], items, { expireIn: 60_000 });
const cached = await kv.get(['cache', 'featured']);
```

### In-memory backend for tests

```ts
import { MemoryKvAdapter } from '@netscript/kv';

const kv = new MemoryKvAdapter();

await kv.set(['test', 'key'], 'value');
const entry = await kv.get<string>(['test', 'key']);
// Data is process-local and cleared when the adapter is closed
```

## Auto-Detection

`getKv()` selects the backend in this priority order:

| Priority | Condition                                                         | Backend       |
| -------- | ----------------------------------------------------------------- | ------------- |
| 1        | `CACHE_PROVIDER=redis` or `CACHE_PROVIDER=garnet`                 | Redis         |
| 2        | `CACHE_PROVIDER=denokv` or `CACHE_PROVIDER=deno-kv`               | Deno KV       |
| 3        | `REDIS_URI` or `GARNET_URI` present                               | Redis         |
| 4        | `ConnectionStrings__redis` or `ConnectionStrings__garnet` present | Redis         |
| 5        | Aspire `services__redis__*` or `services__garnet__*` present      | Redis         |
| 6        | Aspire `services__kv__*`, `KV_URL`, or `DENO_KV_URL` present      | Deno KV       |
| 7        | (fallback)                                                        | Local Deno KV |

To override auto-detection, set `CACHE_PROVIDER` to `redis`, `garnet`, `denokv`, or `deno-kv`.

## Resources

- [`@netscript/sdk`](https://jsr.io/@netscript/sdk) — Service clients and cache-backed queries built
  on `@netscript/kv`
- [Deno KV documentation](https://docs.deno.com/deploy/kv/manual/)
- [ioredis](https://github.com/redis/ioredis) — Peer dependency for the Redis adapter

## License

MIT
